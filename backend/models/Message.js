const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    // "text" = normal message, "code" = code snippet with syntax highlighting
    type: {
      type: String,
      enum: ["text", "code"],
      default: "text",
    },
    // The language for code snippets (e.g. "cpp", "python", "javascript")
    language: {
      type: String,
      default: null,
    },
    // Reply-to: stores a preview of the quoted message
    replyTo: {
      messageId: { type: mongoose.Schema.Types.ObjectId, default: null },
      senderName: { type: String, default: null },
      preview: { type: String, default: null }, // first 100 chars of quoted content
      type: { type: String, default: "text" }, // "text" or "code"
    },
    // Emoji reactions: { "👍": ["userId1", "userId2"], "❤️": ["userId3"] }
    reactions: {
      type: Map,
      of: [String], // array of user IDs who reacted with that emoji
      default: {},
    },
    // TTL field — MongoDB auto-deletes this document 48 hours after creation
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    },
  },
  {
    timestamps: true,
  }
);

// ─── Critical Performance Indexes ────────────────────────────────────────────

// Fast message fetch: most recent messages in a conversation
messageSchema.index({ conversationId: 1, createdAt: -1 });

// TTL index: MongoDB daemon checks this field every ~60 seconds and auto-deletes
// documents where expiresAt < current time. Zero application-level code needed.
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Message", messageSchema);
