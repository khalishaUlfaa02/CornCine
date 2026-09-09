import axiosClient from './axiosClient';

export function getStoredToken() {
  const directToken = localStorage.getItem('token') || localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
  if (directToken) return directToken;

  // Cek jika tersimpan dalam JSON user
  const rawUser = localStorage.getItem('user');
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      return parsed.token || parsed.accessToken || parsed.jwt || null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

// Public endpoints
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

export const getGenres = async () => {
  const response = await axiosClient.get('/genres');
  return response.data;
};

export const createGenre = async (genreName) => {
  const response = await axiosClient.post('/genres', { genreName }, {
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    }
  });
  return response.data;
};

// Admin endpoints
// Tambahkan token saat request (meskipun di axiosClient sudah di-intercept, untuk keamanan manual kadang perlu atau interceptornya perlu diperiksa).
export const createMovie = async (data) => {
  const response = await axiosClient.post('/movies', data, {
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    }
  });
  return response.data;
};

export const updateMovie = async (movieId, data) => {
  const response = await axiosClient.put(`/movies/${movieId}`, data, {
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    }
  });
  return response.data;
};

export const deleteMovie = async (movieId) => {
  const response = await axiosClient.delete(`/movies/${movieId}`, {
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    }
  });
  return response.data;
};

export const uploadFile = async (formData) => {
  const response = await axiosClient.post('/files/upload', formData, {
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    }
  });
  return response.data;
};

