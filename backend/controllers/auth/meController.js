const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { refreshTokenSecret, safeUser } = require("../../services/authSession");

const meController = async (req, res) => {
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

    return res.json({ user: safeUser(user) });
  } catch (error) {
    return res.status(401).json({ message: "Session expired. Please sign in again.", error: error.message });
  }
};

module.exports = meController;