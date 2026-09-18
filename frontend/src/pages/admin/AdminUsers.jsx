import React, { useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, toggleUserStatus, createStaffApi } from '../../api/authApi';

const AdminUsers = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      if (res.success) {
        const userList = res.data?.content || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setUsers(userList);
      }
    } catch (error) {
      console.error('Gagal mengambil data user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, username) => {
    if (window.confirm(`Ubah status pengguna "${username}"?`)) {
      setActionLoading(userId);
      try {
        await toggleUserStatus(userId);
        fetchUsers();
      } catch (error) {
        toast.error('Gagal mengubah status: ' + (error.response?.data?.message || 'Kesalahan internal'));
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitStaff = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.fullName || !formData.email || !formData.password) {
      toast.error("Semua field wajib diisi!");
      return;
    }

    setSubmitLoading(true);
    try {
      await createStaffApi(formData);
      toast.success("Akun Staff berhasil dibuat!");
      setShowModal(false);
      setFormData({ username: '', fullName: '', email: '', password: '' });
      fetchUsers();
    } catch (error) {
      toast.error("Gagal membuat akun Staff: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cine-bg pt-28 pb-20">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center tracking-tight">
              Manajemen Pengguna
              <span className="ml-4 h-1.5 w-12 bg-sky-400 rounded-full inline-block shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
            </h1>
            <p className="text-slate-400 font-medium mt-2">Kelola status keanggotaan penonton di CornCine</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-sky-400 text-slate-950 font-bold hover:bg-sky-300 px-6 py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            + Tambah Akun Staff
          </button>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700/50">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">No</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Identitas Pengguna</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kontak</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-slate-400">
                      <div className="w-8 h-8 border-4 border-slate-700 border-t-sky-400 rounded-full animate-spin mx-auto mb-3"></div>
                      Memuat data pengguna...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-slate-400 font-medium">
                      Belum ada pengguna terdaftar
                    </td>
                  </tr>
                ) : (
                  users.map((u, index) => {
                    const isSuperAdmin = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
                    const isActive = u.status === 'ACTIVE';
                    return (
                      <tr key={u.userId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6 text-sm text-slate-500 font-medium">{index + 1}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-300 font-bold flex-shrink-0 shadow-inner overflow-hidden relative group">
                              {u.avatarUrl ? (
                                <img 
                                  src={u.avatarUrl} 
                                  alt="Avatar" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    if (e.target.nextSibling) {
                                      e.target.nextSibling.style.display = 'flex';
                                    }
                                  }}
                                />
                              ) : null}
                              <div className="w-full h-full flex items-center justify-center" style={{ display: u.avatarUrl ? 'none' : 'flex' }}>
                                {(u.fullName || u.username || '?').charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-sm">{u.username}</span>
                              <span className="text-xs text-slate-400">{u.fullName || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-medium text-slate-300">{u.email}</p>
                          <p className="text-xs text-slate-500">{u.phoneNumber || 'No phone'}</p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {isSuperAdmin ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-400/20 px-2.5 py-1 rounded-md">
                              Super Admin
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                                isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}
                            >
                              {isActive ? 'Aktif' : 'Suspend'}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {isSuperAdmin ? (
                            <span className="text-xs text-slate-500 italic">Permanen</span>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(u.userId, u.username)}
                              disabled={actionLoading === u.userId}
                              className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all duration-200 w-28 ml-auto ${
                                actionLoading === u.userId
                                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                  : isActive
                                  ? 'bg-transparent text-rose-400 border-rose-400/50 hover:bg-rose-500/10 hover:border-rose-400'
                                  : 'bg-transparent text-emerald-400 border-emerald-400/50 hover:bg-emerald-500/10 hover:border-emerald-400'
                              }`}
                            >
                              {actionLoading === u.userId ? '...' : isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tambah Staff */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl relative z-10 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#162238]/50">
              <h2 className="text-xl font-bold text-white">Tambah Akun Staff</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8">
              <form id="staffForm" onSubmit={handleSubmitStaff} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Username</label>
                  <input required type="text" name="username" value={formData.username} onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3.5 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                    placeholder="Min. 4 karakter" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Nama Lengkap</label>
                  <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3.5 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                    placeholder="Nama Staff" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Email</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3.5 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                    placeholder="email@corncine.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Password</label>
                  <input required type="password" name="password" value={formData.password} onChange={handleChange} minLength="6"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3.5 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                    placeholder="Min. 6 karakter" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-[#162238]/50">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                Batal
              </button>
              <button type="submit" form="staffForm" disabled={submitLoading}
                className={`bg-sky-400 text-slate-950 font-extrabold px-8 py-3 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transform hover:-translate-y-0.5 ${submitLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {submitLoading ? 'Menyimpan...' : 'Simpan Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUsers;


