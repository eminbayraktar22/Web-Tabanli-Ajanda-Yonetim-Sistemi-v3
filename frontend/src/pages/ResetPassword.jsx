import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Girdiğiniz şifreler eşleşmiyor!');
      return;
    }
    if (!token) {
      toast.error('Geçersiz veya eksik güvenlik jetonu (Token). Lütfen e-postadaki linke doğru tıkladığınıza emin olun.');
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password: formData.password });
      if (data.success) {
        toast.success(data.message);
        navigate('/login');
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err.msg));
      } else {
        toast.error(error.response?.data?.message || 'Şifre sıfırlanamadı.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden max-w-lg w-full mx-auto p-8 text-center">
        <div className="w-full">
          <h3 className="text-xl font-bold text-red-600 mb-4">Geçersiz Link</h3>
          <p className="text-slate-600 mb-6">Şifre sıfırlama jetonu bulunamadı. Lütfen e-postanıza gelen linkin tam olduğuna emin olun.</p>
          <Link to="/forgot-password" className="text-indigo-600 font-semibold hover:underline">Şifremi Unuttum sayfasına dön</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full mx-auto">
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-700 p-12 text-white flex flex-col justify-between">
        <div>
           <h2 className="text-3xl font-bold mb-4">Yeni Şifrenizi Belirleyin</h2>
           <p className="text-emerald-100 mt-2">Güçlü ve hatırlayabileceğiniz yeni bir şifre seçin. Ardından sisteme güvenle giriş yapın.</p>
        </div>
        <div className="text-emerald-200 text-sm">
           &copy; 2026 AjandaSys
        </div>
      </div>

      <div className="w-full md:w-1/2 p-8 sm:p-12">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 font-sans">Yeni Şifre Oluştur</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Şifre</label>
            <input 
               type="password" 
               name="password"
               required
               minLength={6}
               value={formData.password}
               onChange={handleChange}
               className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
               placeholder="En az 6 karakter"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Yeni Şifre (Tekrar)</label>
            <input 
               type="password"
               name="confirmPassword"
               required
               minLength={6}
               value={formData.confirmPassword}
               onChange={handleChange} 
               className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
               placeholder="Şifreyi onaylayın"
            />
          </div>

          <button 
             type="submit" 
             disabled={isLoading}
             className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20 disabled:bg-emerald-400 disabled:cursor-not-allowed mt-4"
          >
            {isLoading ? 'Güncelleniyor...' : 'Şifremi Değiştir'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
