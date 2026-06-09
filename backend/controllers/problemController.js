const Problem = require("../models/Problem");
const { resolveSessionUser } = require("./authController");

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
    const session = await resolveSessionUser(req);
    if (!session) {
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
      createdBy: session.user._id,
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

module.exports = {
  listProblems,
  createProblem,
  getProblem,
};