const express = require("express");
const {
	createContest,
	endContest,
	enterContest,
	getContest,
	joinContest,
	listContests,
	runContestCode,
	startContest,
} = require("../controllers/contestController");

const router = express.Router();

router.get("/", listContests);
router.get("/:contestId", getContest);
router.post("/:contestId/enter", enterContest);
router.post("/:contestId/run", runContestCode);
router.post("/:contestId/start", startContest);
router.post("/:contestId/end", endContest);
router.post("/join", joinContest);
router.post("/", createContest);

module.exports = router;