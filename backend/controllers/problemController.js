const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const { resolveUserFromAccessToken } = require("../services/authSession");
const { SUPPORTED_LANGUAGES, runCodeAgainstTestCases } = require("../services/codeRunner");
const Groq = require("groq-sdk");

const listProblems = async (req, res) => {
  try {
    const problems = await Problem.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    return res.json({ problems });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load problems.", error: error.message });
  }
};

const createProblem = async (req, res) => {
  try {
    const user = await resolveUserFromAccessToken(req);
    if (!user) {
      return res.status(401).json({ message: "Please sign in to create a problem." });
    }

    const { title, difficulty, statement, timeComplexity, spaceComplexity, testCases } = req.body;

    if (!title || !difficulty || !statement || !testCases || testCases.length === 0) {
      return res.status(400).json({
        message: "Title, difficulty, statement, and at least one test case are required.",
      });
    }

    const problem = await Problem.create({
      title: title.trim(),
      difficulty,
      statement: statement.trim(),
      timeComplexity: timeComplexity?.trim(),
      spaceComplexity: spaceComplexity?.trim(),
      testCases: testCases.map((tc) => ({
        input: tc.input?.trim(),
        expectedOutput: tc.expectedOutput?.trim(),
      })),
      createdBy: user._id,
    });

    return res.status(201).json({
      message: "Problem created successfully.",
      problem,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create problem.", error: error.message });
  }
};

const getProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).populate("createdBy", "name email");
    if (!problem) {
      return res.status(404).json({ message: "Problem not found." });
    }
    return res.json({ problem });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load problem.", error: error.message });
  }
};

const runProblemCode = async (req, res) => {
  try {
    const user = await resolveUserFromAccessToken(req);
    if (!user) {
      return res.status(401).json({ message: "Please sign in to solve problems." });
    }

    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found." });
    }

    const { code, language = "cpp", isSubmit = false, customTestCases } = req.body;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        message: `Unsupported language. Choose one of: ${SUPPORTED_LANGUAGES.join(", ")}.`,
      });
    }

    let casesToRun = problem.testCases;
    if (!isSubmit && Array.isArray(customTestCases) && customTestCases.length > 0) {
      casesToRun = customTestCases.map((tc) => ({
        input: tc.input ?? "",
        expectedOutput: tc.expectedOutput ?? "",
      }));
    }

    const execution = await runCodeAgainstTestCases({
      code,
      language,
      testCases: casesToRun,
      timeLimitMs: 2000,
    });

    if (isSubmit) {
      const overallVerdict = execution.results.every((r) => r.verdict === "Accepted")
        ? "Accepted"
        : execution.results.find((r) => r.verdict !== "Accepted")?.verdict || "Wrong Answer";

      await Submission.create({
        problem: problem._id,
        user: user._id,
        code,
        language,
        verdict: overallVerdict,
        results: execution.results,
      });
    }

    return res.json({
      message: "Code executed successfully.",
      results: execution.results,
      terminalOutput: execution.terminalOutput,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to run code.", error: error.message });
  }
};

const getProblemSubmissions = async (req, res) => {
  try {
    const user = await resolveUserFromAccessToken(req);
    if (!user) {
      return res.status(401).json({ message: "Please sign in to view submissions." });
    }

    const submissions = await Submission.find({
      problem: req.params.id,
      user: user._id,
    }).sort({ createdAt: -1 });

    return res.json({ submissions });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load submissions.", error: error.message });
  }
};

const analyzeCode = async (req, res) => {
  try {
    const { code, type, problemId, contestId, questionIndex } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Code is required for analysis." });
    }

    let contextTitle = "";
    let contextDescription = "";

    if (problemId) {
      const problem = await Problem.findById(problemId);
      if (problem) {
        contextTitle = problem.title;
        contextDescription = problem.statement;
      }
    } else if (contestId && questionIndex !== undefined) {
      const Contest = require("../models/Contest");
      const contest = await Contest.findById(contestId);
      if (contest && contest.questions[questionIndex]) {
        contextTitle = contest.questions[questionIndex].title;
        contextDescription = contest.questions[questionIndex].prompt;
      }
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const models = [
      "qwen/qwen3-32b",
      "llama-3.3-70b-versatile",
      "openai/gpt-oss-120b"
    ];

    let prompt = "";
    if (type === "complexity") {
      prompt = `Analyze this code for the problem "${contextTitle}". 
Problem Description: ${contextDescription}

Code:
${code}

Return ONLY the Time and Space complexity. 
Format:
Time Complexity: [Value]
Space Complexity: [Value]
No other information or explanation.`;
    } else if (type === "edgeCases") {
      prompt = `Analyze this code against the problem "${contextTitle}".
Problem Description: ${contextDescription}

Code to analyze:
${code}

Identify ONLY the critical edge cases that will cause this specific code to fail (Wrong Answer, Runtime Error, or TLE) for this problem.
Return a list of short points (give top important 5, if edge cases alredy resolved dont give them). 
Rules:
- NO markdown symbols like '*', '-', '#'.
- NO introductory text.
- ONLY the cases that matter for this specific code and problem.
- Maximum 5 points.`;
    } else if (type === "review") {
      prompt = `Review this code for the problem "${contextTitle}".
Problem Description: ${contextDescription}

Code:
${code}

Assess if the code works correctly for the problem and identify important optimizations.
Format:
Verdict: [Correct / Needs Optimization / Incorrect]
Optimizations:
1. [Point 1]
2. [Point 2]
...
Rules:
- Keep it very short and crisp.
- Remove all markdown tags like '*', '**', etc.
- Only suggest high-impact improvements.
- #include<bits/stdc++.h> is not an optimization. Don't mention it., if missing imports then mention`;
    } else {
      return res.status(400).json({ message: "Invalid analysis type." });
    }

    let completion;
    for (const model of models) {
      try {
        completion = await groq.chat.completions.create({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
        });
        if (completion) break;
      } catch (err) {
        if (err.status !== 429) throw err;
      }
    }

    if (!completion) {
      return res.status(500).json({ message: "Analysis failed. Please try again later." });
    }

    let result = completion.choices[0].message.content;
    // Remove <think>...</think> tags and their content
    result = result.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    // Aggressively remove markdown symbols as requested by user
    result = result.replace(/[*#`~]/g, "").trim();

    res.json({
      result
    });

  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to analyze code.", error: error.message });
  }
};

module.exports = {
  listProblems,
  createProblem,
  getProblem,
  runProblemCode,
  getProblemSubmissions,
  analyzeCode,
};

