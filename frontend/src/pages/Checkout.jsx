import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { createBooking, simulatePayment, cancelBooking } from '../api/ticketApi';

const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const PAYMENT_METHODS = [
  { id: 'BCA_VA', name: 'BCA Virtual Account', icon: '🏦' },
  { id: 'QRIS', name: 'QRIS (Gopay, OVO, Dana)', icon: '📱' },
  { id: 'GOPAY', name: 'GoPay', icon: '🟢' },
];

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [bookingData, setBookingData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0].id);
  
  const [initLoading, setInitLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState('');

  // Data dari halaman SeatSelection
  const { scheduleId, selectedSeats, scheduleDetails, totalAmount } = location.state || {};

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!scheduleId || !selectedSeats || selectedSeats.length === 0) {
      navigate('/');
      return;
    }

    const initTransaction = async () => {
      setInitLoading(true);
      setError('');
      try {
        const seatIds = selectedSeats.map((s) => s.seatId);
        const res = await createBooking(scheduleId, seatIds);
        if (res.success && res.data) {
          setBookingData(res.data);
        } else {
          setError(res.message || "Gagal membuat transaksi.");
        }
      } catch (err) {
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("Gagal membuat transaksi. Kursi mungkin sudah direbut orang lain.");
        }
      } finally {
        setInitLoading(false);
      }
    };

    initTransaction();
  }, [scheduleId, selectedSeats, user, navigate]);

  const handlePayment = async () => {
    if (!bookingData) return;
    setPaymentLoading(true);
    setError('');

    try {
      const res = await simulatePayment(bookingData.bookingCode, selectedMethod);
      if (res.success) {
        navigate('/my-tickets', { state: { successMsg: "Pembayaran berhasil! Tiketmu sudah terbit." } });
      } else {
        setError(res.message || "Pembayaran gagal.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Terjadi kesalahan saat memproses pembayaran.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!bookingData) {
      navigate(-1);
      return;
    }
    
    if (window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
      setCancelLoading(true);
      try {
        await cancelBooking(bookingData.bookingCode);
        navigate('/');
      } catch (err) {
        setError("Gagal membatalkan pesanan.");
        setCancelLoading(false);
      }
    }
  };

  if (initLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cine-baby border-t-transparent mb-4"></div>
        <p className="text-cine-muted font-medium animate-pulse">Menyiapkan transaksi Anda...</p>
      </div>
    );
  }

  if (error && !bookingData) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="bg-cine-card border border-rose-500/30 p-8 rounded-2xl shadow-xl">
          <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Transaksi Gagal</h2>
          <p className="text-slate-300 text-sm mb-8">{error}</p>
          <button 
            onClick={() => navigate(`/booking/${scheduleId}`)}
            className="w-full bg-cine-baby text-cine-dark font-bold py-3 rounded-xl hover:bg-cine-baby-hover transition-colors"
          >
            Kembali Pilih Kursi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-white mb-8 flex items-center">
        Checkout Pembayaran
        <span className="ml-3 h-1 w-12 bg-cine-baby rounded-full inline-block" />
      </h1>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm font-medium mb-8">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Kolom Kiri: Detail Pembayaran & Metode */}
        <div className="w-full lg:w-2/3 space-y-6">
          
          {/* Instruksi Tagihan */}
          <div className="bg-cine-card rounded-2xl p-6 md:p-8 border border-cine-border shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-cine-muted text-sm font-medium mb-1">Kode Booking</p>
                <p className="text-white font-bold text-lg tracking-wider">{bookingData?.bookingCode}</p>
              </div>
              <div className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg text-xs font-bold border border-amber-500/20">
                MENUNGGU PEMBAYARAN
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-4">Pilih Metode Pembayaran</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedMethod === method.id
                      ? 'border-cine-baby bg-cine-baby/10 shadow-[0_0_15px_rgba(125,211,252,0.15)]'
                      : 'border-cine-border bg-cine-dark hover:border-slate-500'
                  }`}
                >
                  <span className="text-3xl mb-2">{method.icon}</span>
                  <span className={`text-sm font-semibold ${selectedMethod === method.id ? 'text-cine-baby' : 'text-slate-300'}`}>
                    {method.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Kotak Simulasi/Instruksi (Mock) */}
            <div className="bg-cine-dark rounded-xl p-6 border border-dashed border-cine-border text-center">
              {selectedMethod === 'BCA_VA' ? (
                <>
                  <p className="text-cine-muted text-sm mb-2">Nomor Virtual Account Anda:</p>
                  <p className="text-3xl font-mono font-bold text-cine-baby mb-4 tracking-widest bg-cine-card py-3 px-6 rounded-lg inline-block border border-cine-border">
                    {bookingData?.paymentCode}
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Ini adalah simulasi pembayaran. Klik "Bayar Sekarang" di bawah ini untuk mensimulasikan pelunasan tagihan melalui sistem kami.
                  </p>
                </>
              ) : selectedMethod === 'QRIS' ? (
                <>
                  <p className="text-cine-muted text-sm mb-4">Scan QR Code menggunakan aplikasi e-Wallet Anda:</p>
                  <div className="w-40 h-40 bg-white mx-auto rounded-xl p-2 mb-4">
                    {/* Mock QR image */}
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bookingData?.bookingCode}`} alt="QRIS Mock" className="w-full h-full opacity-90" />
                  </div>
                  <p className="text-xs text-slate-400">QR Code Simulasi (Dummy)</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🟢</span>
                  </div>
                  <p className="text-sm font-medium text-slate-300 mb-2">Aplikasi GoPay Anda akan terbuka (Simulasi)</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Pesanan */}
        <div className="w-full lg:w-1/3">
          <div className="bg-cine-card rounded-2xl p-6 border border-cine-border shadow-lg sticky top-24">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-cine-border pb-4">Ringkasan Pesanan</h3>
            
            <div className="mb-6">
              <h4 className="font-bold text-white text-lg mb-1">{scheduleDetails?.movieTitle || 'Judul Film'}</h4>
              <p className="text-cine-baby-soft text-sm font-medium mb-3">
                {scheduleDetails?.cinemaName} - Studio {scheduleDetails?.studioNumber}
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-cine-dark p-3 rounded-lg border border-cine-border">
                <span>📅 {scheduleDetails?.showDate}</span>
                <span className="text-cine-muted">|</span>
                <span>⏰ {scheduleDetails?.startTime?.substring(0,5)}</span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-slate-300 mb-2">Kursi yang Dipilih:</p>
              <div className="flex flex-wrap gap-2">
                {selectedSeats?.map((s) => (
                  <span key={s.seatId} className="bg-cine-border text-white text-xs font-bold px-2 py-1 rounded">
                    {s.seatCode}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-cine-border pt-4 mb-6">
              <div className="flex justify-between text-sm text-slate-300">
                <span>Harga Tiket x {selectedSeats?.length}</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-300">
                <span>Biaya Layanan</span>
                <span>Rp 0</span>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-cine-border pt-4 mb-8">
              <span className="text-sm font-medium text-cine-muted">Total Tagihan</span>
              <span className="text-2xl font-extrabold text-cine-baby">{formatPrice(totalAmount)}</span>
            </div>

            <div className="space-y-4">
              <button
                onClick={handlePayment}
                disabled={paymentLoading || cancelLoading}
                className={`w-full font-bold py-3.5 rounded-xl transition-all duration-300 ${
                  paymentLoading || cancelLoading
                    ? 'bg-cine-baby/50 text-cine-dark cursor-not-allowed'
                    : 'bg-cine-baby text-cine-dark hover:bg-cine-baby-hover shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transform hover:-translate-y-0.5'
                }`}
              >
                {paymentLoading ? 'Memproses...' : 'Bayar Sekarang (Simulasi)'}
              </button>
              
              <button
                onClick={handleCancel}
                disabled={paymentLoading || cancelLoading}
                className="w-full bg-transparent text-rose-400 font-semibold py-3 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500 transition-all duration-200"
              >
                {cancelLoading ? 'Membatalkan...' : 'Batalkan Pesanan'}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;