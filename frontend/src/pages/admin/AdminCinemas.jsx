import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCinemas, createCinema, deleteCinema, getStudiosByCinemaId, createStudio, deleteStudio } from '../../api/cinemaApi';

const STUDIO_TYPES = [
  { id: 'REGULAR_2D', name: 'Regular 2D', capacity: 120, badgeClass: 'bg-slate-800 text-slate-300 border-slate-700' },
  { id: 'IMAX', name: 'IMAX Laser', capacity: 150, badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/30' },
  { id: 'PREMIERE', name: 'Premiere VIP', capacity: 40, badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'VELVET', name: 'Velvet Suite', capacity: 24, badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
];

const AdminCinemas = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [cinemas, setCinemas] = useState([]);
  const [studiosMap, setStudiosMap] = useState({}); // { cinemaId: [studios] }
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Modals State
  const [showCinemaModal, setShowCinemaModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [selectedCinemaId, setSelectedCinemaId] = useState(null);

  // Forms
  const [cinemaForm, setCinemaForm] = useState({ name: '', city: '', address: '', phoneNumber: '' });
  const [studioForm, setStudioForm] = useState({ studioNumber: '', studioType: 'REGULAR_2D', totalSeats: 120 });

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
      navigate('/');
      return;
    }
    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const res = await getCinemas();
      if (res.success) {
        const cinemaList = res.data?.content || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setCinemas(cinemaList);
        
        // Fetch studios for all cinemas
        const newStudiosMap = {};
        for (const cinema of cinemaList) {
          try {
            const sRes = await getStudiosByCinemaId(cinema.cinemaId);
            if (sRes.success) {
               newStudiosMap[cinema.cinemaId] = sRes.data?.content || sRes.data?.data || (Array.isArray(sRes.data) ? sRes.data : []);
            }
          } catch(e) {
            newStudiosMap[cinema.cinemaId] = [];
          }
        }
        setStudiosMap(newStudiosMap);
      }
    } catch (error) {
      console.error("Gagal mengambil data bioskop:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Cinema Handlers ---
  const handleCinemaSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await createCinema(cinemaForm);
      alert("Bioskop berhasil ditambahkan!");
      setShowCinemaModal(false);
      setCinemaForm({ name: '', city: '', address: '', phoneNumber: '' });
      fetchAllData();
    } catch (error) {
      alert("Gagal menambah bioskop: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteCinema = async (id, name) => {
    if (window.confirm(`Hapus bioskop "${name}" beserta seluruh studionya?`)) {
      try {
        await deleteCinema(id);
        fetchAllData();
      } catch (error) {
        alert("Gagal menghapus bioskop");
      }
    }
  };

  // --- Studio Handlers ---
  const handleOpenStudioModal = (cinemaId) => {
    setSelectedCinemaId(cinemaId);
    setStudioForm({ studioNumber: '', studioType: 'REGULAR_2D', totalSeats: 120 });
    setShowStudioModal(true);
  };

  const handleStudioTypeChange = (e) => {
    const type = e.target.value;
    const defaultCapacity = STUDIO_TYPES.find(t => t.id === type)?.capacity || 120;
    setStudioForm({ ...studioForm, studioType: type, totalSeats: defaultCapacity });
  };

  const handleStudioSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        cinemaId: selectedCinemaId,
        studioNumber: parseInt(studioForm.studioNumber),
        studioType: studioForm.studioType,
        totalSeats: parseInt(studioForm.totalSeats)
      };
      await createStudio(payload);
      alert("Studio berhasil ditambahkan!");
      setShowStudioModal(false);
      fetchAllData();
    } catch (error) {
      alert("Gagal menambah studio: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteStudio = async (id, num) => {
    if (window.confirm(`Hapus Studio ${num}?`)) {
      try {
        await deleteStudio(id);
        fetchAllData();
      } catch (error) {
        alert("Gagal menghapus studio");
      }
    }
  };

  const getStudioBadge = (typeId) => {
    const typeObj = STUDIO_TYPES.find(t => t.id === typeId) || STUDIO_TYPES[0];
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeObj.badgeClass}`}>{typeObj.name}</span>;
  };

  return (
    <div className="min-h-screen bg-cine-bg pt-28 pb-20">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center tracking-tight">
              Manajemen Bioskop & Studio
              <span className="ml-4 h-1.5 w-12 bg-sky-400 rounded-full inline-block shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
            </h1>
            <p className="text-slate-400 font-medium mt-2">Kelola daftar cabang (mall) dan tata letak studio penayangan</p>
          </div>
          <button 
            onClick={() => setShowCinemaModal(true)}
            className="bg-sky-400 text-slate-950 font-extrabold hover:bg-sky-300 px-6 py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            + Tambah Cabang Bioskop
          </button>
        </div>

        {/* Loading / Empty State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-sky-400 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-medium animate-pulse">Memuat daftar bioskop...</p>
          </div>
        ) : cinemas.length === 0 ? (
          <div className="text-center py-24 bg-[#162238]/60 border border-slate-800 rounded-3xl">
            <h2 className="text-2xl font-bold text-slate-300 mb-2">Belum ada cabang bioskop</h2>
            <p className="text-slate-500">Mulai dengan menambahkan bioskop baru Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {cinemas.map(cinema => {
              const cStudios = studiosMap[cinema.cinemaId] || [];
              return (
                <div key={cinema.cinemaId} className="bg-[#162238] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col hover:border-slate-700 transition-all duration-300">
                  
                  {/* Cinema Header Info */}
                  <div className="p-6 border-b border-slate-800/80 bg-slate-900/40 relative">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-white pr-4 leading-tight">{cinema.name}</h3>
                      <button 
                        onClick={() => handleDeleteCinema(cinema.cinemaId, cinema.name)}
                        className="text-rose-400 hover:text-rose-300 bg-rose-500/10 p-2 rounded-lg hover:bg-rose-500/20 transition-colors"
                        title="Hapus Bioskop"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 text-sm text-slate-400 font-medium">
                      <p className="flex items-center gap-2"><span className="text-slate-500">📍</span> {cinema.address}, {cinema.city}</p>
                      <p className="flex items-center gap-2"><span className="text-slate-500">📞</span> {cinema.phoneNumber || '-'}</p>
                    </div>

                    <div className="absolute bottom-6 right-6 flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                      <span className="text-sky-400 font-bold text-lg leading-none">{cStudios.length}</span>
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wide leading-none pt-0.5">Studio</span>
                    </div>
                  </div>

                  {/* Studio List */}
                  <div className="p-6 flex-grow bg-[#162238]/60">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Daftar Studio</h4>
                      <button 
                        onClick={() => handleOpenStudioModal(cinema.cinemaId)}
                        className="text-xs font-bold text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-lg hover:bg-sky-500/20 border border-sky-500/20 transition-all flex items-center gap-1"
                      >
                        <span>+</span> Tambah Studio
                      </button>
                    </div>

                    {cStudios.length === 0 ? (
                      <p className="text-sm text-slate-500 italic py-4 text-center bg-slate-900/30 rounded-xl border border-slate-800 border-dashed">Belum ada studio di bioskop ini.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {cStudios.sort((a,b) => a.studioNumber - b.studioNumber).map(studio => (
                          <div key={studio.studioId} className="flex items-center justify-between bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-[#162238] border border-slate-700 flex items-center justify-center font-bold text-white text-lg">
                                {studio.studioNumber}
                              </div>
                              <div className="flex flex-col gap-1">
                                {getStudioBadge(studio.studioType)}
                                <span className="text-xs text-slate-400 font-medium">{studio.totalSeats} Kursi</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteStudio(studio.studioId, studio.studioNumber)}
                              className="text-slate-500 hover:text-rose-400 transition-colors p-2"
                              title="Hapus Studio"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH BIOSKOP */}
      {showCinemaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowCinemaModal(false)}></div>
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl relative z-10 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#162238]/50">
              <h2 className="text-xl font-bold text-white">Tambah Cabang Bioskop</h2>
              <button onClick={() => setShowCinemaModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8">
              <form id="cinemaForm" onSubmit={handleCinemaSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Nama Bioskop</label>
                  <input required type="text" value={cinemaForm.name} onChange={e => setCinemaForm({...cinemaForm, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3.5 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                    placeholder="Contoh: CornCine Grand Mall" />
                </div>
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Kota</label>
                    <input required type="text" value={cinemaForm.city} onChange={e => setCinemaForm({...cinemaForm, city: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3.5 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                      placeholder="Contoh: Jakarta" />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">No. Telp (Opsional)</label>
                    <input type="text" value={cinemaForm.phoneNumber} onChange={e => setCinemaForm({...cinemaForm, phoneNumber: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3.5 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                      placeholder="Contoh: 021-1234567" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Alamat Lengkap</label>
                  <textarea required value={cinemaForm.address} onChange={e => setCinemaForm({...cinemaForm, address: e.target.value})} rows="3"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3.5 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/50 transition-all font-medium resize-none" 
                    placeholder="Masukkan alamat lengkap..." />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-[#162238]/50">
              <button type="button" onClick={() => setShowCinemaModal(false)} className="px-5 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                Batal
              </button>
              <button type="submit" form="cinemaForm" disabled={submitLoading}
                className={`bg-sky-400 text-slate-950 font-extrabold px-8 py-3 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transform hover:-translate-y-0.5 ${submitLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {submitLoading ? 'Menyimpan...' : 'Simpan Bioskop'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH STUDIO */}
      {showStudioModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowStudioModal(false)}></div>
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl relative z-10 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#162238]/50">
              <h2 className="text-xl font-bold text-white">Tambah Studio Baru</h2>
              <button onClick={() => setShowStudioModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8">
              <form id="studioForm" onSubmit={handleStudioSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Tipe Studio</label>
                  <div className="grid grid-cols-2 gap-3">
                    {STUDIO_TYPES.map(type => (
                      <label key={type.id} className={`cursor-pointer border rounded-xl p-3 flex flex-col gap-1 transition-all ${
                        studioForm.studioType === type.id 
                          ? 'border-sky-400 bg-sky-500/10 shadow-[0_0_10px_rgba(56,189,248,0.2)]' 
                          : 'border-slate-800 bg-slate-950 hover:border-slate-600'
                      }`}>
                        <input type="radio" name="studioType" value={type.id} checked={studioForm.studioType === type.id} onChange={handleStudioTypeChange} className="hidden" />
                        <span className="font-bold text-sm text-white">{type.name}</span>
                        <span className="text-xs text-slate-500 font-medium">~{type.capacity} Kursi</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Nomor Studio</label>
                    <input required type="number" min="1" value={studioForm.studioNumber} onChange={e => setStudioForm({...studioForm, studioNumber: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/50 transition-all font-medium text-center text-lg" 
                      placeholder="1" />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Kapasitas Kursi</label>
                    <input required type="number" min="1" value={studioForm.totalSeats} onChange={e => setStudioForm({...studioForm, totalSeats: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/50 transition-all font-medium text-center text-lg" />
                  </div>
                </div>
                
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                  <span className="text-amber-500 text-xl leading-none">💡</span>
                  <p className="text-xs text-amber-400/80 font-medium leading-relaxed">
                    Setelah studio ini disimpan, seluruh layout kursi otomatis digenerate oleh sistem sesuai dengan total kapasitas yang Anda tentukan.
                  </p>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-[#162238]/50">
              <button type="button" onClick={() => setShowStudioModal(false)} className="px-5 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                Batal
              </button>
              <button type="submit" form="studioForm" disabled={submitLoading}
                className={`bg-sky-400 text-slate-950 font-extrabold px-8 py-3 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transform hover:-translate-y-0.5 ${submitLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {submitLoading ? 'Menyimpan...' : 'Simpan Studio'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCinemas;