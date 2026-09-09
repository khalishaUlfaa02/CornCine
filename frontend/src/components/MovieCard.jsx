import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const FALLBACK_POSTER = 'https://placehold.co/400x600/162238/7DD3FC?text=Poster+Unavailable';

const MovieCard = ({ movie }) => {
  const { user } = useContext(AuthContext);
  const [imgError, setImgError] = useState(false);

  const posterSrc = (!movie.posterUrl || imgError) ? FALLBACK_POSTER : movie.posterUrl;
  
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'STAFF');

  return (
    <div className="group relative bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-sky-400/50 hover:shadow-2xl hover:shadow-sky-500/20 transition-all duration-500 hover:-translate-y-2 flex flex-col">
      
      {/* Poster Container with Smooth Zoom Effect */}
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
        <img
          src={posterSrc}
          alt={movie.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        {/* Top Badges (Age Rating) */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {movie.ageRating && (
            <span className="bg-slate-950/80 backdrop-blur-md border border-sky-400/30 text-sky-300 text-[11px] tracking-wide font-bold px-3 py-1 rounded shadow-sm">
              {movie.ageRating}
            </span>
          )}
        </div>

        {/* Gradient Overlay & Hover Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-end p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
          <Link
            to={`/movies/${movie.movieId}`}
            className="w-full text-center bg-sky-400 text-slate-950 font-bold py-3.5 rounded-xl hover:bg-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all duration-300"
          >
            {isAdmin ? "Lihat Pratinjau" : "Pesan Tiket"}
          </Link>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-5 flex flex-col flex-grow z-10 relative bg-slate-950/80 group-hover:bg-slate-900 transition-colors duration-300 border-t border-slate-800/60">
        <h3 className="text-white font-extrabold text-lg leading-tight line-clamp-1 mb-2 group-hover:text-sky-300 transition-colors">
          {movie.title}
        </h3>

        {/* Genre Tags */}
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {movie.genres.slice(0, 3).map((genre, i) => (
              <span key={i} className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                {genre}{i < Math.min(movie.genres.length, 3) - 1 ? <span className="mx-1.5 text-slate-700">•</span> : ''}
              </span>
            ))}
          </div>
        )}

        {/* Duration with Icon */}
        <div className="flex items-center text-xs text-sky-100 font-medium mt-auto bg-slate-800/50 w-max px-3 py-1.5 rounded-lg border border-slate-700/50">
          <svg className="w-4 h-4 mr-2 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {movie.durationMinutes} Menit
        </div>
      </div>
    </div>
  );
};

export default MovieCard;