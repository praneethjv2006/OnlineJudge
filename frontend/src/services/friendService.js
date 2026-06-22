import api from "./api";

export const searchUsers = async (q) => {
  const res = await api.get("/friends/search", { params: { q } });
  return res.data;
};

export const sendFriendRequest = async (recipientId) => {
  const res = await api.post("/friends/request", { recipientId });
  return res.data;
};

export const acceptFriendRequest = async (friendshipId) => {
  const res = await api.patch(`/friends/request/${friendshipId}/accept`);
  return res.data;
};

export const rejectFriendRequest = async (friendshipId) => {
  const res = await api.patch(`/friends/request/${friendshipId}/reject`);
  return res.data;
};

export const cancelFriendRequest = async (friendshipId) => {
  const res = await api.delete(`/friends/request/${friendshipId}`);
  return res.data;
};

export const unfriend = async (friendId) => {
  const res = await api.delete(`/friends/${friendId}`);
  return res.data;
};

export const getMyFriends = async (page = 1, limit = 20) => {
  const res = await api.get("/friends", { params: { page, limit } });
  return res.data;
};

export const getIncomingRequests = async (page = 1) => {
  const res = await api.get("/friends/requests/incoming", { params: { page } });
  return res.data;
};

export const getSentRequests = async () => {
  const res = await api.get("/friends/requests/sent");
  return res.data;
};

export const getMutualFriends = async (userId) => {
  const res = await api.get(`/friends/mutual/${userId}`);
  return res.data;
};

export const getFriendSuggestions = async () => {
  const res = await api.get("/friends/suggestions");
  return res.data;
};

export const getRequestCount = async () => {
  try {
    const res = await api.get("/friends/requests/count");
    return res.data.count || 0;
  } catch {
    return 0;
  }
};
