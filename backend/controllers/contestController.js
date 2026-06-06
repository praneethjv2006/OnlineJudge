const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Contest = require("../models/Contest");
const User = require("../models/User");
const { refreshTokenSecret } = require("../services/authSession");

const resolveContestCreator = async (req) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return null;
  }

  const payload = jwt.verify(token, refreshTokenSecret);
  const user = await User.findById(payload.id);

  if (!user || user.refreshToken !== token) {
    return null;
  }

  return user;
};

const generateContestCode = async () => {
  for (let attempts = 0; attempts < 8; attempts += 1) {
    const code = `CJ-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const existingContest = await Contest.exists({ roomCode: code });

    if (!existingContest) {
      return code;
    }
  }

  throw new Error("Unable to generate a contest room code.");
};

const normalizeQuestions = (questions) =>
  questions.map((question) => ({
    title: question.title?.trim(),
    prompt: question.prompt?.trim(),
    timeLimitMs: Number(question.timeLimitMs),
    testCases: Array.isArray(question.testCases)
      ? question.testCases.map((testCase) => ({
          input: testCase.input?.trim(),
          expectedOutput: testCase.expectedOutput?.trim(),
        }))
      : [],
  }));

const listContests = async (req, res) => {
  try {
    const visibility = req.query.visibility === "private" ? "private" : "public";
    const now = new Date();

    const contests = await Contest.find({
      visibility,
      startAt: { $lte: now },
      endAt: { $gte: now },
    })
      .select("-roomCode")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    return res.json({ contests });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load contests.", error: error.message });
  }
};

const createContest = async (req, res) => {
  try {
    const creator = await resolveContestCreator(req);

    if (!creator) {
      return res.status(401).json({ message: "Please sign in to create a contest." });
    }

    const { title, description = "", visibility = "public", durationMinutes, questions } = req.body;

    if (!title || !durationMinutes || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "Title, duration, and at least one question are required.",
      });
    }

    const roomCode = await generateContestCode();

    const contest = await Contest.create({
      roomCode,
      title: title.trim(),
      description: description.trim(),
      visibility,
      durationMinutes: Number(durationMinutes),
      questions: normalizeQuestions(questions),
      createdBy: creator._id,
    });

    const populatedContest = await Contest.findById(contest._id).populate("createdBy", "name email");

    return res.status(201).json({
      message: "Contest created successfully.",
      contest: populatedContest,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create contest.", error: error.message });
  }
};

const joinContest = async (req, res) => {
  try {
    const { contestId, code } = req.body;

    let contest = null;

    if (code) {
      contest = await Contest.findOne({ roomCode: code.trim().toUpperCase() })
        .populate("createdBy", "name email")
        .select("-roomCode");
    } else if (contestId) {
      contest = await Contest.findById(contestId)
        .populate("createdBy", "name email")
        .select("-roomCode");
    }

    if (!contest) {
      return res.status(404).json({ message: "Contest room not found." });
    }

    if (contest.visibility === "private" && !code) {
      return res.status(400).json({ message: "A private contest requires a room code." });
    }

    if (contest.visibility === "public" && contestId && !code) {
      return res.json({ message: "Joined contest successfully.", contest });
    }

    return res.json({ message: "Joined contest successfully.", contest });
  } catch (error) {
    return res.status(500).json({ message: "Unable to join contest.", error: error.message });
  }
};

module.exports = {
  createContest,
  joinContest,
  listContests,
};