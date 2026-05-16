import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('E-posta adresi zorunludur'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Geçerli bir e-posta adresi girin'); return; }
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      if (data.success) { toast.success(data.message); setIsSent(true); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'E-posta gönderilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full mx-auto border border-slate-100 dark:border-slate-800">
      {/* Sol Panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Dekoratif daireler */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/10 rounded-full"></div>
        <div className="relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Şifrenizi mi Unuttunuz?</h2>
          <p className="text-indigo-100 leading-relaxed">Endişelenmeyin. E-posta adresinizi girin, size güvenli bir şifre sıfırlama bağlantısı göndereceğiz.</p>
          <div className="mt-8 space-y-3">
            {['Güvenli sıfırlama bağlantısı', 'Sadece 15 dakika geçerli', 'E-postanızı kontrol edin'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-indigo-100 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-indigo-200 text-sm">© 2026 AjandaSys</div>
      </div>

      {/* Sağ Panel */}
      <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
        <Link to="/login" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition mb-8 group w-fit">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Giriş sayfasına dön
        </Link>

        {isSent ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-4">E-Posta Gönderildi!</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Sıfırlama bağlantısını <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span> adresine gönderdik.
              <br />Gelen kutunuzu (ve spam klasörünü) kontrol edin.
            </p>
            <Link to="/login"
              className="mt-4 block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition text-center shadow-sm">
              Giriş Sayfasına Dön
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Şifre Sıfırlama</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">E-posta adresinizi girin, sıfırlama bağlantısını iletiyoruz.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  E-Posta Adresi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email" value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="ornek@email.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border ${error ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'} dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm`}
                  />
                </div>
                {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow-sm shadow-indigo-500/20">
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</> : 'Sıfırlama Linki Gönder'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
