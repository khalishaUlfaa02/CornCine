import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getScheduleDetail, getStudioSeats, getOccupiedSeats } from '../api/ticketApi';

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
        // 1. Fetch Schedule Detail (dari cinema_service via gateway)
        const schedRes = await getScheduleDetail(scheduleId);
        if (!schedRes.success) throw new Error("Gagal mengambil data jadwal");
        const schedData = schedRes.data;
        setSchedule(schedData);

        // 2. Fetch Occupied Seats (dari ticket_service)
        try {
            const occRes = await getOccupiedSeats(scheduleId);
            setOccupiedSeatIds(occRes.data || []);
        } catch(e) {
            // Abaikan jika error 404/500 (mungkin mock UUID tidak match)
            console.log("Occupied seats empty or error");
            setOccupiedSeatIds([]);
        }

        // 3. Fetch Studio Seats Layout (dari cinema_service)
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

  // Kelompokkan kursi per baris (Row A, B, C...)
  const seatLayout = useMemo(() => {
    const layout = {};
    seats.forEach((seat) => {
      if (!layout[seat.seatRow]) layout[seat.seatRow] = [];
      layout[seat.seatRow].push(seat);
    });
    // Pastikan berurutan berdasarkan nomor kursi
    Object.keys(layout).forEach((row) => {
      layout[row].sort((a, b) => a.seatNumber - b.seatNumber);
    });
    // Urutkan baris (A, B, C...)
    return Object.keys(layout).sort().map(row => ({
      rowLabel: row,
      rowSeats: layout[row]
    }));
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
    
    // Meneruskan state ke halaman checkout
    navigate('/checkout', { 
      state: { 
        scheduleId, 
        selectedSeats,
        scheduleDetails: schedule,
        totalAmount: totalPrice
      } 
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cine-baby border-t-transparent"></div>
      </div>
    );
  }

  const totalPrice = selectedSeats.length * (schedule?.price || 0);

  return (
    <div className="min-h-screen pb-32">
      {/* Header Info */}
      <div className="bg-cine-card border-b border-cine-border py-6 px-4">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{schedule?.movieTitle}</h1>
            <p className="text-cine-muted font-medium mt-1">
              {schedule?.cinemaName} • Studio {schedule?.studioNumber} ({schedule?.studioType})
            </p>
          </div>
          <div className="bg-cine-dark px-4 py-2 rounded-lg border border-cine-border text-right">
            <p className="text-xs text-cine-muted mb-0.5">Waktu Tayang</p>
            <p className="text-white font-bold text-sm">
              {schedule?.showDate} | {schedule?.startTime?.substring(0,5)}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="container mx-auto px-4 mt-6">
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        </div>
      )}

      {/* Seat Selection Area */}
      <div className="container mx-auto px-4 mt-12 overflow-x-auto pb-10">
        <div className="min-w-[600px] max-w-4xl mx-auto">
          {/* Layar Bioskop */}
          <div className="mb-16 relative">
            <div className="h-2 w-full bg-cine-baby/20 rounded-full shadow-[0_-10px_25px_rgba(125,211,252,0.3)] border-t-2 border-cine-baby mx-auto" />
            <p className="text-center text-cine-baby font-bold tracking-[0.3em] text-xs mt-3 uppercase">Layar Bioskop</p>
          </div>

          {/* Grid Kursi */}
          <div className="flex flex-col gap-3">
            {seatLayout.length === 0 ? (
              <p className="text-center text-cine-muted">Denah kursi belum tersedia untuk studio ini.</p>
            ) : (
              seatLayout.map((row) => (
                <div key={row.rowLabel} className="flex justify-center items-center gap-3">
                  <div className="w-6 text-center font-bold text-cine-muted text-sm">{row.rowLabel}</div>
                  
                  <div className="flex gap-2">
                    {row.rowSeats.map((seat) => {
                      const isOccupied = occupiedSeatIds.includes(seat.seatId) || occupiedSeatIds.includes(String(seat.seatId));
                      const isSelected = selectedSeats.some((s) => s.seatId === seat.seatId);

                      let btnClass = "w-8 h-8 rounded-t-lg rounded-b-sm text-[10px] font-bold transition-all duration-200 border ";
                      
                      if (isOccupied) {
                        btnClass += "bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed opacity-50";
                      } else if (isSelected) {
                        btnClass += "bg-cine-baby border-cine-baby text-cine-dark shadow-[0_0_10px_rgba(125,211,252,0.5)] transform scale-110";
                      } else {
                        btnClass += "bg-cine-card border-cine-border text-slate-300 hover:border-cine-baby hover:text-cine-baby";
                      }

                      return (
                        <button
                          key={seat.seatId}
                          disabled={isOccupied}
                          onClick={() => toggleSeat(seat)}
                          className={btnClass}
                          title={isOccupied ? "Terisi" : "Tersedia"}
                        >
                          {seat.seatNumber}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="w-6 text-center font-bold text-cine-muted text-sm">{row.rowLabel}</div>
                </div>
              ))
            )}
          </div>

          {/* Legend */}
          <div className="flex justify-center items-center gap-8 mt-12 pt-8 border-t border-cine-border">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-t bg-cine-card border border-cine-border"></div>
              <span className="text-xs font-medium text-slate-300">Tersedia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-t bg-cine-baby shadow-[0_0_8px_rgba(125,211,252,0.4)]"></div>
              <span className="text-xs font-medium text-slate-300">Pilihanmu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-t bg-slate-700 border border-slate-600 opacity-50"></div>
              <span className="text-xs font-medium text-slate-300">Terisi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-cine-card border-t border-cine-border p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-50">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-grow w-full md:w-auto">
            <p className="text-cine-muted text-xs font-medium mb-1">Kursi Terpilih</p>
            <p className="text-white font-bold text-sm md:text-base line-clamp-1">
              {selectedSeats.length > 0 
                ? selectedSeats.map(s => s.seatCode).join(', ') 
                : '-'}
            </p>
          </div>
          
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            <div>
              <p className="text-cine-muted text-xs font-medium mb-1">Total Harga</p>
              <p className="text-cine-baby font-extrabold text-lg md:text-xl">
                {formatPrice(totalPrice)}
              </p>
            </div>
            
            <button
              onClick={handleBooking}
              disabled={selectedSeats.length === 0 || bookingLoading}
              className={`px-6 md:px-10 py-3 rounded-xl font-bold transition-all duration-300 ${
                selectedSeats.length === 0 || bookingLoading
                  ? 'bg-cine-border text-cine-muted cursor-not-allowed'
                  : 'bg-cine-baby text-cine-dark hover:bg-cine-baby-hover shadow-[0_0_15px_rgba(125,211,252,0.3)] transform hover:-translate-y-0.5'
              }`}
            >
              {bookingLoading ? 'Memproses...' : 'Konfirmasi Kursi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;