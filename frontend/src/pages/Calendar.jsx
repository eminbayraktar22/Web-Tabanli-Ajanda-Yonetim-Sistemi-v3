import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import trLocale from '@fullcalendar/core/locales/tr';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import EventModal from '../components/EventModal';

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    category_id: '',
    all_day: false,
    shared_emails: '',
    rrule: '',
    attachment_url: ''
  });
  const [attachmentFile, setAttachmentFile] = useState(null);

  const calendarRef = useRef(null);

  // Verileri Getir
  const fetchEventsAndCategories = async () => {
    try {
      const [eventsRes, catsRes, tasksRes] = await Promise.all([
        api.get('/events'),
        api.get('/categories'),
        api.get('/tasks')
      ]);

      setCategories(catsRes.data.data || []);

      // FullCalendar Formatına Dönüştür
      const formattedEvents = (eventsRes.data.data || []).map(ev => {
        const baseEvent = {
          id: ev.id,
          title: ev.title,
          allDay: ev.all_day,
          backgroundColor: ev.Category?.color_hex || '#3b82f6',
          extendedProps: {
            description: ev.description,
            category_id: ev.category_id,
            shared_emails: ev.shared_emails || '',
            rrule: ev.rrule || '',
            attachment_url: ev.attachment_url || ''
          }
        };

        if (ev.rrule) {
          baseEvent.rrule = {
            freq: ev.rrule, // 'daily', 'weekly', 'monthly', 'yearly'
            dtstart: ev.start_datetime
          };
          if (!ev.all_day) {
             const startObj = new Date(ev.start_datetime);
             const endObj = new Date(ev.end_datetime);
             const durationMs = endObj.getTime() - startObj.getTime();
             const hours = Math.floor(durationMs / 3600000);
             const minutes = Math.floor((durationMs % 3600000) / 60000);
             baseEvent.duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
        } else {
          baseEvent.start = ev.start_datetime;
          baseEvent.end = ev.end_datetime;
        }
        
        return baseEvent;
      });

      // Görevleri FullCalendar Formatına Dönüştür
      const priorityEmoji = { low: '⬇️', medium: '⏺️', high: '⬆️', critical: '🚨' };

      const formattedTasks = (tasksRes.data.data || [])
        .filter(t => t.due_date) // Sadece tarihi olanlar
        .map(t => ({
          id: `task-${t.id}`,
          title: `${priorityEmoji[t.priority] || '⏺️'} [Görev] ${t.title}`,
          start: t.due_date,
          allDay: true, // Görevler takvimde tüm gün eylemi gibi dursun
          backgroundColor: t.status === 'done' ? '#10b981' : '#f59e0b', // Yapıldıysa Yeşil, Bekliyorsa Turuncu
          borderColor: t.status === 'done' ? '#059669' : '#d97706',
          editable: false, // Sürükle bırak (Düzenleme) kapalı
          extendedProps: {
            isTask: true,
            taskId: t.id,
            description: t.description,
            status: t.status,
            category_id: t.category_id
          }
        }));

      setEvents([...formattedEvents, ...formattedTasks]);
    } catch (error) {
      toast.error('Takvim verileri yüklenirken hata oluştu.');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEventsAndCategories();
  }, []);

  // --- Dışa Aktarım İşlemi (.ICS) ---
  const handleExportToICS = async () => {
    try {
      const toastId = toast.loading('Takvim hazırlanıyor...');
      const response = await api.get('/events/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Ajanda_Disa_Aktarim.ics');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.dismiss(toastId);
      toast.success('Takvim başarıyla dışa aktarıldı');
    } catch (error) {
      toast.dismiss();
      toast.error('Dışa aktarım sırasında hata oluştu');
    }
  };

  // Helper function to format date for datetime-local input
  const formatDateTimeForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
  };

  // --- Takvim Etkileşimleri ---

  // Boş güne veya saate tıklandığında (Yeni Ekle)
  const handleDateSelect = (selectInfo) => {
    setModalMode('add');

    // Varsayılan bitiş tarihi, başlangıçtan 1 saat sonrası veya seçilen bitiş tarihi
    const startObj = new Date(selectInfo.start);
    let endObj = new Date(selectInfo.end);

    // If it's an all-day selection, FullCalendar might give end as the next day's start.
    // For input, we want it to be the end of the selected day or 1 hour after start.
    if (selectInfo.allDay) {
      endObj = new Date(startObj.getTime() + 60 * 60 * 1000); // Default 1 hour after start for all-day add
    }

    const startStr = formatDateTimeForInput(startObj);
    const endStr = formatDateTimeForInput(endObj);

    setFormData({
      id: '',
      title: '',
      description: '',
      start_datetime: startStr,
      end_datetime: endStr,
      category_id: categories.length > 0 ? categories[0].id : '',
      all_day: selectInfo.allDay,
      shared_emails: '',
      rrule: '',
      attachment_url: ''
    });
    setAttachmentFile(null);

    setIsModalOpen(true);
    // Takvim seçimini temizle
    let calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
  };

  // Var Olan Etkinliğe Tıklandığında (Düzenle/Sil)
  const handleEventClick = (clickInfo) => {
    setModalMode('edit');
    const ev = clickInfo.event;

    const startStr = formatDateTimeForInput(ev.start);
    const endStr = formatDateTimeForInput(ev.end || ev.start); // If end is null, use start

    setFormData({
      id: ev.id,
      title: ev.title,
      description: ev.extendedProps.description || '',
      start_datetime: startStr,
      end_datetime: endStr,
      category_id: ev.extendedProps.category_id || (categories.length > 0 ? categories[0].id : ''),
      all_day: ev.allDay,
      shared_emails: ev.extendedProps.shared_emails || '',
      rrule: ev.extendedProps.rrule || '',
      attachment_url: ev.extendedProps.attachment_url || ''
    });
    setAttachmentFile(null);

    setIsModalOpen(true);
  };

  // Sürükle Bırak (Drag & Drop) ile Tarih Değiştirme
  const handleEventDrop = async (dropInfo) => {
    const ev = dropInfo.event;
    try {
      await api.put(`/events/${ev.id}`, {
        start_datetime: ev.start.toISOString(),
        end_datetime: ev.end ? ev.end.toISOString() : ev.start.toISOString(),
        all_day: ev.allDay
      });
      toast.success('Etkinlik tarihi güncellendi');
    } catch (error) {
      toast.error('Tarih güncellenemedi, değişiklik geri alınıyor.');
      dropInfo.revert();
    }
  };

  // Modal Form Gönderimi (Ekle / Güncelle)
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalAttachmentUrl = formData.attachment_url;

      if (attachmentFile) {
        const fileData = new FormData();
        fileData.append('file', attachmentFile);
        const uploadRes = await api.post('/events/upload', fileData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalAttachmentUrl = uploadRes.data.url;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime,
        category_id: formData.category_id,
        all_day: formData.all_day,
        shared_emails: formData.shared_emails,
        rrule: formData.rrule,
        attachment_url: finalAttachmentUrl
      };

      if (modalMode === 'add') {
        await api.post('/events', payload);
        toast.success('Etkinlik eklendi!');
      } else {
        await api.put(`/events/${formData.id}`, payload);
        toast.success('Etkinlik güncellendi!');
      }

      setIsModalOpen(false);
      fetchEventsAndCategories(); // Takvimi yenile
    } catch (error) {
      toast.error(error.response?.data?.message || 'İşlem başarısız.');
    }
  };

  // Etkinlik Silme
  const handleDeleteEvent = async () => {
    if (!window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/events/${formData.id}`);
      toast.success('Etkinlik silindi.');
      setIsModalOpen(false);
      fetchEventsAndCategories();
    } catch (error) {
      toast.error('Etkinlik silinemedi.');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-sans tracking-tight">Takvim</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Zamanınızı yönetmek için etkinliklere tıklayın veya sürükleyin.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
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
            onClick={handleExportToICS}
            className="flex-1 md:flex-none justify-center bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-emerald-700 transition flex items-center"
          >
            <Download className="w-5 h-5 mr-2" /> Dışa Aktar (.ICS)
          </button>
          <button
            onClick={() => {
              setModalMode('add');
              setFormData({ ...formData, id: '', title: '', description: '', start_datetime: '', end_datetime: '', category_id: categories.length > 0 ? categories[0].id : '' });
              setIsModalOpen(true);
            }}
            className="flex-1 md:flex-none justify-center bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition flex items-center"
          >
            + Yeni Etkinlik
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex-grow overflow-hidden calendar-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          initialView="dayGridMonth"
          locale={trLocale}
          events={events.filter(ev => selectedCategory === 'all' || ev.extendedProps?.category_id === selectedCategory)}
          editable={true} // Sürükle bırak açık
          selectable={true} // Tıklayıp seçme açık
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventDrop} // Boyutlandırma ile bitiş zamanı ayarını eventDrop metodu ile aynı apide yakalayabiliyoruz
          height="100%"
        />
      </div>

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
