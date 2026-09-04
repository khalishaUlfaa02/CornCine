import axiosClient from './axiosClient';

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
