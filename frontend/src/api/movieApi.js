import axiosClient from './axiosClient';

// Helper function untuk mengambil token secara fleksibel
export function getStoredToken() {
  const directToken = localStorage.getItem('token') || localStorage.getItem('jwt_token') || localStorage.getItem('accessToken');
  if (directToken) return directToken;

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
export const getMovies = async (page = 0, size = 12, search = '', options = {}) => {
  const params = { page, size };
  if (search) params.search = search;
  if (options.genre) params.genre = options.genre;
  if (options.sortBy) params.sortBy = options.sortBy;
  if (options.direction) params.direction = options.direction;
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
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

// Admin endpoints
export const createMovie = async (data) => {
  const response = await axiosClient.post('/movies', data, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const updateMovie = async (movieId, data) => {
  const response = await axiosClient.put(`/movies/${movieId}`, data, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const deleteMovie = async (movieId) => {
  const response = await axiosClient.delete(`/movies/${movieId}`, {
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const uploadFile = async (formData) => {
  // JANGAN set Content-Type manual: biarkan browser/Axios mengisinya
  // otomatis beserta boundary multipart. Kita hanya kirim token.
  // (Default axiosClient memaksa 'application/json' yang merusak FormData,
  //  jadi harus ditimpa jadi undefined AGAR tidak terkirim.)
  const response = await axiosClient.post('/files/upload', formData, {
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
      'Content-Type': undefined,
    },
    transformRequest: [(data) => data],
  });
  return response.data;
};

export const exportMoviesToExcel = async () => {
  const response = await axiosClient.get('/movies/excel/export', {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${getStoredToken()}` }
  });
  return response.data;
};

export const importMoviesFromExcel = async (formData) => {
  const response = await axiosClient.post('/movies/excel/import', formData, {
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
      'Content-Type': undefined,
    },
    transformRequest: [(data) => data],
  });
  return response.data;
};