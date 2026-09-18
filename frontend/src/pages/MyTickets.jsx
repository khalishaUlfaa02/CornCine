import React, { useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMyBookings, downloadTicketPdf, createPaymentInvoice, cancelBooking, syncPaymentStatus } from '../api/ticketApi';

const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const MyTickets = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('aktif');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [checkingId, setCheckingId] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(location.state?.successMsg || '');

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMyBookings();
      // ticket_service membalas {status, message, data} (tanpa field success)
      if (res.success || (typeof res.status === 'number' && res.status >= 200 && res.status < 300)) {
        const list = res.data || [];
        setBookings(list);
        return list;
      } else {
        setError(res.message || "Gagal mengambil riwayat tiket.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Terjadi kesalahan pada server.");
    } finally {
      setLoading(false);
    }
    return [];
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    (async () => {
      const list = await fetchBookings();
      // Baru redirect dari Xendit (?status=success) -> sinkronkan semua yg masih PENDING
      const params = new URLSearchParams(location.search);
      if (params.get('status') === 'success') {
        navigate(location.pathname, { replace: true });
        await syncAllPending(list);
      }
    })();
  }, [user, navigate]);

  const syncAllPending = async (list) => {
    const pending = (list || []).filter((b) => b.paymentStatus === 'PENDING');
    if (pending.length === 0) return;
    setSyncingAll(true);
    try {
      for (const b of pending) {
        try {
          await syncPaymentStatus(b.bookingCode);
        } catch (e) {
          console.error('Gagal sync', b.bookingCode, e);
        }
      }
      const refreshed = await fetchBookings();
      const paidCount = (refreshed || []).filter((b) => b.paymentStatus === 'PAID').length;
      if (paidCount > 0) setSuccessMsg('Pembayaran terkonfirmasi! Tiketmu sudah LUNAS.');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleCheckPayment = async (booking) => {
    setCheckingId(booking.bookingCode);
    setError('');
    try {
      const res = await syncPaymentStatus(booking.bookingCode);
      const result = res.data || {};
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingCode === booking.bookingCode
            ? { ...b, paymentStatus: result.paymentStatus || b.paymentStatus }
            : b
        )
      );
      if (result.paymentStatus === 'PAID') {
        setSuccessMsg(`Tiket ${booking.bookingCode} sudah LUNAS. Silakan unduh E-Tiket PDF.`);
      } else {
        setSuccessMsg('');
        setError(`Status di Xendit: ${result.invoiceStatus || 'belum lunas'}. Coba lagi setelah bayar.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengecek status ke Xendit.');
    } finally {
      setCheckingId(null);
    }
  };

  const handlePayNow = async (booking) => {
    // 1. Pakai URL invoice Xendit yang sudah tersimpan (paymentCode membawa paymentUrl)
    const savedUrl = booking.paymentCode && booking.paymentCode.startsWith('http') ? booking.paymentCode : null;
    if (savedUrl) {
      window.open(savedUrl, '_blank');
      return;
    }

    // 2. Belum ada URL -> buat invoice baru via backend, simpan ke state, lalu buka
    setPayingId(booking.bookingCode);
    setError('');
    try {
      const res = await createPaymentInvoice({
        bookingId: booking.bookingCode,
        userEmail: user?.email || '',
        amount: booking.totalAmount,
        description: `Tiket ${booking.movieTitle || 'CornCine'} - ${booking.bookingCode}`,
      });
      const invoiceUrl = res.data?.invoice_url;
      if ((res.success || (typeof res.status === 'number' && res.status >= 200 && res.status < 300)) && invoiceUrl) {
        setBookings((prev) =>
          prev.map((b) => (b.bookingCode === booking.bookingCode ? { ...b, paymentCode: invoiceUrl } : b))
        );
        window.open(invoiceUrl, '_blank');
      } else {
        setError(res.message || 'Gagal membuat invoice Xendit.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat membuat invoice Xendit.');
    } finally {
      setPayingId(null);
    }
  };

  const handleCancelBooking = async (booking) => {
    if (!window.confirm(`Batalkan pesanan ${booking.bookingCode}? Kursi akan kembali tersedia.`)) return;
    setCancellingId(booking.bookingCode);
    setError('');
    try {
      await cancelBooking(booking.bookingCode);
      setSuccessMsg(`Pesanan ${booking.bookingCode} berhasil dibatalkan.`);
      await fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membatalkan pesanan.');
    } finally {
      setCancellingId(null);
    }
  };

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
      toast.error("Gagal mengunduh E-Ticket. Pastikan transaksi sudah lunas.");
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'PAID') {
      return (
        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
          LUNAS / BERHASIL
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
          MENUNGGU PEMBAYARAN
        </span>
      );
    }
    return (
      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
        DIBATALKAN
      </span>
    );
  };

  // CANCELLED yang bookingTime-nya lebih tua dari 1 hari disembunyikan (data tetap aman di database)
  const visibleBookings = bookings.filter((b) => {
    const isActive = b.paymentStatus === 'PENDING' || b.paymentStatus === 'PAID';
    if (isActive) return true;
    if (!b.bookingTime) return true;
    const age = Date.now() - new Date(b.bookingTime).getTime();
    return Number.isNaN(age) || age < 24 * 60 * 60 * 1000;
  });

  const activeBookings = visibleBookings.filter(
    (b) => b.paymentStatus === 'PENDING' || b.paymentStatus === 'PAID'
  );
  const historyBookings = visibleBookings.filter(
    (b) => b.paymentStatus !== 'PENDING' && b.paymentStatus !== 'PAID'
  );
  const displayedBookings = activeTab === 'aktif' ? activeBookings : historyBookings;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center pt-28">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cine-baby border-t-transparent mb-4"></div>
        <p className="text-cine-muted font-medium animate-pulse">Memuat riwayat tiket...</p>
      </div>
    );
  }

  return (
    <div className="pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-extrabold text-white mb-8 flex items-center">
        Tiket Saya
        <span className="ml-3 h-1 w-12 bg-cine-baby rounded-full inline-block" />
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

      {syncingAll && (
        <div className="bg-sky-500/10 border border-sky-400/30 text-sky-300 p-4 rounded-xl text-sm font-medium mb-8 animate-pulse">
          Memeriksa status pembayaran ke Xendit...
        </div>
      )}

      {/* Tab Aktif / Riwayat */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab('aktif')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'aktif'
              ? 'bg-cine-baby text-cine-dark shadow-[0_0_15px_rgba(125,211,252,0.3)]'
              : 'bg-cine-card text-cine-muted border border-cine-border hover:text-white'
          }`}
        >
          Tiket Aktif ({activeBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'riwayat'
              ? 'bg-cine-baby text-cine-dark shadow-[0_0_15px_rgba(125,211,252,0.3)]'
              : 'bg-cine-card text-cine-muted border border-cine-border hover:text-white'
          }`}
        >
          Riwayat ({historyBookings.length})
        </button>
      </div>

      {displayedBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-cine-card rounded-2xl border border-cine-border shadow-lg">
          <svg className="w-24 h-24 text-cine-border mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">
            {activeTab === 'aktif' ? 'Tidak ada tiket aktif' : 'Riwayat kosong'}
          </h2>
          <p className="text-cine-muted mb-8 max-w-md">
            {activeTab === 'aktif'
              ? 'Anda belum memiliki tiket yang menunggu pembayaran atau sudah lunas.'
              : 'Tiket yang dibatalkan lebih dari 1 hari lalu otomatis disembunyikan.'}
          </p>
          <Link
            to="/"
            className="bg-cine-baby text-cine-dark font-bold px-8 py-3.5 rounded-xl hover:bg-cine-baby-hover shadow-[0_0_15px_rgba(125,211,252,0.3)] transition-all duration-300"
          >
            Cari Film Sekarang
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedBookings.map((booking) => (
            <div key={booking.bookingCode} className="bg-cine-card rounded-2xl border border-cine-border overflow-hidden shadow-lg flex flex-col relative">

              {/* Header Card / Movie Info */}
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-extrabold text-white pr-4">{booking.movieTitle || booking.schedule?.movie?.title || 'Film Bioskop'}</h2>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {getStatusBadge(booking.paymentStatus)}
                    {booking.paymentStatus === 'PENDING' && (
                      <button
                        onClick={() => handleCheckPayment(booking)}
                        disabled={checkingId === booking.bookingCode}
                        title="Periksa Pembayaran"
                        className="text-[11px] font-bold text-sky-300 border border-sky-400/40 hover:bg-sky-400/10 px-2.5 py-1 rounded-full transition-all disabled:opacity-50 disabled:cursor-wait"
                      >
                        {checkingId === booking.bookingCode ? '...' : '↻ Periksa'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-2">
                  <p className="text-sm font-medium text-cine-baby-soft">
                    {booking.cinemaName || 'Bioskop CornCine'} <span className="text-cine-muted mx-1">•</span> {booking.studioName || 'Studio'}
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-white">Jadwal:</span> {booking.showTime ? booking.showTime.replace('T', ' ').substring(0, 16) : (booking.bookingTime ? booking.bookingTime.replace('T', ' ').substring(0, 16) : '-')}
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-white">Kursi:</span> {booking.seatCodes?.join(', ') || '-'}
                  </p>
                </div>
              </div>

              {/* Dashed Divider Line */}
              <div className="relative flex items-center px-4">
                <div className="w-4 h-8 bg-cine-dark rounded-full -ml-6 absolute z-10 border-r border-cine-border" />
                <div className="w-full border-t-2 border-dashed border-cine-border" />
                <div className="w-4 h-8 bg-cine-dark rounded-full -mr-6 absolute right-0 z-10 border-l border-cine-border" />
              </div>

              {/* Footer Card / Payment Info & Actions */}
              <div className="p-6 pt-4 bg-cine-card/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <p className="text-xs text-cine-muted mb-1">Kode Booking</p>
                  <p className="text-sm font-mono font-bold text-white tracking-widest">{booking.bookingCode}</p>
                </div>
                
                <div className="text-left sm:text-right">
                  <p className="text-xs text-cine-muted mb-1">Total Pembayaran</p>
                  <p className="text-lg font-extrabold text-cine-baby">{formatPrice(booking.totalAmount)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0 flex gap-3">
                {booking.paymentStatus === 'PENDING' ? (
                  <div className="w-full flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handlePayNow(booking)}
                      disabled={payingId === booking.bookingCode || cancellingId === booking.bookingCode}
                      className="flex-1 bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold py-2 px-4 rounded-xl text-sm transition-all shadow-md shadow-sky-400/20 disabled:opacity-50 disabled:cursor-wait"
                    >
                      {payingId === booking.bookingCode ? 'Menyiapkan...' : 'Bayar Sekarang'}
                    </button>
                    <button
                      onClick={() => handleCancelBooking(booking)}
                      disabled={payingId === booking.bookingCode || cancellingId === booking.bookingCode}
                      className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium py-2 px-4 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-wait"
                    >
                      {cancellingId === booking.bookingCode ? 'Membatalkan...' : 'Batalkan Pesanan'}
                    </button>
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
