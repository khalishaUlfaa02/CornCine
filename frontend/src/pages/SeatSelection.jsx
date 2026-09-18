import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getScheduleDetail, getStudioSeats, getOccupiedSeats } from '../api/ticketApi';

const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price || 0);

const FALLBACK_ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const FALLBACK_COLS = 10;

const SeatSelection = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [schedule, setSchedule] = useState(null);
  const [seats, setSeats] = useState([]);
  const [occupiedSeatIds, setOccupiedSeatIds] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [loading, setLoading] = useState(true);
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
        if (!schedRes.success) throw new Error('Gagal mengambil data jadwal');
        const schedData = schedRes.data;
        setSchedule(schedData);

        try {
          const occRes = await getOccupiedSeats(scheduleId);
          const occList = occRes.data?.content || occRes.data?.data || (Array.isArray(occRes.data) ? occRes.data : []);
          setOccupiedSeatIds(occList.map((s) => String(s)));
        } catch (e) {
          console.log('Occupied seats empty or error');
          setOccupiedSeatIds([]);
        }

        if (schedData.studioId) {
          try {
            const seatRes = await getStudioSeats(schedData.studioId);
            if (seatRes.success) {
              const seatList =
                seatRes.data?.content || seatRes.data?.data || (Array.isArray(seatRes.data) ? seatRes.data : []);
              setSeats(seatList);
            }
          } catch (e) {
            console.log('Studio seats empty or error');
            setSeats([]);
          }
        }
      } catch (err) {
        console.error(err);
        setError('Terjadi kesalahan saat memuat data denah kursi.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [scheduleId, user, navigate]);

  // Layout kursi: pakai data API jika ada, fallback generate A-F x 10
  const seatLayout = useMemo(() => {
    if (seats && seats.length > 0) {
      const layout = {};
      seats.forEach((seat) => {
        const row = seat.seatRow || String(seat.seatCode || '').charAt(0) || '?';
        if (!layout[row]) layout[row] = [];
        layout[row].push({
          seatId: String(seat.seatId ?? seat.id ?? seat.seatCode),
          seatCode: seat.seatCode || `${row}${seat.seatNumber}`,
          seatRow: row,
          seatNumber: seat.seatNumber,
        });
      });
      Object.keys(layout).forEach((row) => {
        layout[row].sort((a, b) => (a.seatNumber ?? 0) - (b.seatNumber ?? 0));
      });
      return Object.keys(layout)
        .sort()
        .map((row) => ({ rowLabel: row, rowSeats: layout[row] }));
    }

    return FALLBACK_ROWS.map((row) => ({
      rowLabel: row,
      rowSeats: Array.from({ length: FALLBACK_COLS }, (_, i) => {
        const num = i + 1;
        const code = `${row}${num}`;
        return { seatId: code, seatCode: code, seatRow: row, seatNumber: num };
      }),
    }));
  }, [seats]);

  const isOccupied = (seat) =>
    occupiedSeatIds.includes(String(seat.seatId)) || occupiedSeatIds.includes(String(seat.seatCode));

  const toggleSeat = (seat) => {
    if (isOccupied(seat)) return;
    setSelectedSeats((prev) => {
      const exists = prev.find((s) => String(s.seatId) === String(seat.seatId));
      if (exists) return prev.filter((s) => String(s.seatId) !== String(seat.seatId));
      return [...prev, seat];
    });
  };

  const totalPrice = selectedSeats.length * (schedule?.price || 0);

  const handleProceed = () => {
    if (selectedSeats.length === 0) return;
    navigate('/checkout', {
      state: {
        scheduleId,
        selectedSeats,
        scheduleDetails: schedule,
        totalAmount: totalPrice,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1325] pt-28 pb-32 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1325] pt-28 pb-32">
      {/* Header Info Jadwal */}
      <div className="bg-[#162238] border-b border-slate-800 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{schedule?.movieTitle || 'Pilih Kursi'}</h1>
            <p className="text-slate-400 font-medium mt-1">
              {schedule?.cinemaName} • Studio {schedule?.studioNumber} ({schedule?.studioType})
            </p>
          </div>
          <div className="bg-[#0B1325] px-4 py-2 rounded-lg border border-slate-800 text-right">
            <p className="text-xs text-slate-400 mb-0.5">Waktu Tayang</p>
            <p className="text-white font-bold text-sm">
              {schedule?.showDate} | {schedule?.startTime?.substring(0, 5)}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        </div>
      )}

      {/* Area Denah */}
      <div className="max-w-7xl mx-auto px-4 mt-12 overflow-x-auto pb-10">
        <div className="min-w-[600px] max-w-4xl mx-auto">
          {/* Layar Bioskop */}
          <div className="mb-10">
            <div className="border-t-4 border-sky-400/80 shadow-[0_-15px_30px_rgba(125,211,252,0.25)] rounded-[50%] h-6 w-3/4 mx-auto mb-2"></div>
            <p className="text-center text-xs tracking-widest text-slate-400 font-medium">LAYAR BIOSKOP</p>
          </div>

          {/* Legend */}
          <div className="flex justify-center items-center gap-6 mb-10">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md border border-slate-700 bg-slate-900/60"></div>
              <span className="text-xs font-medium text-slate-300">Tersedia</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-sky-400 text-slate-950 font-bold text-[10px] flex items-center justify-center">✓</div>
              <span className="text-xs font-medium text-slate-300">Dipilih</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-slate-800/40 border border-slate-800 text-slate-600 cursor-not-allowed"></div>
              <span className="text-xs font-medium text-slate-300">Terisi</span>
            </div>
          </div>

          {/* Grid Kursi */}
          <div className="flex flex-col gap-3">
            {seatLayout.map((row) => (
              <div key={row.rowLabel} className="flex justify-center items-center gap-3">
                <div className="w-6 text-center font-bold text-slate-400 text-sm">{row.rowLabel}</div>

                <div className="flex gap-2">
                  {row.rowSeats.map((seat, idx) => {
                    const occupied = isOccupied(seat);
                    const selected = selectedSeats.some((s) => String(s.seatId) === String(seat.seatId));

                    let btnClass =
                      'w-8 h-8 rounded-t-lg rounded-b-sm text-[10px] font-bold transition-all duration-200 border ';

                    if (occupied) {
                      btnClass += 'bg-slate-800/40 border-slate-800 text-slate-600 cursor-not-allowed';
                    } else if (selected) {
                      btnClass +=
                        'bg-sky-400 border-sky-400 text-slate-950 font-bold shadow-[0_0_10px_rgba(125,211,252,0.5)] transform scale-110';
                    } else {
                      btnClass +=
                        'border-slate-700 bg-slate-900/60 text-slate-200 hover:border-sky-400 hover:text-sky-300';
                    }

                    const isHalfway = idx === Math.floor(row.rowSeats.length / 2) - 1;

                    return (
                      <React.Fragment key={seat.seatId}>
                        <button
                          disabled={occupied}
                          onClick={() => toggleSeat(seat)}
                          className={btnClass}
                          title={occupied ? 'Terisi' : seat.seatCode}
                        >
                          {seat.seatNumber}
                        </button>
                        {isHalfway && <div className="w-6" />}
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="w-6 text-center font-bold text-slate-400 text-sm">{row.rowLabel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 py-4 px-6 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex-grow w-full md:w-auto">
            <p className="text-slate-400 text-xs font-medium mb-1">
              Kursi: {selectedSeats.length > 0 ? selectedSeats.map((s) => s.seatCode).join(', ') : '-'}
            </p>
            <p className="text-white font-bold text-base md:text-lg">Total: {formatPrice(totalPrice)}</p>
          </div>

          <button
            onClick={handleProceed}
            disabled={selectedSeats.length === 0}
            className="w-full md:w-auto bg-sky-400 text-slate-950 font-bold px-8 py-3 rounded-xl hover:bg-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Lanjut ke Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
