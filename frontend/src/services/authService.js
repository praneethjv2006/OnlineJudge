import api from "./api";

export const signIn = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const signUp = async (details) => {
  const response = await api.post("/auth/register", details);
  return response.data;
};

export const loadSession = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const signOut = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};