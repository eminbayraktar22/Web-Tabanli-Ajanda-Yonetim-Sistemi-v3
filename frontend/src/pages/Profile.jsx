import React, { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Camera, User, Lock, Mail, Save, CalendarDays, ListTodo, Clock, Eye, EyeOff, Loader2, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { BASE_URL } from '../utils/api';

const InputField = ({ label, icon: Icon, error, required, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />}
      <input
        {...props}
        className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 border ${error ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'} dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors text-sm`}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1">{error}</p>}
  </div>
);

const StatItem = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  </div>
);

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);

  // Profil formu
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  // Şifre formu
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [isPwSaving, setIsPwSaving] = useState(false);

  // AI Formu
  const [aiForm, setAiForm] = useState({
    provider: user?.ai_provider || 'openai',
    model: user?.ai_model || 'gpt-3.5-turbo',
    apiKey: user?.ai_api_key || ''
  });
  const [isAiSaving, setIsAiSaving] = useState(false);

  // Avatar
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // İstatistikler
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/users/me').then(res => setStats(res.data.data)).catch(() => {});
  }, []);

  const getAvatarUrl = () => {
    if (!user?.avatar_url) return null;
    if (user.avatar_url.startsWith('blob:') || user.avatar_url.startsWith('http')) return user.avatar_url;
    return `${BASE_URL}${user.avatar_url}`;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Lütfen geçerli bir resim dosyası seçin');
    const fd = new FormData();
    fd.append('avatar', file);
    setIsUploading(true);
    const tid = toast.loading('Fotoğraf yükleniyor...');
    try {
      const res = await api.post('/auth/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ ...user, avatar_url: res.data.avatar_url });
      toast.success('Profil fotoğrafı güncellendi', { id: tid });
    } catch { toast.error('Fotoğraf yükleme başarısız', { id: tid }); }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setNameError('Ad Soyad zorunludur'); return; }
    setNameError('');
    setIsSaving(true);
    const tid = toast.loading('Güncelleniyor...');
    try {
      const res = await api.put('/users/me', { name: name.trim() });
      updateUser({ ...user, name: res.data.user.name });
      toast.success('Profil bilgileri güncellendi', { id: tid });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Güncelleme başarısız', { id: tid });
    } finally { setIsSaving(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.current) errs.current = 'Mevcut şifre zorunludur';
    if (!pwForm.new || pwForm.new.length < 6) errs.new = 'Yeni şifre en az 6 karakter olmalıdır';
    if (pwForm.new !== pwForm.confirm) errs.confirm = 'Şifreler eşleşmiyor';
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsPwSaving(true);
    const tid = toast.loading('Şifre güncelleniyor...');
    try {
      await api.put('/users/change-password', { currentPassword: pwForm.current, newPassword: pwForm.new });
      toast.success('Şifre başarıyla güncellendi', { id: tid });
      setPwForm({ current: '', new: '', confirm: '' });
      setPwErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Şifre güncellenemedi', { id: tid });
    } finally { setIsPwSaving(false); }
  };

  const handleAiSave = async (e) => {
    e.preventDefault();
    setIsAiSaving(true);
    const tid = toast.loading('Ayarlar güncelleniyor...');
    try {
      const res = await api.put('/users/me', { 
         ai_provider: aiForm.provider,
         ai_model: aiForm.model,
         ai_api_key: aiForm.apiKey
      });
      updateUser({ ...user, ...res.data.user });
      toast.success('Yapay Zeka ayarları güncellendi', { id: tid });
    } catch (err) {
      toast.error('Güncelleme başarısız', { id: tid });
    } finally { setIsAiSaving(false); }
  };

  const membershipLabel = () => {
    if (!stats?.membershipDays && stats?.membershipDays !== 0) return '—';
    if (stats.membershipDays === 0) return 'Bugün katıldı';
    if (stats.membershipDays < 30) return `${stats.membershipDays} gün`;
    if (stats.membershipDays < 365) return `${Math.floor(stats.membershipDays / 30)} ay`;
    return `${Math.floor(stats.membershipDays / 365)} yıl`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-sans tracking-tight">Kullanıcı Profili</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Kişisel bilgilerinizi ve hesap tercihlerinizi yönetin.</p>
      </div>

      {/* Profil Kartı (üst) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
            <div className={`w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg ${isUploading ? 'opacity-50' : ''}`}>
              {getAvatarUrl() ? (
                <img src={getAvatarUrl()} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
          </div>

          {/* Bilgiler */}
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{user?.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{user?.email}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {user?.createdAt ? `Katılım: ${new Date(user.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}
            </p>
            <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2 cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>
              Fotoğraf değiştir
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Formlar */}
        <div className="lg:col-span-2 space-y-6">
          {/* Kişisel Bilgiler */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" /> Kişisel Bilgiler
            </h3>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <InputField
                label="Ad Soyad" icon={User} required
                type="text" value={name}
                onChange={e => { setName(e.target.value); setNameError(''); }}
                error={nameError} placeholder="Adınız Soyadınız"
              />
              <InputField
                label="E-Posta Adresi" icon={Mail}
                type="email" value={user?.email || ''} disabled
                className="opacity-60 cursor-not-allowed"
              />
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSaving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-sm text-sm">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Kaydet
                </button>
              </div>
            </form>
          </div>

          {/* Şifre Değiştir */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" /> Şifre Değiştir
            </h3>
            <form onSubmit={handlePasswordSave} className="space-y-4">
              {[
                { key: 'current', label: 'Mevcut Şifre', placeholder: '••••••' },
                { key: 'new', label: 'Yeni Şifre', placeholder: 'En az 6 karakter' },
                { key: 'confirm', label: 'Yeni Şifre Tekrar', placeholder: 'Şifreyi tekrar girin' }
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {label} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPw[key] ? 'text' : 'password'}
                      value={pwForm[key]}
                      onChange={e => { setPwForm(p => ({ ...p, [key]: e.target.value })); setPwErrors(p => ({ ...p, [key]: '' })); }}
                      placeholder={placeholder}
                      className={`w-full pl-10 pr-10 py-2.5 border ${pwErrors[key] ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-700'} dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors text-sm`}
                    />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {pwErrors[key] && <p className="mt-1 text-xs text-red-500">{pwErrors[key]}</p>}
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isPwSaving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-sm text-sm">
                  {isPwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Şifreyi Güncelle
                </button>
              </div>
            </form>
          </div>

          {/* Yapay Zeka Ayarları */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-500" /> Yapay Zeka Ayarları (Kendi Anahtarını Kullan)
            </h3>
            <form onSubmit={handleAiSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">AI Sağlayıcısı</label>
                <select 
                  value={aiForm.provider} 
                  onChange={e => setAiForm({...aiForm, provider: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors text-sm"
                >
                  <option value="openai">OpenAI (ChatGPT)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="gemini">Google (Gemini)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Model Adı</label>
                <select 
                  value={aiForm.model} 
                  onChange={e => setAiForm({...aiForm, model: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors text-sm"
                >
                  <optgroup label="OpenAI">
                    <option value="gpt-4o">GPT-4o (En Yetenekli)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Hızlı ve Ucuz)</option>
                  </optgroup>
                  <optgroup label="Anthropic">
                    <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
                    <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                    <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                  </optgroup>
                  <optgroup label="Google">
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-pro">Gemini Pro</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">API Anahtarı (API Key)</label>
                <input 
                  type="password" 
                  value={aiForm.apiKey} 
                  onChange={e => setAiForm({...aiForm, apiKey: e.target.value})}
                  placeholder="sk-..."
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors text-sm"
                />
                <p className="mt-1.5 text-[11px] text-slate-500">Anahtarınız şifreli saklanır ve sadece sizin işlemleriniz için kullanılır.</p>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={isAiSaving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-sm text-sm">
                  {isAiSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Ayarları Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sağ: İstatistikler */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Hesap İstatistikleri</h3>
            <div className="space-y-3">
              <StatItem
                icon={CalendarDays} label="Toplam Etkinlik"
                value={stats?.totalEvents ?? '—'}
                color="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
              />
              <StatItem
                icon={ListTodo} label="Toplam Görev"
                value={stats?.totalTasks ?? '—'}
                color="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
              />
              <StatItem
                icon={Clock} label="Üyelik Süresi"
                value={membershipLabel()}
                color="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
