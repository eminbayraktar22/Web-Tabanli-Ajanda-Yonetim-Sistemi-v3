import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2, CalendarDays, CheckCircle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const features = [
  { icon: CalendarDays, text: 'Akıllı takvim & etkinlik yönetimi' },
  { icon: CheckCircle, text: 'Kanban görev panosu' },
  { icon: Zap, text: 'Otomatik hatırlatma e-postaları' },
];

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', formData);
      if (data.success) {
        login(data.token, data.user);
        toast.success(`Hoşgeldiniz, ${data.user.name.split(' ')[0]}! 👋`);
        navigate('/');
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err.msg));
      } else {
        toast.error(error.response?.data?.message || 'E-posta veya şifre hatalı.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = 'w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all';

  return (
    <div className="flex bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden w-full border border-slate-100 dark:border-slate-800">
      {/* Sol Panel */}
      <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">AjandaSys</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">Zamanınızı<br />Akıllıca Yönetin</h2>
          <p className="text-indigo-200 text-sm leading-relaxed">Etkinliklerinizi planlayın, görevlerinizi takip edin, hiçbir şeyi kaçırmayın.</p>
        </div>
        <div className="relative z-10 space-y-3">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-indigo-100 text-sm">{text}</span>
            </div>
          ))}
          <p className="text-indigo-300 text-xs pt-2">© 2026 AjandaSys</p>
        </div>
      </div>

      {/* Sağ Form */}
      <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-8 md:hidden">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-white">AjandaSys</span>
        </div>
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Tekrar Hoşgeldiniz</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">Hesabınıza giriş yapın.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">E-Posta</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="email" required autoComplete="email" value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className={inputCls} placeholder="ornek@email.com" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Şifre</label>
              <Link to="/forgot-password" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Unuttum</Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type={showPw ? 'text' : 'password'} required autoComplete="current-password" value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className={inputCls + ' pr-11'} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Beni hatırla</span>
          </label>
          <button type="submit" disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow-sm shadow-indigo-500/25 mt-2">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Giriş yapılıyor...</> : 'Sisteme Giriş'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Hesabınız yok mu?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Ücretsiz Kayıt Olun</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
