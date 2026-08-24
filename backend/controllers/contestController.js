const crypto = require("crypto");
const Contest = require("../models/Contest");
const Submission = require("../models/Submission");
const { resolveUserFromAccessToken } = require("../services/authSession");
const { SUPPORTED_LANGUAGES, runCodeAgainstTestCases } = require("../services/codeRunner");

const resolveContestUser = resolveUserFromAccessToken;
const resolveContestCreator = resolveUserFromAccessToken;

const populateContest = (query) =>
  query.populate("createdBy", "name email").populate("participants.user", "name email");

const findContestByIdentifier = (identifier) => {
  if (!identifier) return null;
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
    if (!existingContest) return code;
  }
  throw new Error("Unable to generate a contest room code.");
};

const normalizeQuestions = (questions) =>
  questions.map((question) => {
    const topics = Array.isArray(question.topics)
      ? question.topics
      : typeof question.topics === "string"
        ? question.topics.split(",")
        : [];
    const cognitiveCategories = Array.isArray(question.cognitiveCategories)
      ? question.cognitiveCategories
      : typeof question.cognitiveCategories === "string"
        ? question.cognitiveCategories.split(",")
        : [];
    const tags = Array.isArray(question.tags)
      ? question.tags
      : typeof question.tags === "string"
        ? question.tags.split(",")
        : [];

    return {
      title: question.title?.trim(),
      prompt: question.prompt?.trim(),
      timeLimitMs: Number(question.timeLimitMs),
      difficulty: question.difficulty || "medium",
      category: question.category?.trim() || "Coding",
      cognitiveCategories: cognitiveCategories.map((c) => c?.trim()).filter(Boolean),
      topics: topics.map((t) => t?.trim()).filter(Boolean),
      tags: tags.map((t) => t?.trim()).filter(Boolean),
      points: Number(question.points) || 100,
      testCases: Array.isArray(question.testCases)
        ? question.testCases.map((testCase) => ({
            input: testCase.input?.trim(),
            expectedOutput: testCase.expectedOutput?.trim(),
          }))
        : [],
    };
  });

// ─── Leaderboard helpers ──────────────────────────────────────────────────────

const recomputeLeaderboard = async (contestId) => {
  const contest = await Contest.findById(contestId);
  if (!contest) return;

  const submissions = await Submission.find({ contest: contestId })
    .populate("user", "name")
    .sort({ createdAt: 1 }); // oldest first for correct timing

  const userMap = {}; // userId -> leaderboard entry

  submissions.forEach((sub) => {
    const uid = sub.user?._id?.toString() || sub.user?.toString();
    if (!uid) return;

    if (!userMap[uid]) {
      userMap[uid] = {
        user: sub.user?._id || sub.user,
        userName: sub.user?.name || "Unknown",
        score: 0,
        penalty: 0,
        questionsSolved: 0,
        questionResults: {},
        lastSubmitAt: null,
      };
    }

    const entry = userMap[uid];
    const qIdx = sub.questionIndex ?? 0;
    const qKey = String(qIdx);

    if (!entry.questionResults[qKey]) {
      entry.questionResults[qKey] = {
        solved: false,
        attempts: 0,
        solvedAt: null,
        penaltyMinutes: 0,
      };
    }

    const qResult = entry.questionResults[qKey];
    if (qResult.solved) return; // already solved, skip further submissions

    qResult.attempts += 1;

    if (sub.verdict === "Accepted") {
      qResult.solved = true;
      qResult.solvedAt = sub.submittedAt || sub.createdAt;

      // Penalty: minutes from contest start + 20 min per WA attempt before AC
      const contestStart = contest.actualStartAt || contest.startAt;
      const solveMinutes = contestStart
        ? Math.floor((new Date(qResult.solvedAt) - new Date(contestStart)) / 60000)
        : 0;
      const waPenalty = (qResult.attempts - 1) * 20;
      qResult.penaltyMinutes = Math.max(0, solveMinutes) + waPenalty;

      const q = contest.questions[qIdx];
      const questionPoints = q?.points || 100;

      entry.score += questionPoints;
      entry.penalty += qResult.penaltyMinutes;
      entry.questionsSolved += 1;
      entry.lastSubmitAt = qResult.solvedAt;
    }
  });

  // Sort: problems solved desc, then penalty asc
  const leaderboard = Object.values(userMap).sort((a, b) => {
    if (b.questionsSolved !== a.questionsSolved) return b.questionsSolved - a.questionsSolved;
    return a.penalty - b.penalty;
  });

  leaderboard.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  contest.leaderboard = leaderboard;
  await contest.save();
  return leaderboard;
};

// ─── Endpoints ───────────────────────────────────────────────────────────────

