import React, { useState, useEffect, useContext } from 'react';
import { getMovies, createMovie, updateMovie, deleteMovie, getGenres, createGenre, uploadFile, getStoredToken } from '../../api/movieApi';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FALLBACK_POSTER = 'https://placehold.co/400x600/1E293B/7DD3FC?text=No+Poster';

const AVAILABLE_GENRES = [
  "Action", "Adventure", "Animation", "Comedy", 
  "Drama", "Horror", "Romance", "Sci-Fi", "Thriller"
];

const AdminMovies = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [submitLoading, setSubmitLoading] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    movieId: null,
    title: '',
    director: '',
    castMembers: '',
    synopsis: '',
    durationMinutes: 120,
    posterUrl: '',
    trailerUrl: '',
    releaseDate: '',
    ageRating: '13+',
    genres: []
  });

  const [posterFile, setPosterFile] = useState(null);
  const [previewPoster, setPreviewPoster] = useState('');

  useEffect(() => {
    // Basic role protection check (Ideally protected by a higher order component)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [moviesRes, genresRes] = await Promise.all([
        getMovies(0, 100), // Get first 100 movies for simple admin view
        getGenres()
      ]);
      
      console.log("Response data film:", moviesRes.data);
      
      if (moviesRes.success) {
        const movieList = moviesRes.data?.content || moviesRes.data?.data || (Array.isArray(moviesRes.data) ? moviesRes.data : []);
        setMovies(movieList);
      }
      
      if (genresRes.success) {
        const genreList = genresRes.data?.content || genresRes.data?.data || (Array.isArray(genresRes.data) ? genresRes.data : []);
        setGenres(genreList);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, movie = null) => {
    setModalMode(mode);
    setPosterFile(null);
    if (mode === 'edit' && movie) {
      // Pastikan genres berupa array
      let currentGenres = [];
      if (Array.isArray(movie.genres)) {
        currentGenres = movie.genres;
      } else if (typeof movie.genres === 'string') {
        currentGenres = movie.genres.split(',').map(g => g.trim());
      }

      setFormData({
        movieId: movie.movieId,
        title: movie.title || '',
        director: movie.director || '',
        castMembers: movie.castMembers || '',
        synopsis: movie.synopsis || '',
        durationMinutes: movie.durationMinutes || 120,
        posterUrl: movie.posterUrl || '',
        trailerUrl: movie.trailerUrl || '',
        releaseDate: movie.releaseDate || '',
        ageRating: movie.ageRating || '13+',
        genres: currentGenres
      });
      setPreviewPoster(movie.posterUrl || '');
    } else {
      setFormData({
        movieId: null,
        title: '',
        director: '',
        castMembers: '',
        synopsis: '',
        durationMinutes: 120,
        posterUrl: '',
        trailerUrl: '',
        releaseDate: '',
        ageRating: '13+',
        genres: []
      });
      setPreviewPoster('');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || '' : value
    }));
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPosterFile(file);
      setPreviewPoster(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    console.log("Token yang dipakai:", getStoredToken());

    try {
      let finalPosterUrl = formData.posterUrl;

      // Upload poster if a new file is selected
      if (posterFile) {
        setUploadingPoster(true);
        const fileData = new FormData();
        fileData.append('file', posterFile);
        const uploadRes = await uploadFile(fileData);
        if (uploadRes.success) {
          finalPosterUrl = uploadRes.data.fileUrl;
        }
        setUploadingPoster(false);
      }

      // Siapkan genre ID, buat yang belum ada di database server
      const finalGenreIds = [];
      let currentServerGenres = [...genres]; // salinan state genre dari server
      
      for (const gName of formData.genres) {
        let found = currentServerGenres.find(sg => sg.genreName.toLowerCase() === gName.toLowerCase());
        if (found) {
          finalGenreIds.push(found.genreId);
        } else {
          // Genre belum ada di DB! Buat genre baru ke backend.
          try {
            console.log(`Menciptakan genre baru di database: ${gName}`);
            const newGenreRes = await createGenre(gName);
            // Anggap response success dan tidak mengembalikan ID langsung?
            // Kita harus fetch ulang genres atau berharap backend mereturn ID. 
            // Karena `POST /genres` backend di CinemaService hanya mengembalikan message "Genre baru berhasil ditambahkan" (null data).
            // Maka kita fetch ulang saja daftar genre-nya dari server.
            const refreshGenresRes = await getGenres();
            if (refreshGenresRes.success) {
               currentServerGenres = refreshGenresRes.data?.content || refreshGenresRes.data?.data || (Array.isArray(refreshGenresRes.data) ? refreshGenresRes.data : []);
               setGenres(currentServerGenres); // update state juga
               
               found = currentServerGenres.find(sg => sg.genreName.toLowerCase() === gName.toLowerCase());
               if (found) finalGenreIds.push(found.genreId);
            }
          } catch (genreErr) {
            console.error(`Gagal membuat genre ${gName}`, genreErr);
          }
        }
      }

      if (finalGenreIds.length === 0) {
        alert("Gagal memetakan genre. Pastikan minimal ada 1 genre yang valid.");
        setSubmitLoading(false);
        return;
      }

      const payload = {
        title: formData.title,
        director: formData.director,
        castMembers: formData.castMembers,
        synopsis: formData.synopsis,
        durationMinutes: parseInt(formData.durationMinutes),
        posterUrl: finalPosterUrl,
        trailerUrl: formData.trailerUrl,
        releaseDate: formData.releaseDate || null,
        ageRating: formData.ageRating,
        genreIds: finalGenreIds
      };

      if (modalMode === 'add') {
        await createMovie(payload);
        alert("Film berhasil ditambahkan!");
      } else {
        await updateMovie(formData.movieId, payload);
        alert("Film berhasil diperbarui!");
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      alert("Gagal menyimpan data film: " + (error.response?.data?.message || error.message || "Error tidak diketahui"));
      console.error(error);
    } finally {
      setSubmitLoading(false);
      setUploadingPoster(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus film "${title}"?`)) {
      try {
        await deleteMovie(id);
        fetchData();
      } catch (error) {
        alert("Gagal menghapus film");
      }
    }
  };

  return (
    <div className="min-h-screen bg-cine-bg pt-24 pb-20">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center">
              Manajemen Katalog Film
              <span className="ml-4 h-1 w-12 bg-sky-400 rounded-full inline-block shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
            </h1>
            <p className="text-slate-400 font-medium mt-2">Kelola data film yang tampil di aplikasi</p>
          </div>
          <button 
            onClick={() => handleOpenModal('add')}
            className="bg-sky-400 text-slate-950 font-bold hover:bg-sky-300 px-6 py-3 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            + Tambah Film Baru
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700/50">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Poster</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Info Film</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rating & Durasi</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400">
                      <div className="w-8 h-8 border-4 border-slate-700 border-t-sky-400 rounded-full animate-spin mx-auto mb-3"></div>
                      Memuat data...
                    </td>
                  </tr>
                ) : movies.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400 font-medium">Belum ada film di katalog</td>
                  </tr>
                ) : (
                  movies.map((movie) => (
                    <tr key={movie.movieId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <img 
                          src={movie.posterUrl || FALLBACK_POSTER} 
                          alt="Poster" 
                          className="w-14 h-20 object-cover rounded-lg border border-slate-700 shadow-sm"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-white text-base mb-1">{movie.title}</p>
                        <p className="text-xs text-slate-400 truncate max-w-xs">{movie.genres?.join(', ')}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="bg-slate-800 text-sky-300 text-xs font-bold px-2.5 py-1 rounded border border-slate-700">{movie.ageRating}</span>
                          <span className="text-sm text-slate-300 font-medium">{movie.durationMinutes} mnt</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right space-x-3">
                        <button 
                          onClick={() => handleOpenModal('edit', movie)}
                          className="text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(movie.movieId, movie.title)}
                          className="text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleCloseModal}></div>
          
          {/* Modal Content */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-white">
                {modalMode === 'add' ? 'Tambah Film Baru' : 'Edit Film'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form id="movieForm" onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-8">
                
                {/* Kiri: Poster Upload */}
                <div className="w-full md:w-1/3 flex flex-col items-center space-y-4">
                  <p className="text-sm font-semibold text-slate-300 self-start">Poster Film</p>
                  <div className="w-full aspect-[2/3] rounded-2xl bg-slate-950/50 border border-dashed border-slate-700 overflow-hidden relative group">
                    {(previewPoster || formData.posterUrl) ? (
                      <img src={previewPoster || formData.posterUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                        <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-xs">Pilih Gambar</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <span className="bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700">Ubah Poster</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handlePosterChange} />
                    </label>
                  </div>
                  {uploadingPoster && <p className="text-xs text-sky-400 animate-pulse">Mengunggah poster...</p>}
                </div>

                {/* Kanan: Info Form */}
                <div className="w-full md:w-2/3 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Judul Film</label>
                    <input required type="text" name="title" value={formData.title} onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:border-sky-400 focus:outline-none transition-colors" placeholder="Masukkan judul" />
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">Durasi (Menit)</label>
                      <input required type="number" name="durationMinutes" value={formData.durationMinutes} onChange={handleChange} min="1"
                        className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:border-sky-400 focus:outline-none transition-colors" />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm font-semibold text-slate-300 mb-1.5">Rating Usia</label>
                      <select name="ageRating" value={formData.ageRating} onChange={handleChange}
                        className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:border-sky-400 focus:outline-none transition-colors appearance-none">
                        <option value="SU">SU (Semua Umur)</option>
                        <option value="13+">13+</option>
                        <option value="17+">17+</option>
                        <option value="21+">21+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Genre Film</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {AVAILABLE_GENRES.map((genre) => {
                        const isSelected = formData.genres?.includes(genre);
                        return (
                          <button
                            key={genre}
                            type="button"
                            onClick={() => {
                              const current = formData.genres || [];
                              const updated = isSelected
                                ? current.filter((g) => g !== genre)
                                : [...current, genre];
                              setFormData({ ...formData, genres: updated });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              isSelected
                                ? "bg-sky-400 text-slate-950 shadow-md shadow-sky-400/20"
                                : "bg-slate-950/60 text-slate-300 border border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            {isSelected ? `✓ ${genre}` : `+ ${genre}`}
                          </button>
                        );
                      })}
                    </div>
                    {(!formData.genres || formData.genres.length === 0) && <p className="text-xs text-rose-400 mt-1">Minimal pilih 1 genre.</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Sutradara / Director</label>
                    <input type="text" name="director" value={formData.director} onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:border-sky-400 focus:outline-none transition-colors" placeholder="Nama sutradara" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Pemeran Utama</label>
                    <input type="text" name="castMembers" value={formData.castMembers} onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:border-sky-400 focus:outline-none transition-colors" placeholder="Ryan Gosling, Emma Stone" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Tanggal Rilis (Opsional)</label>
                    <input type="date" name="releaseDate" value={formData.releaseDate} onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:border-sky-400 focus:outline-none transition-colors [color-scheme:dark]" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">URL Trailer YouTube (Opsional)</label>
                    <input type="text" name="trailerUrl" value={formData.trailerUrl} onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:border-sky-400 focus:outline-none transition-colors" placeholder="https://youtube.com/watch?v=..." />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Sinopsis</label>
                    <textarea name="synopsis" value={formData.synopsis} onChange={handleChange} rows="4"
                      className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-2.5 focus:border-sky-400 focus:outline-none transition-colors resize-none" placeholder="Tulis sinopsis film..." />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 shrink-0 bg-slate-900/50 rounded-b-3xl">
              <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors">
                Batal
              </button>
              <button type="submit" form="movieForm" disabled={submitLoading || uploadingPoster}
                className={`bg-sky-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transform hover:-translate-y-0.5 ${(submitLoading || uploadingPoster) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {(submitLoading || uploadingPoster) ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminMovies;