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

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    statement: {
      type: String,
      required: true,
      trim: true,
    },
    timeComplexity: {
      type: String,
      trim: true,
      default: "",
    },
    spaceComplexity: {
      type: String,
      trim: true,
      default: "",
    },
    testCases: {
      type: [testCaseSchema],
      validate: [(value) => value.length > 0, "At least one test case is required."],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    timeLimit: {
      type: Number,
      default: 2000,
    },
    memoryLimit: {
      type: Number,
      default: 256,
    },
    problemStory: {
      type: String,
      default: "",
    },
    formalStatement: {
      type: String,
      default: "",
    },
    inputFormat: {
      type: String,
      default: "",
    },
    outputFormat: {
      type: String,
      default: "",
    },
    constraints: {
      type: String,
      default: "",
    },
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Problem", problemSchema);
