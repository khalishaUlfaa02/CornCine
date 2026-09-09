import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getMovies } from '../../api/movieApi';
import { 
  getAllSchedules, 
  createSchedule, 
  deleteSchedule, 
  getCinemas, 
  getStudiosByCinema 
} from '../../api/scheduleApi';

const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

const AdminSchedules = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [studios, setStudios] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    movieId: '',
    cinemaId: '',
    studioId: '',
    showDate: '',
    startTime: '',
    price: ''
  });

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedRes, movieRes, cinemaRes] = await Promise.all([
        getAllSchedules(0, 100),
        getMovies(0, 100),
        getCinemas()
      ]);

      if (schedRes.success) {
        const schedList = schedRes.data?.content || schedRes.data?.data || (Array.isArray(schedRes.data) ? schedRes.data : []);
        setSchedules(schedList);
      }
      
      if (movieRes.success) {
        const movieList = movieRes.data?.content || movieRes.data?.data || (Array.isArray(movieRes.data) ? movieRes.data : []);
        setMovies(movieList);
      }

      if (cinemaRes.success) {
        const cinemaList = cinemaRes.data?.content || cinemaRes.data?.data || (Array.isArray(cinemaRes.data) ? cinemaRes.data : []);
        setCinemas(cinemaList);
      }
    } catch (error) {
      console.error("Gagal mengambil data jadwal:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCinemaChange = async (e) => {
    const selectedCinemaId = e.target.value;
    setFormData(prev => ({ ...prev, cinemaId: selectedCinemaId, studioId: '' }));
    setStudios([]);

    if (selectedCinemaId) {
      try {
        const res = await getStudiosByCinema(selectedCinemaId);
        if (res.success) {
          const studioList = res.data?.content || res.data?.data || (Array.isArray(res.data) ? res.data : []);
          setStudios(studioList);
        }
      } catch (err) {
        console.error("Gagal load studio:", err);
      }
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOpenModal = () => {
    setFormData({
      movieId: '',
      cinemaId: '',
      studioId: '',
      showDate: '',
      startTime: '',
      price: ''
    });
    setStudios([]);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.movieId || !formData.studioId || !formData.showDate || !formData.startTime || !formData.price) {
      alert("Semua field wajib diisi!");
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        movieId: parseInt(formData.movieId),
        studioId: parseInt(formData.studioId),
        showDate: formData.showDate,
        startTime: formData.startTime + ':00', // Format local time HH:mm:ss
        price: parseFloat(formData.price)
      };

      await createSchedule(payload);
      alert("Jadwal berhasil ditambahkan!");
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert("Gagal menambah jadwal: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      try {
        await deleteSchedule(id);
        fetchData();
      } catch (error) {
        alert("Gagal menghapus jadwal.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-cine-bg pt-28 pb-20">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center">
              Manajemen Jadwal Tayang
              <span className="ml-4 h-1 w-12 bg-sky-400 rounded-full inline-block shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
            </h1>
            <p className="text-slate-400 font-medium mt-2">Kelola jadwal penayangan film untuk seluruh studio</p>
          </div>
          <button 
            onClick={handleOpenModal}
            className="bg-sky-400 text-slate-950 font-bold hover:bg-sky-300 px-6 py-3 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            + Buat Jadwal Baru
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700/50">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Film</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Lokasi Studio</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Waktu Tayang</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Harga</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      <div className="w-8 h-8 border-4 border-slate-700 border-t-sky-400 rounded-full animate-spin mx-auto mb-3"></div>
                      Memuat jadwal...
                    </td>
                  </tr>
                ) : schedules.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">Belum ada jadwal tayang</td>
                  </tr>
                ) : (
                  schedules.map((sched) => (
                    <tr key={sched.scheduleId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-white text-base">{sched.movieTitle}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium text-slate-300">{sched.cinemaName}</p>
                        <p className="text-xs text-slate-500">Studio {sched.studioNumber} ({sched.studioType})</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium text-white">{sched.showDate}</p>
                        <p className="text-xs text-sky-400 font-semibold">{sched.startTime?.substring(0,5)} - {sched.endTime?.substring(0,5)}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-bold text-amber-400">{formatPrice(sched.price)}</p>
                      </td>
                      <td className="py-4 px-6 text-right space-x-3">
                        <button 
                          onClick={() => handleDelete(sched.scheduleId)}
                          className="text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form Tambah Jadwal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl relative z-10 flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-white">Buat Jadwal Baru</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="schedForm" onSubmit={handleSubmit} className="space-y-5">
                
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-1.5">Film</label>
                  <select required name="movieId" value={formData.movieId} onChange={handleChange}
                    className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors appearance-none">
                    <option value="" disabled>-- Pilih Film --</option>
                    {movies.map(m => <option key={m.movieId} value={m.movieId}>{m.title}</option>)}
                  </select>
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Bioskop</label>
                    <select required name="cinemaId" value={formData.cinemaId} onChange={handleCinemaChange}
                      className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors appearance-none">
                      <option value="" disabled>-- Pilih Bioskop --</option>
                      {cinemas.map(c => <option key={c.cinemaId} value={c.cinemaId}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="w-1/2">
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Studio</label>
                    <select required name="studioId" value={formData.studioId} onChange={handleChange} disabled={!formData.cinemaId}
                      className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors appearance-none disabled:opacity-50">
                      <option value="" disabled>-- Pilih Studio --</option>
                      {studios.map(s => <option key={s.studioId} value={s.studioId}>Studio {s.studioNumber} ({s.studioType})</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Tanggal</label>
                    <input required type="date" name="showDate" value={formData.showDate} onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors [color-scheme:dark]" />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Jam Tayang</label>
                    <input required type="time" name="startTime" value={formData.startTime} onChange={handleChange}
                      className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors [color-scheme:dark]" />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5">Harga Tiket</label>
                    <input required type="number" name="price" value={formData.price} onChange={handleChange} min="1000" step="1000" placeholder="Rp"
                      className="w-full bg-slate-950/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:border-sky-400 focus:outline-none transition-colors" />
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 shrink-0 bg-slate-900/50 rounded-b-3xl">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors">
                Batal
              </button>
              <button type="submit" form="schedForm" disabled={submitLoading}
                className={`bg-sky-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transform hover:-translate-y-0.5 ${submitLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {submitLoading ? 'Menyimpan...' : 'Simpan Jadwal'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSchedules;