import React, { useState, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Camera, User, Lock, Mail, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { BASE_URL } from '../utils/api';

const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const getAvatarUrl = () => {
    if (user?.avatar_url) {
      if (user.avatar_url.startsWith('blob:')) {
        return user.avatar_url;
      }
      return `${BASE_URL}${user.avatar_url}`;
    }
    return null;
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Lütfen geçerli bir resim dosyası seçin');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploading(true);
    const toastId = toast.loading('Fotoğraf yükleniyor...');
    try {
      const response = await api.post('/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      updateUser({ ...user, avatar_url: response.data.avatar_url });
      toast.success('Profil fotoğrafı güncellendi', { id: toastId });
    } catch (error) {
      toast.error('Fotoğraf yükleme başarısız oldu', { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading('Profil güncelleniyor...');
    
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      const response = await api.put('/auth/profile', payload);
      updateUser(response.data.user);
      
      setFormData(prev => ({ ...prev, password: '' })); // Şifre alanını temizle
      toast.success('Profil bilgileriniz güncellendi', { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Güncelleme başarısız', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-sans tracking-tight">Kullanıcı Profili</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Kişisel bilgilerinizi ve hesap tercihlerinizi yönetin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
          <div className="relative mb-4 group cursor-pointer" onClick={handleAvatarClick}>
            <div className={`w-36 h-36 rounded-full overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-md ${isUploading ? 'opacity-50' : ''}`}>
              {getAvatarUrl() ? (
                <img src={getAvatarUrl()} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-5xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white mb-1" />
              <span className="text-white text-xs font-medium">Değiştir</span>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{user?.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-5 flex items-center">
            <User className="w-5 h-5 mr-2 text-indigo-500" /> Hesap Bilgileri
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                <User className="w-4 h-4 mr-1 text-slate-400" /> Ad Soyad
              </label>
              <input
                type="text" required
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                <Mail className="w-4 h-4 mr-1 text-slate-400" /> E-Posta Adresi
              </label>
              <input
                type="email" required
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
              />
            </div>
            
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
                <Lock className="w-4 h-4 mr-2 text-indigo-500" /> Şifreyi Değiştir
              </h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Yeni Şifre (Sadece değiştirmek istiyorsanız doldurun)</label>
                <input
                  type="password" minLength={6}
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                  placeholder="******"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-medium px-6 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20 dark:shadow-none flex items-center"
              >
                <Save className="w-5 h-5 mr-2" /> Değişiklikleri Kaydet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
