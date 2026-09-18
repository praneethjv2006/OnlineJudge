import api from "./api";

export const getApiHealth = async () => {
  const response = await api.get("/health");
  return response.data;
};

export const getProblems = async () => {
  const response = await api.get("/problems");
  return response.data.problems;
};

export const getProblem = async (id) => {
  const response = await api.get(`/problems/${id}`);
  return response.data.problem;
};

export const createProblem = async (problemData) => {
  const response = await api.post("/problems", problemData);
  return response.data.problem;
};

export const updateProblem = async (id, problemData) => {
  const response = await api.put(`/problems/${id}`, problemData);
  return response.data.problem;
};

export const runProblemCode = async (id, payload) => {
  const response = await api.post(`/problems/${id}/run`, payload);
  return response.data;
};

export const analyzeCode = async (payload) => {
  const response = await api.post("/problems/analyze", payload);
  return response.data;
};

export const getProblemSubmissions = async (id) => {
  const response = await api.get(`/problems/${id}/submissions`);
  return response.data;
};

export const deleteProblem = async (id) => {
  const response = await api.delete(`/problems/${id}`);
  return response.data;
};

// Admin: update only the cognitive ratings of a problem
export const updateCognitiveRatings = async (id, cognitiveRatings) => {
  const response = await api.patch(`/problems/${id}/cognitive-ratings`, { cognitiveRatings });
  return response.data.problem;
};

// Search problems for admin/contest creation
export const searchProblems = async (query = "") => {
  const response = await api.get(`/problems${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  return response.data.problems || [];
};
