import axiosClient from './axiosClient';
import { getStoredToken } from './movieApi';

export const getCinemas = async () => {
  const response = await axiosClient.get('/cinemas', { params: { size: 100 } });
  return response.data;
};

export const createCinema = async (data) => {
  const response = await axiosClient.post('/cinemas', data, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const deleteCinema = async (cinemaId) => {
  const response = await axiosClient.delete(`/cinemas/${cinemaId}`, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

// =======================
// STUDIOS API
// =======================

export const getStudiosByCinemaId = async (cinemaId) => {
  const response = await axiosClient.get(`/studios/cinema/${cinemaId}`);
  return response.data;
};

// Sesuai struktur backend StudioReq.java
export const createStudio = async (data) => {
  const response = await axiosClient.post(`/studios`, data, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const deleteStudio = async (studioId) => {
  const response = await axiosClient.delete(`/studios/${studioId}`, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};
