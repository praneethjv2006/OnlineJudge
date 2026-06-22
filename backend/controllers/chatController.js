const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Friendship = require("../models/Friendship");
const { resolveUserFromAccessToken } = require("../services/authSession");

// ─── Helper: verify user is a participant ────────────────────────────────────

const assertParticipant = (conversation, userId) => {
  return conversation.participants.some(
    (p) => p.toString() === userId.toString()
  );
};

// ─── Get My Conversations ─────────────────────────────────────────────────────

const getConversations = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const conversations = await Conversation.find({ participants: me._id })
      .sort({ "lastMessage.at": -1, updatedAt: -1 })
      .limit(50)
      .populate("participants", "name email")
      .populate("lastMessage.sender", "name");

    return res.json({ conversations });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch conversations.", error: err.message });
  }
};

// ─── Get or Create Direct Conversation ───────────────────────────────────────

const getOrCreateDirect = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const { friendId } = req.body;
    if (!friendId || !mongoose.isValidObjectId(friendId)) {
      return res.status(400).json({ message: "Invalid friendId." });
    }

    // Only allow DM if they are friends
    const friendship = await Friendship.findOne({
      status: "accepted",
      $or: [
        { requester: me._id, recipient: friendId },
        { requester: friendId, recipient: me._id },
      ],
    });
    if (!friendship) {
      return res.status(403).json({ message: "You can only message friends." });
    }

    // Find existing direct conversation between the two
    let conversation = await Conversation.findOne({
      type: "direct",
      participants: { $all: [me._id, friendId], $size: 2 },
    }).populate("participants", "name email");

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [me._id, friendId],
      });
      conversation = await Conversation.findById(conversation._id).populate("participants", "name email");
    }

    return res.json({ conversation });
  } catch (err) {
    return res.status(500).json({ message: "Failed to open conversation.", error: err.message });
  }
};

// ─── Create Group Conversation ────────────────────────────────────────────────

const createGroup = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const { groupName, participantIds } = req.body;

    if (!groupName || !groupName.trim()) {
      return res.status(400).json({ message: "Group name is required." });
    }

    if (!Array.isArray(participantIds) || participantIds.length < 1) {
      return res.status(400).json({ message: "At least one other participant is required." });
    }

    // Ensure all participants are friends
    const allParticipants = [me._id.toString(), ...participantIds];
    const uniqueParticipants = [...new Set(allParticipants)];

    const conversation = await Conversation.create({
      type: "group",
      groupName: groupName.trim(),
      groupAdmin: me._id,
      participants: uniqueParticipants,
    });

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", "name email")
      .populate("groupAdmin", "name");

    return res.status(201).json({ conversation: populated });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create group.", error: err.message });
  }
};

// ─── Add Member to Group ──────────────────────────────────────────────────────

const addGroupMember = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Group not found." });
    }

    if (conversation.groupAdmin.toString() !== me._id.toString()) {
      return res.status(403).json({ message: "Only the group admin can add members." });
    }

    const { userId } = req.body;
    if (conversation.participants.some((p) => p.toString() === userId)) {
      return res.status(409).json({ message: "User is already a member." });
    }

    conversation.participants.push(userId);
    await conversation.save();

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", "name email");

    return res.json({ conversation: populated });
  } catch (err) {
    return res.status(500).json({ message: "Failed to add member.", error: err.message });
  }
};

// ─── Get Messages (Paginated, newest first) ───────────────────────────────────

const getMessages = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    if (!assertParticipant(conversation, me._id)) {
      return res.status(403).json({ message: "Not a participant in this conversation." });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ conversationId: conversation._id })
        .sort({ createdAt: -1 })  // Newest first for pagination
        .skip(skip)
        .limit(limit)
        .populate("sender", "name email"),
      Message.countDocuments({ conversationId: conversation._id }),
    ]);

    // Return in chronological order for display
    const chronological = [...messages].reverse();

    return res.json({
      messages: chronological,
      page,
      limit,
      total,
      hasMore: skip + limit < total,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch messages.", error: err.message });
  }
};

// ─── Send Message ─────────────────────────────────────────────────────────────

