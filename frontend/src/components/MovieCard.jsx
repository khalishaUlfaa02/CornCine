import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FALLBACK_POSTER = 'https://placehold.co/300x450/162238/7DD3FC?text=No+Poster';

const MovieCard = ({ movie }) => {
  const [imgError, setImgError] = useState(false);

  const posterSrc = (!movie.posterUrl || imgError) ? FALLBACK_POSTER : movie.posterUrl;

  return (
    <div className="bg-cine-card rounded-2xl overflow-hidden border border-cine-border group hover:border-cine-baby/40 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-cine-baby/5 flex flex-col">
      
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-cine-dark">
        <img
          src={posterSrc}
          alt={movie.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Age Rating Badge */}
        {movie.ageRating && (
          <span className="absolute top-3 right-3 bg-cine-border text-cine-baby text-xs font-semibold px-2 py-0.5 rounded">
            {movie.ageRating}
          </span>
        )}
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-cine-dark via-cine-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-white font-bold text-base leading-snug line-clamp-2 mb-2 group-hover:text-cine-baby transition-colors">
          {movie.title}
        </h3>

        {/* Genre Tags */}
        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {movie.genres.slice(0, 3).map((genre, i) => (
              <span key={i} className="text-[11px] text-cine-baby-soft bg-cine-baby/10 px-2 py-0.5 rounded-full font-medium border border-cine-baby/20">
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Duration */}
        <p className="text-cine-muted text-xs font-medium mt-auto mb-4">
          {movie.durationMinutes} mnt
        </p>

        {/* CTA Button */}
        <Link
          to={`/movies/${movie.movieId}`}
          className="block w-full text-center bg-cine-baby text-cine-dark font-semibold py-2.5 rounded-xl hover:bg-cine-baby-hover shadow-[0_0_10px_rgba(125,211,252,0.15)] hover:shadow-[0_0_18px_rgba(56,189,248,0.35)] transition-all duration-300"
        >
          Beli Tiket
        </Link>
      </div>
    </div>
  );
};

export default MovieCard;
