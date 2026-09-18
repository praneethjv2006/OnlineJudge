const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    contest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contest",
      required: false,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questionIndex: {
      type: Number,
      required: false,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    verdict: {
      type: String,
      required: true,
    },
    results: [
      {
        id: Number,
        verdict: String,
        stdout: String,
        stderr: String,
        actualOutput: String,
        expectedOutput: String,
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    // True when submitted after contest ended (upsolving) — excluded from leaderboard
    isUpsolve: { type: Boolean, default: false },
    // AI-rated 4-dimensional performance scores (optional, populated asynchronously after AC)
    performanceRatings: {
      solvingSpeed: { type: Number, default: null },
      codeQuality: { type: Number, default: null },
      optimizationAbility: { type: Number, default: null },
      memoryEfficiency: { type: Number, default: null },
      scores: {
        solvingSpeed: { type: Number, default: null },
        codeQuality: { type: Number, default: null },
        optimizationAbility: { type: Number, default: null },
        memoryEfficiency: { type: Number, default: null },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Submission", submissionSchema);
