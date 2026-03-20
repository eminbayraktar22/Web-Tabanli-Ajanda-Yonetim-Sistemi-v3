import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, List, X, Tag, Folder, Briefcase, Heart, Home, AlertCircle, Bookmark, Star, Zap, Plane, Coffee, GraduationCap, ShoppingBag, Gamepad2, Landmark, Monitor } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const iconMap = {
  Folder: <Folder className="w-5 h-5" />, Briefcase: <Briefcase className="w-5 h-5" />, Heart: <Heart className="w-5 h-5" />, Home: <Home className="w-5 h-5" />, 
  AlertCircle: <AlertCircle className="w-5 h-5" />, Bookmark: <Bookmark className="w-5 h-5" />, Star: <Star className="w-5 h-5" />, Zap: <Zap className="w-5 h-5" />, 
  Plane: <Plane className="w-5 h-5" />, Coffee: <Coffee className="w-5 h-5" />, GraduationCap: <GraduationCap className="w-5 h-5" />, ShoppingBag: <ShoppingBag className="w-5 h-5" />, 
  Gamepad2: <Gamepad2 className="w-5 h-5" />, Landmark: <Landmark className="w-5 h-5" />, Monitor: <Monitor className="w-5 h-5" />
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({ id: '', name: '', color_hex: '#3b82f6', icon: 'Folder' });

  // Ön Tanımlı Renk Paleti (İsteğe Bağlı Kolay Seçim)
  const colorPalette = [
    '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', 
    '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', 
    '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', 
    '#f97316', '#ef4444', '#78716c', '#64748b', '#0f172a'
  ];

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/categories');
      // Backend `/categories` genelde `eventCount` de dondurmelidir
      setCategories(data.data || []);
    } catch (error) {
      toast.error('Kategoriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: '', name: '', color_hex: '#3b82f6', icon: 'Folder' });
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setModalMode('edit');
    setFormData({ id: category.id, name: category.name, color_hex: category.color_hex, icon: category.icon || 'Folder' });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
         name: formData.name,
         color_hex: formData.color_hex,
         icon: formData.icon
      };

      if (modalMode === 'add') {
         await api.post('/categories', payload);
         toast.success('Kategori başarıyla eklendi!');
      } else {
         await api.put(`/categories/${formData.id}`, payload);
         toast.success('Kategori başarıyla güncellendi!');
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
       if (error.response?.data?.errors) {
         error.response.data.errors.forEach(err => toast.error(err.msg));
       } else {
         toast.error(error.response?.data?.message || 'İşlem başarısız.');
       }
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?\n\nUyarı: Bu kategoriye bağlı etkinliklerin kategorileri silinmiş sayılacaktır.`)) {
       return;
    }

    try {
       await api.delete(`/categories/${id}`);
       toast.success('Kategori silindi.');
       fetchCategories();
    } catch (error) {
       toast.error('Kategori silinirken hata oluştu.');
    }
  };

  return (
    <div>
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-sans tracking-tight">Kategoriler</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Etkinliklerinizi renklerle ifade edip kolayca sınıflandırın.</p>
            </div>
            <button 
                onClick={openAddModal}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition flex items-center"
            >
               <Plus className="w-5 h-5 mr-2" /> Yeni Kategori
            </button>
        </div>

        {/* Tablo - Liste */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            {isLoading ? (
                <div className="p-8 space-y-4 animate-pulse">
                     {[1,2,3,4].map(i => (
                         <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
                     ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                    <List className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Hiç Kategori Yok</h3>
                    <p className="mt-1 text-sm">Hayatınızı düzenlemeye başlamak için hemen bir Kategori oluşturun.</p>
                </div>
            ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {categories.map(category => (
                        <li key={category.id} className="p-5 sm:px-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div 
                                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-white dark:border-slate-800 text-white" 
                                    style={{ backgroundColor: category.color_hex }}
                                >
                                    {iconMap[category.icon] || <Folder className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-lg">{category.name}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center divide-x divide-slate-300 dark:divide-slate-700">
                                       <span className="flex items-center pr-2"><Tag className="w-3.5 h-3.5 mr-1 text-slate-400" /> <b>{category.eventCount || 0}</b> &nbsp;Etkinlik</span>
                                       <span className="flex items-center pl-2"><List className="w-3.5 h-3.5 mr-1 text-slate-400" /> <b>{category.taskCount || 0}</b> &nbsp;Görev</span>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0 justify-end">
                                <button 
                                   onClick={() => openEditModal(category)}
                                   className="p-2 text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition"
                                   title="Düzenle"
                                >
                                   <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                   onClick={() => handleDelete(category.id, category.name)}
                                   className="p-2 text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition"
                                   title="Sil"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {/* Ekle/Düzenle Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
                   <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
                     <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400" />
                        {modalMode === 'add' ? 'Kategori Oluştur' : 'Kategori Düzenle'}
                     </h3>
                     <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                        <X className="w-5 h-5" />
                     </button>
                   </div>
                   
                   <form onSubmit={handleModalSubmit} className="p-6 space-y-5">
                      <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kategori Adı</label>
                         <input 
                           type="text" required
                           value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                           className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                           placeholder="Örn: Doktor, İş, Ev..."
                         />
                      </div>

                      <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Simge / İkon</label>
                         <div className="flex flex-wrap gap-2 mb-4 max-h-32 overflow-y-auto p-1">
                             {Object.keys(iconMap).map(iconName => (
                                 <button
                                     key={iconName}
                                     type="button"
                                     onClick={() => setFormData({...formData, icon: iconName})}
                                     className={`p-2 rounded-xl flex items-center justify-center transition ${formData.icon === iconName ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 ring-2 ring-indigo-500' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                                 >
                                     {iconMap[iconName]}
                                 </button>
                             ))}
                         </div>
                      </div>

                      <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Seçili Renk: <span className="font-mono ml-2 text-xs text-slate-500 dark:text-slate-400">{formData.color_hex}</span></label>
                         <div className="flex items-center gap-3 mb-4">
                             <div 
                                className="w-12 h-12 rounded-full shadow-inner border-4 border-slate-50 dark:border-slate-800 flex-shrink-0"
                                style={{ backgroundColor: formData.color_hex }}
                             ></div>
                             {/* Yerel Renk Seçici (Color Picker) */}
                             <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 h-10 w-full flex-grow focus-within:ring-2 focus-within:ring-indigo-500">
                                 <input 
                                     type="color" 
                                     value={formData.color_hex} 
                                     onChange={e => setFormData({...formData, color_hex: e.target.value})}
                                     className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer"
                                 />
                                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-slate-50/50 dark:bg-slate-800/80 backdrop-blur-[1px] font-medium text-slate-700 dark:text-slate-300 text-sm">
                                     Özel Renk Seç
                                 </div>
                             </div>
                         </div>

                         {/* Ön Tanımlı Hızlı Palet */}
                         <div className="flex flex-wrap gap-2 mt-4">
                            {colorPalette.map(color => (
                                <button
                                   key={color}
                                   type="button"
                                   onClick={() => setFormData({...formData, color_hex: color})}
                                   className={`w-6 h-6 rounded-full shadow-sm border-2 transition-transform hover:scale-110 ${formData.color_hex === color ? 'border-slate-800 dark:border-white scale-110 ring-2 ring-slate-200 dark:ring-slate-700' : 'border-transparent'}`}
                                   style={{ backgroundColor: color }}
                                   title={color}
                                ></button>
                            ))}
                         </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                         <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium py-2.5 rounded-xl transition">İptal</button>
                         <button type="submit" className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20 dark:shadow-none">Kaydet</button>
                      </div>
                   </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Categories;
