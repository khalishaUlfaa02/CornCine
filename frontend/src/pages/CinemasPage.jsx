import React, { useState, useEffect } from 'react';
import { getCinemas } from '../api/cinemaApi';
import { useNavigate } from 'react-router-dom';

const CinemasPage = () => {
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCity, setActiveCity] = useState('Semua');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const res = await getCinemas();
        if (res.success) {
          const list = res.data?.content || res.data?.data || (Array.isArray(res.data) ? res.data : []);
          setCinemas(list);
        }
      } catch (err) {
        console.error("Gagal memuat bioskop", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCinemas();
  }, []);

  const cities = ['Semua', ...new Set(cinemas.map(c => c.city))].filter(Boolean).sort();

  const filteredCinemas = activeCity === 'Semua' 
    ? cinemas 
    : cinemas.filter(c => c.city === activeCity);

  return (
    <div className="min-h-screen bg-cine-bg pt-32 pb-24">
      <div className="container mx-auto px-6 max-w-7xl">
        <h1 className="text-4xl font-black text-white mb-4">Daftar Bioskop</h1>
        <p className="text-slate-400 mb-10">Temukan lokasi CornCine terdekat di kotamu.</p>

        {/* City Filter */}
        <div className="flex flex-wrap gap-3 mb-12">
          {cities.map(city => (
            <button
              key={city}
              onClick={() => setActiveCity(city)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                activeCity === city
                  ? 'bg-sky-400 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                  : 'bg-cine-card border border-slate-700 text-slate-300 hover:border-sky-400/50'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-sky-400 rounded-full animate-spin"></div>
          </div>
        ) : filteredCinemas.length === 0 ? (
          <div className="text-center py-20 bg-cine-card/50 rounded-3xl border border-slate-800">
            <p className="text-slate-400">Tidak ada bioskop di kota ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCinemas.map(cinema => (
              <div key={cinema.cinemaId} className="bg-cine-card rounded-2xl p-6 border border-slate-800 shadow-xl hover:border-sky-400/50 transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-2">{cinema.name}</h3>
                <p className="text-sm text-slate-400 mb-6 flex items-start gap-2">
                  <span>📍</span> {cinema.address}, {cinema.city}
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-slate-800 hover:bg-sky-400 text-sky-400 hover:text-slate-950 font-bold py-3 rounded-xl transition-all duration-300"
                >
                  Lihat Jadwal
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CinemasPage;