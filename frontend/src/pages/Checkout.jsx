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
  
  const [timeLeft, setTimeLeft] = useState(900); // 15 menit timer

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

  // Timer countdown
  useEffect(() => {
    if (initLoading || error || !bookingData) return;
    
    if (timeLeft <= 0) {
      handleCancel(true); // Auto cancel jika waktu habis
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, initLoading, error, bookingData]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handlePayment = async () => {
    if (!bookingData) return;
    setPaymentLoading(true);
    setError('');
    try {
      const res = await simulatePayment(bookingData.bookingCode, selectedMethod);
      if (res.success) {
        navigate('/my-tickets', { state: { successMsg: "Pembayaran berhasil! Tiketmu sudah diterbitkan." } });
      } else {
        setError(res.message || "Pembayaran gagal.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Terjadi kesalahan saat memproses pembayaran.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancel = async (isAuto = false) => {
    if (!bookingData) {
      navigate(-1);
      return;
    }
    
    if (isAuto || window.confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
      setCancelLoading(true);
      try {
        await cancelBooking(bookingData.bookingCode);
        if(isAuto) alert("Waktu pembayaran habis. Transaksi dibatalkan otomatis.");
        navigate('/');
      } catch (err) {
        setError("Gagal membatalkan pesanan.");
        setCancelLoading(false);
      }
    }
  };

  if (initLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-cine-border border-t-cine-brand rounded-full animate-spin mb-6"></div>
        <p className="text-cine-muted font-medium text-lg animate-pulse tracking-wide">Mempersiapkan transaksi Anda...</p>
      </div>
    );
  }

  if (error && !bookingData) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-lg">
        <div className="bg-cine-card border border-cine-red/30 p-10 rounded-3xl shadow-2xl">
          <div className="w-20 h-20 bg-cine-red/20 text-cine-red rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Transaksi Gagal</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={() => navigate(`/booking/${scheduleId}`)}
            className="w-full bg-cine-brand text-cine-bg font-extrabold py-3.5 rounded-xl hover:bg-cine-brand-hover transition-colors shadow-lg"
          >
            Kembali Pilih Kursi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 lg:py-16">
      
      {/* Page Title & Timer */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-cine-border pb-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-2">
            Pembayaran
          </h1>
          <p className="text-cine-muted font-medium">Selesaikan pembayaran untuk mengamankan kursi Anda.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3 bg-cine-card px-5 py-3 rounded-xl border border-cine-red/30 shadow-[0_0_15px_rgba(225,29,72,0.1)]">
          <svg className="w-5 h-5 text-cine-red animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Sisa Waktu</span>
          <span className="text-cine-red font-mono font-bold text-xl">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {error && (
        <div className="bg-cine-red/10 border border-cine-red/30 text-cine-red p-4 rounded-xl text-sm font-medium mb-8">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Kolom Kiri: Detail Pembayaran & Metode */}
        <div className="w-full lg:w-7/12 xl:w-2/3 space-y-8">
          
          <div className="bg-cine-card rounded-3xl p-8 border border-cine-border shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="w-8 h-8 rounded-full bg-cine-brand/20 text-cine-brand flex items-center justify-center mr-3 text-sm">1</span>
              Pilih Metode Pembayaran
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-300 ${
                    selectedMethod === method.id
                      ? 'border-cine-brand bg-cine-brand/5 shadow-[0_0_20px_rgba(234,179,8,0.15)] transform -translate-y-1'
                      : 'border-cine-border bg-cine-bg hover:border-slate-500 hover:bg-cine-border/30'
                  }`}
                >
                  <span className="text-4xl mb-3">{method.icon}</span>
                  <span className={`text-sm font-bold text-center ${selectedMethod === method.id ? 'text-cine-brand' : 'text-slate-300'}`}>
                    {method.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Kotak Instruksi Pembayaran */}
            <div className="bg-cine-bg rounded-2xl p-8 border border-cine-border relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-cine-brand"></div>
              
              {selectedMethod === 'BCA_VA' ? (
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-3 font-medium uppercase tracking-wider">Nomor Virtual Account</p>
                  <div className="inline-block bg-cine-card border border-cine-border rounded-xl px-8 py-4 mb-6 shadow-inner">
                    <p className="text-3xl md:text-4xl font-mono font-black text-white tracking-[0.2em]">
                      {bookingData?.paymentCode}
                    </p>
                  </div>
                  <p className="text-sm text-cine-muted max-w-md mx-auto leading-relaxed">
                    Lakukan pembayaran melalui ATM BCA, KlikBCA, atau m-BCA sebelum waktu habis.
                  </p>
                </div>
              ) : selectedMethod === 'QRIS' ? (
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-5 font-medium uppercase tracking-wider">Scan QR Code</p>
                  <div className="w-48 h-48 bg-white mx-auto rounded-2xl p-3 mb-5 shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${bookingData?.bookingCode}`} alt="QRIS" className="w-full h-full" />
                  </div>
                  <p className="text-sm text-cine-muted">Gunakan aplikasi e-Wallet atau m-Banking Anda.</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-5xl">🟢</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">Buka Aplikasi GoPay</h4>
                  <p className="text-sm text-cine-muted">Selesaikan pembayaran langsung melalui aplikasi Gojek di HP Anda.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Pesanan */}
        <div className="w-full lg:w-5/12 xl:w-1/3">
          <div className="bg-cine-card rounded-3xl p-8 border border-cine-border shadow-2xl sticky top-28">
            <h3 className="text-xl font-bold text-white mb-6 pb-4 border-b border-cine-border">Ringkasan Pesanan</h3>
            
            <div className="mb-8">
              <h4 className="font-black text-white text-xl mb-2">{scheduleDetails?.movieTitle}</h4>
              <p className="text-cine-brand text-sm font-bold mb-4">
                {scheduleDetails?.cinemaName} <span className="text-cine-muted mx-1">•</span> Studio {scheduleDetails?.studioNumber}
              </p>
              <div className="bg-cine-bg p-4 rounded-xl border border-cine-border space-y-2">
                <div className="flex items-center text-sm font-medium text-slate-300">
                  <span className="w-6 text-cine-muted">📅</span> {scheduleDetails?.showDate}
                </div>
                <div className="flex items-center text-sm font-medium text-slate-300">
                  <span className="w-6 text-cine-muted">⏰</span> {scheduleDetails?.startTime?.substring(0,5)} WIB
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Kursi</p>
                <span className="text-xs bg-cine-border text-slate-300 px-2 py-1 rounded font-bold">{selectedSeats?.length} Kursi</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSeats?.map((s) => (
                  <span key={s.seatId} className="bg-cine-bg border border-cine-border text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm">
                    {s.seatCode}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4 border-t border-cine-border pt-6 mb-8">
              <div className="flex justify-between text-sm text-slate-300 font-medium">
                <span>Subtotal Tiket</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-300 font-medium">
                <span>Biaya Layanan</span>
                <span className="text-emerald-400">Gratis</span>
              </div>
            </div>

            <div className="flex justify-between items-end bg-cine-bg -mx-8 -mb-8 p-8 rounded-b-3xl border-t border-cine-border mt-4">
              <div>
                <p className="text-sm font-semibold text-cine-muted uppercase tracking-wider mb-1">Total Tagihan</p>
                <p className="text-xs text-slate-500">Termasuk pajak</p>
              </div>
              <span className="text-3xl font-black text-cine-brand">{formatPrice(totalAmount)}</span>
            </div>
          </div>
          
          <div className="mt-8 space-y-4">
            <button
              onClick={handlePayment}
              disabled={paymentLoading || cancelLoading}
              className={`w-full font-black text-lg py-4 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 ${
                paymentLoading || cancelLoading
                  ? 'bg-cine-border text-slate-400 cursor-not-allowed'
                  : 'bg-cine-brand text-cine-bg hover:bg-cine-brand-hover shadow-[0_10px_20px_rgba(234,179,8,0.25)] hover:shadow-[0_10px_30px_rgba(234,179,8,0.4)] transform hover:-translate-y-1'
              }`}
            >
              {paymentLoading ? 'Memproses...' : 'BAYAR SEKARANG'}
            </button>
            
            <button
              onClick={() => handleCancel(false)}
              disabled={paymentLoading || cancelLoading}
              className="w-full text-slate-400 font-bold py-3 rounded-xl hover:text-cine-red hover:bg-cine-red/5 transition-all duration-200"
            >
              {cancelLoading ? 'Membatalkan...' : 'Batalkan Pesanan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;