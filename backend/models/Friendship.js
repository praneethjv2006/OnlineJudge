const mongoose = require("mongoose");

const friendshipSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "blocked"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index — prevents duplicate friend requests
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Fast "incoming requests" query: recipient + status
friendshipSchema.index({ recipient: 1, status: 1 });

// Fast "sent requests" / "my friends" query: requester + status
friendshipSchema.index({ requester: 1, status: 1 });

module.exports = mongoose.model("Friendship", friendshipSchema);
