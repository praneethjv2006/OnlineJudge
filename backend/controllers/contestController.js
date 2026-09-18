const crypto = require("crypto");
const Contest = require("../models/Contest");
const Problem = require("../models/Problem");
const Submission = require("../models/Submission");
const User = require("../models/User");
const { resolveUserFromAccessToken } = require("../services/authSession");
const { SUPPORTED_LANGUAGES, runCodeAgainstTestCases } = require("../services/codeRunner");
const { updateRatingsForContest } = require("../services/ratingService");

const resolveContestUser = resolveUserFromAccessToken;
const resolveContestCreator = resolveUserFromAccessToken;

const populateContest = (query) =>
  query.populate("createdBy", "name email role").populate("participants.user", "name email");

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
      timeLimitMs: Number(question.timeLimitMs) || 2000,
      memoryLimitMb: Number(question.memoryLimitMb) || 256,
      difficulty: question.difficulty || "medium",
      category: question.category?.trim() || "Coding",
      cognitiveCategories: cognitiveCategories.map((c) => c?.trim()).filter(Boolean),
      topics: topics.map((t) => t?.trim()).filter(Boolean),
      tags: tags.map((t) => t?.trim()).filter(Boolean),
      points: Number(question.points) || 100,
      // Preserve cognitiveRatings if provided (admin-set)
      cognitiveRatings: question.cognitiveRatings || {},
      problemRef: question.problemRef || null,
      testCases: Array.isArray(question.testCases)
        ? question.testCases.map((testCase) => ({
            // allow empty string input (no-stdin problems)
            input: testCase.input ?? "",
            expectedOutput: testCase.expectedOutput?.trim() ?? "",
          }))
        : [],
    };
  });

// ─── Scheduled auto-start timers (in-memory) ─────────────────────────────────
// Cleared when process restarts; contests in "scheduled" state detected on server startup
const scheduledTimers = new Map();

const scheduleAutoStart = (contest) => {
  if (!contest.scheduledAt || contest.status !== "scheduled") return;

  const delay = new Date(contest.scheduledAt).getTime() - Date.now();
  if (delay <= 0) return; // already past — will be caught by listContests

  const contestIdStr = contest._id.toString();

  // Clear any existing timer for this contest
  if (scheduledTimers.has(contestIdStr)) {
    clearTimeout(scheduledTimers.get(contestIdStr));
  }

  const timer = setTimeout(async () => {
    try {
      const c = await Contest.findById(contestIdStr);
      if (!c || c.status !== "scheduled") return;
      c.status = "live";
      c.actualStartAt = new Date();
      c.actualEndAt = new Date(c.actualStartAt.getTime() + c.durationMinutes * 60 * 1000);
      c.endAt = c.actualEndAt;
      await c.save();
      console.log(`[scheduler] Contest "${c.title}" auto-started.`);

      // Schedule auto-end
      const endDelay = c.actualEndAt.getTime() - Date.now();
      if (endDelay > 0) {
        setTimeout(async () => {
          try {
            const liveContest = await Contest.findById(contestIdStr);
            if (!liveContest || liveContest.status !== "live") return;
            liveContest.status = "ended";
            liveContest.actualEndAt = new Date();
            await liveContest.save();
            await recomputeLeaderboard(liveContest._id);
            if (liveContest.isOfficial) {
              updateRatingsForContest(liveContest._id).catch(() => {});
            }
            console.log(`[scheduler] Contest "${liveContest.title}" auto-ended.`);
          } catch (e) {
            console.error("[scheduler] Auto-end error:", e.message);
          }
        }, endDelay);
      }
    } catch (e) {
      console.error("[scheduler] Auto-start error:", e.message);
    }
    scheduledTimers.delete(contestIdStr);
  }, delay);

  scheduledTimers.set(contestIdStr, timer);
  console.log(`[scheduler] Contest "${contest.title}" scheduled to auto-start in ${Math.round(delay / 60000)} min.`);
};

// On server startup, reschedule any contests still in "scheduled" state
const rescheduleOnStartup = async () => {
  try {
    const scheduled = await Contest.find({ status: "scheduled", scheduledAt: { $gt: new Date() } });
    scheduled.forEach(scheduleAutoStart);
    console.log(`[scheduler] ${scheduled.length} contest(s) rescheduled on startup.`);
  } catch (e) {
    console.error("[scheduler] Startup reschedule error:", e.message);
  }
};

// Call on module load
rescheduleOnStartup();

// ─── Leaderboard helpers ──────────────────────────────────────────────────────

