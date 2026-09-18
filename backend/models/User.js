const mongoose = require("mongoose");

const tagRatingSchema = new mongoose.Schema(
  {
    tag: { type: String, required: true },
    rating: { type: Number, default: 0 },
    solved: { type: Number, default: 0 },
    tier: { type: String, default: "Wanderer" },
  },
  { _id: false }
);

const skillMetadataSchema = new mongoose.Schema(
  {
    lastComputedAt: { type: Date, default: null },
    overallRating: { type: Number, default: 0 },
    tier: { type: String, default: "Unranked" },
    tagRatings: { type: [tagRatingSchema], default: [] },
    easySolved: { type: Number, default: 0 },
    mediumSolved: { type: Number, default: 0 },
    hardSolved: { type: Number, default: 0 },
    totalContestsParticipated: { type: Number, default: 0 },
    bestContestRank: { type: Number, default: null },
    contestRatingHistory: { type: [{ rating: Number, date: Date, contestId: mongoose.Schema.Types.ObjectId }], default: [] },
    // 4-dimensional AI performance ratings (ELO per dimension)
    performanceRatings: {
      solvingSpeed: { rating: { type: Number, default: 0 }, tier: { type: String, default: "Unranked" }, score: { type: Number, default: 0 } },
      codeQuality: { rating: { type: Number, default: 0 }, tier: { type: String, default: "Unranked" }, score: { type: Number, default: 0 } },
      optimizationAbility: { rating: { type: Number, default: 0 }, tier: { type: String, default: "Unranked" }, score: { type: Number, default: 0 } },
      memoryEfficiency: { rating: { type: Number, default: 0 }, tier: { type: String, default: "Unranked" }, score: { type: Number, default: 0 } },
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    // role: 'admin' can create official contests that update global ratings
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    skillMetadata: {
      type: skillMetadataSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);