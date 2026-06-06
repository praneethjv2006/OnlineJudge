const express = require("express");
const { createContest, joinContest, listContests } = require("../controllers/contestController");

const router = express.Router();

router.get("/", listContests);
router.post("/join", joinContest);
router.post("/", createContest);

module.exports = router;