const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Contest = require("../models/Contest");
const User = require("../models/User");
const Submission = require("../models/Submission");
const { accessTokenSecret, refreshTokenSecret } = require("../services/authSession");
const { SUPPORTED_LANGUAGES, runCodeAgainstTestCases } = require("../services/codeRunner");

const resolveContestUser = async (req) => {
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const refreshToken = req.cookies?.refreshToken;

  if (!bearerToken && !refreshToken) {
    return null;
  }

  if (bearerToken) {
    const payload = jwt.verify(bearerToken, accessTokenSecret);
    return User.findById(payload.id);
  }

  const payload = jwt.verify(refreshToken, refreshTokenSecret);
  const user = await User.findById(payload.id);

  if (!user || user.refreshToken !== refreshToken) {
    return null;
  }

  return user;
};

const resolveContestCreator = resolveContestUser;

const populateContest = (query) => query.populate("createdBy", "name email").populate("participants.user", "name email");

const findContestByIdentifier = (identifier) => {
  if (!identifier) {
    return null;
  }

  const normalized = identifier.toString().trim();
  const upper = normalized.toUpperCase();
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(normalized);

  if (isObjectId) {
    return Contest.findOne({ $or: [{ _id: normalized }, { roomCode: upper }] });
  }

  return Contest.findOne({ roomCode: upper });
};

const getContestOr404 = async (contestId, res) => {
  const contest = await populateContest(findContestByIdentifier(contestId));

  if (!contest) {
    res.status(404).json({ message: "Contest room not found." });
    return null;
  }

  return contest;
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

    const contests = await Contest.find({
      visibility,
      status: { $ne: "ended" },
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
      status: "ready",
      durationMinutes: Number(durationMinutes),
      questions: normalizeQuestions(questions),
      participants: [{ user: creator._id }],
      createdBy: creator._id,
    });

    const populatedContest = await populateContest(Contest.findById(contest._id));

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
    const user = await resolveContestUser(req);
    const { contestId, code } = req.body;

    let contest = null;

    if (code) {
      contest = await populateContest(Contest.findOne({ roomCode: code.trim().toUpperCase() }));
    } else if (contestId) {
      contest = await populateContest(findContestByIdentifier(contestId));
    }

    if (!contest) {
      return res.status(404).json({ message: "Contest room not found." });
    }

    if (!user) {
      return res.status(401).json({ message: "Please sign in to enter a contest." });
    }

    const isOrganizer = contest.createdBy._id.toString() === user._id.toString();

    if (contest.visibility === "private" && !code && !isOrganizer) {
      return res.status(400).json({ message: "A private contest requires a room code." });
    }

    const participantExists = contest.participants.some((participant) => participant.user?._id?.toString() === user._id.toString());

    if (!participantExists) {
      if (contest.status === "live" && !isOrganizer) {
        return res.status(403).json({ message: "The contest has already started. New participants cannot join." });
      }
      if (contest.status === "ended") {
        return res.status(403).json({ message: "The contest has already ended." });
      }
      contest.participants.push({ user: user._id });
      await contest.save();
    }

    const refreshedContest = await populateContest(Contest.findById(contest._id));

    return res.json({ message: "Joined contest successfully.", contest: refreshedContest });
  } catch (error) {
    return res.status(500).json({ message: "Unable to join contest.", error: error.message });
  }
};

const getContest = async (req, res) => {
  try {
    const contest = await getContestOr404(req.params.contestId, res);

    if (!contest) {
      return null;
    }

    return res.json({ contest });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load contest room.", error: error.message });
  }
};

const enterContest = async (req, res) => {
  req.body = { ...req.body, contestId: req.params.contestId };
  return joinContest(req, res);
};

