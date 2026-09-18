const express = require("express");
const {
  me,
  refreshSession,
  signIn,
  signOut,
  signUp,
  getMyStats,
  getUserProfile,
  addAdmin,
  listAdmins,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", signUp);
router.post("/login", signIn);
router.post("/refresh", refreshSession);
router.post("/logout", signOut);
router.get("/me", me);
router.get("/dashboard-stats", getMyStats);
router.get("/users/:userId/stats", getUserProfile);

// Admin management — guarded inside the controller
router.post("/admin/promote", addAdmin);
router.get("/admin/list", listAdmins);

module.exports = router;