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
      .populate("problem", "title difficulty")
      .sort({ createdAt: -1 });

    const solvedSet = new Set();
    submissions.forEach((sub) => {
      if (sub.verdict === "Accepted") {
        if (sub.contest) {
          solvedSet.add(`contest-${sub.contest._id || sub.contest}-${sub.questionIndex}`);
        } else if (sub.problem) {
          solvedSet.add(`problem-${sub.problem._id || sub.problem}`);
        }
      }
    });

    const totalSolved = solvedSet.size;

    return res.json({
      user: safeUser(user),
      totalSolved,
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

module.exports = {
  me,
  refreshSession,
  signIn,
  signOut,
  signUp,
  getMyStats,
};