const recomputeLeaderboard = async (contestId) => {
  const contest = await Contest.findById(contestId);
  if (!contest) return;

  const submissions = await Submission.find({ contest: contestId })
    .populate("user", "name")
    .sort({ createdAt: 1 });

  const userMap = {};

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
      entry.questionResults[qKey] = { solved: false, attempts: 0, solvedAt: null, penaltyMinutes: 0 };
    }

    const qResult = entry.questionResults[qKey];
    if (qResult.solved) return;

    qResult.attempts += 1;

    if (sub.verdict === "Accepted") {
      qResult.solved = true;
      qResult.solvedAt = sub.submittedAt || sub.createdAt;

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

  // Sort: questions solved desc, then penalty asc, then lastSubmitAt asc
  const leaderboard = Object.values(userMap).sort((a, b) => {
    if (b.questionsSolved !== a.questionsSolved) return b.questionsSolved - a.questionsSolved;
    if (a.penalty !== b.penalty) return a.penalty - b.penalty;
    if (a.lastSubmitAt && b.lastSubmitAt) return new Date(a.lastSubmitAt) - new Date(b.lastSubmitAt);
    return 0;
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
    const tab = req.query.tab || "all";

    let statusFilter = {};
    if (tab === "upcoming") statusFilter = { status: { $in: ["scheduled", "ready"] } };
    else if (tab === "live") statusFilter = { status: "live" };
    else if (tab === "ended") statusFilter = { status: "ended" };

    const contests = await Contest.find({ visibility, ...statusFilter })
      .select("-roomCode")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(50);

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
      startNow = false, // true = start immediately as live
      isOfficial = false,
      existingProblemIds = [],
    } = req.body;

    if (!title || !durationMinutes) {
      return res.status(400).json({ message: "Title and duration are required." });
    }

    // Role Rule: Public contests can only be created by admins
    if (visibility === "public" && creator.role !== "admin") {
      return res.status(403).json({
        message: "Only administrators can create public contests. Regular users can create private contests and invite their friends.",
      });
    }

    // Build questions array: merge inline questions + existing problems
    let builtQuestions = [];

    // Add existing problems from library
    if (existingProblemIds.length > 0) {
      const problems = await Problem.find({ _id: { $in: existingProblemIds } });
      const problemQuestions = problems.map((p) => ({
        title: p.title,
        prompt: p.formalStatement || p.statement || "",
        timeLimitMs: p.timeLimit || 2000,
        memoryLimitMb: p.memoryLimit || 256,
        difficulty: p.difficulty || "medium",
        tags: p.tags || [],
        topics: p.topics || [],
        points: p.difficulty === "hard" ? 300 : p.difficulty === "medium" ? 200 : 100,
        cognitiveRatings: p.cognitiveRatings || {},
        problemRef: p._id,
        testCases: (p.testCases || []).map((tc) => ({
          input: tc.input ?? "",
          expectedOutput: tc.expectedOutput?.trim() ?? "",
        })),
      }));
      builtQuestions.push(...problemQuestions);
    }

    // Add inline/custom questions
    if (Array.isArray(questions) && questions.length > 0) {
      builtQuestions.push(...questions);
    }

    if (builtQuestions.length === 0) {
      return res.status(400).json({ message: "At least one question is required." });
    }

    const roomCode = await generateContestCode();
    // startNow → go live immediately; scheduledAt → future scheduled; else → ready
    const now = new Date();
    let status, actualStartAt, actualEndAt, endAt, scheduledAtDate;

    if (startNow) {
      status = "live";
      actualStartAt = now;
      actualEndAt = new Date(now.getTime() + Number(durationMinutes) * 60 * 1000);
      endAt = actualEndAt;
      scheduledAtDate = null;
    } else if (scheduledAt) {
      status = "scheduled";
      actualStartAt = null;
      actualEndAt = null;
      endAt = null;
      scheduledAtDate = new Date(scheduledAt);
    } else {
      status = "ready";
      actualStartAt = null;
      actualEndAt = null;
      endAt = null;
      scheduledAtDate = null;
    }

    // Only admins can create official rated contests
    const canBeOfficial = creator.role === "admin" && isOfficial;

    const contest = await Contest.create({
      roomCode,
      title: title.trim(),
      description: description.trim(),
      visibility,
      status,
      isOfficial: canBeOfficial,
      scheduledAt: scheduledAtDate,
      actualStartAt,
      actualEndAt,
      endAt,
      durationMinutes: Number(durationMinutes),
      questions: normalizeQuestions(builtQuestions),
      participants: [{ user: creator._id }],
      createdBy: creator._id,
    });

    // If started immediately, schedule auto-end
    if (startNow && actualEndAt) {
      const endDelay = actualEndAt.getTime() - Date.now();
      if (endDelay > 0) {
        const contestIdStr = contest._id.toString();
        setTimeout(async () => {
          try {
            const liveContest = await Contest.findById(contestIdStr);
            if (!liveContest || liveContest.status !== "live") return;
            liveContest.status = "ended";
            liveContest.actualEndAt = new Date();
            await liveContest.save();
            await recomputeLeaderboard(liveContest._id);
            if (liveContest.isOfficial) {
              updateRatingsForContest(liveContest._id).catch(() => {});
            }
          } catch (e) {
            console.error("[scheduler] Auto-end error (startNow):", e.message);
          }
        }, endDelay);
      }
    }

    // Schedule auto-start if contest is scheduled for future
    if (status === "scheduled") {
      scheduleAutoStart(contest);
    }

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
    const isInvited = Array.isArray(contest.invitedUsers) && contest.invitedUsers.some(
      (u) => (u?._id?.toString() || u?.toString()) === user._id.toString()
    );

    if (contest.visibility === "private" && !code && !isOrganizer && !isInvited) {
      return res.status(400).json({ message: "A private contest requires a room code or an invite from the organizer." });
    }

    const participantExists = contest.participants.some(
      (participant) => participant.user?._id?.toString() === user._id.toString()
    );

    if (!participantExists) {
      // In LeetCode/Codeforces, any participant can join and attempt a live contest!
      contest.participants.push({ user: user._id });
      await contest.save();
    }

    const refreshedContest = await populateContest(Contest.findById(contest._id));
    return res.json({ message: "Joined contest successfully.", contest: refreshedContest });
  } catch (error) {
    return res.status(500).json({ message: "Unable to join contest.", error: error.message });
  }
};

