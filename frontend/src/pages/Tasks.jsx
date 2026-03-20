import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, Edit2, GripVertical, CheckCircle2, Clock, ListTodo, X, AlertCircle, ArrowUp, ArrowDown, Paperclip, Download, CheckSquare } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const priorityIcons = {
  low: <ArrowDown className="w-3.5 h-3.5 text-slate-400" />,
  medium: <div className="w-3.5 h-3.5 rounded-full bg-blue-400 opacity-80" />,
  high: <ArrowUp className="w-3.5 h-3.5 text-orange-500" />,
  critical: <AlertCircle className="w-3.5 h-3.5 text-red-600" />
};

const columnMapping = {
  'todo': { title: 'Bekleyenler', icon: <ListTodo className="w-5 h-5 text-slate-500" /> },
  'in-progress': { title: 'Yapılıyor', icon: <Clock className="w-5 h-5 text-amber-500" /> },
  'done': { title: 'Bitenler', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
};

const Tasks = () => {
  const [tasks, setTasks] = useState({
    'todo': [],
    'in-progress': [],
    'done': []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({ id: '', title: '', description: '', status: 'todo', due_date: '', tags_json: '', priority: 'medium', subtasks: [], attachment_url: '' });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const [tasksRes, catsRes] = await Promise.all([
         api.get(`/tasks${selectedCategory !== 'all' ? `?category_id=${selectedCategory}` : ''}`),
         api.get('/categories')
      ]);
      
      setCategories(catsRes.data?.data || []);
      const fetchedTasks = tasksRes.data?.data || [];
      
      const groupedTasks = { 'todo': [], 'in-progress': [], 'done': [] };
      fetchedTasks.forEach(task => {
         if (groupedTasks[task.status]) {
             groupedTasks[task.status].push(task);
         }
      });
      
      setTasks(groupedTasks);
    } catch (error) {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedCategory]);

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;

    const newTasks = { ...tasks };
    
    // Kopar
    const sourceColTasks = Array.from(newTasks[sourceColId]);
    const [removed] = sourceColTasks.splice(source.index, 1);
    
    // Durumunu güncelle
    removed.status = destColId;

    // Hedefe ekle
    const destColTasks = sourceColId === destColId ? sourceColTasks : Array.from(newTasks[destColId]);
    destColTasks.splice(destination.index, 0, removed);

    newTasks[sourceColId] = sourceColTasks;
    newTasks[destColId] = destColTasks;

    // Arayüzü anında güncelle (Optimistic UI)
    setTasks(newTasks);

    // Backend bulk update
    try {
      const payload = destColTasks.map((t, index) => ({
         id: t.id,
         status: destColId,
         order: index
      }));
      
      // Eger ayni kolonda değilse, kaynak kolonun siralamasini da düzeltmek gerekebilir
      // Basitlik adina sadece varilan kolonu gonderiyoruz
      await api.post('/tasks/reorder', { items: payload });
    } catch (error) {
       toast.error('Sıralama kaydedilemedi, değişiklikler geri alınıyor.');
       fetchTasks(); // Hata varsa eski haline dön
    }
  };

  const openAddModal = (status = 'todo') => {
    setModalMode('add');
    setFormData({ id: '', title: '', description: '', status, due_date: '', tags_json: '', priority: 'medium', subtasks: [], attachment_url: '' });
    setAttachmentFile(null);
    setNewSubtask('');
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setModalMode('edit');
    let formattedDate = '';
    if (task.due_date) {
       const d = new Date(task.due_date);
       formattedDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    }
    setFormData({ 
      id: task.id, 
      title: task.title, 
      description: task.description || '', 
      status: task.status, 
      due_date: formattedDate, 
      tags_json: task.tags_json || '',
      priority: task.priority || 'medium',
      subtasks: task.subtasks_json ? JSON.parse(task.subtasks_json) : [],
      attachment_url: task.attachment_url || ''
    });
    setAttachmentFile(null);
    setNewSubtask('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalAttachmentUrl = formData.attachment_url;
      
      if (attachmentFile) {
        const uploadData = new FormData();
        uploadData.append('file', attachmentFile);
        const uploadRes = await api.post('/tasks/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalAttachmentUrl = uploadRes.data.url;
      }

      const payload = {
         ...formData,
         subtasks_json: JSON.stringify(formData.subtasks),
         attachment_url: finalAttachmentUrl
      };

      if (modalMode === 'add') {
         await api.post('/tasks', { ...payload, order: tasks[payload.status].length });
         toast.success('Görev eklendi');
      } else {
         await api.put(`/tasks/${payload.id}`, payload);
         toast.success('Görev güncellendi');
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (error) {
      toast.error('Görevi kaydederken hata oluştu');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Görev silindi');
      fetchTasks();
    } catch (error) {
      toast.error('Silme işlemi başarısız');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex justify-between items-end mb-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-sans tracking-tight">Görevler Panosu</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">İşlerinizi sürükleyerek durumlarını güncelleyebilirsiniz.</p>
            </div>
            <div className="flex gap-3">
                <select 
                   value={selectedCategory} 
                   onChange={(e) => setSelectedCategory(e.target.value)}
                   className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm w-full md:w-auto appearance-none font-medium text-sm"
                   style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.2em' }}
                >
                   <option value="all">Tüm Kategoriler</option>
                   {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                   ))}
                </select>
                <button 
                    onClick={() => openAddModal('todo')}
                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition flex items-center"
                >
                   <Plus className="w-5 h-5 mr-2" /> Yeni Görev
                </button>
            </div>
        </div>

        {isLoading ? (
             <div className="flex-grow flex items-center justify-center p-8">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
             </div>
        ) : (
            <div className="flex-grow overflow-x-auto pb-4">
               <DragDropContext onDragEnd={onDragEnd}>
                  <div className="flex gap-6 h-full min-w-max items-start">
                     {Object.entries(tasks).map(([columnId, columnTasks]) => (
                        <div key={columnId} className="w-80 bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col max-h-full border border-slate-200 dark:border-slate-800">
                            
                            <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center rounded-t-2xl bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-2">
                                  {columnMapping[columnId].icon}
                                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">{columnMapping[columnId].title}</h3>
                                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full text-xs font-medium ml-1">
                                      {columnTasks.length}
                                  </span>
                                </div>
                                <button onClick={() => openAddModal(columnId)} className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                                   <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <Droppable droppableId={columnId}>
                              {(provided, snapshot) => (
                                <div 
                                  {...provided.droppableProps} 
                                  ref={provided.innerRef}
                                  className={`flex-1 p-3 overflow-y-auto min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                                >
                                    {columnTasks.map((task, index) => (
                                       <Draggable key={task.id} draggableId={task.id} index={index}>
                                          {(provided, snapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              className={`mb-3 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border ${snapshot.isDragging ? 'border-indigo-500 shadow-lg dark:shadow-none ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-700'} group relative`}
                                            >
                                               <div className="flex items-start">
                                                  <div {...provided.dragHandleProps} className="mr-2 text-slate-300 dark:text-slate-600 hover:text-slate-500 cursor-grab active:cursor-grabbing mt-0.5">
                                                     <GripVertical className="w-4 h-4" />
                                                  </div>
                                                  <div className="flex-1 pr-6">
                                                     <div className="flex justify-between items-start mb-1.5 gap-2">
                                                        <div className="flex flex-wrap gap-1">
                                                           {task.tags_json && task.tags_json.split(',').map(tag => tag.trim() && (
                                                              <span key={tag} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] font-semibold">{tag.trim()}</span>
                                                           ))}
                                                        </div>
                                                        {task.priority && (
                                                           <div className="flex items-center" title={`Öncelik: ${task.priority}`}>
                                                              {priorityIcons[task.priority]}
                                                           </div>
                                                        )}
                                                     </div>
                                                     <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">{task.title}</h4>
                                                     {task.description && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                                                     )}
                                                     {(() => {
                                                        const subT = task.subtasks_json ? JSON.parse(task.subtasks_json) : [];
                                                        if (subT.length === 0) return null;
                                                        const doneT = subT.filter(t => t.isCompleted).length;
                                                        const pct = Math.round((doneT / subT.length) * 100);
                                                        return (
                                                          <div className="mt-3 mb-1">
                                                            <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                                                              <span><CheckSquare className="inline w-3 h-3 mr-1"/> {doneT}/{subT.length}</span>
                                                              <span>{pct}%</span>
                                                            </div>
                                                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                              <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${pct}%` }}></div>
                                                            </div>
                                                          </div>
                                                        );
                                                     })()}
                                                     <div className="flex items-center justify-between mt-2">
                                                        {task.due_date ? (
                                                           <div className={`flex items-center text-xs font-medium ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                                              <Clock className="w-3.5 h-3.5 mr-1" />
                                                              {new Date(task.due_date).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                           </div>
                                                        ) : <div></div>}
                                                        
                                                        {task.attachment_url && (
                                                           <div className="text-slate-400" title="Eklenti Var"><Paperclip className="w-3.5 h-3.5"/></div>
                                                        )}
                                                     </div>
                                                  </div>
                                                  <div className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                                     <button onClick={() => openEditModal(task)} className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-100 dark:border-slate-700">
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                     </button>
                                                     <button onClick={() => handleDelete(task.id)} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-100 dark:border-slate-700">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                     </button>
                                                  </div>
                                               </div>
                                            </div>
                                          )}
                                       </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                              )}
                            </Droppable>

                        </div>
                     ))}
                  </div>
               </DragDropContext>
            </div>
        )}

        {/* Ekle/Düzenle Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
                   <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
                     <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                        <ListTodo className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400" />
                        {modalMode === 'add' ? 'Görev Oluştur' : 'Görev Düzenle'}
                     </h3>
                     <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                        <X className="w-5 h-5" />
                     </button>
                   </div>
                   
                   <form onSubmit={handleModalSubmit} className="p-6 space-y-5">
                      <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Görev Başlığı</label>
                         <input 
                           type="text" required
                           value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                           className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                           placeholder="Örn: Proje raporunu hazırla..."
                         />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Açıklama</label>
                         <textarea 
                           rows="3"
                           value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                           className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors resize-none"
                           placeholder="Ek detaylar..."
                         ></textarea>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kategori</label>
                           <select 
                             value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})}
                             className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                           >
                              <option value="">Kategorisiz</option>
                              {categories.map(cat => (
                                 <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                           </select>
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Öncelik</label>
                           <select 
                             value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}
                             className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                           >
                              <option value="low">Düşük</option>
                              <option value="medium">Orta</option>
                              <option value="high">Yüksek</option>
                              <option value="critical">Kritik</option>
                           </select>
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Teslim Tarihi</label>
                           <input 
                             type="datetime-local"
                             value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})}
                             className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Manuel Etiketler</label>
                           <input 
                             type="text"
                             value={formData.tags_json} onChange={e => setFormData({...formData, tags_json: e.target.value})}
                             className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                             placeholder="Örn: Özellik, Backend"
                           />
                         </div>
                      </div>

                       <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Alt Görevler (Checklist)</label>
                         <div className="flex mb-2">
                           <input 
                             type="text" value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                             placeholder="Yeni görev maddesi..."
                             className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-l-xl focus:outline-none text-sm"
                             onKeyDown={e => {
                               if (e.key === 'Enter') {
                                 e.preventDefault();
                                 if(newSubtask.trim()) {
                                    setFormData({...formData, subtasks: [...formData.subtasks, { id: Date.now().toString(), title: newSubtask.trim(), isCompleted: false }]});
                                    setNewSubtask('');
                                 }
                               }
                             }}
                           />
                           <button type="button" onClick={() => {
                             if(newSubtask.trim()) {
                                setFormData({...formData, subtasks: [...formData.subtasks, { id: Date.now().toString(), title: newSubtask.trim(), isCompleted: false }]});
                                setNewSubtask('');
                             }
                           }} className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-3 py-2 rounded-r-xl text-sm font-medium hover:bg-indigo-200 transition"><Plus className="w-5 h-5"/></button>
                         </div>
                         <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                            {formData.subtasks.map((st, i) => (
                               <div key={st.id} className="flex items-center justify-between group">
                                  <div className="flex items-center gap-2 flex-1 relative">
                                     <input 
                                       type="checkbox" checked={st.isCompleted} 
                                       onChange={(e) => {
                                          const newSt = [...formData.subtasks];
                                          newSt[i].isCompleted = e.target.checked;
                                          setFormData({...formData, subtasks: newSt});
                                       }}
                                       className="w-4 h-4 text-indigo-600 rounded bg-slate-100 dark:bg-slate-700 border-none cursor-pointer"
                                     />
                                     <span className={`text-sm tracking-wide ${st.isCompleted ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{st.title}</span>
                                  </div>
                                  <button type="button" onClick={() => {
                                     const newSt = [...formData.subtasks];
                                     newSt.splice(i, 1);
                                     setFormData({...formData, subtasks: newSt});
                                  }} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-3.5 h-3.5"/></button>
                               </div>
                            ))}
                         </div>
                       </div>
                       
                       <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                            Dosya Eki <span className="text-[10px] ml-2 text-slate-400">(Opsiyonel)</span>
                         </label>
                         <input 
                            type="file" 
                            onChange={(e) => setAttachmentFile(e.target.files[0])}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/40 dark:file:text-indigo-400 transition"
                         />
                         {formData.attachment_url && !attachmentFile && (
                            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 flex items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
                               <Paperclip className="w-4 h-4 mr-2"/> Sisteme Yüklü Ek: 
                               <a href={api.defaults.baseURL.replace('/api', '') + formData.attachment_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-indigo-600 dark:text-indigo-400 hover:underline flex items-center bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                                  İndir <Download className="w-3 h-3 ml-1"/>
                               </a>
                            </div>
                         )}
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

export default Tasks;
