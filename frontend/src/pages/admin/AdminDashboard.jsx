import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getMovies } from '../../api/movieApi';
import { getAllSchedules } from '../../api/scheduleApi';
import { getCinemas } from '../../api/cinemaApi';
import { getAllUsers } from '../../api/authApi';

const unwrapList = (res) =>
  res?.data?.content || res?.data?.data || (Array.isArray(res?.data) ? res.data : []);

const StatCard = ({ label, value, sub, to }) => {
  const content = (
    <div className="bg-cine-card rounded-2xl p-6 border border-cine-border shadow-lg hover:border-cine-baby/50 transition-all group h-full">
      <p className="text-cine-muted text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
      <p className="text-4xl font-black text-white group-hover:text-cine-baby transition-colors">{value}</p>
      {sub && <p className="text-cine-muted text-xs mt-2">{sub}</p>}
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : <div>{content}</div>;
};

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ movies: 0, cinemas: 0, schedules: 0, users: '-' });
  const [recentSchedules, setRecentSchedules] = useState([]);
  const [recentMovies, setRecentMovies] = useState([]);
  const [error, setError] = useState('');

  const isSuperAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'STAFF')) {
      navigate('/');
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        const promises = [
          getMovies(0, 100),
          getAllSchedules(0, 100),
          getCinemas(),
        ];

        if (isSuperAdmin) {
          promises.push(getAllUsers(0, 1));
        } else {
          // Dummy resolved promise for STAFF to maintain index
          promises.push(Promise.resolve(null));
        }

        const results = await Promise.allSettled(promises);

        const moviesRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const schedRes = results[1].status === 'fulfilled' ? results[1].value : null;
        const cinemaRes = results[2].status === 'fulfilled' ? results[2].value : null;
        const usersRes = results[3].status === 'fulfilled' ? results[3].value : null;

        const movies = moviesRes ? unwrapList(moviesRes) : [];
        const schedules = schedRes ? unwrapList(schedRes) : [];
        const cinemas = cinemaRes ? unwrapList(cinemaRes) : [];
        
        let totalUsers = '-';
        if (isSuperAdmin && usersRes) {
          totalUsers = usersRes.data?.totalElements ?? unwrapList(usersRes).length;
        }

        setStats({
          movies: moviesRes?.data?.totalElements ?? movies.length,
          cinemas: cinemas.length,
          schedules: schedules.length,
          users: totalUsers,
        });

        setRecentSchedules(schedules.slice(0, 5));
        setRecentMovies(movies.slice(0, 4));

        // Check if critical data failed
        if (results[0].status === 'rejected' || results[1].status === 'rejected') {
          console.error("Sebagian data gagal dimuat", results);
          setError("Beberapa data mungkin tidak tampil karena gangguan pada server.");
        }
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data dashboard secara fatal.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user, navigate, isSuperAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cine-dark pt-32 pb-20 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-cine-baby rounded-full animate-spin"></div>
          <p className="mt-4 text-cine-muted font-medium animate-pulse">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cine-dark pt-28 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white flex items-center tracking-tight">
            Dashboard
            <span className="ml-4 h-1.5 w-12 bg-cine-baby rounded-full inline-block shadow-[0_0_10px_rgba(125,211,252,0.5)]" />
          </h1>
          <p className="text-cine-muted font-medium mt-2">Ringkasan operasional CornCine secara real-time</p>
        </div>

        {error && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-4 rounded-xl text-sm font-medium mb-8">
            {error}
          </div>
        )}

        <div className={`grid gap-4 mb-10 ${isSuperAdmin ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
          <StatCard label="Total Film" value={stats.movies} sub="Katalog aktif" to="/admin/movies" />
          <StatCard label="Total Bioskop" value={stats.cinemas} sub="Cabang terdaftar" to={isSuperAdmin ? "/admin/cinemas" : null} />
          <StatCard label="Total Jadwal" value={stats.schedules} sub="Slot tayang" to="/admin/schedules" />
          {isSuperAdmin && (
            <StatCard 
              label="Total Pengguna" 
              value={stats.users} 
              sub="Akun terdaftar" 
              to="/admin/users" 
            />
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-cine-card rounded-2xl border border-cine-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Jadwal Terbaru</h2>
              <Link to="/admin/schedules" className="text-cine-baby text-sm font-semibold hover:text-cine-baby-hover">
                Kelola →
              </Link>
            </div>
            {recentSchedules.length === 0 ? (
              <p className="text-cine-muted text-sm">Belum ada jadwal tayang.</p>
            ) : (
              <ul className="space-y-3">
                {recentSchedules.map((s) => (
                  <li key={s.scheduleId} className="flex justify-between items-center bg-cine-dark rounded-xl px-4 py-3 border border-cine-border">
                    <div>
                      <p className="text-white text-sm font-bold">{s.movieTitle}</p>
                      <p className="text-cine-muted text-xs">
                        {s.cinemaName} • Studio {s.studioNumber} • {s.showDate} {s.startTime?.substring(0, 5)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-cine-card rounded-2xl border border-cine-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Film Terbaru</h2>
              <Link to="/admin/movies" className="text-cine-baby text-sm font-semibold hover:text-cine-baby-hover">
                Kelola →
              </Link>
            </div>
            {recentMovies.length === 0 ? (
              <p className="text-cine-muted text-sm">Belum ada film di katalog.</p>
            ) : (
              <ul className="space-y-3">
                {recentMovies.map((m) => (
                  <li key={m.movieId} className="flex justify-between items-center bg-cine-dark rounded-xl px-4 py-3 border border-cine-border">
                    <div>
                      <p className="text-white text-sm font-bold">{m.title}</p>
                      <p className="text-cine-muted text-xs">
                        {(m.genres || []).slice(0, 3).join(', ') || '-'} • {m.durationMinutes} mnt
                      </p>
                    </div>
                    <span className="text-cine-baby text-xs font-bold">{m.ageRating}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
