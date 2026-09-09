import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getScheduleDetail, getStudioSeats, getOccupiedSeats, createBooking, createPaymentInvoice } from '../api/ticketApi';

const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const SeatSelection = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [schedule, setSchedule] = useState(null);
  const [seats, setSeats] = useState([]);
  const [occupiedSeatIds, setOccupiedSeatIds] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const schedRes = await getScheduleDetail(scheduleId);
        if (!schedRes.success) throw new Error("Gagal mengambil data jadwal");
        const schedData = schedRes.data;
        setSchedule(schedData);

        try {
            const occRes = await getOccupiedSeats(scheduleId);
            setOccupiedSeatIds(occRes.data || []);
        } catch(e) {
            console.log("Occupied seats empty or error");
            setOccupiedSeatIds([]);
        }

        if (schedData.studioId) {
          const seatRes = await getStudioSeats(schedData.studioId);
          if (seatRes.success) {
            setSeats(seatRes.data || []);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Terjadi kesalahan saat memuat data denah kursi.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [scheduleId, user, navigate]);

  const seatLayout = useMemo(() => {
    const layout = {};

    // Jika API mengembalikan data kursi (sudah di-generate oleh admin)
    if (seats && seats.length > 0) {
      seats.forEach((seat) => {
        if (!layout[seat.seatRow]) layout[seat.seatRow] = [];
        layout[seat.seatRow].push(seat);
      });
      Object.keys(layout).forEach((row) => {
        layout[row].sort((a, b) => a.seatNumber - b.seatNumber);
      });
      return Object.keys(layout).sort().map(row => ({
        rowLabel: row,
        rowSeats: layout[row]
      }));
    }

    // FALLBACK: Auto-Generate Denah Kursi Jika API Kosong
    // Baris A - F, 8 kolom (nanti akan ada spasi/aisle di tengah)
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const cols = 8;
    
    return rows.map((rLabel) => {
      const rowSeats = [];
      for (let i = 1; i <= cols; i++) {
        // Karena kita membuat data palsu (mock/fallback), kita menggunakan 
        // string gabungan row+number sebagai seatId tiruan.
        const code = `${rLabel}${i}`;
        rowSeats.push({
          seatId: code,
          seatRow: rLabel,
          seatNumber: i,
          seatCode: code,
          seatType: 'REGULAR'
        });
      }
      return {
        rowLabel: rLabel,
        rowSeats: rowSeats
      };
    });
  }, [seats]);

  const toggleSeat = (seat) => {
    const isOccupied = occupiedSeatIds.includes(seat.seatId) || occupiedSeatIds.includes(String(seat.seatId));
    if (isOccupied) return;

    setSelectedSeats((prev) => {
      const isSelected = prev.find((s) => s.seatId === seat.seatId);
      if (isSelected) {
        return prev.filter((s) => s.seatId !== seat.seatId);
      } else {
        return [...prev, seat];
      }
    });
  };

  const handleBooking = async () => {
    if (selectedSeats.length === 0) return;
    
    setBookingLoading(true);
    setError('');
    
    try {
      // 1. Create Booking Transaction
      const seatIds = selectedSeats.map((s) => s.seatId);
      const bookingRes = await createBooking(scheduleId, seatIds);
      
      if (!bookingRes.success || !bookingRes.data) {
        throw new Error(bookingRes.message || "Gagal membuat transaksi.");
      }
      
      const bookingData = bookingRes.data;
      
      // 2. Buat Invoice Xendit
      const paymentPayload = {
        bookingId: bookingData.bookingCode, // Asumsi ini order_id / kode unik
        userEmail: user.email || 'user@example.com',
        amount: totalPrice,
        description: `Tiket Nonton: ${schedule.movieTitle}`
      };
      
      const invoiceRes = await createPaymentInvoice(paymentPayload);
      
      if (invoiceRes.success && invoiceRes.data && invoiceRes.data.invoice_url) {
        // 3. Redirect ke URL Xendit
        window.location.href = invoiceRes.data.invoice_url;
      } else {
        throw new Error("Gagal menggenerate link pembayaran Xendit.");
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err.message || "Terjadi kesalahan saat memproses pesanan.");
      }
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cine-bg pt-28 pb-32 flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-sky-400 rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-400 font-medium animate-pulse">Menyiapkan studio...</p>
        </div>
      </div>
    );
  }

  const totalPrice = selectedSeats.length * (schedule?.price || 0);

  return (
    <div className="min-h-screen bg-cine-bg pt-28 pb-32">
      {/* Header Info */}
      <div className="bg-cine-card border-b border-slate-800 py-6 px-4">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{schedule?.movieTitle}</h1>
            <p className="text-slate-400 font-medium mt-1">
              {schedule?.cinemaName} <span className="mx-2">•</span> Studio {schedule?.studioNumber} <span className="mx-2 border border-slate-700 px-2 py-0.5 rounded text-xs">{schedule?.studioType}</span>
            </p>
          </div>
          <div className="bg-cine-bg px-5 py-3 rounded-xl border border-slate-800 text-right shadow-inner">
            <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Waktu Tayang</p>
            <p className="text-white font-bold text-sm">
              {schedule?.showDate} <span className="mx-2 text-sky-400">|</span> {schedule?.startTime?.substring(0,5)}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="container mx-auto px-4 mt-8">
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        </div>
      )}

      {/* Seat Selection Area */}
      <div className="container mx-auto px-4 mt-12 overflow-x-auto pb-10">
        <div className="min-w-[600px] max-w-4xl mx-auto bg-[#162238]/30 p-8 rounded-3xl border border-slate-800/60 shadow-xl">
          
          {/* Layar Bioskop Interaktif Netflix Style */}
          <div className="mb-20 text-center">
            <div className="border-t-4 border-sky-400/80 shadow-[0_-15px_30px_rgba(125,211,252,0.25)] rounded-[50%] h-6 w-3/4 mx-auto mb-2"></div>
            <p className="text-slate-400 font-bold tracking-[0.5em] text-xs uppercase">LAYAR BIOSKOP</p>
          </div>

          {/* Grid Kursi */}
          <div className="flex flex-col gap-5">
            {seatLayout.map((row) => (
              <div key={row.rowLabel} className="flex justify-center items-center gap-6">
                <div className="w-6 text-center font-bold text-slate-500 text-sm">{row.rowLabel}</div>
                
                <div className="flex gap-2.5 items-center">
                  {row.rowSeats.map((seat, index) => {
                    const isOccupied = occupiedSeatIds.includes(seat.seatId) || occupiedSeatIds.includes(String(seat.seatId));
                    const isSelected = selectedSeats.some((s) => s.seatId === seat.seatId);

                    // Design kursi gaya XXI/Netflix: Kotak rounded smooth
                    let btnClass = "w-9 h-9 rounded-t-xl rounded-b-md text-xs font-bold transition-all duration-300 flex items-center justify-center border-2 ";
                    
                    if (isOccupied) {
                      btnClass += "bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50";
                    } else if (isSelected) {
                      btnClass += "bg-sky-400 border-sky-400 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.5)] transform scale-110 -translate-y-1";
                    } else {
                      btnClass += "bg-slate-900/80 border-slate-700 text-slate-200 hover:border-sky-400 hover:text-sky-400";
                    }

                    // Aisle (Lorong tengah)
                    const isHalfway = index === Math.floor(row.rowSeats.length / 2) - 1;

                    return (
                      <React.Fragment key={seat.seatId}>
                        <button
                          disabled={isOccupied}
                          onClick={() => toggleSeat(seat)}
                          className={btnClass}
                          title={isOccupied ? "Terisi" : "Tersedia"}
                        >
                          {seat.seatNumber}
                        </button>
                        {/* Jarak lorong di tengah */}
                        {isHalfway && <div className="w-8"></div>}
                      </React.Fragment>
                    );
                  })}
                </div>
                
                <div className="w-6 text-center font-bold text-slate-500 text-sm">{row.rowLabel}</div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex justify-center items-center gap-10 mt-16 pt-8 border-t border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-t-md bg-slate-900/80 border-2 border-slate-700"></div>
              <span className="text-sm font-medium text-slate-300">Tersedia</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-t-md bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.4)] border-2 border-sky-400"></div>
              <span className="text-sm font-medium text-slate-300">Dipilih</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-t-md bg-slate-800/40 border-2 border-slate-800 opacity-50"></div>
              <span className="text-sm font-medium text-slate-400">Terisi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar / Checkout Drawer */}
      <div className="fixed bottom-0 left-0 right-0 bg-cine-card/95 backdrop-blur-xl border-t border-slate-800 p-5 shadow-[0_-15px_40px_rgba(0,0,0,0.6)] z-50 transform transition-transform duration-500">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="flex-grow w-full md:w-auto flex flex-col md:flex-row md:items-center gap-4 md:gap-12">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Kursi Terpilih</p>
              <p className="text-white font-bold text-base md:text-lg line-clamp-1">
                {selectedSeats.length > 0 
                  ? selectedSeats.map(s => s.seatCode).join(', ') 
                  : <span className="text-slate-500 italic font-normal">Belum ada kursi yang dipilih</span>}
              </p>
            </div>
            {selectedSeats.length > 0 && (
               <div className="hidden md:block h-10 w-px bg-slate-800"></div>
            )}
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Bayar</p>
              <p className="text-sky-400 font-black text-xl md:text-2xl">
                {formatPrice(totalPrice)}
              </p>
            </div>
          </div>
          
          <div className="w-full md:w-auto">
            <button
              onClick={handleBooking}
              disabled={selectedSeats.length === 0}
              className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                selectedSeats.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-sky-400 text-slate-950 hover:bg-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.3)] transform hover:-translate-y-1'
              }`}
            >
              Lanjut ke Pembayaran
              {selectedSeats.length > 0 && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SeatSelection;