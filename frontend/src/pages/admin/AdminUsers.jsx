import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, toggleUserStatus } from '../../api/authApi';

const AdminUsers = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    // Basic protection (Only SUPER_ADMIN / ADMIN)
    if (!user || user.role !== 'ADMIN') {
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
      console.error("Gagal mengambil data user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus, username) => {
    if (window.confirm(`Apakah Anda yakin ingin mengubah status pengguna "${username}"?`)) {
      setActionLoading(userId);
      try {
        await toggleUserStatus(userId);
        fetchUsers();
      } catch (error) {
        alert("Gagal mengubah status pengguna: " + (error.response?.data?.message || "Kesalahan internal"));
      } finally {
        setActionLoading(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-cine-bg pt-28 pb-20">
      <div className="container mx-auto px-6 max-w-5xl">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-white flex items-center tracking-tight">
            Manajemen Pengguna
            <span className="ml-4 h-1.5 w-12 bg-sky-400 rounded-full inline-block shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
          </h1>
          <p className="text-slate-400 font-medium mt-2">Kelola status keanggotaan penonton di CornCine</p>
        </div>

        {/* Table Container */}
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
                    <td colSpan="5" className="py-16 text-center text-slate-400 font-medium">Belum ada pengguna terdaftar</td>
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
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-300 font-bold flex-shrink-0 shadow-inner">
                              {(u.fullName || u.username).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-sm flex items-center gap-2">
                                {u.username}
                                {isSuperAdmin && (
                                  <svg className="w-3.5 h-3.5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477 6.237 7.982l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </span>
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
                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-400/20 px-2.5 py-1 rounded-md">Super Admin</span>
                          ) : (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                              isActive 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {isActive ? 'Aktif' : 'Suspend'}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {isSuperAdmin ? (
                            <span className="text-xs text-slate-500 italic">Permanen</span>
                          ) : (
                            <button 
                              onClick={() => handleToggleStatus(u.userId, u.status, u.username)}
                              disabled={actionLoading === u.userId}
                              className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all duration-200 flex items-center justify-center w-28 ml-auto ${
                                actionLoading === u.userId 
                                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                  : isActive 
                                    ? 'bg-transparent text-rose-400 border-rose-400/50 hover:bg-rose-500/10 hover:border-rose-400' 
                                    : 'bg-transparent text-emerald-400 border-emerald-400/50 hover:bg-emerald-500/10 hover:border-emerald-400'
                              }`}
                            >
                              {actionLoading === u.userId ? '...' : (isActive ? 'Nonaktifkan' : 'Aktifkan')}
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
    </div>
  );
};

export default AdminUsers;