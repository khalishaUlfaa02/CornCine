import axiosClient from './axiosClient';

export const getMovies = async (page = 0, size = 12, search = '') => {
  const params = { page, size };
  if (search) params.search = search;
  const response = await axiosClient.get('/movies', { params });
  return response.data;
};

export const getMovieById = async (movieId) => {
  const response = await axiosClient.get(`/movies/${movieId}`);
  return response.data;
};
