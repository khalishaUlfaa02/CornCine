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
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMovies(page, 12, search);
      console.log("Response data film Home:", response.data);
      if (response.success && response.data) {
        const movieList = response.data?.content || response.data?.data || (Array.isArray(response.data) ? response.data : []);
        setMovies(movieList);
        setTotalPages(response.data.totalPages || 1);
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
    // Scroll down to catalog smoothly
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
          {/* Glow effect on hover */}
          <div className="absolute inset-0 bg-sky-400/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          
          <div className="relative flex items-center bg-[#162238]/90 backdrop-blur-xl border border-slate-700/80 p-2.5 rounded-2xl shadow-2xl transition-all duration-300 group-hover:border-sky-400/50">
            <div className="pl-4 pr-2 text-sky-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center tracking-tight">
              Sedang Tayang
              <span className="ml-4 h-1.5 w-12 bg-sky-400 rounded-full inline-block shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
            </h2>
          </div>
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
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="flex justify-center items-center gap-4 mt-16">
                <button
                  onClick={() => { setPage((prev) => Math.max(prev - 1, 0)); document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' }); }}
                  disabled={page === 0}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                    page === 0
                      ? 'bg-[#162238]/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                      : 'bg-[#162238] text-sky-400 border border-slate-700 hover:border-sky-400/50 hover:bg-sky-400/10'
                  }`}
                >
                  ← Sebelumnya
                </button>

                <div className="flex items-center justify-center bg-[#162238] border border-slate-700/80 rounded-xl px-6 py-3 shadow-inner">
                  <span className="text-sm text-slate-300 font-bold tracking-wide">
                    Hal <span className="text-white mx-1">{page + 1}</span> dari <span className="text-white mx-1">{totalPages}</span>
                  </span>
                </div>

                <button
                  onClick={() => { setPage((prev) => Math.min(prev + 1, totalPages - 1)); document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' }); }}
                  disabled={page >= totalPages - 1}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                    page >= totalPages - 1
                      ? 'bg-[#162238]/50 text-slate-600 border border-slate-800 cursor-not-allowed'
                      : 'bg-[#162238] text-sky-400 border border-slate-700 hover:border-sky-400/50 hover:bg-sky-400/10'
                  }`}
                >
                  Selanjutnya →
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