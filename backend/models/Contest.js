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
    testCases: {
      type: [testCaseSchema],
      validate: [(value) => value.length > 0, "At least one test case is required."],
      required: true,
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
      required: true,
    },
    questions: {
      type: [questionSchema],
      validate: [(value) => value.length > 0, "At least one question is required."],
      required: true,
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
  if (this.startAt && this.durationMinutes) {
    this.endAt = new Date(this.startAt.getTime() + this.durationMinutes * 60 * 1000);
  }

  next();
});

module.exports = mongoose.model("Contest", contestSchema);