const mongoose = require("mongoose");

const rateLimitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["ai_review", "code_run"],
      required: true,
    },
    timestamps: [
      {
        type: Date,
        default: Date.now,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly find a user's rate limits for an action
rateLimitSchema.index({ userId: 1, action: 1 }, { unique: true });

module.exports = mongoose.model("RateLimit", rateLimitSchema);
