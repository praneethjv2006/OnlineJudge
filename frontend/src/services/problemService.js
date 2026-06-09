import api from "./api";

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