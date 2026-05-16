import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Loader2, CalendarDays, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const features = [
  { icon: CalendarDays, text: 'Etkinlik & takvim yönetimi' },
  { icon: ShieldCheck, text: 'Güvenli kişisel alan' },
  { icon: Sparkles, text: 'Akıllı hatırlatmalar' },
];

const getStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};
const strengthConfig = [
  { label: '', color: 'bg-slate-200 dark:bg-slate-700' },
  { label: 'Çok Zayıf', color: 'bg-red-500' },
  { label: 'Zayıf', color: 'bg-orange-400' },
  { label: 'Orta', color: 'bg-yellow-400' },
  { label: 'Güçlü', color: 'bg-emerald-500' },
];

const inputCls = 'w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const strength = getStrength(formData.password);
  const cfg = strengthConfig[strength] || strengthConfig[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) { toast.error('Şifre en az 6 karakter olmalı'); return; }
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/register', formData);
      if (data.success) {
        toast.success('Hesabınız oluşturuldu! Giriş yapabilirsiniz.');
        navigate('/login');
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => toast.error(err.msg));
      } else {
        toast.error(error.response?.data?.message || 'Kayıt olurken hata oluştu.');
      }
    } finally { setIsLoading(false); }
  };

  return (
    <div className="flex bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden w-full border border-slate-100 dark:border-slate-800">
      {/* Sol Panel */}
      <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">AjandaSys</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-3">Yeni Bir<br />Başlangıç</h2>
          <p className="text-indigo-200 text-sm leading-relaxed">Ücretsiz hesap oluşturun. Kredi kartı gerekmez.</p>
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
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Hesap Oluşturun</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">Hızlı kayıt — dakikadan az sürer.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ad Soyad */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Ad Soyad</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="text" name="name" required autoComplete="name"
                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                className={inputCls} placeholder="Adınız Soyadınız" />
            </div>
          </div>

          {/* E-posta */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">E-Posta Adresi</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="email" name="email" required autoComplete="email"
                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                className={inputCls} placeholder="ornek@email.com" />
            </div>
          </div>

          {/* Şifre + Güç Göstergesi */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input type={showPw ? 'text' : 'password'} name="password" required autoComplete="new-password"
                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                className={inputCls + ' pr-11'} placeholder="En az 6 karakter" />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Şifre Güç Göstergesi */}
            {formData.password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? cfg.color : 'bg-slate-200 dark:bg-slate-700'}`} />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-orange-400' : strength === 3 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                  {cfg.label}
                </p>
              </div>
            )}
          </div>

          <button type="submit" disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition shadow-sm shadow-indigo-500/25 mt-2">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Hesap oluşturuluyor...</> : 'Ücretsiz Hesap Oluştur'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Giriş Yapın</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
