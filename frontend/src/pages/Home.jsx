import React, { useState, useEffect, useCallback } from 'react';
import { getMovies } from '../api/movieApi';
import MovieCard from '../components/MovieCard';

// Komponen Skeleton Loading Shimmer
const SkeletonCard = () => (
  <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl overflow-hidden animate-pulse flex flex-col shadow-lg">
    <div className="aspect-[2/3] bg-slate-800" />
    <div className="p-5 space-y-4">
      <div className="h-5 bg-slate-700 rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-4 bg-slate-800 rounded-full w-14" />
        <div className="h-4 bg-slate-800 rounded-full w-12" />
      </div>
      <div className="h-6 bg-slate-800 rounded-lg w-24 mt-2" />
    </div>
  </div>
);

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(12);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const SORT_OPTIONS = {
    newest: { sortBy: 'movieId', direction: 'desc' },
    oldest: { sortBy: 'movieId', direction: 'asc' },
    az: { sortBy: 'title', direction: 'asc' },
    za: { sortBy: 'title', direction: 'desc' },
  };

  const GENRE_OPTIONS = ['', 'Action', 'Adventure', 'Animation', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'];

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMovies(page, size, search, {
        genre,
        ...(SORT_OPTIONS[sort] || SORT_OPTIONS.newest),
      });
      if (response.success && response.data) {
        const movieList = response.data?.content || response.data?.data || (Array.isArray(response.data) ? response.data : []);
        setMovies(movieList);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalElements ?? movieList.length);
      }
    } catch (err) {
      console.error('Failed to fetch movies:', err);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [page, size, search, genre, sort]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchMovies();
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    if (e.target.value === '') {
      setPage(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1325] pb-24 relative overflow-hidden">
      
      {/* Ambient Glow Latar Belakang Hero */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* 🎬 Hero Section */}
      <div className="relative w-full pt-32 pb-20 flex flex-col items-center justify-center text-center px-4 z-10">
        <span className="inline-block py-1.5 px-5 rounded-full bg-sky-500/10 text-sky-400 font-bold text-xs tracking-[0.2em] uppercase mb-6 border border-sky-400/30 backdrop-blur-md shadow-[0_0_15px_rgba(56,189,248,0.2)]">
          CornCine Premiere
        </span>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 max-w-4xl tracking-tight">
          Nonton Film Favorit <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-sky-500 drop-shadow-sm">Tanpa Antre.</span>
        </h1>
        
        <p className="text-lg text-slate-400 mb-12 max-w-2xl font-medium leading-relaxed">
          Temukan film layar lebar terbaru, amankan kursi ternyamanmu, dan nikmati pengalaman sinematik yang tak tertandingi.
        </p>

        {/* Floating Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-2xl group z-20">
          <div className="absolute inset-0 bg-sky-400/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          
          <div className="relative flex items-center bg-[#162238]/90 backdrop-blur-xl border border-slate-700/80 p-2.5 rounded-2xl shadow-2xl transition-all duration-300 group-hover:border-sky-400/50">
            <div className="pl-4 pr-2 text-sky-400">
              <svg className="w-6 h-6" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Cari judul film..."
              className="w-full py-3 px-3 bg-transparent text-white placeholder-slate-400 focus:outline-none text-lg font-medium tracking-wide"
            />
            <button
              type="submit"
              className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold px-8 py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.4)] flex-shrink-0"
            >
              Cari
            </button>
          </div>
        </form>
      </div>

      {/* 🍿 Catalog Section (Now Showing) */}
      <div id="catalog" className="container mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center tracking-tight">
              Sedang Tayang
              <span className="ml-4 h-1.5 w-12 bg-sky-400 rounded-full inline-block shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <select
            value={genre}
            onChange={(e) => { setGenre(e.target.value); setPage(0); }}
            className="bg-[#162238] border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 focus:border-sky-400 focus:outline-none"
          >
            <option value="">Semua Genre</option>
            {GENRE_OPTIONS.filter(Boolean).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(0); }}
            className="bg-[#162238] border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 focus:border-sky-400 focus:outline-none"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
          </select>
          <select
            value={size}
            onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
            className="bg-[#162238] border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl px-4 py-2.5 focus:border-sky-400 focus:outline-none"
          >
            {[8, 12, 16, 24].map((n) => (
              <option key={n} value={n}>{n} / halaman</option>
            ))}
          </select>
          {(search || genre) && (
            <button
              onClick={() => { setSearch(''); setGenre(''); setPage(0); }}
              className="text-sm font-semibold text-cine-baby hover:text-cine-baby-hover"
            >
              Reset filter
            </button>
          )}
          <span className="ml-auto text-xs text-cine-muted font-medium">
            {totalItems} film • Hal {page + 1} dari {totalPages}
          </span>
        </div>

        {/* Movie Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : movies.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-28 text-center bg-[#162238]/50 rounded-3xl border border-slate-800/80 shadow-inner">
            <div className="w-24 h-24 bg-slate-800/80 rounded-full flex items-center justify-center mb-6 shadow-lg border border-slate-700/50">
              <svg className="w-12 h-12 text-slate-400" width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-200 mb-3 tracking-wide">Film tidak ditemukan</h2>
            <p className="text-slate-400 font-medium max-w-md">Kami tidak dapat menemukan film yang cocok dengan pencarian Anda. Coba gunakan kata kunci lain.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {movies.map((movie) => (
                <MovieCard key={movie.movieId} movie={movie} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-16 flex-wrap">
                <button
                  onClick={() => { setPage((prev) => Math.max(prev - 1, 0)); document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' }); }}
                  disabled={page === 0}
                  className={`px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                    page === 0
                      ? 'bg-[#162238]/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                      : 'bg-[#162238] text-sky-400 border border-slate-700 hover:border-sky-400/50 hover:bg-sky-400/10'
                  }`}
                >
                  ←
                </button>

                {Array.from({ length: totalPages }, (_, i) => i)
                  .filter((i) => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
                  .reduce((acc, i, _, arr) => {
                    if (acc.length > 0 && i - acc[acc.length - 1] > 1) acc.push('...');
                    acc.push(i);
                    return acc;
                  }, [])
                  .map((i, idx) =>
                    i === '...' ? (
                      <span key={`dots-${idx}`} className="text-slate-500 text-sm px-1">…</span>
                    ) : (
                      <button
                        key={i}
                        onClick={() => { setPage(i); document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' }); }}
                        className={`min-w-[44px] px-3 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                          i === page
                            ? 'bg-cine-baby text-cine-dark shadow-[0_0_12px_rgba(125,211,252,0.4)]'
                            : 'bg-[#162238] text-slate-300 border border-slate-700 hover:border-sky-400/50 hover:text-sky-400'
                        }`}
                      >
                        {i + 1}
                      </button>
                    )
                  )}

                <button
                  onClick={() => { setPage((prev) => Math.min(prev + 1, totalPages - 1)); document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' }); }}
                  disabled={page >= totalPages - 1}
                  className={`px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                    page >= totalPages - 1
                      ? 'bg-[#162238]/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                      : 'bg-[#162238] text-sky-400 border border-slate-700 hover:border-sky-400/50 hover:bg-sky-400/10'
                  }`}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;