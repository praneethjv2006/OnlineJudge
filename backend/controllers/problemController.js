const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const mongoose = require("mongoose");
const { resolveUserFromAccessToken } = require("../services/authSession");
const { SUPPORTED_LANGUAGES, runCodeAgainstTestCases } = require("../services/codeRunner");
const Groq = require("groq-sdk");

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeProblemInput = (body = {}) => {
  const formalStatement = cleanText(body.formalStatement);
  const statement = cleanText(body.statement) || formalStatement;
  const testCases = Array.isArray(body.testCases)
    ? body.testCases
        .map((testCase) => ({
          input: cleanText(testCase?.input),
          expectedOutput: cleanText(testCase?.expectedOutput),
        }))
        .filter((testCase) => testCase.input && testCase.expectedOutput)
    : [];
  const examples = Array.isArray(body.examples)
    ? body.examples
        .map((example) => ({
          input: cleanText(example?.input),
          output: cleanText(example?.output),
          explanation: cleanText(example?.explanation),
        }))
        .filter((example) => example.input || example.output || example.explanation)
    : [];
  const tags = Array.isArray(body.tags)
    ? body.tags
    : String(body.tags || "").split(",");

  return {
    title: cleanText(body.title),
    difficulty: cleanText(body.difficulty).toLowerCase(),
    statement,
    formalStatement,
    problemStory: cleanText(body.problemStory),
    inputFormat: cleanText(body.inputFormat),
    outputFormat: cleanText(body.outputFormat),
    constraints: cleanText(body.constraints),
    notes: cleanText(body.notes),
    timeComplexity: cleanText(body.timeComplexity),
    spaceComplexity: cleanText(body.spaceComplexity),
    timeLimit: Number(body.timeLimit) || 2000,
    memoryLimit: Number(body.memoryLimit) || 256,
    tags: tags.map((tag) => cleanText(String(tag))).filter(Boolean),
    examples,
    testCases,
  };
};

const validateProblemInput = (problemData) => {
  if (!problemData.title) return "Problem title is required.";
  if (!["easy", "medium", "hard"].includes(problemData.difficulty)) {
    return "Difficulty must be easy, medium, or hard.";
  }
  if (!problemData.statement) return "A formal problem statement is required.";
  if (!problemData.inputFormat) return "Input format is required.";
  if (!problemData.outputFormat) return "Output format is required.";
  if (!problemData.constraints) return "Constraints are required.";
  if (problemData.examples.length === 0) return "At least one public example is required.";
  if (problemData.testCases.length === 0) return "At least one judge test case is required.";
  if (problemData.timeLimit < 100 || problemData.timeLimit > 60000) {
    return "Time limit must be between 100 and 60000 milliseconds.";
  }
  if (problemData.memoryLimit < 16 || problemData.memoryLimit > 4096) {
    return "Memory limit must be between 16 and 4096 MB.";
  }
  return null;
};

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

    const problemData = normalizeProblemInput(req.body);
    const validationError = validateProblemInput(problemData);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const problem = await Problem.create({ ...problemData, createdBy: user._id });

    return res.status(201).json({
      message: "Problem created successfully.",
      problem,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create problem.", error: error.message });
  }
};

const updateProblem = async (req, res) => {
  try {
    const user = await resolveUserFromAccessToken(req);
    if (!user) {
      return res.status(401).json({ message: "Please sign in to edit a problem." });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Problem not found." });
    }

    const problem = await Problem.findOne({
      _id: req.params.id,
      createdBy: user._id,
    });
    if (!problem) {
      const problemExists = await Problem.exists({ _id: req.params.id });
      return res.status(problemExists ? 403 : 404).json({
        message: problemExists
          ? "Only the problem author can edit this problem."
          : "Problem not found.",
      });
    }

    const problemData = normalizeProblemInput(req.body);
    const validationError = validateProblemInput(problemData);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    problem.set(problemData);
    await problem.save();
    await problem.populate("createdBy", "name email");

    return res.json({
      message: "Problem updated successfully.",
      problem,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update problem.", error: error.message });
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

    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Code cannot be empty." });
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        message: `Unsupported language. Choose one of: ${SUPPORTED_LANGUAGES.join(", ")}.`,
      });
    }

    // Validate that test cases exist
    let casesToRun = problem.testCases;
    if (!Array.isArray(casesToRun) || casesToRun.length === 0) {
      return res.status(400).json({
        message: "This problem has no test cases defined. Please contact the problem creator.",
      });
    }

    if (!isSubmit && Array.isArray(customTestCases) && customTestCases.length > 0) {
      // Validate custom test cases format
      const validatedCustom = customTestCases
        .map((tc) => ({
          input: String(tc?.input ?? "").trim(),
          expectedOutput: String(tc?.expectedOutput ?? "").trim(),
        }))
        .filter((tc) => tc.input !== "" && tc.expectedOutput !== "");
      
      if (validatedCustom.length > 0) {
        casesToRun = validatedCustom;
      }
    }

    // Final validation that we have test cases
    if (!Array.isArray(casesToRun) || casesToRun.length === 0) {
      return res.status(400).json({
        message: "No valid test cases available to run.",
      });
    }

    const execution = await runCodeAgainstTestCases({
      code,
      language,
      testCases: casesToRun,
      timeLimitMs: problem.timeLimit || 2000,
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
    console.error("Error in runProblemCode:", error);
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

const deleteProblem = async (req, res) => {
  try {
    const user = await resolveUserFromAccessToken(req);
    if (!user) {
      return res.status(401).json({ message: "Please sign in to delete a problem." });
    }
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Problem not found." });
    }

    const problem = await Problem.findOne({
      _id: req.params.id,
      createdBy: user._id,
    });
    if (!problem) {
      const problemExists = await Problem.exists({ _id: req.params.id });
      return res.status(problemExists ? 403 : 404).json({
        message: problemExists
          ? "Only the problem author can delete this problem."
          : "Problem not found.",
      });
    }

    await Submission.deleteMany({ problem: problem._id });
    await problem.deleteOne();

    return res.json({ message: "Problem deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete problem.", error: error.message });
  }
};

module.exports = {
  listProblems,
  createProblem,
  updateProblem,
  getProblem,
  runProblemCode,
  getProblemSubmissions,
  analyzeCode,
  deleteProblem,
};
