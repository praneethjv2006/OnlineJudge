const express = require("express");
const {
  getConversations,
  getOrCreateDirect,
  createGroup,
  addGroupMember,
  getMessages,
  sendMessage,
  deleteMessage,
  toggleReaction,
  leaveGroup,
} = require("../controllers/chatController");

const router = express.Router();

// Conversations
router.get("/conversations", getConversations);
router.post("/conversations/direct", getOrCreateDirect);
router.post("/conversations/group", createGroup);
router.patch("/conversations/group/:id/add", addGroupMember);
router.post("/conversations/group/:id/leave", leaveGroup);

// Messages
router.get("/conversations/:id/messages", getMessages);
router.post("/conversations/:id/messages", sendMessage);
router.delete("/conversations/:id/messages/:msgId", deleteMessage);
router.post("/conversations/:id/messages/:msgId/react", toggleReaction);

module.exports = router;

