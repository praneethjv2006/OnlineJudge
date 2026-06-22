import api from "./api";

const storeSession = (accessToken, user) => {
  if (accessToken) {
    window.localStorage.setItem("accessToken", accessToken);
  }
  if (user) {
    window.localStorage.setItem("user", JSON.stringify(user));
  }
};

const clearSession = () => {
  window.localStorage.removeItem("accessToken");
  window.localStorage.removeItem("user");
};

export const signIn = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  storeSession(response.data.accessToken, response.data.user);
  return response.data;
};

export const signUp = async (details) => {
  const response = await api.post("/auth/register", details);
  storeSession(response.data.accessToken, response.data.user);
  return response.data;
};

export const loadSession = async () => {
  const response = await api.get("/auth/me");
  if (response.data.user) {
    window.localStorage.setItem("user", JSON.stringify(response.data.user));
  }
  return response.data;
};

export const loadDashboardStats = async () => {
  const response = await api.get("/auth/dashboard-stats");
  return response.data;
};

export const loadFriendProfile = async (userId) => {
  const response = await api.get(`/auth/users/${userId}/stats`);
  return response.data;
};

export const signOut = async () => {
  const response = await api.post("/auth/logout");
  clearSession();
  return response.data;
};