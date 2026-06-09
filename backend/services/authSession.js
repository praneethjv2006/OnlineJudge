const jwt = require("jsonwebtoken");

const accessTokenSecret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";
const accessTokenExpiry = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

const buildTokens = (user) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
  };

  const accessToken = jwt.sign(payload, accessTokenSecret, {
    expiresIn: accessTokenExpiry,
  });

  const refreshToken = jwt.sign(payload, refreshTokenSecret, {
    expiresIn: refreshTokenExpiry,
  });

  return { accessToken, refreshToken };
};

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, cookieOptions);
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", cookieOptions);
};

module.exports = {
  buildTokens,
  clearRefreshCookie,
  cookieOptions,
  safeUser,
  setRefreshCookie,
  accessTokenSecret,
  refreshTokenSecret,
};