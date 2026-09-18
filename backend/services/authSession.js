const jwt = require("jsonwebtoken");
const User = require("../models/User");

const accessTokenSecret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";
const accessTokenExpiry = process.env.JWT_ACCESS_EXPIRES_IN || "1h";
const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  // Cross-origin refresh calls require SameSite=None on HTTPS
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const buildTokens = (user) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role || "user",
  };

  const accessToken = jwt.sign(payload, accessTokenSecret, {
    expiresIn: accessTokenExpiry,
  });

  const refreshToken = jwt.sign(payload, refreshTokenSecret, {
    expiresIn: refreshTokenExpiry,
  });

  return { accessToken, refreshToken };
};

// Returns a safe user object to send to the client (no password/token)
const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role || "user",
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, cookieOptions);
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", cookieOptions);
};

/**
 * Resolves a user from the Access Token (Authorization header).
 * Does NOT fall back to refresh token.
 */
const resolveUserFromAccessToken = async (req) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return null;

  try {
    const payload = jwt.verify(token, accessTokenSecret);
    return await User.findById(payload.id);
  } catch (err) {
    return null;
  }
};

/**
 * Resolves a user from the Refresh Token (HTTP-only cookie).
 * Used only for the refresh endpoint.
 */
const resolveUserFromRefreshToken = async (req) => {
  const token = req.cookies?.refreshToken;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, refreshTokenSecret);
    const user = await User.findById(payload.id);

    if (user && user.refreshToken === token) {
      return user;
    }
    return null;
  } catch (err) {
    return null;
  }
};

module.exports = {
  buildTokens,
  clearRefreshCookie,
  cookieOptions,
  safeUser,
  setRefreshCookie,
  accessTokenSecret,
  refreshTokenSecret,
  resolveUserFromAccessToken,
  resolveUserFromRefreshToken,
};
