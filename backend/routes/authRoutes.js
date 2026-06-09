const express = require("express");
const {
	me,
	refreshSession,
	signIn,
	signOut,
	signUp,
	getMyStats,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", signUp);
router.post("/login", signIn);
router.post("/refresh", refreshSession);
router.post("/logout", signOut);
router.get("/me", me);
router.get("/dashboard-stats", getMyStats);

module.exports = router;