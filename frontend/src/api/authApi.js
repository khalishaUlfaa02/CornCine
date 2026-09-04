import axiosClient from './axiosClient';

export const loginApi = async (username, password) => {
  const response = await axiosClient.post('/auth/login', { username, password });
  return response.data;
};

export const registerApi = async (userData) => {
  const response = await axiosClient.post('/auth/register', userData);
  return response.data;
};
