import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, FileText, Palette } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#ffffff', '#fef3c7', '#dcfce7', '#e0e7ff', '#fce7f3', '#f3f4f6', '#1e293b'];

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({ id: '', title: '', content: '', color: '#ffffff' });

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/notes');
      setNotes(res.data.data || []);
    } catch (error) {
      toast.error('Notlar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: '', title: '', content: '', color: '#ffffff' });
    setIsModalOpen(true);
  };

  const openEditModal = (note) => {
    setModalMode('edit');
    setFormData({ ...note });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await api.post('/notes', formData);
        toast.success('Not eklendi');
      } else {
        await api.put(`/notes/${formData.id}`, formData);
        toast.success('Not güncellendi');
      }
      setIsModalOpen(false);
      fetchNotes();
    } catch (error) {
      toast.error('Not kaydedilemedi');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Bu notu silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/notes/${id}`);
      toast.success('Not silindi');
      fetchNotes();
    } catch (error) {
      toast.error('Not silinemedi');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-sans tracking-tight">Notlar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Hızlıca not alın ve organize edin.</p>
        </div>
        <button onClick={openAddModal} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition flex items-center text-sm">
          <Plus className="w-4 h-4 mr-2" /> Yeni Not
        </button>
      </div>

      {isLoading ? (
         <div className="flex justify-center p-8">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
         </div>
      ) : notes.length === 0 ? (
         <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-indigo-300 dark:text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Henüz not eklemediniz</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm">Fikirlerinizi, toplantı notlarınızı veya unutmak istemediğiniz detayları buraya kaydedebilirsiniz.</p>
            <button onClick={openAddModal} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition">
              İlk Notunu Oluştur
            </button>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {notes.map(note => {
             const isDarkColor = note.color === '#1e293b';
             return (
              <div 
                key={note.id} 
                onClick={() => openEditModal(note)}
                className={`group cursor-pointer rounded-2xl p-5 shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-200 flex flex-col h-64 relative overflow-hidden`}
                style={{ backgroundColor: note.color === '#ffffff' ? '' : note.color }}
              >
                {note.color === '#ffffff' && <div className="absolute inset-0 bg-white dark:bg-slate-900 -z-10"></div>}
                
                <h3 className={`font-bold text-lg mb-2 truncate ${isDarkColor ? 'text-white' : 'text-slate-800'}`}>{note.title}</h3>
                <div 
                   className={`text-sm flex-1 overflow-hidden break-words whitespace-pre-wrap quill-preview ${isDarkColor ? 'text-slate-300' : 'text-slate-600 dark:text-slate-300'}`} 
                   style={{ display: '-webkit-box', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical' }}
                   dangerouslySetInnerHTML={{ __html: note.content || '<span class="italic opacity-50">Boş not...</span>' }}
                />
                <div className="mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className={`text-[10px] ${isDarkColor ? 'text-slate-400' : 'text-slate-400'}`}>
                    {new Date(note.updatedAt).toLocaleDateString('tr-TR')}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(note); }} className={`p-1.5 rounded-lg transition-colors ${isDarkColor ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-black/5 text-slate-500'}`}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => handleDelete(note.id, e)} className={`p-1.5 rounded-lg transition-colors ${isDarkColor ? 'hover:bg-red-500/20 text-red-400 hover:text-red-300' : 'hover:bg-red-50 text-red-500 hover:text-red-600'}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={(e) => { if(e.target===e.currentTarget) setIsModalOpen(false) }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-800 overflow-hidden" style={{ backgroundColor: formData.color === '#ffffff' ? '' : formData.color }}>
            <form onSubmit={handleModalSubmit} className="flex flex-col h-full overflow-hidden">
               <div className={`p-5 flex justify-between items-center ${formData.color === '#1e293b' ? 'border-slate-700' : 'border-slate-100 dark:border-slate-800'} border-b`}>
                 <div className="flex gap-2">
                   {COLORS.map(c => (
                     <button
                       key={c} type="button"
                       onClick={() => setFormData({...formData, color: c})}
                       className={`w-6 h-6 rounded-full border-2 ${formData.color === c ? 'border-indigo-500' : 'border-transparent'} shadow-sm`}
                       style={{ backgroundColor: c, border: c === '#ffffff' && formData.color !== c ? '2px solid #e2e8f0' : undefined }}
                     />
                   ))}
                 </div>
                 <button type="button" onClick={() => setIsModalOpen(false)} className={`p-1 rounded-lg transition ${formData.color === '#1e293b' ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}>
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="p-6 flex flex-col gap-4 flex-1 overflow-y-auto">
                 <input 
                   type="text" required
                   value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                   placeholder="Başlık"
                   className={`w-full text-2xl font-bold bg-transparent outline-none border-none placeholder-opacity-50 mb-4 ${formData.color === '#1e293b' ? 'text-white placeholder-slate-400' : 'text-slate-800 dark:text-white placeholder-slate-400'}`}
                 />
                 <div className="bg-white/50 dark:bg-slate-900/50 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 flex-1">
                   <ReactQuill
                     theme="snow"
                     value={formData.content} 
                     onChange={val => setFormData({...formData, content: val})}
                     placeholder="Notunuzu buraya yazın..."
                     className={`h-[300px] overflow-y-auto ${formData.color === '#1e293b' ? 'text-slate-200' : 'text-slate-800 dark:text-slate-200'}`}
                   />
                 </div>
               </div>

               <div className={`p-4 flex justify-end ${formData.color === '#1e293b' ? 'border-slate-700' : 'border-slate-100 dark:border-slate-800'} border-t`}>
                 <button type="button" onClick={() => setIsModalOpen(false)} className={`px-5 py-2 rounded-xl text-sm font-medium transition mr-3 ${formData.color === '#1e293b' ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>İptal</button>
                 <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-semibold transition shadow-sm">
                   {modalMode === 'add' ? 'Oluştur' : 'Kaydet'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
