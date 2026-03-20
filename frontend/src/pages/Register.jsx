import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/register', formData);
      if (data.success) {
        toast.success('Hesabınız başarıyla oluşturuldu! Şimdi giriş yapabilirsiniz.');
        navigate('/login');
      }
    } catch (error) {
      // Backend'in gönderdiği form validasyon hatalarını göster
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err.msg));
      } else {
        toast.error(error.response?.data?.message || 'Kayıt olurken beklenmeyen bir hata oluştu.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full mx-auto flex-row-reverse">
       {/* Sağ Görsel Alanı (Zarif Grafik / Gradient) */}
       <div className="hidden md:block md:w-1/2 bg-gradient-to-bl from-teal-500 to-indigo-600 p-12 text-white flex flex-col justify-between">
        <div>
           <h2 className="text-3xl font-bold mb-4">Yeni Bir Başlangıç</h2>
           <p className="text-teal-50 mt-2">Daha düzenli, daha organize bir yaşama adım atın. Tüm buluşmalarınız ve randevularınız güvende.</p>
        </div>
      </div>

      {/* Sol Form Alanı */}
      <div className="w-full md:w-1/2 p-8 sm:p-12">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 font-sans">Kayıt Ol</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
            <input 
               type="text" 
               name="name"
               required
               value={formData.name}
               onChange={handleChange}
               className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
               placeholder="Adınız Soyadınız"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-Posta Adresi</label>
            <input 
               type="email" 
               name="email"
               required
               value={formData.email}
               onChange={handleChange}
               className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
               placeholder="ornek@sirket.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şifre Belirleyin</label>
            <input 
               type="password" 
               name="password"
               required
               value={formData.password}
               onChange={handleChange}
               className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
               placeholder="••••••••"
            />
          </div>

          <button 
             type="submit" 
             disabled={isLoading}
             className="w-full bg-teal-600 text-white font-semibold py-3 mt-4 rounded-lg hover:bg-teal-700 transition-colors shadow-md shadow-teal-600/20 disabled:bg-teal-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Hesabınız Oluşturuluyor...' : 'Hesabı Oluştur'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-slate-600">
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="font-semibold text-teal-600 hover:text-teal-500 transition-colors">
            Giriş Yapın
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
