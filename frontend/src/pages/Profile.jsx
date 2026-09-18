import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../api/authApi';
import { uploadFile } from '../api/movieApi';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    avatarUrl: ''
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await getMyProfile();
        if (res.success && res.data) {
          const profile = res.data;
          setFormData({
            fullName: profile.fullName || '',
            phoneNumber: profile.phoneNumber || '',
            avatarUrl: profile.avatarUrl || ''
          });
          setPreviewAvatar(profile.avatarUrl || '');
        }
      } catch (err) {
        setError('Gagal memuat profil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let finalAvatarUrl = formData.avatarUrl;

      if (avatarFile) {
        const fileData = new FormData();
        fileData.append('file', avatarFile);
        const uploadRes = await uploadFile(fileData);
        // Backend membalas {success/status, data: {fileUrl}} — baca semua varian bentuknya
        const ok = uploadRes.success || (typeof uploadRes.status === 'number' && uploadRes.status >= 200 && uploadRes.status < 300);
        const fileUrl = uploadRes.data?.fileUrl || uploadRes.data?.data?.fileUrl || uploadRes.data?.fileName;
        if (!ok || !fileUrl) {
          throw new Error(uploadRes.message || 'Upload foto gagal. Coba lagi.');
        }
        finalAvatarUrl = fileUrl;
      }

      const payload = {
        ...formData,
        avatarUrl: finalAvatarUrl
      };

      const updateRes = await updateMyProfile(payload);
      if (updateRes.success) {
        setSuccess('Profil berhasil diperbarui!');
        // Update context with new fullName
        const currentToken = localStorage.getItem('token');
        login(currentToken, { ...user, fullName: payload.fullName, avatarUrl: payload.avatarUrl });
      } else {
        setError(updateRes.message || 'Gagal memperbarui profil');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan sistem');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] pt-32 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-sky-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] pt-28 pb-20">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <div className="bg-[#1E293B] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          
          <div className="h-32 bg-gradient-to-r from-sky-900 to-slate-900 border-b border-slate-800 relative">
            {/* Avatar positioned halfway */}
            <div className="absolute -bottom-12 left-8">
              <div className="relative group w-24 h-24 rounded-full border-4 border-[#1E293B] bg-slate-800 overflow-hidden shadow-xl">
                {previewAvatar ? (
                  <img src={previewAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sky-400 text-3xl font-black">
                    {(formData.fullName || user.username || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="text-[10px] text-white font-bold mt-1">Ubah</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-16 px-8 pb-8">
            <h2 className="text-2xl font-black text-white mb-1">{user.username}</h2>
            <p className="text-slate-400 text-sm mb-8">{user.email}</p>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm font-medium mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm font-medium mb-6">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Nama Lengkap</label>
                <input 
                  type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                  className="w-full px-5 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                  placeholder="Nama sesuai KTP"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Nomor Handphone</label>
                <input 
                  type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
                  className="w-full px-5 py-3 rounded-xl bg-slate-950/50 border border-slate-800 text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                  placeholder="Contoh: 08123456789"
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit" disabled={saving}
                  className={`bg-sky-400 text-slate-950 font-extrabold px-8 py-3.5 rounded-xl hover:bg-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] transition-all duration-300 transform hover:-translate-y-0.5 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;