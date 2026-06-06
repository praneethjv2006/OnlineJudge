import api from "./api";

export const loadContests = async (visibility) => {
  const response = await api.get(`/contests?visibility=${encodeURIComponent(visibility)}`);
  return response.data;
};

export const createContest = async (payload) => {
  const response = await api.post("/contests", payload);
  return response.data;
};

export const joinContest = async (payload) => {
  const response = await api.post("/contests/join", payload);
  return response.data;
};