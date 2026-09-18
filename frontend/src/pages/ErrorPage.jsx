import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ERROR_CONFIG = {
  401: {
    code: '401',
    title: 'Unauthorized',
    message: 'Sesi Anda telah berakhir atau Anda belum login. Silakan login terlebih dahulu.',
    action: { to: '/login', label: 'Ke Halaman Login' },
  },
  403: {
    code: '403',
    title: 'Forbidden',
    message: 'Anda tidak memiliki hak akses untuk membuka halaman ini.',
    action: { to: '/', label: 'Kembali ke Beranda' },
  },
  404: {
    code: '404',
    title: 'Not Found',
    message: 'Halaman yang Anda cari tidak ditemukan atau sudah dipindahkan.',
    action: { to: '/', label: 'Kembali ke Beranda' },
  },
  500: {
    code: '500',
    title: 'Internal Server Error',
    message: 'Terjadi kesalahan pada server. Silakan coba lagi beberapa saat.',
    action: { to: '/', label: 'Kembali ke Beranda' },
  },
};

const ErrorPage = ({ code = 404 }) => {
  const navigate = useNavigate();
  const config = ERROR_CONFIG[code] || ERROR_CONFIG[404];

  return (
    <div className="min-h-screen pt-32 pb-16 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-black text-cine-baby mb-4">{config.code}</p>
        <h1 className="text-2xl font-extrabold text-white mb-3">{config.title}</h1>
        <p className="text-cine-muted mb-8">{config.message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl bg-cine-card border border-cine-border text-slate-100 font-semibold hover:border-cine-baby transition-colors"
          >
            Kembali
          </button>
          <Link
            to={config.action.to}
            className="px-6 py-3 rounded-xl bg-cine-baby text-cine-dark font-bold hover:bg-cine-baby-hover transition-colors"
          >
            {config.action.label}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
