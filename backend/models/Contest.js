const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true, trim: true },
    expectedOutput: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    prompt: { type: String, required: true, trim: true },
    timeLimitMs: { type: Number, required: true, min: 100, default: 2000 },
    memoryLimitMb: { type: Number, default: 256 },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    category: { type: String, default: "Coding", trim: true },
    cognitiveCategories: { type: [String], default: [] },
    topics: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    points: { type: Number, default: 100 },
    // If linked to a Problem document (added from problem library)
    problemRef: { type: mongoose.Schema.Types.ObjectId, ref: "Problem", default: null },
    testCases: {
      type: [testCaseSchema],
      validate: [(value) => value.length > 0, "At least one test case is required."],
      required: true,
    },
  },
  { _id: false }
);

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now },
    isVirtual: { type: Boolean, default: false },
    virtualStartedAt: { type: Date, default: null },
  },
  { _id: false }
);

const leaderboardEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, default: "" },
    score: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },
    questionsSolved: { type: Number, default: 0 },
    questionResults: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastSubmitAt: { type: Date, default: null },
    rank: { type: Number, default: 0 },
  },
  { _id: false }
);

const contestSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    status: { type: String, enum: ["scheduled", "ready", "live", "ended"], default: "ready" },
    type: { type: String, enum: ["regular", "virtual"], default: "regular" },
    virtualOf: { type: mongoose.Schema.Types.ObjectId, ref: "Contest", default: null },
    durationMinutes: { type: Number, required: true, min: 15 },
    scheduledAt: { type: Date, default: null },
    startAt: { type: Date, default: Date.now },
    endAt: { type: Date, default: null },
    actualStartAt: { type: Date, default: null },
    actualEndAt: { type: Date, default: null },
    // isOfficial: only admin-created official contests contribute to global ratings
    isOfficial: { type: Boolean, default: false },
    questions: {
      type: [questionSchema],
      validate: [(value) => value.length > 0, "At least one question is required."],
      required: true,
    },
    participants: { type: [participantSchema], default: [] },
    leaderboard: { type: [leaderboardEntrySchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    registrationOpen: { type: Boolean, default: true },
    maxParticipants: { type: Number, default: null },
  },
  { timestamps: true }
);

contestSchema.pre("validate", function contestDurationHook(next) {
  if (this.actualStartAt && this.durationMinutes) {
    this.endAt = new Date(this.actualStartAt.getTime() + this.durationMinutes * 60 * 1000);
  }
  next();
});

module.exports = mongoose.model("Contest", contestSchema);