const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Submission = require("../models/Submission");
const {
  buildTokens,
  clearRefreshCookie,
  safeUser,
  setRefreshCookie,
  resolveUserFromAccessToken,
  resolveUserFromRefreshToken,
} = require("../services/authSession");

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const { accessToken, refreshToken } = buildTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    setRefreshCookie(res, refreshToken);

    return res.json({
      message: "Login successful.",
      user: safeUser(user),
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
};

const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const { accessToken, refreshToken } = buildTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      message: "Registration successful.",
      user: safeUser(user),
      accessToken,
    });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await resolveUserFromAccessToken(req);

    if (!user) {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }

    return res.json({ user: safeUser(user) });
  } catch (error) {
    return res.status(401).json({ message: "Session expired. Please sign in again.", error: error.message });
  }
};

const refreshSession = async (req, res) => {
  try {
    const user = await resolveUserFromRefreshToken(req);

    if (!user) {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }

    const { accessToken, refreshToken } = buildTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    setRefreshCookie(res, refreshToken);

    return res.json({
      message: "Session refreshed.",
      accessToken,
    });
  } catch (error) {
    return res.status(401).json({ message: "Session expired. Please sign in again.", error: error.message });
  }
};

const signOut = async (req, res) => {
  try {
    const user = await resolveUserFromAccessToken(req) || await resolveUserFromRefreshToken(req);

    if (user) {
      await User.findByIdAndUpdate(user._id, { refreshToken: null });
    }
  } catch (error) {
    // Clear the client cookie even if the token can no longer be verified.
  }

  clearRefreshCookie(res);
  return res.json({ message: "Logged out." });
};

const inferCognitiveCategories = (title = "", tags = []) => {
  const normTitle = String(title || "").toLowerCase();
  const normTags = Array.isArray(tags) ? tags.map((t) => String(t || "").toLowerCase()) : [];

  const checkKeywords = (keywords) => {
    return keywords.some(
      (kw) => normTitle.includes(kw) || normTags.some((tag) => tag.includes(kw))
    );
  };

  const results = [];

  if (checkKeywords(["debug", "fix", "correct", "wrong", "syntax", "compilation", "error", "find the bug", "predict", "choice"])) {
    results.push("Logic Flow & Debugging");
  }
  if (checkKeywords(["complexity", "optimize", "time limit", "memory", "space", "huge input", "large input", "overflow", "floating point", "precision"])) {
    results.push("Memory & Complexity");
  }
  if (checkKeywords(["math", "prime", "modulo", "gcd", "sequence", "numbers", "factorial", "combinatorics", "geometry", "probability"])) {
    results.push("Mathematical Reasoning");
  }
  if (checkKeywords(["dp", "dynamic programming", "shortest", "greedy", "knapsack", "path", "dijkstra", "segment tree", "fenwick", "mst", "binary search"])) {
    results.push("Optimization Ability");
  }

  if (results.length === 0 || checkKeywords(["pattern", "regex", "string", "array", "search", "hash", "map", "filter", "sort"])) {
    results.push("Pattern Recognition");
  }

  return results;
};

const calculateRating = (solvedCount) => {
  if (solvedCount === 0) return 0;
  if (solvedCount === 1) return 35; // Easy (30-40)
  if (solvedCount === 2) return 55; // Medium (50-70)
  if (solvedCount === 3) return 62; // Medium (50-70)
  if (solvedCount === 4) return 68; // Medium (50-70)
  if (solvedCount === 5) return 80; // Hard (80-90)
  if (solvedCount === 6) return 84; // Hard (80-90)
  if (solvedCount === 7) return 88; // Hard (80-90)
  if (solvedCount === 8) return 92; // Extreme (90+)
  if (solvedCount === 9) return 95; // Extreme (90+)
  return Math.min(99, 95 + (solvedCount - 9)); // Extreme (90+), capped at 99
};

