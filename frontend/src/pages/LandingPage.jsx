import React, { useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { getMovies } from '../api/movieApi';
import { AuthContext } from '../context/AuthContext';
import MovieCard from '../components/MovieCard';

const FALLBACK_MOVIES = [
  {
    movieId: 1,
    title: "Dune: Part Two",
    posterUrl: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjc9ew.jpg",
    ageRating: "13+",
    durationMinutes: 166,
    genres: ["Action", "Sci-Fi"]
  },
  {
    movieId: 2,
    title: "Oppenheimer",
    posterUrl: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    ageRating: "17+",
    durationMinutes: 180,
    genres: ["Drama", "History"]
  },
  {
    movieId: 3,
    title: "The Batman",
    posterUrl: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
    ageRating: "13+",
    durationMinutes: 176,
    genres: ["Crime", "Action"]
  },
  {
    movieId: 4,
    title: "Avatar: The Way of Water",
    posterUrl: "https://image.tmdb.org/t/p/w500/t6HIqrBUCPCc1x5K3Tj8E2tQy2Z.jpg",
    ageRating: "13+",
    durationMinutes: 192,
    genres: ["Sci-Fi", "Adventure"]
  }
];

const COMING_SOON = [
  { id: 101, title: "Deadpool & Wolverine", date: "26 Juli 2026", posterUrl: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg" },
  { id: 102, title: "Joker: Folie à Deux", date: "4 Oktober 2026", posterUrl: "https://image.tmdb.org/t/p/w500/amY0gSqHk0g651L9wI33qT0t0e6.jpg" },
  { id: 103, title: "Gladiator II", date: "22 November 2026", posterUrl: "https://image.tmdb.org/t/p/w500/vHofXtvTtzL4O5I0j5A1z51zZ4S.jpg" }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNowShowing = async () => {
      setLoading(true);
      try {
        const res = await getMovies(0, 8);
        if (res.success && res.data) {
          const list = res.data.content || res.data.data || (Array.isArray(res.data) ? res.data : []);
          setMovies(list.length > 0 ? list : FALLBACK_MOVIES);
        } else {
          setMovies(FALLBACK_MOVIES);
        }
      } catch (err) {
        console.warn("Backend belum aktif, menggunakan fallback data.");
        setMovies(FALLBACK_MOVIES);
      } finally {
        setLoading(false);
      }
    };
    fetchNowShowing();
  }, []);

  const handleBookTicket = () => {
    if (!user) {
      navigate('/login');
    } else {
      document.getElementById('now-showing').scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-cine-bg overflow-hidden text-slate-100 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full pt-32 pb-24 md:pt-40 md:pb-32 flex items-center justify-center text-center px-4 overflow-hidden">
        {/* Radial Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-900/20 via-cine-bg to-cine-bg"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-sky-500/10 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <span className="inline-block py-1.5 px-4 rounded-full bg-sky-500/10 text-sky-400 font-bold text-[10px] sm:text-xs tracking-[0.2em] uppercase mb-6 border border-sky-400/30 backdrop-blur-md">
            Bioskop Digital Generasi Baru
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
            Nonton Bioskop Tanpa Antre, <br className="hidden sm:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-sky-600 drop-shadow-sm">Pesan Tiketmu Sekarang!</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-10 max-w-2xl font-medium leading-relaxed px-4">
            Akses ribuan film layar lebar, pilih kursi favoritmu secara real-time, dan unduh tiket elektronikmu hanya dalam genggaman.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-6 sm:px-0">
            <button 
              onClick={handleBookTicket}
              className="bg-sky-400 hover:bg-sky-300 text-slate-950 px-8 py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all duration-300 transform hover:-translate-y-1"
            >
              Cek Jadwal Film
            </button>
            {!user && (
              <button 
                onClick={() => navigate('/register')}
                className="bg-slate-900/80 backdrop-blur border border-slate-700 hover:border-sky-400/50 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300"
              >
                Daftar Akun Baru
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. NOW PLAYING (SEDANG TAYANG) */}
      <section id="now-showing" className="container mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-10 border-b border-slate-800/60 pb-6">
          <div>
            <h2 className="text-3xl font-black text-white flex items-center tracking-tight">
              Sedang Tayang
              <span className="ml-4 h-1.5 w-12 bg-sky-400 rounded-full inline-block shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
            </h2>
          </div>
          <button onClick={() => navigate('/movies')} className="hidden sm:flex text-sky-400 font-semibold hover:text-sky-300 items-center gap-1 group">
            Lihat Semua <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-cine-card rounded-2xl aspect-[2/3] border border-slate-800 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {movies.map((movie) => (
              <MovieCard key={movie.movieId} movie={movie} />
            ))}
          </div>
        )}
      </section>

      {/* 4. COMING SOON */}
      <section className="container mx-auto px-6 py-12">
        <h2 className="text-2xl font-black text-white mb-8">Segera Hadir</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {COMING_SOON.map(item => (
            <div key={item.id} className="relative rounded-2xl overflow-hidden group cursor-pointer border border-slate-800 hover:border-slate-600 transition-colors">
              <div className="aspect-video bg-cine-card overflow-hidden">
                <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex flex-col justify-end p-5">
                <span className="bg-slate-800 text-sky-400 text-[10px] font-bold px-2.5 py-1 rounded w-max mb-2">RILIS: {item.date}</span>
                <h3 className="text-white font-bold text-lg">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. PROMO COMING SOON */}
      <section className="container mx-auto px-6 py-12">
        <div className="bg-gradient-to-r from-sky-900 to-indigo-900 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-sky-700/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-400/20 blur-[80px] rounded-full"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="bg-sky-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">Segera Hadir</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">Promo Coming Soon!</h2>
              <p className="text-sky-100 font-medium max-w-lg mb-6">Voucher diskon dan cashback menarik sedang kami siapkan. Klik tombol di bawah agar tidak ketinggalan saat vouchernya rilis.</p>
              <button
                onClick={() => toast.success('Siap! Kami akan mengingatkanmu saat voucher CornCine rilis.')}
                className="bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold px-6 py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.4)] transform hover:-translate-y-0.5"
              >
                🔔 Ingatkan Saya
              </button>
            </div>
            <div className="hidden lg:block">
              <div className="text-[120px] leading-none">🎫</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5B. KELEBIHAN & KEKURANGAN */}
      <section className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-cine-card rounded-3xl p-8 border border-slate-800 shadow-xl">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <span className="text-emerald-400">✓</span> Kelebihan CornCine
            </h3>
            <ul className="space-y-4 text-sm text-slate-300 font-medium">
              <li className="flex gap-3"><span className="text-emerald-400 font-bold">✓</span> Pesan tiket tanpa antre, kursi dipilih langsung di denah interaktif</li>
              <li className="flex gap-3"><span className="text-emerald-400 font-bold">✓</span> Pembayaran aman via Xendit (VA, QRIS, e-wallet)</li>
              <li className="flex gap-3"><span className="text-emerald-400 font-bold">✓</span> E-tiket PDF + QR Code siap diunduh dan dipindai petugas</li>
              <li className="flex gap-3"><span className="text-emerald-400 font-bold">✓</span> Riwayat tiket tersimpan rapi, tiket aktif dan arsip terpisah</li>
            </ul>
          </div>
          <div className="bg-cine-card rounded-3xl p-8 border border-slate-800 shadow-xl">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <span className="text-amber-400">!</span> Yang Sedang Kami Benahi
            </h3>
            <ul className="space-y-4 text-sm text-slate-300 font-medium">
              <li className="flex gap-3"><span className="text-amber-400 font-bold">•</span> Program voucher & promo masih tahap persiapan</li>
              <li className="flex gap-3"><span className="text-amber-400 font-bold">•</span> Pilihan metode bayar tunai di bioskop belum tersedia</li>
              <li className="flex gap-3"><span className="text-amber-400 font-bold">•</span> Notifikasi email tiket masih dalam pengembangan</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. CARA PEMESANAN (HOW IT WORKS) */}
      <section className="container mx-auto px-6 py-20 border-t border-slate-800/60 mt-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-white mb-4">Cara Pesan Tiket</h2>
          <p className="text-slate-400 font-medium">Langkah mudah mengamankan kursi film favoritmu</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-0.5 bg-slate-800 z-0"></div>
          
          {[
            { step: '1', title: 'Pilih Film & Jadwal', desc: 'Jelajahi katalog dan temukan waktu tayang yang cocok.' },
            { step: '2', title: 'Pilih Kursi', desc: 'Tentukan posisi duduk ternyamanmu di denah studio interaktif.' },
            { step: '3', title: 'Bayar & Unduh Tiket', desc: 'Selesaikan pembayaran aman dan tiket PDF siap diunduh.' },
          ].map((item, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-cine-card border-2 border-slate-700 group-hover:border-sky-400 rounded-full flex items-center justify-center text-2xl font-black text-white mb-6 shadow-xl transition-colors duration-300">
                {item.step}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-sky-400 transition-colors">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
