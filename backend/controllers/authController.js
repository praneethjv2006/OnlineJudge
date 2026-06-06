const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  buildTokens,
  clearRefreshCookie,
  refreshTokenSecret,
  safeUser,
  setRefreshCookie,
} = require("../services/authSession");

const resolveSessionUser = async (req) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return null;
  }

  const payload = jwt.verify(token, refreshTokenSecret);
  const user = await User.findById(payload.id);

  if (!user || user.refreshToken !== token) {
    return null;
  }

  return { token, user };
};

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
    const session = await resolveSessionUser(req);

    if (!session) {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }

    return res.json({ user: safeUser(session.user) });
  } catch (error) {
    return res.status(401).json({ message: "Session expired. Please sign in again.", error: error.message });
  }
};

const refreshSession = async (req, res) => {
  try {
    const session = await resolveSessionUser(req);

    if (!session) {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }

    const { accessToken, refreshToken } = buildTokens(session.user);
    session.user.refreshToken = refreshToken;
    await session.user.save();

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
    const session = await resolveSessionUser(req);

    if (session) {
      await User.findByIdAndUpdate(session.user._id, { refreshToken: null });
    }
  } catch (error) {
    // Clear the client cookie even if the token can no longer be verified.
  }

  clearRefreshCookie(res);
  return res.json({ message: "Logged out." });
};

module.exports = {
  me,
  refreshSession,
  signIn,
  signOut,
  signUp,
};