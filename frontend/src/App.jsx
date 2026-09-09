import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import MovieDetail from './pages/MovieDetail';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import MyTickets from './pages/MyTickets';
import AdminMovies from './pages/admin/AdminMovies';
import AdminSchedules from './pages/admin/AdminSchedules';
import AdminCinemas from './pages/admin/AdminCinemas';
import AdminUsers from './pages/admin/AdminUsers';

// Komponen pelindung route (Protected Route)
const ProtectedRoute = ({ children, allowedRoles }) => {
  return (
    <AuthContext.Consumer>
      {({ user, loading }) => {
        if (loading) return null; // Bisa diganti dengan spinner/loading
        if (!user) return <Navigate to="/login" replace />;
        
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          // Jika role tidak sesuai
          if (user.role === 'STAFF') {
            return <Navigate to="/admin/movies" replace />;
          }
          return <Navigate to="/" replace />;
        }
        
        return children;
      }}
    </AuthContext.Consumer>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-sky-400/30">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Rute Publik */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth />} />
              <Route path="/movies/:movieId" element={<MovieDetail />} />
              
              {/* Rute Semi-Publik / Protected (Wajib Login) */}
              <Route path="/booking/:scheduleId" element={<ProtectedRoute><SeatSelection /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
              {/* Rute Admin (Semi-Protected) */}
              <Route path="/admin/movies" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'STAFF']}><AdminMovies /></ProtectedRoute>} />
              <Route path="/admin/schedules" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'STAFF']}><AdminSchedules /></ProtectedRoute>} />
              
              {/* Rute Super Admin Khusus */}
              <Route path="/admin/cinemas" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminCinemas /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminUsers /></ProtectedRoute>} />
            </Routes>
          </main>
          <footer className="bg-slate-900 border-t border-slate-800/60 py-10 text-center text-slate-500 mt-auto">
            <div className="container mx-auto px-6">
              <p className="font-medium text-sm tracking-wide">
                &copy; {new Date().getFullYear()} Corn<span className="text-sky-300">Cine</span>. Hak Cipta Dilindungi.
              </p>
              <p className="text-xs text-slate-600 mt-2">Didesain dengan ❤️ untuk pengalaman sinematik yang tak terlupakan.</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;