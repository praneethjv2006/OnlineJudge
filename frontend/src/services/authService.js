import api from "./api";

const storeAccessToken = (accessToken) => {
  if (accessToken) {
    window.localStorage.setItem("accessToken", accessToken);
  }
};

const clearAccessToken = () => {
  window.localStorage.removeItem("accessToken");
};

export const signIn = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  storeAccessToken(response.data.accessToken);
  return response.data;
};

export const signUp = async (details) => {
  const response = await api.post("/auth/register", details);
  storeAccessToken(response.data.accessToken);
  return response.data;
};

export const loadSession = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const signOut = async () => {
  const response = await api.post("/auth/logout");
  clearAccessToken();
  return response.data;
};