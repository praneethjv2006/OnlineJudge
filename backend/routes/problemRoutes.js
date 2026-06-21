const express = require("express");
const {
  listProblems,
  createProblem,
  updateProblem,
  getProblem,
  runProblemCode,
  getProblemSubmissions,
  analyzeCode,
  deleteProblem,
} = require("../controllers/problemController");

const router = express.Router();

router.get("/", listProblems);
router.get("/:id/submissions", getProblemSubmissions);
router.post("/:id/run", runProblemCode);
router.post("/analyze", analyzeCode);
router.post("/", createProblem);
router
  .route("/:id")
  .get(getProblem)
  .put(updateProblem)
  .patch(updateProblem)
  .delete(deleteProblem);

module.exports = router;
