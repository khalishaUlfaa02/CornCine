import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordApi } from '../api/authApi';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    token: searchParams.get('token') || '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.token) {
      setError('Token reset wajib diisi (cek email Anda)');
      return;
    }
    if (!formData.newPassword || formData.newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Konfirmasi password tidak sama');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPasswordApi(formData.token, formData.newPassword);
      setSuccess(response.message || 'Kata sandi berhasil diperbarui, silakan login kembali.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Gagal terhubung ke server backend. Pastikan service auth menyala.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kesalahan pada server. Coba lagi nanti.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-16 flex items-center justify-center px-4 relative z-10">
      <div className="bg-cine-card p-10 rounded-2xl shadow-2xl w-full max-w-md border border-cine-border relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-cine-baby rounded-b-full shadow-[0_0_20px_rgba(125,211,252,0.8)]"></div>

        <h2 className="text-3xl font-extrabold text-center text-white mb-2">Reset Password</h2>
        <p className="text-center text-cine-muted mb-8 font-medium">
          Masukkan token dari email dan password baru Anda.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-200 mb-2">Token Reset</label>
            <input
              type="text"
              name="token"
              value={formData.token}
              onChange={handleChange}
              className="w-full bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 px-4 py-3 rounded-xl focus:border-sky-400 focus:ring-1 focus:ring-sky-400 focus:outline-none transition-colors"
              placeholder="Token dari email"
            />
          </div>
          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-200 mb-2">Password Baru</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 px-4 py-3 rounded-xl focus:border-sky-400 focus:ring-1 focus:ring-sky-400 focus:outline-none transition-colors"
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-200 mb-2">Konfirmasi Password Baru</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full bg-slate-900/80 border border-slate-700 text-slate-100 placeholder-slate-500 px-4 py-3 rounded-xl focus:border-sky-400 focus:ring-1 focus:ring-sky-400 focus:outline-none transition-colors"
              placeholder="Ulangi password baru"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-cine-baby text-cine-dark font-extrabold py-3.5 rounded-xl hover:bg-cine-baby-hover shadow-[0_0_15px_rgba(125,211,252,0.3)] transition-all duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Memproses...' : 'Ubah Password'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-cine-muted text-sm font-medium">
            <Link to="/login" className="hover:text-slate-300 font-semibold transition-colors">
              ← Kembali ke login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
