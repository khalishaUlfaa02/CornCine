import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieById } from '../api/movieApi';
import { getSchedulesByMovie } from '../api/scheduleApi';
import { AuthContext } from '../context/AuthContext';

const FALLBACK_POSTER = 'https://placehold.co/400x600/162238/7DD3FC?text=No+Poster';

const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const getYoutubeEmbedUrl = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const generateDates = (count = 7) => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const formatDateLabel = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (d.getTime() === today.getTime()) return 'Hari Ini';
  if (d.getTime() === tomorrow.getTime()) return 'Besok';
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
};

const MovieDetail = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [movie, setMovie] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const dates = useMemo(() => generateDates(7), []);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        const res = await getMovieById(movieId);
        if (res.success) setMovie(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [movieId]);

  useEffect(() => {
    const fetchSchedules = async () => {
      setScheduleLoading(true);
      setSelectedScheduleId(null);
      try {
        const res = await getSchedulesByMovie(movieId, selectedDate);
        if (res.success) setSchedules(res.data || []);
        else setSchedules([]);
      } catch (err) {
        console.error(err);
        setSchedules([]);
      } finally {
        setScheduleLoading(false);
      }
    };
    fetchSchedules();
  }, [movieId, selectedDate]);

  const groupedSchedules = useMemo(() => {
    const groups = {};
    schedules.forEach((s) => {
      const key = `${s.cinemaName}__${s.studioNumber}__${s.studioType}`;
      if (!groups[key]) {
        groups[key] = {
          cinemaName: s.cinemaName,
          studioNumber: s.studioNumber,
          studioType: s.studioType,
          slots: [],
        };
      }
      groups[key].slots.push(s);
    });
    Object.values(groups).forEach((g) =>
      g.slots.sort((a, b) => (a.startTime > b.startTime ? 1 : -1))
    );
    return Object.values(groups);
  }, [schedules]);

  const handleSelectSchedule = () => {
    if (!selectedScheduleId) return;
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/booking/${selectedScheduleId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 animate-pulse">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="w-full lg:w-80 aspect-[2/3] bg-cine-card rounded-2xl" />
          <div className="flex-grow space-y-4">
            <div className="h-8 bg-cine-card rounded w-2/3" />
            <div className="h-4 bg-cine-card rounded w-1/3" />
            <div className="h-24 bg-cine-card rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-cine-muted">Film tidak ditemukan</h2>
      </div>
    );
  }

  const embedUrl = getYoutubeEmbedUrl(movie.trailerUrl);
  const posterSrc = !movie.posterUrl || imgError ? FALLBACK_POSTER : movie.posterUrl;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row gap-10 mb-14">
        {/* Poster */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <img
            src={posterSrc}
            alt={movie.title}
            onError={() => setImgError(true)}
            className="w-full rounded-2xl shadow-2xl border border-cine-border object-cover aspect-[2/3]"
          />
        </div>

        {/* Info */}
        <div className="flex-grow">
          <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">{movie.title}</h1>

          {/* Badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            {movie.ageRating && (
              <span className="bg-cine-border text-cine-baby text-xs font-semibold px-3 py-1 rounded">
                {movie.ageRating}
              </span>
            )}
            <span className="bg-cine-border text-slate-300 text-xs font-semibold px-3 py-1 rounded">
              {movie.durationMinutes} menit
            </span>
            {movie.releaseDate && (
              <span className="bg-cine-border text-slate-300 text-xs font-semibold px-3 py-1 rounded">
                {movie.releaseDate}
              </span>
            )}
          </div>

          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres.map((g, i) => (
                <span
                  key={i}
                  className="text-xs text-cine-baby-soft bg-cine-baby/10 px-3 py-1 rounded-full font-medium border border-cine-baby/20"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Synopsis */}
          <h3 className="text-sm font-bold text-cine-muted uppercase tracking-wider mb-2">Sinopsis</h3>
          <p className="text-slate-300 leading-relaxed mb-8 text-sm whitespace-pre-line">
            {movie.synopsis || 'Sinopsis belum tersedia.'}
          </p>

          {/* Trailer */}
          {embedUrl && (
            <div className="aspect-video w-full max-w-2xl rounded-2xl overflow-hidden border border-cine-border shadow-lg">
              <iframe
                src={embedUrl}
                title="Trailer"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Schedule Section */}
      <div className="bg-cine-card rounded-2xl border border-cine-border p-6 lg:p-8">
        <h2 className="text-2xl font-extrabold text-white mb-6 flex items-center">
          Jadwal Tayang
          <span className="ml-3 h-1 w-10 bg-cine-baby rounded-full inline-block" />
        </h2>

        {/* Date Selector */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedDate === d
                  ? 'bg-cine-baby text-cine-dark shadow-md shadow-cine-baby/20'
                  : 'border border-cine-border text-slate-300 hover:border-cine-baby hover:text-cine-baby'
              }`}
            >
              {formatDateLabel(d)}
            </button>
          ))}
        </div>

        {/* Schedule Slots */}
        {scheduleLoading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="bg-cine-dark rounded-xl p-5 border border-cine-border">
                <div className="h-5 bg-cine-border rounded w-48 mb-4" />
                <div className="flex gap-3">
                  <div className="h-10 bg-cine-border rounded-lg w-20" />
                  <div className="h-10 bg-cine-border rounded-lg w-20" />
                  <div className="h-10 bg-cine-border rounded-lg w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : groupedSchedules.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-16 h-16 text-cine-border mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-cine-muted font-medium">Belum ada jadwal tayang untuk tanggal ini</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedSchedules.map((group, idx) => (
              <div
                key={idx}
                className="bg-cine-dark rounded-xl p-5 border border-cine-border"
              >
                {/* Cinema + Studio header */}
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-white font-bold text-base">{group.cinemaName}</h3>
                  <span className="text-cine-muted text-sm">|</span>
                  <span className="text-cine-baby-soft text-sm font-medium">
                    Studio {group.studioNumber}
                  </span>
                  <span className="text-xs bg-cine-baby/10 text-cine-baby px-2 py-0.5 rounded-full font-semibold border border-cine-baby/20">
                    {group.studioType}
                  </span>
                </div>

                {/* Time Slots */}
                <div className="flex flex-wrap gap-3">
                  {group.slots.map((slot) => {
                    const isSelected = selectedScheduleId === slot.scheduleId;
                    const timeLabel = slot.startTime?.substring(0, 5);
                    return (
                      <button
                        key={slot.scheduleId}
                        onClick={() => setSelectedScheduleId(slot.scheduleId)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                          isSelected
                            ? 'bg-cine-baby text-cine-dark border border-cine-baby shadow-md shadow-cine-baby/20'
                            : 'border border-cine-border text-slate-300 hover:border-cine-baby hover:text-cine-baby'
                        }`}
                      >
                        <span className="block">{timeLabel}</span>
                        <span className={`block text-[11px] mt-0.5 ${isSelected ? 'text-cine-dark/70' : 'text-cine-muted'}`}>
                          {formatPrice(slot.price)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSelectSchedule}
            disabled={!selectedScheduleId}
            className={`px-8 py-3.5 rounded-xl font-bold text-base transition-all duration-300 ${
              selectedScheduleId
                ? 'bg-cine-baby text-cine-dark hover:bg-cine-baby-hover shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transform hover:-translate-y-0.5'
                : 'bg-cine-border text-cine-muted cursor-not-allowed'
            }`}
          >
            Lanjut Pilih Kursi →
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
