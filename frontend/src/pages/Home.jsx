import React, { useState, useEffect, useCallback } from 'react';
import { getMovies } from '../api/movieApi';
import MovieCard from '../components/MovieCard';

const SkeletonCard = () => (
  <div className="bg-cine-card rounded-2xl overflow-hidden border border-cine-border animate-pulse flex flex-col">
    <div className="aspect-[2/3] bg-cine-border" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-cine-border rounded w-3/4" />
      <div className="flex gap-1.5">
        <div className="h-4 bg-cine-border rounded-full w-14" />
        <div className="h-4 bg-cine-border rounded-full w-12" />
      </div>
      <div className="h-3 bg-cine-border rounded w-16" />
      <div className="h-10 bg-cine-border rounded-xl w-full mt-2" />
    </div>
  </div>
);

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMovies(page, 12, search);
      if (response.success && response.data) {
        setMovies(response.data.content || []);
        setTotalPages(response.data.totalPages || 0);
      }
    } catch (err) {
      console.error('Failed to fetch movies:', err);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchMovies();
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    if (e.target.value === '') {
      setPage(0);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <h1 className="text-3xl font-extrabold text-white flex items-center">
          Now Showing
          <span className="ml-3 h-1 w-12 bg-cine-baby rounded-full inline-block" />
        </h1>

        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Cari judul film..."
            className="w-full py-3 pl-12 pr-4 rounded-xl bg-cine-card border border-cine-border text-white placeholder-cine-muted focus:outline-none focus:border-cine-baby focus:ring-1 focus:ring-cine-baby/50 transition-all"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cine-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-cine-baby text-cine-dark font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-cine-baby-hover transition-colors"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Movie Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : movies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <svg className="w-20 h-20 text-cine-border mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <h2 className="text-xl font-bold text-cine-muted mb-2">Film tidak ditemukan</h2>
          <p className="text-cine-muted text-sm">Coba kata kunci lain atau hapus pencarian</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.movieId} movie={movie} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-12">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={page === 0}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  page === 0
                    ? 'bg-cine-card text-cine-muted border border-cine-border cursor-not-allowed'
                    : 'bg-cine-card text-cine-baby border border-cine-border hover:border-cine-baby hover:bg-cine-baby/10'
                }`}
              >
                Prev
              </button>

              <span className="text-sm text-cine-muted font-medium px-4">
                {page + 1} / {totalPages}
              </span>

              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={page >= totalPages - 1}
                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  page >= totalPages - 1
                    ? 'bg-cine-card text-cine-muted border border-cine-border cursor-not-allowed'
                    : 'bg-cine-card text-cine-baby border border-cine-border hover:border-cine-baby hover:bg-cine-baby/10'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
