const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
    },
    // All participants — multikey index for fast "my conversations" query
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Group-only fields
    groupName: {
      type: String,
      trim: true,
      default: null,
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Denormalized last message for conversation list preview
    lastMessage: {
      content: { type: String, default: "" },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      at: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Multikey index — MongoDB automatically indexes each element in participants array
// This makes "find all conversations where userId is a participant" very fast
conversationSchema.index({ participants: 1 });

// Compound index for fast conversation lookup between two users
conversationSchema.index({ type: 1, participants: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
