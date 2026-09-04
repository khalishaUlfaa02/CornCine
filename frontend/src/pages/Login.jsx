import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { loginApi } from '../api/authApi';

const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kesalahan pada server. Coba lagi nanti.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-cine-card p-10 rounded-2xl shadow-2xl w-full max-w-md border border-cine-border relative overflow-hidden">
        {/* Glow effect in background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-cine-baby rounded-b-full shadow-[0_0_20px_rgba(125,211,252,0.8)]"></div>
        
        <h2 className="text-3xl font-extrabold text-center text-white mb-2">Welcome Back</h2>
        <p className="text-center text-cine-muted mb-8 font-medium">Masuk untuk memesan tiket nontonmu</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <label className="block text-sm font-semibold text-slate-200 mb-2">Username</label>
            <input 
              type="text" 
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3.5 rounded-xl bg-cine-dark border border-cine-border text-white focus:outline-none focus:border-cine-baby focus:ring-1 focus:ring-cine-baby/50 transition-all" 
              placeholder="Masukkan username Anda"
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
              placeholder="Masukkan password Anda"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-cine-baby text-cine-dark font-extrabold py-3.5 rounded-xl hover:bg-cine-baby-hover shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Memproses...' : 'Login to CornCine'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-cine-muted text-sm font-medium">
            Belum punya akun?{' '}
            <Link to="/register" className="text-cine-baby hover:text-cine-baby-hover font-bold transition-colors">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;