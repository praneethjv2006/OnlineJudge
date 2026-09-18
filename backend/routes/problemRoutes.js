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
  updateCognitiveRatings,
} = require("../controllers/problemController");
const { checkRateLimit } = require("../middleware/rateLimiter");

const router = express.Router();

router.get("/", listProblems);
router.get("/:id/submissions", getProblemSubmissions);
router.post("/:id/run", checkRateLimit("code_run", 60, 600), runProblemCode);
router.post("/analyze", checkRateLimit("ai_review", 15, 60), analyzeCode);
router.post("/", createProblem);
// Admin: PATCH cognitive ratings only
router.patch("/:id/cognitive-ratings", updateCognitiveRatings);
router
  .route("/:id")
  .get(getProblem)
  .put(updateProblem)
  .patch(updateProblem)
  .delete(deleteProblem);

module.exports = router;