const startContest = async (req, res) => {
  try {
    const user = await resolveContestUser(req);
    const contest = await getContestOr404(req.params.contestId, res);

    if (!contest) {
      return null;
    }

    if (!user || contest.createdBy._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Only the organizer can start the contest." });
    }

    if (contest.status === "live") {
      return res.json({ message: "Contest already started.", contest });
    }

    contest.status = "live";
    contest.actualStartAt = new Date();
    contest.actualEndAt = new Date(contest.actualStartAt.getTime() + contest.durationMinutes * 60 * 1000);
    contest.endAt = contest.actualEndAt;
    await contest.save();

    const refreshedContest = await populateContest(Contest.findById(contest._id));
    return res.json({ message: "Contest started.", contest: refreshedContest });
  } catch (error) {
    return res.status(500).json({ message: "Unable to start contest.", error: error.message });
  }
};

const endContest = async (req, res) => {
  try {
    const user = await resolveContestUser(req);
    const contest = await getContestOr404(req.params.contestId, res);

    if (!contest) {
      return null;
    }

    if (!user || contest.createdBy._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Only the organizer can end the contest." });
    }

    contest.status = "ended";
    contest.actualEndAt = new Date();
    await contest.save();

    const refreshedContest = await populateContest(Contest.findById(contest._id));
    return res.json({ message: "Contest ended.", contest: refreshedContest });
  } catch (error) {
    return res.status(500).json({ message: "Unable to end contest.", error: error.message });
  }
};

const runContestCode = async (req, res) => {
  try {
    const user = await resolveContestUser(req);
    const contest = await getContestOr404(req.params.contestId, res);

    if (!contest) {
      return null;
    }

    if (!user) {
      return res.status(401).json({ message: "Please sign in to run code." });
    }

    const isOrganizer = contest.createdBy._id.toString() === user._id.toString();
    const isParticipant = contest.participants.some(
      (participant) => participant.user?._id?.toString() === user._id.toString()
    );

    if (!isOrganizer && !isParticipant) {
      return res.status(403).json({ message: "Join the contest room before running code." });
    }

    if (contest.status !== "live" && !isOrganizer) {
      return res.status(403).json({ message: "Code execution is available once the contest starts." });
    }

    if (contest.status === "ended") {
      return res.status(403).json({ message: "The contest has ended. Code execution is disabled." });
    }

    const { code, language = "cpp", questionIndex = 0, isSubmit = false } = req.body;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        message: `Unsupported language. Choose one of: ${SUPPORTED_LANGUAGES.join(", ")}.`,
      });
    }

    const question = contest.questions[Number(questionIndex)];

    if (!question) {
      return res.status(400).json({ message: "Question not found in this contest." });
    }

    const execution = await runCodeAgainstTestCases({
      code,
      language,
      testCases: question.testCases,
      timeLimitMs: question.timeLimitMs || 2000,
    });

    if (isSubmit) {
      const overallVerdict = execution.results.every((r) => r.verdict === "Accepted")
        ? "Accepted"
        : execution.results.find((r) => r.verdict !== "Accepted")?.verdict || "Wrong Answer";

      await Submission.create({
        contest: contest._id,
        user: user._id,
        questionIndex: Number(questionIndex),
        code,
        language,
        verdict: overallVerdict,
        results: execution.results,
      });
    }

    return res.json({
      message: "Code executed successfully.",
      language,
      questionIndex: Number(questionIndex),
      results: execution.results,
      terminalOutput: execution.terminalOutput,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to run code.", error: error.message });
  }
};

const getSubmissions = async (req, res) => {
  try {
    const user = await resolveContestUser(req);
    const contest = await getContestOr404(req.params.contestId, res);

    if (!contest) {
      return null;
    }

    if (!user) {
      return res.status(401).json({ message: "Please sign in to view submissions." });
    }

    const submissions = await Submission.find({
      contest: contest._id,
      user: user._id,
    }).sort({ createdAt: -1 });

    return res.json({ submissions });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load submissions.", error: error.message });
  }
};

module.exports = {
  createContest,
  endContest,
  enterContest,
  getContest,
  getSubmissions,
  joinContest,
  listContests,
  runContestCode,
  startContest,
};