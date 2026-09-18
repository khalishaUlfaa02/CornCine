import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { getStoredToken } from '../../api/movieApi';

const TicketValidatorPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [bookingCode, setBookingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success: bool, message: string, data: object }

  useEffect(() => {
    // Only allow STAFF, ADMIN, SUPER_ADMIN
    if (!user || (user.role !== 'STAFF' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!bookingCode.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await axiosClient.post('/tickets/validate', 
        { bookingCode }, 
        { headers: { Authorization: `Bearer ${getStoredToken()}` } }
      );
      
      if (response.data.success || (response.status >= 200 && response.status < 300)) {
        setResult({
          success: true,
          message: response.data.message || 'TIKET VALID - SILAKAN MASUK',
          data: response.data.data
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.message || 'Terjadi kesalahan saat memvalidasi tiket',
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setBookingCode('');
  };

  return (
    <div className="min-h-screen bg-cine-bg pt-28 pb-20 px-4">
      <div className="container mx-auto max-w-2xl">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Gate Scanner</h1>
          <p className="text-slate-400 font-medium">Sistem Validasi Tiket CornCine</p>
        </div>

        {/* Validator Form */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl mb-8">
          <form onSubmit={handleValidate}>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Kode Booking (Order ID)</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value)}
                  placeholder="Contoh: CORNCINE-178... ATAU SCAN QR"
                  className="w-full px-5 py-4 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all font-mono font-bold text-lg"
                  autoFocus
                />
                <button 
                  type="submit" 
                  disabled={loading || !bookingCode.trim()}
                  className="bg-sky-400 text-slate-950 font-extrabold px-8 py-4 rounded-xl hover:bg-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto w-full"
                >
                  {loading ? 'Mengecek...' : 'Validasi'}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
              <span className="text-xl">📷</span>
              <p className="text-xs text-slate-400 font-medium">Gunakan alat pemindai Barcode/QR eksternal yang terhubung ke perangkat ini, lalu arahkan kursor ke dalam kotak teks di atas.</p>
            </div>
          </form>
        </div>

        {/* Result Card */}
        {result && (
          <div className="animate-slide-up">
            {result.success ? (
              <div className="bg-emerald-950/40 border-2 border-emerald-500 rounded-3xl p-8 shadow-[0_0_30px_rgba(16,185,129,0.15)] text-center relative overflow-hidden">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-emerald-400 mb-2">{result.message}</h2>
                <div className="bg-slate-900/80 rounded-xl p-5 mt-6 border border-emerald-500/20 text-left">
                  <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Detail Tiket</p>
                  <p className="text-white font-bold text-lg">{result.data?.movieTitle}</p>
                  <p className="text-sky-300 font-medium text-sm mt-1">{result.data?.cinemaName} - {result.data?.studioName}</p>
                  <div className="flex items-center gap-2 mt-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Jadwal:</span>
                    <span className="text-white font-bold">{result.data?.showTime}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-slate-400">Kursi:</span>
                    <span className="text-amber-400 font-bold tracking-wide">{result.data?.seatCodes}</span>
                  </div>
                </div>
                <button onClick={resetScanner} className="mt-8 text-emerald-400 font-bold hover:text-white transition-colors underline underline-offset-4">
                  Scan Tiket Berikutnya
                </button>
              </div>
            ) : (
              <div className="bg-rose-950/40 border-2 border-rose-500 rounded-3xl p-8 shadow-[0_0_30px_rgba(225,29,72,0.15)] text-center relative overflow-hidden">
                <div className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(225,29,72,0.5)]">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-rose-400 mb-2">AKSES DITOLAK</h2>
                <p className="text-slate-300 bg-slate-900/80 p-4 rounded-xl border border-rose-500/20 mt-4 font-medium">
                  {result.message}
                </p>
                <button onClick={resetScanner} className="mt-8 text-rose-400 font-bold hover:text-white transition-colors underline underline-offset-4">
                  Coba Scan Ulang
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default TicketValidatorPage;
