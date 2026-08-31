import api from "../axios";

export const submitAdmission = async (data) => {
  const response = await api.post("/admissions", data);
  return response.data;
};
