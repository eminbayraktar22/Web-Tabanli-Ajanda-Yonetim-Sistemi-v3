import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      if (data.success) {
        toast.success(data.message);
        setIsSent(true);
      }
    } catch (error) {
       toast.error(error.response?.data?.message || 'E-posta gönderilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full mx-auto">
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 text-white flex flex-col justify-between">
        <div>
           <h2 className="text-3xl font-bold mb-4">Şifrenizi mi Unuttunuz?</h2>
           <p className="text-indigo-100 mt-2">Endişelenmeyin, yeni şifre belirlemeniz için size güvenli bir sıfırlama bağlantısı göndereceğiz.</p>
        </div>
        <div className="text-indigo-200 text-sm">
           &copy; 2026 Emin Bayraktar
        </div>
      </div>

      <div className="w-full md:w-1/2 p-8 sm:p-12">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 font-sans">Şifre Sıfırlama</h3>
        
        {isSent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h4 className="text-xl font-medium text-slate-800">E-Posta Gönderildi!</h4>
            <p className="text-slate-600 mb-6">Sıfırlama bağlantısını <b>{email}</b> adresine gönderdik. Lütfen gelen kutunuzu kontrol edin.</p>
            <Link to="/login" className="block w-full bg-slate-100 text-slate-700 font-semibold py-3 rounded-lg hover:bg-slate-200 transition-colors">
              Giriş Sayfasına Dön
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-Posta Adresi</label>
              <input 
                 type="email" 
                 required
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                 placeholder="ornek@sirket.com"
              />
            </div>

            <button 
               type="submit" 
               disabled={isLoading}
               className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
            </button>
          </form>
        )}
        
        {!isSent && (
          <p className="mt-8 text-center text-sm text-slate-600">
            Hatırladınız mı?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
              Giriş Yapın
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
