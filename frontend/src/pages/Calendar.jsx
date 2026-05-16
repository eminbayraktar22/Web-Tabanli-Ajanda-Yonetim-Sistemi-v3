import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import trLocale from '@fullcalendar/core/locales/tr';
import { Download, Plus, SlidersHorizontal, X, Calendar as CalendarIcon, RefreshCw, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import EventModal from '../components/EventModal';
import { Draggable } from '@fullcalendar/interaction';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [unplannedTasks, setUnplannedTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showTeamCalendar, setShowTeamCalendar] = useState(false);
  const [isTasksPanelOpen, setIsTasksPanelOpen] = useState(window.innerWidth >= 1024);
  const { user } = useContext(AuthContext);

  const initialView = window.innerWidth < 768 ? 'timeGridDay' : 'dayGridMonth';

  const [formData, setFormData] = useState({
    id: '', title: '', description: '',
    start_datetime: '', end_datetime: '',
    category_id: '', all_day: false,
    shared_emails: '', rrule: '', attachment_url: ''
  });
  const [attachmentFile, setAttachmentFile] = useState(null);

  // Filtre state
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const calendarRef = useRef(null);
  const draggableRef = useRef(null);

  // ── Veri yükleme ────────────────────────────────────────
  const fetchEventsAndCategories = async () => {
    setIsLoading(true);
    try {
      const [eventsRes, catsRes, tasksRes] = await Promise.all([
        api.get('/events'),
        api.get('/categories'),
        api.get('/tasks')
      ]);

      setCategories(catsRes.data.data || []);

      const formattedEvents = (eventsRes.data.data || []).map(ev => {
        const isMine = ev.user_id === user.id || ev.shared_emails?.includes(user.email);
        const base = {
          id: ev.id,
          title: isMine ? ev.title : `[${ev.User?.name}] ${ev.title}`,
          allDay: ev.all_day,
          backgroundColor: isMine ? (ev.Category?.color_hex || '#6366f1') : '#e2e8f0',
          borderColor: isMine ? (ev.Category?.color_hex || '#6366f1') : '#cbd5e1',
          textColor: isMine ? '#ffffff' : '#475569',
          extendedProps: {
            description: ev.description,
            category_id: ev.category_id,
            shared_emails: ev.shared_emails || '',
            rrule: ev.rrule || '',
            attachment_url: ev.attachment_url || '',
            isMine,
            userName: ev.User?.name || 'Bilinmiyor'
          }
        };
        if (ev.rrule) {
          base.rrule = { freq: ev.rrule, dtstart: ev.start_datetime };
          if (!ev.all_day) {
            const ms = new Date(ev.end_datetime) - new Date(ev.start_datetime);
            const h = Math.floor(ms / 3600000);
            const m = Math.floor((ms % 3600000) / 60000);
            base.duration = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
          }
        } else {
          base.start = ev.start_datetime;
          base.end = ev.end_datetime;
        }
        return base;
      });

      const priorityEmoji = { low: '⬇️', medium: '⏺️', high: '⬆️', critical: '🚨' };
      const formattedTasks = (tasksRes.data.data || [])
        .filter(t => t.due_date)
        .map(t => ({
          id: `task-${t.id}`,
          title: `${priorityEmoji[t.priority] || '⏺️'} [Görev] ${t.title}`,
          start: t.due_date,
          allDay: true,
          backgroundColor: t.status === 'done' ? '#10b981' : '#f59e0b',
          borderColor: t.status === 'done' ? '#059669' : '#d97706',
          editable: true,
          extendedProps: { isTask: true, taskId: t.id, description: t.description, status: t.status, category_id: t.category_id }
        }));

      const unplTasks = (tasksRes.data.data || []).filter(t => !t.due_date && t.status !== 'done');
      setUnplannedTasks(unplTasks);

      setEvents([...formattedEvents, ...formattedTasks]);
    } catch (error) {
      toast.error('Takvim verileri yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchEventsAndCategories(); }, []);

  useEffect(() => {
    if (draggableRef.current) {
      let draggable = new Draggable(draggableRef.current, {
        itemSelector: '.external-task',
        eventData: function(eventEl) {
          return {
            title: eventEl.getAttribute('data-title'),
            id: 'task-' + eventEl.getAttribute('data-taskid'),
            create: false,
            extendedProps: { isTask: true, taskId: eventEl.getAttribute('data-taskid') }
          };
        }
      });
      return () => draggable.destroy();
    }
  }, [unplannedTasks]);

  // ── ICS Dışa Aktarım ───────────────────────────────────
  const handleExportToICS = async () => {
    try {
      const id = toast.loading('Takvim hazırlanıyor...');
      const res = await api.get('/events/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'Ajanda_Disa_Aktarim.ics';
      document.body.appendChild(a); a.click(); a.remove();
      toast.dismiss(id);
      toast.success('Takvim dışa aktarıldı');
    } catch { toast.dismiss(); toast.error('Dışa aktarım başarısız'); }
  };

  const formatDateTimeForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  // ── Takvim etkileşimleri ───────────────────────────────
  const handleDateSelect = (info) => {
    setModalMode('add');
    const start = new Date(info.start);
    const end = info.allDay ? new Date(start.getTime() + 3600000) : new Date(info.end);
    setFormData({
      id: '', title: '', description: '',
      start_datetime: formatDateTimeForInput(start),
      end_datetime: formatDateTimeForInput(end),
      category_id: categories.length > 0 ? categories[0].id : '',
      all_day: info.allDay, shared_emails: '', rrule: '', attachment_url: ''
    });
    setAttachmentFile(null);
    setIsModalOpen(true);
    info.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo) => {
    if (clickInfo.event.extendedProps?.isTask) {
      toast('Bu bir görev kartı. Düzenlemek için Görevler sayfasını kullanın.', { icon: 'ℹ️' });
      return;
    }
    setModalMode('edit');
    const ev = clickInfo.event;
    setFormData({
      id: ev.id, title: ev.title,
      description: ev.extendedProps.description || '',
      start_datetime: formatDateTimeForInput(ev.start),
      end_datetime: formatDateTimeForInput(ev.end || ev.start),
      category_id: ev.extendedProps.category_id || (categories.length > 0 ? categories[0].id : ''),
      all_day: ev.allDay,
      shared_emails: ev.extendedProps.shared_emails || '',
      rrule: ev.extendedProps.rrule || '',
      attachment_url: ev.extendedProps.attachment_url || ''
    });
    setAttachmentFile(null);
    setIsModalOpen(true);
  };

  const handleEventDrop = async (info) => {
    const ev = info.event;
    try {
      if (ev.extendedProps?.isTask) {
        await api.put(`/tasks/${ev.extendedProps.taskId}`, {
          due_date: ev.start.toISOString()
        });
        toast.success('Görev takvime taşındı');
      } else {
        await api.put(`/events/${ev.id}`, {
          start_datetime: ev.start.toISOString(),
          end_datetime: (ev.end || ev.start).toISOString(),
          all_day: ev.allDay
        });
        toast.success('Etkinlik tarihi güncellendi');
      }
    } catch {
      toast.error('Güncelleme başarısız, değişiklik geri alındı.');
      info.revert();
    }
  };

  const handleExternalDrop = async (info) => {
    try {
      const taskId = info.draggedEl.getAttribute('data-taskid');
      await api.put(`/tasks/${taskId}`, {
        due_date: info.date.toISOString()
      });
      toast.success('Görev takvime başarıyla eklendi');
      fetchEventsAndCategories();
    } catch {
      toast.error('Görev eklenemedi');
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      let attachUrl = formData.attachment_url;
      if (attachmentFile) {
        const fd = new FormData();
        fd.append('file', attachmentFile);
        const r = await api.post('/events/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        attachUrl = r.data.url;
      }
      const payload = { ...formData, attachment_url: attachUrl };
      if (modalMode === 'add') {
        await api.post('/events', payload); toast.success('Etkinlik eklendi!');
      } else {
        await api.put(`/events/${formData.id}`, payload); toast.success('Etkinlik güncellendi!');
      }
      setIsModalOpen(false);
      fetchEventsAndCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'İşlem başarısız.');
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/events/${formData.id}`);
      toast.success('Etkinlik silindi.');
      setIsModalOpen(false);
      fetchEventsAndCategories();
    } catch { toast.error('Etkinlik silinemedi.'); }
  };

  const hasActiveFilters = selectedCategory !== 'all' || dateFrom || dateTo;
  const clearFilters = () => { setSelectedCategory('all'); setDateFrom(''); setDateTo(''); };

  const filteredEvents = events.filter(ev => {
    if (!showTeamCalendar && ev.extendedProps?.isTask !== true && ev.extendedProps?.isMine === false) return false;
    if (selectedCategory !== 'all' && ev.extendedProps?.category_id !== selectedCategory) return false;
    if (dateFrom && ev.start && new Date(ev.start) < new Date(dateFrom)) return false;
    if (dateTo && ev.start && new Date(ev.start) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">

      {/* ── Sayfa Başlığı + Kontroller ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Takvim
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Etkinliklere tıklayın, yeni gün seçin veya sürükleyip bırakın.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Ekip Takvimi Toggle */}
          <button
            onClick={() => setShowTeamCalendar(p => !p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border transition ${
              showTeamCalendar
                ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            {showTeamCalendar ? 'Ekip Takvimi Açık' : 'Sadece Benim'}
          </button>

          {/* Filtre Butonu */}
          <button
            onClick={() => setFilterOpen(p => !p)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border transition ${
              hasActiveFilters
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtrele
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
          </button>

          {/* Yenile */}
          <button
            onClick={fetchEventsAndCategories}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* ICS Dışa Aktar */}
          <button
            onClick={handleExportToICS}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
          >
            <Download className="w-4 h-4" /> Dışa Aktar
          </button>

          {/* Yeni Etkinlik */}
          <button
            onClick={() => {
              setModalMode('add');
              setFormData({ id: '', title: '', description: '', start_datetime: '', end_datetime: '', category_id: categories.length > 0 ? categories[0].id : '', all_day: false, shared_emails: '', rrule: '', attachment_url: '' });
              setAttachmentFile(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Yeni Etkinlik
          </button>
        </div>
      </div>

      {/* ── Filtre Paneli ──────────────────────────────────── */}
      {filterOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Filtreler</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition">
                <X className="w-3 h-3" /> Temizle
              </button>
            )}
          </div>

          {/* Kategori chip'leri */}
          <div className="mb-4">
            <p className="text-xs font-medium text-slate-400 mb-2">Kategori</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition ${
                  selectedCategory === 'all'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}>
                Tümü
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 flex items-center gap-1.5 transition ${
                    selectedCategory === cat.id ? 'border-current' : 'border-transparent hover:border-current/30'
                  }`}
                  style={{ color: cat.color_hex, backgroundColor: selectedCategory === cat.id ? cat.color_hex + '20' : undefined }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color_hex }} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tarih aralığı */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1.5">Başlangıç Tarihi</p>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1.5">Bitiş Tarihi</p>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="px-3.5 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            </div>
          </div>
        </div>
      )}

      {/* ── Takvim Alanı ve Dış Görevler ──────────────────── */}
      <div className="flex flex-1 overflow-hidden gap-4 flex-col lg:flex-row">
        {/* Dış Görevler Paneli */}
        {isTasksPanelOpen ? (
          <div className="w-full lg:w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 flex flex-col flex-shrink-0 max-h-48 lg:max-h-full transition-all">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Planlanmamış Görevler</h3>
              <button onClick={() => setIsTasksPanelOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div ref={draggableRef} className="flex-1 overflow-y-auto space-y-2 pr-1">
            {unplannedTasks.length === 0 ? (
              <p className="text-xs text-slate-400">Tüm görevleriniz planlanmış!</p>
            ) : (
              unplannedTasks.map(task => (
                <div
                  key={task.id}
                  className="external-task p-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl cursor-grab hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition shadow-sm text-sm"
                  data-taskid={task.id}
                  data-title={task.title}
                >
                  <div className="font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{task.title}</div>
                  <div className="text-[10px] text-slate-500 mt-1 uppercase">Sürükle bırak</div>
                </div>
              ))
            )}
          </div>
        </div>
        ) : (
          <button 
            onClick={() => setIsTasksPanelOpen(true)} 
            className="hidden lg:flex w-12 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-2 flex-col items-center justify-start flex-shrink-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="Görevleri Göster"
          >
            <ChevronRight className="w-5 h-5 text-slate-400 mt-2" />
            <span className="text-[10px] uppercase font-bold text-slate-400 mt-4 tracking-widest" style={{ writingMode: 'vertical-lr' }}>Görevler</span>
          </button>
        )}

        {/* Takvim */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex-1 overflow-hidden calendar-container p-4 sm:p-6 min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Takvim yükleniyor...</p>
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
              initialView={initialView}
              locale={trLocale}
              events={filteredEvents}
              editable={true}
              droppable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventDrop}
              drop={handleExternalDrop}
              height="100%"
              eventDidMount={(info) => {
                info.el.title = info.event.title;
              }}
            />
          )}
        </div>
      </div>

      {/* ── Legand (Kategori Renkleri) ─────────────────────── */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-1">
          <span className="text-xs text-slate-400 font-medium">Renkler:</span>
          {categories.map(cat => (
            <span key={cat.id} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color_hex }} />
              {cat.name}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Bekleyen Görev
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Tamamlanan Görev
          </span>
        </div>
      )}

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        onSubmit={handleModalSubmit}
        onDelete={handleDeleteEvent}
        attachmentFile={attachmentFile}
        setAttachmentFile={setAttachmentFile}
      />
    </div>
  );
};

export default Calendar;
