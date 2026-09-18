import axiosClient from './axiosClient';
import { getStoredToken } from './movieApi';

export const loginApi = async (username, password) => {
  const response = await axiosClient.post('/auth/login', { username, password });
  return response.data;
};

export const registerApi = async (userData) => {
  const response = await axiosClient.post('/auth/register', userData);
  return response.data;
};

export const forgotPasswordApi = async (email) => {
  const response = await axiosClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPasswordApi = async (token, newPassword) => {
  const response = await axiosClient.post('/auth/reset-password', { token, newPassword });
  return response.data;
};

export const getMyProfile = async () => {
  const response = await axiosClient.get('/users/profile', {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const updateMyProfile = async (data) => {
  const response = await axiosClient.put('/users/profile', data, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};
// Admin Endpoints
export const getAllUsers = async (page = 0, size = 50) => {
  const response = await axiosClient.get('/users', {
    params: { page, size, sortBy: 'userId', direction: 'desc' },
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const toggleUserStatus = async (userId) => {
  const response = await axiosClient.patch(`/users/${userId}/status`, {}, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const createStaffApi = async (staffData) => {
  const response = await axiosClient.post('/users/staff', staffData, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};