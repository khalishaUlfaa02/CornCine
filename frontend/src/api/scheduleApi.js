import axiosClient from './axiosClient';
import { getStoredToken } from './movieApi';

export const getSchedulesByMovie = async (movieId, date) => {
  const response = await axiosClient.get(`/schedules/movie/${movieId}`, {
    params: { date },
  });
  return response.data;
};

export const getScheduleById = async (scheduleId) => {
  const response = await axiosClient.get(`/schedules/${scheduleId}`);
  return response.data;
};

// Admin Endpoints
export const getAllSchedules = async (page = 0, size = 100) => {
  const response = await axiosClient.get('/schedules', {
    params: { page, size, sortBy: 'showDate', direction: 'desc' }
  });
  return response.data;
};

export const createSchedule = async (data) => {
  const response = await axiosClient.post('/schedules', data, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const deleteSchedule = async (scheduleId) => {
  const response = await axiosClient.delete(`/schedules/${scheduleId}`, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const getCinemas = async () => {
  const response = await axiosClient.get('/cinemas', { params: { size: 100 } });
  return response.data;
};

export const getStudiosByCinema = async (cinemaId) => {
  const response = await axiosClient.get(`/studios/cinema/${cinemaId}`);
  return response.data;
};
