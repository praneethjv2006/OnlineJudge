const express = require("express");
const {
  listProblems,
  createProblem,
  getProblem,
  runProblemCode,
  getProblemSubmissions,
} = require("../controllers/problemController");

const router = express.Router();

router.get("/", listProblems);
router.get("/:id", getProblem);
router.get("/:id/submissions", getProblemSubmissions);
router.post("/:id/run", runProblemCode);
router.post("/", createProblem);

module.exports = router;