const sendMessage = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    if (!assertParticipant(conversation, me._id)) {
      return res.status(403).json({ message: "Not a participant in this conversation." });
    }

    const { content, type = "text", language = null, replyTo = null } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content cannot be empty." });
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    // Build replyTo preview if provided
    let replyToData = { messageId: null, senderName: null, preview: null, type: "text" };
    if (replyTo?.messageId) {
      try {
        const quoted = await Message.findById(replyTo.messageId).populate("sender", "name");
        if (quoted) {
          replyToData = {
            messageId: quoted._id,
            senderName: quoted.sender?.name || "Unknown",
            preview: quoted.content.slice(0, 100),
            type: quoted.type || "text",
          };
        }
      } catch { /* skip replyTo if not found */ }
    }

    const message = await Message.create({
      conversationId: conversation._id,
      sender: me._id,
      content: content.trim(),
      type,
      language,
      replyTo: replyToData,
      expiresAt,
    });

    // Update conversation lastMessage for list preview
    conversation.lastMessage = {
      content: content.trim().slice(0, 100),
      sender: me._id,
      at: new Date(),
    };
    await conversation.save();

    const populated = await Message.findById(message._id).populate("sender", "name email");

    return res.status(201).json({ message: populated });
  } catch (err) {
    return res.status(500).json({ message: "Failed to send message.", error: err.message });
  }
};

// ─── Delete Own Message ───────────────────────────────────────────────────────

const deleteMessage = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const message = await Message.findById(req.params.msgId);
    if (!message) return res.status(404).json({ message: "Message not found." });

    if (message.sender.toString() !== me._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own messages." });
    }

    await message.deleteOne();

    return res.json({ message: "Message deleted." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete message.", error: err.message });
  }
};

// ─── Toggle Emoji Reaction ────────────────────────────────────────────────────

const toggleReaction = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const message = await Message.findById(req.params.msgId);
    if (!message) return res.status(404).json({ message: "Message not found." });

    const conversation = await Conversation.findById(message.conversationId);
    if (!conversation || !assertParticipant(conversation, me._id)) {
      return res.status(403).json({ message: "Not a participant." });
    }

    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: "Emoji required." });

    const reactions = message.reactions || new Map();
    const userId = me._id.toString();
    const existing = reactions.get(emoji) || [];

    if (existing.includes(userId)) {
      // Remove reaction
      reactions.set(emoji, existing.filter((id) => id !== userId));
      if (reactions.get(emoji).length === 0) reactions.delete(emoji);
    } else {
      // Add reaction (also remove this user's reaction from other emojis)
      for (const [key, users] of reactions.entries()) {
        if (users.includes(userId)) {
          const filtered = users.filter((id) => id !== userId);
          if (filtered.length === 0) reactions.delete(key);
          else reactions.set(key, filtered);
        }
      }
      reactions.set(emoji, [...(reactions.get(emoji) || []), userId]);
    }

    message.reactions = reactions;
    await message.save();

    // Convert Map to plain object for response
    const reactionsObj = {};
    for (const [k, v] of message.reactions.entries()) {
      reactionsObj[k] = v;
    }

    return res.json({ reactions: reactionsObj });
  } catch (err) {
    return res.status(500).json({ message: "Failed to toggle reaction.", error: err.message });
  }
};

// ─── Leave Group ──────────────────────────────────────────────────────────────

const leaveGroup = async (req, res) => {
  try {
    const me = await resolveUserFromAccessToken(req);
    if (!me) return res.status(401).json({ message: "Please sign in." });

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Group not found." });
    }

    if (!assertParticipant(conversation, me._id)) {
      return res.status(403).json({ message: "You are not a member." });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.toString() !== me._id.toString()
    );

    // If admin leaves, assign admin to first remaining member
    if (conversation.groupAdmin?.toString() === me._id.toString() && conversation.participants.length > 0) {
      conversation.groupAdmin = conversation.participants[0];
    }

    await conversation.save();
    return res.json({ message: "Left the group." });
  } catch (err) {
    return res.status(500).json({ message: "Failed to leave group.", error: err.message });
  }
};

module.exports = {
  getConversations,
  getOrCreateDirect,
  createGroup,
  addGroupMember,
  getMessages,
  sendMessage,
  deleteMessage,
  toggleReaction,
  leaveGroup,
};
