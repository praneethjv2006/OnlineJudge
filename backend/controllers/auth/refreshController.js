const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { buildTokens, refreshTokenSecret, setRefreshCookie } = require("../../services/authSession");

const refreshController = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }

    const payload = jwt.verify(token, refreshTokenSecret);
    const user = await User.findById(payload.id);

    if (!user || user.refreshToken !== token) {
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

module.exports = refreshController;