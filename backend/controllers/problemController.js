const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const { resolveUserFromAccessToken } = require("../services/authSession");
const { SUPPORTED_LANGUAGES, runCodeAgainstTestCases } = require("../services/codeRunner");

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

module.exports = {
  listProblems,
  createProblem,
  getProblem,
  runProblemCode,
  getProblemSubmissions,
};
