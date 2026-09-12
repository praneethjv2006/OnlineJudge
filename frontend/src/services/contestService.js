import api from "./api";

export const loadContests = async (visibility, tab = "all") => {
  const response = await api.get(`/contests?visibility=${encodeURIComponent(visibility)}&tab=${encodeURIComponent(tab)}`);
  return response.data;
};

export const createContest = async (payload) => {
  const response = await api.post("/contests", payload);
  return response.data;
};

export const loadContest = async (contestId) => {
  const response = await api.get(`/contests/${contestId}`);
  return response.data;
};

export const joinContest = async (payload) => {
  const response = await api.post("/contests/join", payload);
  return response.data;
};

export const enterContest = async (contestId, payload = {}) => {
  const response = await api.post(`/contests/${contestId}/enter`, payload);
  return response.data;
};

export const startContest = async (contestId) => {
  const response = await api.post(`/contests/${contestId}/start`);
  return response.data;
};

export const endContest = async (contestId) => {
  const response = await api.post(`/contests/${contestId}/end`);
  return response.data;
};

export const runContestCode = async (contestId, payload) => {
  const response = await api.post(`/contests/${contestId}/run`, payload);
  return response.data;
};

export const getContestSubmissions = async (contestId) => {
  const response = await api.get(`/contests/${contestId}/submissions`);
  return response.data;
};

export const loadContestLeaderboard = async (contestId) => {
  const response = await api.get(`/contests/${contestId}/leaderboard`);
  return response.data;
};

export const startVirtualContest = async (contestId) => {
  const response = await api.post(`/contests/${contestId}/virtual`);
  return response.data;
};

// Fetch problems from library for the "Add Existing Problem" flow in CreateContestPage
export const searchProblems = async (query = "") => {
  const response = await api.get(`/problems${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  return response.data.problems || [];
};