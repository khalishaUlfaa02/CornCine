import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMyBookings, downloadTicketPdf } from '../api/ticketApi';

const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const MyTickets = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.successMsg || '');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getMyBookings();
        if (res.success) {
          setBookings(res.data || []);
        } else {
          setError(res.message || "Gagal mengambil riwayat tiket.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Terjadi kesalahan pada server.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, navigate]);

  const handleDownloadPdf = async (bookingCode) => {
    setDownloadingId(bookingCode);
    try {
      const blob = await downloadTicketPdf(bookingCode);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `E-Ticket_${bookingCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Gagal mengunduh E-Ticket. Pastikan transaksi sudah lunas.");
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'PAID') {
      return (
        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
          LUNAS
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
          MENUNGGU PEMBAYARAN
        </span>
      );
    }
    return (
      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
        DIBATALKAN
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cine-brand border-t-transparent mb-4"></div>
        <p className="text-cine-muted font-medium animate-pulse">Memuat riwayat tiket...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-white mb-8 flex items-center">
        Tiket Saya
        <span className="ml-3 h-1 w-12 bg-cine-brand rounded-full inline-block" />
      </h1>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm font-medium mb-8">
          {successMsg}
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm font-medium mb-8">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-cine-card rounded-2xl border border-cine-border shadow-lg">
          <svg className="w-24 h-24 text-cine-border mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">Belum ada tiket</h2>
          <p className="text-cine-muted mb-8 max-w-md">
            Anda belum pernah memesan tiket. Yuk, temukan film favorit Anda dan pesan tiketnya sekarang!
          </p>
          <Link 
            to="/" 
            className="bg-cine-brand text-cine-bg font-bold px-8 py-3.5 rounded-xl hover:bg-cine-brand-hover shadow-[0_0_15px_rgba(125,211,252,0.3)] transition-all duration-300"
          >
            Cari Film Sekarang
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <div key={booking.bookingId} className="bg-cine-card rounded-2xl border border-cine-border overflow-hidden shadow-lg flex flex-col relative">
              
              {/* Header Card / Movie Info */}
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-extrabold text-white pr-4">{booking.movieTitle}</h2>
                  <div className="flex-shrink-0">
                    {getStatusBadge(booking.status)}
                  </div>
                </div>
                
                <div className="space-y-2 mb-2">
                  <p className="text-sm font-medium text-amber-200">
                    {booking.cinemaName} <span className="text-cine-muted mx-1">•</span> Studio {booking.studioNumber}
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-white">Jadwal:</span> {booking.showDate} | {booking.startTime?.substring(0,5)}
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-white">Kursi:</span> {booking.seatCodes?.join(', ')}
                  </p>
                </div>
              </div>

              {/* Dashed Divider Line */}
              <div className="relative flex items-center px-4">
                <div className="w-4 h-8 bg-cine-bg rounded-full -ml-6 absolute z-10 border-r border-cine-border" />
                <div className="w-full border-t-2 border-dashed border-cine-border" />
                <div className="w-4 h-8 bg-cine-bg rounded-full -mr-6 absolute right-0 z-10 border-l border-cine-border" />
              </div>

              {/* Footer Card / Payment Info & Actions */}
              <div className="p-6 pt-4 bg-cine-card/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-xs text-cine-muted mb-1">Kode Booking</p>
                  <p className="text-sm font-mono font-bold text-white tracking-widest">{booking.bookingCode}</p>
                </div>
                
                <div className="text-left sm:text-right">
                  <p className="text-xs text-cine-muted mb-1">Total Pembayaran</p>
                  <p className="text-lg font-extrabold text-cine-brand">{formatPrice(booking.totalAmount)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 flex gap-3">
                {booking.status === 'PAID' ? (
                  <button
                    onClick={() => handleDownloadPdf(booking.bookingCode)}
                    disabled={downloadingId === booking.bookingCode}
                    className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all duration-300 ${
                      downloadingId === booking.bookingCode
                        ? 'bg-cine-brand/50 text-cine-bg cursor-wait'
                        : 'bg-cine-brand text-cine-bg hover:bg-cine-brand-hover shadow-[0_0_15px_rgba(125,211,252,0.2)] hover:shadow-[0_0_20px_rgba(56,189,248,0.4)]'
                    }`}
                  >
                    {downloadingId === booking.bookingCode ? (
                      <span className="animate-pulse">Mengunduh PDF...</span>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download E-Tiket (PDF)
                      </>
                    )}
                  </button>
                ) : booking.status === 'PENDING' ? (
                  // Opsional: Tombol untuk lanjut bayar jika masih pending (redirect ke checkout manual, tapi karena checkout butuh state dari SeatSelection, kita bisa disabled atau bikin alur khusus)
                  <div className="w-full bg-amber-500/5 border border-amber-500/20 text-amber-500 text-center py-3 rounded-xl text-sm font-medium">
                    Mohon selesaikan pembayaran.
                  </div>
                ) : null}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTickets;