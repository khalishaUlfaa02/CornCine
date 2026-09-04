import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-cine-card border-b border-cine-border py-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        
        {/* Brand Logo */}
        <Link to="/" className="text-2xl font-extrabold tracking-wide text-white">
          <span className="text-cine-baby text-3xl leading-none align-middle mr-1">🍿</span>
          Corn<span className="text-cine-baby">Cine</span>
        </Link>
        
        {/* Navigation Links */}
        <div className="flex items-center space-x-8">
          <Link 
            to="/" 
            className={`font-medium transition-colors ${
              isActive('/') 
                ? 'text-cine-baby border-b-2 border-cine-baby pb-1' 
                : 'text-slate-100 hover:text-cine-baby-soft'
            }`}
          >
            Movies
          </Link>
          
          {user ? (
            <>
              <Link 
                to="/my-tickets" 
                className={`font-medium transition-colors ${
                  isActive('/my-tickets') 
                    ? 'text-cine-baby border-b-2 border-cine-baby pb-1' 
                    : 'text-slate-100 hover:text-cine-baby-soft'
                }`}
              >
                My Tickets
              </Link>
              <div className="h-6 w-px bg-cine-border"></div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-cine-baby-soft bg-cine-dark px-3 py-1.5 rounded-full border border-cine-border">
                  Hi, {user.fullName || user.username}
                </span>
                <button 
                  onClick={logout} 
                  className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link 
              to="/login" 
              className="bg-cine-baby hover:bg-cine-baby-hover text-cine-dark px-6 py-2 rounded-lg font-bold shadow-[0_0_15px_rgba(125,211,252,0.3)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;