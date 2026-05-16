import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, GripVertical, CheckCircle2, Clock, ListTodo, X, AlertCircle, ArrowUp, ArrowDown, Paperclip, Download, CheckSquare, Search, SortAsc, ChevronsUpDown, Copy, Wand2, Loader2, Play, Pause, Timer, Sparkles } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../utils/api';
import toast from 'react-hot-toast';
import TaskComments from '../components/TaskComments';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/airbnb.css';
import { Turkish } from 'flatpickr/dist/l10n/tr.js';

const priorityIcons = {
  low: <ArrowDown className="w-3.5 h-3.5 text-slate-400" />,
  medium: <div className="w-3.5 h-3.5 rounded-full bg-blue-400 opacity-80" />,
  high: <ArrowUp className="w-3.5 h-3.5 text-orange-500" />,
  critical: <AlertCircle className="w-3.5 h-3.5 text-red-600" />
};

const columnMapping = {
  'todo': { title: 'Bekleyenler', icon: <ListTodo className="w-4.5 h-4.5" />, accent: '#94a3b8', bg: 'bg-slate-50 dark:bg-slate-800/60', headerColor: 'text-slate-600 dark:text-slate-300' },
  'in-progress': { title: 'Yapılıyor', icon: <Clock className="w-4.5 h-4.5" />, accent: '#f59e0b', bg: 'bg-amber-50/50 dark:bg-amber-900/10', headerColor: 'text-amber-600 dark:text-amber-400' },
  'done': { title: 'Bitenler', icon: <CheckCircle2 className="w-4.5 h-4.5" />, accent: '#10b981', bg: 'bg-emerald-50/50 dark:bg-emerald-900/10', headerColor: 'text-emerald-600 dark:text-emerald-400' },
};

