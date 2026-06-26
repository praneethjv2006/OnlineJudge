const express = require("express");
const {
	createContest,
	endContest,
	enterContest,
	getContest,
	getSubmissions,
	joinContest,
	listContests,
	runContestCode,
	startContest,
} = require("../controllers/contestController");
const { checkRateLimit } = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/", listContests);
router.get("/:contestId", getContest);
router.get("/:contestId/submissions", getSubmissions);
router.post("/:contestId/enter", enterContest);
router.post("/:contestId/run", checkRateLimit("code_run", 60, 600), runContestCode);
router.post("/:contestId/start", startContest);
router.post("/:contestId/end", endContest);
router.post("/join", joinContest);
router.post("/", createContest);

module.exports = router;