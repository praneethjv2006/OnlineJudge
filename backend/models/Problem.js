const mongoose = require("mongoose");

const testCaseSchema = new mongoose.Schema(
  {
    // input can be empty string for problems with no stdin
    input: {
      type: String,
      default: "",
      trim: false,
    },
    expectedOutput: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

// 5 cognitive skill ratings (0–100) — admin-settable
const cognitiveRatingsSchema = new mongoose.Schema(
  {
    patternRecognition:    { type: Number, default: 0, min: 0, max: 100 },
    optimizationAbility:   { type: Number, default: 0, min: 0, max: 100 },
    mathematicalReasoning: { type: Number, default: 0, min: 0, max: 100 },
    logicFlowDebugging:    { type: Number, default: 0, min: 0, max: 100 },
    memoryComplexity:      { type: Number, default: 0, min: 0, max: 100 },
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
    codeTemplates: {
      type: Object,
      default: {},
    },
    driverCode: {
      type: Object,
      default: {},
    },
    isFunctionMode: {
      type: Boolean,
      default: false,
    },
    cognitiveRatings: { type: cognitiveRatingsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Problem", problemSchema);