const getMyStats = async (req, res) => {
  try {
    const user = await resolveUserFromAccessToken(req);

    if (!user) {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }

    const userId = user._id;

    // Fetch all submissions for this user, populating the contest questions and problem details
    const submissions = await Submission.find({ user: userId })
      .populate("contest", "title questions")
      .populate("problem", "title difficulty category cognitiveCategories topics")
      .sort({ createdAt: -1 });

    const solvedSet = new Set();
    const cognitiveCategoriesList = [
      "Pattern Recognition",
      "Optimization Ability",
      "Mathematical Reasoning",
      "Logic Flow & Debugging",
      "Memory & Complexity"
    ];

    const solvedCounts = {};
    cognitiveCategoriesList.forEach((cat) => {
      solvedCounts[cat] = 0;
    });

    submissions.forEach((sub) => {
      if (sub.verdict === "Accepted") {
        let questionKey = "";
        let cogCats = [];

        if (sub.contest) {
          questionKey = `contest-${sub.contest._id || sub.contest}-${sub.questionIndex}`;
          if (!solvedSet.has(questionKey)) {
            solvedSet.add(questionKey);
            const q = sub.contest.questions?.[sub.questionIndex];
            if (q && Array.isArray(q.cognitiveCategories) && q.cognitiveCategories.length > 0) {
              cogCats = q.cognitiveCategories;
            } else {
              cogCats = inferCognitiveCategories(q?.title || "", q?.topics || []);
            }
          }
        } else if (sub.problem) {
          questionKey = `problem-${sub.problem._id || sub.problem}`;
          if (!solvedSet.has(questionKey)) {
            solvedSet.add(questionKey);
            if (sub.problem && Array.isArray(sub.problem.cognitiveCategories) && sub.problem.cognitiveCategories.length > 0) {
              cogCats = sub.problem.cognitiveCategories;
            } else {
              cogCats = inferCognitiveCategories(
                sub.problem?.title || "",
                sub.problem?.tags || sub.problem?.topics || []
              );
            }
          }
        }

        if (cogCats && cogCats.length > 0) {
          cogCats.forEach((cat) => {
            const matched = cognitiveCategoriesList.find(
              (c) => c.toLowerCase() === cat.toLowerCase()
            );
            if (matched) {
              solvedCounts[matched]++;
            }
          });
        }
      }
    });

    const totalSolved = solvedSet.size;

    const cognitiveProfile = cognitiveCategoriesList.map((name) => {
      const solved = solvedCounts[name] || 0;
      const rating = calculateRating(solved);
      let tier = "Unranked";
      if (rating > 0 && rating < 50) tier = "Easy";
      else if (rating >= 50 && rating < 80) tier = "Medium";
      else if (rating >= 80 && rating < 90) tier = "Hard";
      else if (rating >= 90) tier = "Extreme";

      return {
        name,
        solved,
        rating,
        tier,
      };
    });

    return res.json({
      user: safeUser(user),
      totalSolved,
      cognitiveProfile,
      submissions: submissions.map((sub) => {
        let questionTitle = "Unknown Problem";
        let difficulty = "medium";
        let contestTitle = "Practice";

        if (sub.problem) {
          questionTitle = sub.problem.title || "Unknown Practice Problem";
          difficulty = sub.problem.difficulty || "medium";
        } else if (sub.contest) {
          contestTitle = sub.contest.title || "Unknown Contest";
          questionTitle = `Question #${sub.questionIndex + 1}`;
          if (Array.isArray(sub.contest.questions)) {
            const q = sub.contest.questions[sub.questionIndex];
            if (q && q.title) {
              questionTitle = q.title;
            }
          }
        }

        return {
          _id: sub._id,
          contestId: sub.contest?._id,
          contestTitle,
          questionIndex: sub.questionIndex,
          questionTitle,
          difficulty,
          language: sub.language,
          verdict: sub.verdict,
          code: sub.code,
          submittedAt: sub.submittedAt || sub.createdAt,
        };
      }),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load user dashboard stats.", error: error.message });
  }
};

// ─── Get Public User Profile (for friend profile modal) ──────────────────────

const getUserProfile = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const { userId } = req.params;
    const targetUser = await User.findById(userId).select("name email createdAt");
    if (!targetUser) return res.status(404).json({ message: "User not found." });

    // Get their accepted submissions count
    const submissions = await Submission.find({ user: userId })
      .populate("contest", "title questions")
      .populate("problem", "title difficulty")
      .sort({ createdAt: -1 });

    const solvedSet = new Set();
    submissions.forEach((sub) => {
      if (sub.verdict === "Accepted") {
        if (sub.contest) {
          solvedSet.add(`contest-${sub.contest._id}-${sub.questionIndex}`);
        } else if (sub.problem) {
          solvedSet.add(`problem-${sub.problem._id}`);
        }
      }
    });

    return res.json({
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        createdAt: targetUser.createdAt,
      },
      totalSolved: solvedSet.size,
      recentSubmissions: submissions.slice(0, 10).map((sub) => ({
        _id: sub._id,
        verdict: sub.verdict,
        language: sub.language,
        questionTitle: sub.problem?.title || `Q${(sub.questionIndex || 0) + 1}`,
        difficulty: sub.problem?.difficulty || "medium",
        submittedAt: sub.submittedAt || sub.createdAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load user profile.", error: error.message });
  }
};

module.exports = {
  me,
  refreshSession,
  signIn,
  signOut,
  signUp,
  getMyStats,
  getUserProfile,
};

