import api from "./api";

export const getConversations = async () => {
  const res = await api.get("/chat/conversations");
  return res.data;
};

export const openDirectChat = async (friendId) => {
  const res = await api.post("/chat/conversations/direct", { friendId });
  return res.data;
};

export const createGroupChat = async (groupName, participantIds) => {
  const res = await api.post("/chat/conversations/group", { groupName, participantIds });
  return res.data;
};

export const addGroupMember = async (conversationId, userId) => {
  const res = await api.patch(`/chat/conversations/group/${conversationId}/add`, { userId });
  return res.data;
};

export const leaveGroup = async (conversationId) => {
  const res = await api.post(`/chat/conversations/group/${conversationId}/leave`);
  return res.data;
};

export const getMessages = async (conversationId, page = 1, limit = 50) => {
  const res = await api.get(`/chat/conversations/${conversationId}/messages`, {
    params: { page, limit },
  });
  return res.data;
};

export const sendMessage = async (conversationId, content, type = "text", language = null, replyTo = null) => {
  const res = await api.post(`/chat/conversations/${conversationId}/messages`, {
    content,
    type,
    language,
    replyTo,
  });
  return res.data;
};

export const deleteMessage = async (conversationId, messageId) => {
  const res = await api.delete(`/chat/conversations/${conversationId}/messages/${messageId}`);
  return res.data;
};

export const toggleReaction = async (conversationId, messageId, emoji) => {
  const res = await api.post(`/chat/conversations/${conversationId}/messages/${messageId}/react`, { emoji });
  return res.data;
};

