import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import CinemasPage from './pages/CinemasPage';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MovieDetail from './pages/MovieDetail';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import MyTickets from './pages/MyTickets';
import Profile from './pages/Profile';
import ErrorPage from './pages/ErrorPage';
import AdminMovies from './pages/admin/AdminMovies';
import AdminSchedules from './pages/admin/AdminSchedules';
import AdminCinemas from './pages/admin/AdminCinemas';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDashboard from './pages/admin/AdminDashboard';
import TicketValidatorPage from './pages/admin/TicketValidatorPage';

// Komponen pelindung route (Protected Route)
const ProtectedRoute = ({ children, allowedRoles }) => {
  return (
    <AuthContext.Consumer>
      {({ user, loading }) => {
        if (loading) return null;
        if (!user) return <Navigate to="/login" replace />;

        if (allowedRoles && !allowedRoles.includes(user.role)) {
          if (user.role === 'STAFF') {
            return <Navigate to="/admin" replace />;
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
        <div className="min-h-screen flex flex-col bg-cine-dark text-slate-100">
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: '#1E293B', color: '#fff', border: '1px solid #334155' },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/movies" element={<Home />} />
              <Route path="/dashboard" element={<Navigate to="/movies" replace />} />
              <Route path="/cinemas" element={<CinemasPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/movies/:movieId" element={<MovieDetail />} />
              <Route path="/booking/:scheduleId" element={<ProtectedRoute><SeatSelection /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'STAFF']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/movies" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'STAFF']}><AdminMovies /></ProtectedRoute>} />
              <Route path="/admin/schedules" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'STAFF']}><AdminSchedules /></ProtectedRoute>} />
              <Route path="/admin/validate" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'STAFF']}><TicketValidatorPage /></ProtectedRoute>} />
              <Route path="/admin/cinemas" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminCinemas /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AdminUsers /></ProtectedRoute>} />
              <Route path="/401" element={<ErrorPage code={401} />} />
              <Route path="/403" element={<ErrorPage code={403} />} />
              <Route path="/500" element={<ErrorPage code={500} />} />
              <Route path="*" element={<ErrorPage code={404} />} />
            </Routes>
          </main>
          <footer className="bg-cine-card border-t border-cine-border py-8 text-center text-cine-muted mt-auto">
            <p className="font-medium">&copy; {new Date().getFullYear()} Corn<span className="text-cine-baby">Cine</span>. All rights reserved.</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;