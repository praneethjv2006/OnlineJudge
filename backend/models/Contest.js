const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      required: true,
      trim: true,
    },
    expectedOutput: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    timeLimitMs: {
      type: Number,
      required: true,
      min: 100,
    },
    category: {
      type: String,
      default: "Coding",
      trim: true,
    },
    cognitiveCategories: {
      type: [String],
      default: [],
    },
    topics: {
      type: [String],
      default: [],
    },
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
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    status: {
      type: String,
      enum: ["ready", "live", "ended"],
      default: "ready",
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 15,
    },
    startAt: {
      type: Date,
      default: Date.now,
    },
    endAt: {
      type: Date,
      default: null,
    },
    actualStartAt: {
      type: Date,
      default: null,
    },
    actualEndAt: {
      type: Date,
      default: null,
    },
    questions: {
      type: [questionSchema],
      validate: [(value) => value.length > 0, "At least one question is required."],
      required: true,
    },
    participants: {
      type: [participantSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

contestSchema.pre("validate", function contestDurationHook(next) {
  if (this.actualStartAt && this.durationMinutes) {
    this.endAt = new Date(this.actualStartAt.getTime() + this.durationMinutes * 60 * 1000);
  }

  next();
});

module.exports = mongoose.model("Contest", contestSchema);