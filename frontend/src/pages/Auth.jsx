import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { loginApi, registerApi } from '../api/authApi';

const Auth = () => {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'login' atau 'register'
  const [mode, setMode] = useState(location.pathname === '/register' ? 'register' : 'login');

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Jika sudah login, redirect ke halaman utama
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Update mode based on navigation history if needed
  useEffect(() => {
    if (location.pathname === '/register') setMode('register');
    else if (location.pathname === '/login') setMode('login');
  }, [location.pathname]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setSuccessMsg('');
    setFormData({ username: '', fullName: '', email: '', password: '' });
    // Update URL quietly
    window.history.replaceState(null, '', `/${newMode}`);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.username || !formData.password) {
      setError('Username dan password wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const response = await loginApi(formData.username, formData.password);
      if (response.success && response.data) {
        const { token, ...userData } = response.data;
        login(token, userData);
        navigate('/');
      } else {
        setError(response.message || 'Login gagal');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan pada server. Coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    if (!formData.username || !formData.fullName || !formData.email || !formData.password) {
      setError('Semua field wajib diisi');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    try {
      const response = await registerApi(formData);
      if (response.success) {
        setSuccessMsg(response.message || 'Registrasi berhasil! Silakan masuk.');
        setTimeout(() => {
          switchMode('login');
        }, 2000);
      } else {
        setError(response.message || 'Registrasi gagal');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(Object.values(err.response.data.errors).join(', '));
      } else {
        setError(err.response?.data?.message || 'Terjadi kesalahan pada server. Coba lagi nanti.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-16 flex items-center justify-center px-4 relative overflow-hidden">
      
      {/* Ambient Glow Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl relative z-10 overflow-hidden">
        
        {/* Container for forms */}
        <div className="relative w-full">
          
          {/* ============================== */}
          {/* LOGIN FORM */}
          {/* ============================== */}
          <div 
            className={`w-full p-8 sm:p-10 transition-all duration-500 ease-in-out ${
              mode === 'login' 
                ? 'opacity-100 translate-x-0 relative pointer-events-auto' 
                : 'opacity-0 -translate-x-12 absolute top-0 left-0 pointer-events-none'
            }`}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Selamat Datang</h2>
              <p className="text-slate-400 text-sm font-medium">Masuk untuk memesan tiket nontonmu</p>
            </div>

            {/* Notifications */}
            {mode === 'login' && error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm font-medium text-center animate-fade-in">
                {error}
              </div>
            )}
            {mode === 'login' && successMsg && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium text-center animate-fade-in">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Username</label>
                  <input 
                    type="text" name="username" value={formData.username} onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                    placeholder="Masukkan username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Password</label>
                  <input 
                    type="password" name="password" value={formData.password} onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                    placeholder="Masukkan password"
                  />
                </div>
              </div>
              <button 
                type="submit" disabled={loading}
                className={`w-full bg-sky-400 text-slate-950 font-extrabold py-4 mb-2 rounded-xl hover:bg-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Memproses...' : 'Masuk ke CornCine'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-400 text-sm font-medium">
                Belum punya akun?{' '}
                <button onClick={() => switchMode('register')} className="text-sky-400 hover:text-sky-300 font-bold transition-colors">
                  Daftar sekarang
                </button>
              </p>
            </div>
          </div>

          {/* ============================== */}
          {/* REGISTER FORM */}
          {/* ============================== */}
          <div 
            className={`w-full p-8 sm:p-10 transition-all duration-500 ease-in-out ${
              mode === 'register' 
                ? 'opacity-100 translate-x-0 relative pointer-events-auto' 
                : 'opacity-0 translate-x-12 absolute top-0 left-0 pointer-events-none'
            }`}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Buat Akun Baru</h2>
              <p className="text-slate-400 text-sm font-medium">Bergabunglah dengan pengalaman sinematik kami</p>
            </div>

            {/* Notifications */}
            {mode === 'register' && error && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm font-medium text-center animate-fade-in">
                {error}
              </div>
            )}
            {mode === 'register' && successMsg && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium text-center animate-fade-in">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Username</label>
                  <input 
                    type="text" name="username" value={formData.username} onChange={handleChange}
                    className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                    placeholder="Min. 4 karakter"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Nama Lengkap</label>
                  <input 
                    type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                    className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                    placeholder="Sesuai identitas"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Email</label>
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                    placeholder="email@contoh.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Password</label>
                  <input 
                    type="password" name="password" value={formData.password} onChange={handleChange}
                    className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 transition-all font-medium" 
                    placeholder="Min. 6 karakter"
                  />
                </div>
              </div>
              <button 
                type="submit" disabled={loading || successMsg}
                className={`w-full bg-sky-400 text-slate-950 font-extrabold py-4 mb-2 rounded-xl hover:bg-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 ${(loading || successMsg) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Memproses...' : 'Daftar Sekarang'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-400 text-sm font-medium">
                Sudah punya akun?{' '}
                <button onClick={() => switchMode('login')} className="text-sky-400 hover:text-sky-300 font-bold transition-colors">
                  Masuk di sini
                </button>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;