const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { clearRefreshCookie, refreshTokenSecret } = require("../../services/authSession");

const logoutController = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      const payload = jwt.verify(token, refreshTokenSecret);
      await User.findByIdAndUpdate(payload.id, { refreshToken: null });
    }
  } catch (error) {
    // Clear the client cookie even if the token can no longer be verified.
  }

  clearRefreshCookie(res);
  return res.json({ message: "Logged out." });
};

module.exports = logoutController;