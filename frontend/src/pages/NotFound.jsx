import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 font-sans">
      <div className="max-w-md w-full text-center">
        {/* Büyük 404 */}
        <div className="relative mb-8">
          <p className="text-[10rem] font-black text-slate-100 dark:text-slate-900 leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/40 rounded-3xl flex items-center justify-center shadow-lg">
              <Search className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Sayfa Bulunamadı</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
          Aradığınız sayfa taşınmış, silinmiş ya da hiç mevcut olmamış olabilir.
          Ana sayfaya dönerek devam edebilirsiniz.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </button>
          <Link to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm">
            <Home className="w-4 h-4" />
            Ana Sayfaya Git
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
