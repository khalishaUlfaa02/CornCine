import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerApi } from '../api/authApi';

const Register = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ 
    username: '', 
    fullName: '',
    email: '', 
    password: '' 
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        setSuccessMsg(response.message || 'Registrasi berhasil! Mengarahkan ke halaman login...');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.message || 'Registrasi gagal');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        // Validation errors from Spring Boot @Valid
        const errorMessages = Object.values(err.response.data.errors).join(', ');
        setError(errorMessages);
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-cine-card p-10 rounded-2xl shadow-2xl w-full max-w-md border border-cine-border relative overflow-hidden">
        {/* Glow effect in background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-cine-baby rounded-b-full shadow-[0_0_20px_rgba(125,211,252,0.8)]"></div>
        
        <h2 className="text-3xl font-extrabold text-center text-white mb-2">Create Account</h2>
        <p className="text-center text-cine-muted mb-8 font-medium">Daftar untuk menikmati film terbaik</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm font-medium text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-200 mb-2">Username</label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3.5 rounded-xl bg-cine-dark border border-cine-border text-white focus:outline-none focus:border-cine-baby focus:ring-1 focus:ring-cine-baby/50 transition-all" 
              placeholder="Min. 4 karakter"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-200 mb-2">Nama Lengkap</label>
            <input 
              type="text" 
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full p-3.5 rounded-xl bg-cine-dark border border-cine-border text-white focus:outline-none focus:border-cine-baby focus:ring-1 focus:ring-cine-baby/50 transition-all" 
              placeholder="Nama Lengkap Anda"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-200 mb-2">Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3.5 rounded-xl bg-cine-dark border border-cine-border text-white focus:outline-none focus:border-cine-baby focus:ring-1 focus:ring-cine-baby/50 transition-all" 
              placeholder="contoh@email.com"
            />
          </div>
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-200 mb-2">Password</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3.5 rounded-xl bg-cine-dark border border-cine-border text-white focus:outline-none focus:border-cine-baby focus:ring-1 focus:ring-cine-baby/50 transition-all" 
              placeholder="Min. 6 karakter"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || successMsg}
            className={`w-full bg-cine-baby text-cine-dark font-extrabold py-3.5 rounded-xl hover:bg-cine-baby-hover shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 ${(loading || successMsg) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Memproses...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-cine-muted text-sm font-medium">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-cine-baby hover:text-cine-baby-hover font-bold transition-colors">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;