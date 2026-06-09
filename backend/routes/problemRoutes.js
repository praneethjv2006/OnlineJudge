const express = require("express");
const {
  listProblems,
  createProblem,
  getProblem,
} = require("../controllers/problemController");

const router = express.Router();

router.get("/", listProblems);
router.get("/:id", getProblem);
router.post("/", createProblem);

module.exports = router;