const priorityBorderColor = { low: 'border-l-slate-300', medium: 'border-l-blue-400', high: 'border-l-orange-400', critical: 'border-l-red-500' };
const priorityBadge = {
  low: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  medium: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  high: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  critical: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
};
const priorityLabel = { low: 'Düşük', medium: 'Orta', high: 'Yüksek', critical: 'Kritik' };

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
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Toplu seçim
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  // Sıralama
  const [sortByPriority, setSortByPriority] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const [smartInput, setSmartInput] = useState('');
  const [isSmartLoading, setIsSmartLoading] = useState(false);

  // Parse ?new=1 from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new')) {
      setModalMode('add');
      setFormData({ id: '', title: '', description: '', status: 'todo', due_date: '', tags_json: '', priority: 'medium', subtasks: [], attachment_url: '' });
      setAttachmentFile(null);
      setIsModalOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Global Drop Listener
  useEffect(() => {
    const handleGlobalDrop = (e) => {
      const file = e.detail.file;
      setModalMode('add');
      setFormData({ id: '', title: file.name, description: 'Sürüklenerek eklenen dosya.', status: 'todo', due_date: '', tags_json: '', priority: 'medium', subtasks: [], attachment_url: '' });
      setAttachmentFile(file);
      setIsModalOpen(true);
    };
    window.addEventListener('global-file-drop', handleGlobalDrop);
    return () => window.removeEventListener('global-file-drop', handleGlobalDrop);
  }, []);

  const handleSmartParse = async () => {
    if (!smartInput.trim()) return;
    setIsSmartLoading(true);
    try {
      const res = await api.post('/ai/parse-task', { text: smartInput });
      const parsed = res.data.data;
      
      setFormData(prev => ({
        ...prev,
        title: parsed.title || prev.title,
        due_date: parsed.due_date || prev.due_date,
        priority: parsed.priority || prev.priority,
        tags_json: parsed.tags && parsed.tags.length > 0 ? parsed.tags.join(', ') : prev.tags_json
      }));
      toast.success('Sys Pilot görevi ayrıştırdı!');
      setSmartInput('');
    } catch (error) {
      toast.error('Girdi ayrıştırılamadı. API anahtarınızı kontrol edin.');
    } finally {
      setIsSmartLoading(false);
    }
  };

  const generateSubtasksAI = async () => {
    if (!formData.title) {
      toast.error('Lütfen önce görev başlığını girin.');
      return;
    }
    setIsAILoading(true);
    try {
      const res = await api.post('/ai/breakdown-task', { title: formData.title, description: formData.description });
      const generated = res.data.subtasks || [];
      const newSubtasks = generated.map((title, i) => ({
        id: Date.now().toString() + i,
        title,
        isCompleted: false
      }));
      setFormData(prev => ({ ...prev, subtasks: [...prev.subtasks, ...newSubtasks] }));
      toast.success('AI tarafından alt görevler eklendi!');
    } catch (error) {
      toast.error('Alt görevler üretilemedi.');
    } finally {
      setIsAILoading(false);
    }
  };

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

  const handleToggleTimer = async (taskId) => {
    try {
      await api.post(`/tasks/${taskId}/timer`);
      fetchTasks();
    } catch (error) {
      toast.error('Zamanlayıcı güncellenemedi');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0sn';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}s ${m}d`;
    if (m > 0) return `${m}d ${s}sn`;
    return `${s}sn`;
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

  // Hızlı tamamla — tek tıkla "done" kolonuna taşı
  const handleQuickDone = async (task) => {
    if (task.status === 'done') return;
    try {
      await api.put(`/tasks/${task.id}`, { ...task, status: 'done' });
      toast.success('✓ Görev tamamlandı!');
      fetchTasks();
    } catch { toast.error('Güncellenemedi'); }
  };

  // Toplu silme
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`${selectedIds.size} görevi silmek istiyor musunuz?`)) return;
    try {
      await api.post('/tasks/bulk-delete', { ids: [...selectedIds] });
      toast.success(`${selectedIds.size} görev silindi`);
      setSelectedIds(new Set()); setBulkMode(false);
      fetchTasks();
    } catch { toast.error('Toplu silme başarısız'); }
  };

  // Toplu taşıma
  const handleBulkMove = async (status) => {
    if (selectedIds.size === 0) return;
    try {
      await api.post('/tasks/bulk-update', { ids: [...selectedIds], status });
      const labels = { todo: 'Bekleyenler', 'in-progress': 'Yapılıyor', done: 'Bitenler' };
      toast.success(`${selectedIds.size} görev » ${labels[status]}`);
      setSelectedIds(new Set()); setBulkMode(false);
      fetchTasks();
    } catch { toast.error('Taşıma başarısız'); }
  };

  // Toplu öncelik
  const handleBulkPriority = async (priority) => {
    if (selectedIds.size === 0) return;
    try {
      await api.post('/tasks/bulk-update', { ids: [...selectedIds], priority });
      toast.success(`${selectedIds.size} görev güncellendi`);
      setSelectedIds(new Set()); setBulkMode(false);
      fetchTasks();
    } catch { toast.error('Güncelleme başarısız'); }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = (columnTasks) => {
    const allIds = columnTasks.map(t => t.id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      allIds.forEach(id => next.add(id));
      return next;
    });
  };

  const priorities = [
    { value: 'all', label: 'Tümü', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
    { value: 'low', label: 'Düşük', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' },
    { value: 'medium', label: 'Orta', color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { value: 'high', label: 'Yüksek', color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
    { value: 'critical', label: 'Kritik', color: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  ];

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const filteredTasks = useMemo(() => {
    const result = {};
    Object.entries(tasks).forEach(([col, list]) => {
      let filtered = list.filter(t => {
        const matchPriority = selectedPriority === 'all' || t.priority === selectedPriority;
        const q = searchQuery.trim().toLowerCase();
        const matchSearch = !q || t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
        return matchPriority && matchSearch;
      });
      if (sortByPriority) filtered = [...filtered].sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));
      result[col] = filtered;
    });
    return result;
  }, [tasks, selectedPriority, searchQuery, sortByPriority]);

  // Görev CSV dışa aktarım
  const handleExportCSV = () => {
    const allTasks = Object.values(tasks).flat();
    if (allTasks.length === 0) { toast.error('Dışa aktarılacak görev yok'); return; }

    const statusLabel = { todo: 'Bekliyor', 'in-progress': 'Yapılıyor', done: 'Tamamlandı' };
    const priorityLabel = { low: 'Düşük', medium: 'Orta', high: 'Yüksek', critical: 'Kritik' };

    const headers = ['Başlık', 'Açıklama', 'Durum', 'Öncelik', 'Son Tarih', 'Kategori', 'Etiketler'];
    const rows = allTasks.map(t => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      statusLabel[t.status] || t.status,
      priorityLabel[t.priority] || t.priority,
      t.due_date ? new Date(t.due_date).toLocaleDateString('tr-TR') : '',
      t.Category?.name || '',
      `"${(t.tags_json || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const BOM = '\uFEFF'; // UTF-8 BOM - Excel Türkçe karakter desteği
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gorevler_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${allTasks.length} görev CSV olarak dışa aktarıldı`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-sans tracking-tight">Görevler Panosu</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">İşlerinizi sürükleyerek durumlarını güncelleyebilirsiniz.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Görev ara..."
                  className="pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 w-44"
                />
              </div>
              <select
                value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm appearance-none font-medium text-sm"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.2em' }}
              >
                <option value="all">Tüm Kategoriler</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <button onClick={() => openAddModal('todo')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition flex items-center text-sm">
                <Plus className="w-4 h-4 mr-2" /> Yeni Görev
              </button>
              <button onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition">
                <Download className="w-4 h-4" /> CSV
              </button>
            </div>
          </div>
          {/* Öncelik Chip Filtreleri */}
          <div className="flex flex-wrap gap-2">
            {priorities.map(p => (
              <button key={p.value} onClick={() => setSelectedPriority(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-2 ${
                  selectedPriority === p.value
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 ' + p.color
                    : 'border-transparent ' + p.color
                }`}>
                {p.label}
              </button>
            ))}
            {(selectedPriority !== 'all' || searchQuery) && (
              <button onClick={() => { setSelectedPriority('all'); setSearchQuery(''); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition">
                <X className="w-3 h-3" /> Temizle
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
             <div className="flex-grow flex items-center justify-center p-8">
                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
             </div>
        ) : (
            <div className="flex-grow overflow-x-hidden md:overflow-x-auto overflow-y-auto pb-4 snap-y md:snap-x snap-mandatory">
               <DragDropContext onDragEnd={onDragEnd}>
                  <div className="flex flex-col md:flex-row gap-6 h-full md:min-w-max items-start">
                     {Object.entries(filteredTasks).map(([columnId, columnTasks]) => (
                        <div key={columnId} className="w-full md:w-80 bg-white dark:bg-slate-900 rounded-2xl flex flex-col max-h-full border border-slate-200 dark:border-slate-800 shadow-sm snap-start" style={{ borderTop: `3px solid ${columnMapping[columnId].accent}` }}>
                            
                            <div className={`px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center rounded-t-2xl ${columnMapping[columnId].bg}`}>
                                <div className="flex items-center gap-2">
                                  <span className={columnMapping[columnId].headerColor}>{columnMapping[columnId].icon}</span>
                                  <h3 className={`font-bold text-sm ${columnMapping[columnId].headerColor}`}>{columnMapping[columnId].title}</h3>
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: columnMapping[columnId].accent }}>
                                      {columnTasks.length}
                                  </span>
                                </div>
                                <button onClick={() => openAddModal(columnId)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-indigo-500 transition">
                                   <Plus className="w-4 h-4" />
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
                                              className={`mb-2.5 bg-white dark:bg-slate-800 rounded-xl p-3.5 shadow-sm border-l-4 border border-r-slate-100 border-t-slate-100 border-b-slate-100 dark:border-r-slate-700 dark:border-t-slate-700 dark:border-b-slate-700 ${
                                                snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-400/30' : 'hover:shadow-md'
                                              } ${priorityBorderColor[task.priority] || 'border-l-slate-300'} group relative transition-shadow`}
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
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${priorityBadge[task.priority]}`}>
                                                               {priorityLabel[task.priority]}
                                                            </span>
                                                         )}
                                                     </div>
                                                     <h4 className={`font-medium text-sm ${columnId === 'done' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>{task.title}</h4>
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
                                                         <div className="flex items-center gap-2">
                                                            {task.is_timer_running || task.time_spent > 0 ? (
                                                              <div className={`flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded ${task.is_timer_running ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 animate-pulse' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                                <Timer className="w-3 h-3 mr-1" />
                                                                {task.is_timer_running ? 'Çalışıyor' : formatTime(task.time_spent)}
                                                              </div>
                                                            ) : null}
                                                            {task.attachment_url && (
                                                               <div className="text-slate-400" title="Eklenti Var"><Paperclip className="w-3.5 h-3.5"/></div>
                                                            )}
                                                         </div>
                                                     </div>
                                                  </div>
                                                  <div className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                                     <button onClick={() => handleToggleTimer(task.id)} className={`p-1.5 rounded-md shadow-sm border border-slate-100 dark:border-slate-700 transition ${task.is_timer_running ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800'}`} title={task.is_timer_running ? "Zamanlayıcıyı Durdur" : "Zamanlayıcıyı Başlat"}>
                                                        {task.is_timer_running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                                     </button>
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
                                    {columnTasks.length === 0 && !isLoading && (
                                      <button 
                                        onClick={() => openAddModal(columnId)}
                                        className="flex flex-col w-full items-center justify-center py-8 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all border-2 border-dashed border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                                      >
                                        <Plus className="w-7 h-7 mb-1.5" />
                                        <p className="text-xs text-center font-medium">{searchQuery || selectedPriority !== 'all' ? 'Eşleşen görev yok' : 'Görev eklemek için tıklayın'}</p>
                                      </button>
                                    )}
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
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-800 overflow-hidden">
                   <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
                     <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                        <ListTodo className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400" />
                        {modalMode === 'add' ? 'Görev Oluştur' : 'Görev Düzenle'}
                     </h3>
                     <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                        <X className="w-5 h-5" />
                     </button>
                   </div>
                   
                   <form onSubmit={handleModalSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                      {/* Akıllı Ekleme */}
                      {modalMode === 'add' && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                          <label className="flex items-center text-sm font-semibold text-indigo-700 dark:text-indigo-400 mb-2">
                            <Sparkles className="w-4 h-4 mr-1.5" /> Sys Pilot ile Hızlı Ekle
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={smartInput}
                              onChange={e => setSmartInput(e.target.value)}
                              placeholder="Örn: Yarın 15'te raporu bitir #iş !acil"
                              className="flex-1 px-3 py-2 text-sm border border-indigo-200 dark:border-indigo-700/50 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-white"
                              onKeyDown={(e) => { if(e.key === 'Enter'){ e.preventDefault(); handleSmartParse(); } }}
                            />
                            <button 
                              type="button" 
                              onClick={handleSmartParse}
                              disabled={isSmartLoading || !smartInput.trim()}
                              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 flex items-center"
                            >
                              {isSmartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ayrıştır'}
                            </button>
                          </div>
                        </div>
                      )}

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
                         <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                           <ReactQuill 
                             theme="snow"
                             value={formData.description}
                             onChange={val => setFormData({...formData, description: val})}
                             className="text-slate-800 dark:text-white"
                           />
                         </div>
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
                           <Flatpickr
                             data-enable-time
                             value={formData.due_date ? new Date(formData.due_date) : ''}
                             onChange={([date]) => setFormData({ ...formData, due_date: date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '' })}
                             options={{
                               locale: Turkish,
                               dateFormat: "Y-m-d H:i",
                               time_24hr: true,
                               disableMobile: true
                             }}
                             className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors cursor-pointer"
                             placeholder="Tarih seçin (Opsiyonel)"
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
                         <div className="flex justify-between items-center mb-1.5">
                           <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Alt Görevler (Checklist)</label>
                           <button 
                             type="button" 
                             onClick={generateSubtasksAI}
                             disabled={isAILoading}
                             className="text-xs flex items-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition font-medium disabled:opacity-50"
                           >
                             {isAILoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1.5" />}
                             AI ile Alt Görev Üret
                           </button>
                         </div>
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

                       {modalMode === 'edit' && formData.id && (
                          <TaskComments taskId={formData.id} isDark={document.documentElement.classList.contains('dark')} />
                       )}

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
