import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/60 shadow-lg' 
          : 'bg-gradient-to-b from-slate-950/90 to-transparent border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
        
        {/* Bagian Kiri: Brand Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center group">
            <span className="text-sky-300 mr-2 transform group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(125,211,252,0.5)]">🍿</span>
            Corn<span className="text-sky-300">Cine</span>
          </Link>
        </div>
        
        {/* Bagian Tengah: Navigation Links (Terkumpul) */}
        <div className="hidden lg:flex flex-1 items-center justify-center gap-6">
          <Link 
            to="/" 
            className={`font-semibold tracking-wide transition-all duration-300 relative group text-sm ${
              isActive('/') ? 'text-sky-300' : 'text-slate-300 hover:text-white'
            }`}
          >
            Beranda
            <span className={`absolute -bottom-1.5 left-0 h-0.5 bg-sky-300 rounded-full transition-all duration-300 ${isActive('/') ? 'w-full' : 'w-0 group-hover:w-1/2'}`}></span>
          </Link>
          
          {user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'STAFF') ? (
            <>
              <Link 
                to="/admin/movies" 
                className={`font-semibold tracking-wide transition-all duration-300 relative group text-sm ${
                  isActive('/admin/movies') ? 'text-sky-300' : 'text-slate-300 hover:text-white'
                }`}
              >
                Kelola Film
                <span className={`absolute -bottom-1.5 left-0 h-0.5 bg-sky-300 rounded-full transition-all duration-300 ${isActive('/admin/movies') ? 'w-full' : 'w-0 group-hover:w-1/2'}`}></span>
              </Link>
              <Link 
                to="/admin/schedules" 
                className={`font-semibold tracking-wide transition-all duration-300 relative group text-sm ${
                  isActive('/admin/schedules') ? 'text-sky-300' : 'text-slate-300 hover:text-white'
                }`}
              >
                Kelola Jadwal
                <span className={`absolute -bottom-1.5 left-0 h-0.5 bg-sky-300 rounded-full transition-all duration-300 ${isActive('/admin/schedules') ? 'w-full' : 'w-0 group-hover:w-1/2'}`}></span>
              </Link>
              
              {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                <>
                  <Link 
                    to="/admin/cinemas" 
                    className={`font-semibold tracking-wide transition-all duration-300 relative group text-sm ${
                      isActive('/admin/cinemas') ? 'text-sky-300' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Kelola Bioskop
                    <span className={`absolute -bottom-1.5 left-0 h-0.5 bg-sky-300 rounded-full transition-all duration-300 ${isActive('/admin/cinemas') ? 'w-full' : 'w-0 group-hover:w-1/2'}`}></span>
                  </Link>
                  <Link 
                    to="/admin/users" 
                    className={`font-semibold tracking-wide transition-all duration-300 relative group text-sm ${
                      isActive('/admin/users') ? 'text-sky-300' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Kelola User
                    <span className={`absolute -bottom-1.5 left-0 h-0.5 bg-sky-300 rounded-full transition-all duration-300 ${isActive('/admin/users') ? 'w-full' : 'w-0 group-hover:w-1/2'}`}></span>
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link 
                to="/dashboard" 
                className={`font-semibold tracking-wide transition-all duration-300 relative group text-sm ${
                  isActive('/dashboard') ? 'text-sky-300' : 'text-slate-300 hover:text-white'
                }`}
              >
                Sedang Tayang
                <span className={`absolute -bottom-1.5 left-0 h-0.5 bg-sky-300 rounded-full transition-all duration-300 ${isActive('/dashboard') ? 'w-full' : 'w-0 group-hover:w-1/2'}`}></span>
              </Link>

              <Link 
                to="#" 
                className="font-semibold tracking-wide text-slate-300 hover:text-white transition-colors relative group text-sm"
              >
                Bioskop
                <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-sky-300 rounded-full transition-all duration-300 group-hover:w-1/2"></span>
              </Link>
              
              {user && (
                <Link 
                  to="/my-tickets" 
                  className={`font-semibold tracking-wide transition-all duration-300 relative group text-sm ${
                    isActive('/my-tickets') ? 'text-sky-300' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Tiket Saya
                  <span className={`absolute -bottom-1.5 left-0 h-0.5 bg-sky-300 rounded-full transition-all duration-300 ${isActive('/my-tickets') ? 'w-full' : 'w-0 group-hover:w-1/2'}`}></span>
                </Link>
              )}
            </>
          )}
        </div>
        
        {/* Bagian Kanan: User Actions */}
        <div className="flex-shrink-0 flex items-center">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-300 font-bold shadow-inner">
                {(user.fullName || user.username).charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-semibold text-slate-200 leading-tight">
                  {user.fullName || user.username}
                </span>
                <button 
                  onClick={logout} 
                  className="text-left text-[10px] font-medium text-slate-500 hover:text-rose-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="border border-sky-400/40 text-sky-300 hover:bg-sky-400/10 hover:border-sky-300 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:-translate-y-0.5 shadow-[0_0_15px_rgba(125,211,252,0.1)] hover:shadow-[0_0_20px_rgba(125,211,252,0.2)]"
            >
              Masuk
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;