const listContests = async (req, res) => {
  try {
    const visibility = req.query.visibility === "private" ? "private" : "public";
    const tab = req.query.tab || "all"; // upcoming, live, ended, all

    let statusFilter = {};
    if (tab === "upcoming") statusFilter = { status: { $in: ["scheduled", "ready"] } };
    else if (tab === "live") statusFilter = { status: "live" };
    else if (tab === "ended") statusFilter = { status: "ended" };
    else statusFilter = {}; // all

    const contests = await Contest.find({ visibility, ...statusFilter })
      .select("-roomCode")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(50);

    // Group by status for "all" tab
    const grouped = {
      upcoming: contests.filter((c) => c.status === "scheduled" || c.status === "ready"),
      live: contests.filter((c) => c.status === "live"),
      ended: contests.filter((c) => c.status === "ended"),
    };

    return res.json({ contests, grouped });
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

    const {
      title,
      description = "",
      visibility = "public",
      durationMinutes,
      questions,
      scheduledAt,
    } = req.body;

    if (!title || !durationMinutes || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        message: "Title, duration, and at least one question are required.",
      });
    }

    const roomCode = await generateContestCode();

    const status = scheduledAt ? "scheduled" : "ready";

    const contest = await Contest.create({
      roomCode,
      title: title.trim(),
      description: description.trim(),
      visibility,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
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

    const participantExists = contest.participants.some(
      (participant) => participant.user?._id?.toString() === user._id.toString()
    );

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
    if (!contest) return null;
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
    if (!contest) return null;

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
    if (!contest) return null;

    if (!user || contest.createdBy._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Only the organizer can end the contest." });
    }

    contest.status = "ended";
    contest.actualEndAt = new Date();
    await contest.save();

    // Recompute final leaderboard
    await recomputeLeaderboard(contest._id);

    const refreshedContest = await populateContest(Contest.findById(contest._id));
    return res.json({ message: "Contest ended.", contest: refreshedContest });
  } catch (error) {
    return res.status(500).json({ message: "Unable to end contest.", error: error.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const contest = await getContestOr404(req.params.contestId, res);
    if (!contest) return null;

    // Recompute live leaderboard for live contests, use stored for ended
    let leaderboard;
    if (contest.status === "live" || !contest.leaderboard?.length) {
      leaderboard = await recomputeLeaderboard(contest._id);
    } else {
      leaderboard = contest.leaderboard;
    }

    return res.json({
      leaderboard: leaderboard || [],
      contestTitle: contest.title,
      contestStatus: contest.status,
      questions: contest.questions.map((q, i) => ({
        index: i,
        title: q.title,
        points: q.points || 100,
        difficulty: q.difficulty,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load leaderboard.", error: error.message });
  }
};

const startVirtualContest = async (req, res) => {
  try {
    const user = await resolveContestUser(req);
    if (!user) return res.status(401).json({ message: "Please sign in to start a virtual contest." });

    const originalContest = await getContestOr404(req.params.contestId, res);
    if (!originalContest) return null;

    if (originalContest.status !== "ended") {
      return res.status(400).json({ message: "Virtual contests can only be started for completed contests." });
    }

    // Check if this user already has a virtual for this contest
    const existingVirtual = await Contest.findOne({
      type: "virtual",
      virtualOf: originalContest._id,
      "participants.user": user._id,
    });

    if (existingVirtual) {
      return res.json({
        message: "You already have a virtual contest in progress.",
        contest: await populateContest(Contest.findById(existingVirtual._id)),
        isExisting: true,
      });
    }

    const roomCode = await generateContestCode();
    const now = new Date();

    const virtualContest = await Contest.create({
      roomCode,
      title: `[Virtual] ${originalContest.title}`,
      description: originalContest.description,
      visibility: "private",
      status: "live",
      type: "virtual",
      virtualOf: originalContest._id,
      durationMinutes: originalContest.durationMinutes,
      actualStartAt: now,
      actualEndAt: new Date(now.getTime() + originalContest.durationMinutes * 60 * 1000),
      endAt: new Date(now.getTime() + originalContest.durationMinutes * 60 * 1000),
      questions: originalContest.questions,
      participants: [{ user: user._id, isVirtual: true, virtualStartedAt: now }],
      createdBy: user._id,
    });

    const populated = await populateContest(Contest.findById(virtualContest._id));
    return res.status(201).json({
      message: "Virtual contest started.",
      contest: populated,
      isNew: true,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to start virtual contest.", error: error.message });
  }
};

const runContestCode = async (req, res) => {
  try {
    const user = await resolveContestUser(req);
    const contest = await getContestOr404(req.params.contestId, res);
    if (!contest) return null;

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

    // For virtual contests, allow even after "ended" if user is participant
    const isVirtual = contest.type === "virtual";
    const isUpsolve = req.body.isUpsolve === true;

    if (!isVirtual && !isUpsolve && contest.status !== "live" && !isOrganizer) {
      return res.status(403).json({ message: "Code execution is available once the contest starts." });
    }
    if (!isVirtual && !isUpsolve && contest.status === "ended") {
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

      // Recompute leaderboard asynchronously
      if (contest.status === "live" || isVirtual) {
        recomputeLeaderboard(contest._id).catch(() => {});
      }
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
    if (!contest) return null;

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
  getLeaderboard,
  getSubmissions,
  joinContest,
  listContests,
  runContestCode,
  startContest,
  startVirtualContest,
};
