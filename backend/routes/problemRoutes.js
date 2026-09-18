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
  rateSubmissionPerformance,
} = require("../controllers/problemController");
const { checkRateLimit } = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/", listProblems);
router.get("/:id/submissions", getProblemSubmissions);
router.post("/:id/run", checkRateLimit("code_run", 60, 600), runProblemCode);
router.post("/:id/rate-performance", checkRateLimit("ai_review", 15, 60), rateSubmissionPerformance);
router.post("/analyze", checkRateLimit("ai_review", 15, 60), analyzeCode);
router.post("/", createProblem);
router
  .route("/:id")
  .get(getProblem)
  .put(updateProblem)
  .patch(updateProblem)
  .delete(deleteProblem);

module.exports = router;
