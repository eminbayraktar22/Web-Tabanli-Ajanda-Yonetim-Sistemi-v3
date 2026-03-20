import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/login', formData);
      if (data.success) {
        login(data.token, data.user);
        toast.success(`Hoşgeldiniz, ${data.user.name.split(' ')[0]}!`);
        navigate('/');
      }
    } catch (error) {
       if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err.msg));
      } else {
        toast.error(error.response?.data?.message || 'Giriş yapılamadı, e-posta veya şifre hatalı olabilir.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full mx-auto">
      {/* Sol Görsel Alanı (Zarif Grafik / Gradient) */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 p-12 text-white flex flex-col justify-between">
        <div>
           <h2 className="text-3xl font-bold mb-4">AjandaSys'e Hoşgeldiniz</h2>
           <p className="text-indigo-100 mt-2">Zamanınızı ustalıkla yönetin. İşlerinizi takvimde planlayın, kategorilere ayırın ve asla unutmayın.</p>
        </div>
        <div className="text-indigo-200 text-sm">
           &copy; 2026 Emin Bayraktar
        </div>
      </div>

      {/* Sağ Form Alanı */}
      <div className="w-full md:w-1/2 p-8 sm:p-12">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 font-sans">Giriş Yap</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-Posta Adresi</label>
            <input 
               type="email" 
               name="email"
               required
               value={formData.email}
               onChange={handleChange}
               className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
               placeholder="ornek@sirket.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
            <input 
               type="password"
               name="password"
               required
               value={formData.password}
               onChange={handleChange} 
               className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
               placeholder="••••••••"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">Beni hatırla</label>
            </div>
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">Şifremi unuttum</Link>
            </div>
          </div>

          <button 
             type="submit" 
             disabled={isLoading}
             className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-slate-600">
          Hesabınız yok mu?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
            Hemen Kayıt Olun
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