const inviteToContest = async (req, res) => {
  try {
    const user = await resolveContestUser(req);
    const contest = await getContestOr404(req.params.contestId, res);
    if (!contest) return null;

    if (!user) {
      return res.status(401).json({ message: "Please sign in." });
    }

    const isOrganizer = contest.createdBy._id.toString() === user._id.toString();
    if (!isOrganizer && user.role !== "admin") {
      return res.status(403).json({ message: "Only the contest organizer or an admin can invite friends." });
    }

    const { targetUserId, userId, identifier } = req.body;
    let targetUser = null;
    const lookupId = targetUserId || userId;

    if (lookupId) {
      targetUser = await User.findById(lookupId);
    } else if (identifier) {
      const trimmed = identifier.trim();
      targetUser = await User.findOne({
        $or: [
          { email: trimmed.toLowerCase() },
          { name: trimmed },
        ],
      });
    }

    if (!targetUser) {
      return res.status(404).json({ message: "User not found to invite." });
    }

    if (!Array.isArray(contest.invitedUsers)) contest.invitedUsers = [];
    const alreadyInvited = contest.invitedUsers.some(
      (id) => (id?._id?.toString() || id?.toString()) === targetUser._id.toString()
    );

    if (alreadyInvited) {
      return res.status(400).json({ message: `${targetUser.name} is already invited to this contest.` });
    }

    contest.invitedUsers.push(targetUser._id);
    await contest.save();

    return res.json({
      message: `Successfully invited ${targetUser.name} to the contest!`,
      invitedUser: { id: targetUser._id, name: targetUser.name, email: targetUser.email },
      invitedCount: contest.invitedUsers.length,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to invite friend.", error: error.message });
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

    // Schedule auto-end
    const endDelay = contest.actualEndAt.getTime() - Date.now();
    if (endDelay > 0) {
      const contestIdStr = contest._id.toString();
      setTimeout(async () => {
        try {
          const liveContest = await Contest.findById(contestIdStr);
          if (!liveContest || liveContest.status !== "live") return;
          liveContest.status = "ended";
          liveContest.actualEndAt = new Date();
          await liveContest.save();
          await recomputeLeaderboard(liveContest._id);
          if (liveContest.isOfficial) {
            updateRatingsForContest(liveContest._id).catch(() => {});
          }
          console.log(`[scheduler] Contest "${liveContest.title}" auto-ended.`);
        } catch (e) {
          console.error("[scheduler] Auto-end error:", e.message);
        }
      }, endDelay);
    }

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

    // Update ratings only for official contests (admin-created)
    if (contest.isOfficial) {
      updateRatingsForContest(contest._id).catch((e) => {
        console.error("[ratingService] Rating update error:", e.message);
      });
    }

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
      isOfficial: contest.isOfficial,
      contestStart: contest.actualStartAt || contest.startAt || null,
      durationMinutes: contest.durationMinutes,
      questions: contest.questions.map((q, i) => ({
        index: i,
        title: q.title,
        points: q.points || 100,
        difficulty: q.difficulty,
        cognitiveRatings: q.cognitiveRatings || {},
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
    return res.status(201).json({ message: "Virtual contest started.", contest: populated, isNew: true });
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

    const isVirtual = contest.type === "virtual";
    const isUpsolve = contest.status === "ended" && !isVirtual;

    if (!isVirtual && !isUpsolve && contest.status !== "live" && !isOrganizer) {
      return res.status(403).json({ message: "Code execution is available once the contest starts." });
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
        // Tag as upsolve so leaderboard is not updated
        isUpsolve,
      });

      // Only update leaderboard for live or virtual contests (not upsolves)
      if ((contest.status === "live" || isVirtual) && !isUpsolve) {
        recomputeLeaderboard(contest._id).catch(() => {});
      }
    }

    return res.json({
      message: "Code executed successfully.",
      language,
      questionIndex: Number(questionIndex),
      results: execution.results,
      terminalOutput: execution.terminalOutput,
      isUpsolve,
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
  inviteToContest,
};
