import React, { useEffect, useState } from 'react';
import {
  Calendar, Clock, AlignLeft, Tag, X, Paperclip,
  Users, RefreshCw, Trash2, Save, Plus, Download, Wand2, Loader2
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/airbnb.css';
import { Turkish } from 'flatpickr/dist/l10n/tr.js';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 ' +
  'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm ' +
  'placeholder:text-slate-400 dark:placeholder:text-slate-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ' +
  'transition-all duration-150';

const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5';

const EventModal = ({
  isOpen,
  onClose,
  mode,
  formData,
  setFormData,
  categories,
  onSubmit,
  onDelete,
  attachmentFile,
  setAttachmentFile
}) => {
  const [isAILoading, setIsAILoading] = useState(false);

  const summarizeNotesAI = async () => {
    if (!formData.description) {
      toast.error('Özetlenecek not bulunamadı.');
      return;
    }
    setIsAILoading(true);
    try {
      const res = await api.post('/ai/summarize-notes', { notes: formData.description });
      setFormData(prev => ({ ...prev, description: res.data.summary }));
      toast.success('Notlar AI tarafından özetlendi!');
    } catch (error) {
      toast.error('Notlar özetlenemedi.');
    } finally {
      setIsAILoading(false);
    }
  };

  // ESC ile kapat
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isEdit = mode === 'edit';
  const selectedCat = categories.find(c => String(c.id) === String(formData.category_id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Kategori renk nokta */}
            {selectedCat && (
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                style={{ backgroundColor: selectedCat.color_hex || '#6366f1', ringColor: selectedCat.color_hex }}
              />
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                {isEdit ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {isEdit ? 'Bilgileri güncelleyip kaydedin' : 'Yeni bir etkinlik oluşturun'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Form Body (scrollable) ──────────────────────────── */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Başlık */}
            <div>
              <label className={labelClass}>
                <Calendar className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                Etkinlik Başlığı <span className="text-red-400 normal-case tracking-normal">*</span>
              </label>
              <input
                type="text" required
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className={inputClass}
                placeholder="Örn: Proje Toplantısı"
              />
            </div>

            {/* Tarih / Saat Satırı */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <Clock className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                  Başlangıç <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <Flatpickr
                  data-enable-time
                  value={formData.start_datetime ? new Date(formData.start_datetime) : ''}
                  onChange={([date]) => setFormData({ ...formData, start_datetime: date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '' })}
                  options={{
                    locale: Turkish,
                    dateFormat: "Y-m-d H:i",
                    time_24hr: true,
                    disableMobile: true // Bu sayede mobilde native açılmaz, düzgün styled picker açılır
                  }}
                  className={inputClass + ' cursor-pointer bg-white dark:bg-slate-900'}
                  placeholder="Başlangıç seçin"
                />
              </div>
              <div>
                <label className={labelClass}>
                  <Clock className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                  Bitiş <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <Flatpickr
                  data-enable-time
                  value={formData.end_datetime ? new Date(formData.end_datetime) : ''}
                  onChange={([date]) => setFormData({ ...formData, end_datetime: date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '' })}
                  options={{
                    locale: Turkish,
                    dateFormat: "Y-m-d H:i",
                    time_24hr: true,
                    disableMobile: true
                  }}
                  className={inputClass + ' cursor-pointer bg-white dark:bg-slate-900'}
                  placeholder="Bitiş seçin"
                />
              </div>
            </div>

            {/* Tüm Gün toggle */}
            <label className="flex items-center gap-3 cursor-pointer group select-none w-fit">
              <div
                onClick={() => setFormData({ ...formData, all_day: !formData.all_day })}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  formData.all_day ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  formData.all_day ? 'translate-x-5' : ''
                }`} />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                Tüm Gün Etkinliği
              </span>
            </label>

            {/* Kategori + Tekrarlama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <Tag className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                  Kategori <span className="text-red-400 normal-case tracking-normal">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className={inputClass + ' appearance-none pr-10'}
                  >
                    <option value="">Kategori seçin</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {selectedCat && (
                    <span
                      className="absolute right-9 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full pointer-events-none"
                      style={{ backgroundColor: selectedCat.color_hex || '#6366f1' }}
                    />
                  )}
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div>
                <label className={labelClass}>
                  <RefreshCw className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                  Tekrarlama
                </label>
                <div className="relative">
                  <select
                    value={formData.rrule}
                    onChange={e => setFormData({ ...formData, rrule: e.target.value })}
                    className={inputClass + ' appearance-none pr-10'}
                  >
                    <option value="">Tekrar etmez</option>
                    <option value="daily">Her Gün</option>
                    <option value="weekly">Her Hafta</option>
                    <option value="monthly">Her Ay</option>
                    <option value="yearly">Her Yıl</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Davetliler */}
            <div>
              <label className={labelClass}>
                <Users className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                Davetliler (E-Posta)
              </label>
              <input
                type="text"
                value={formData.shared_emails}
                onChange={e => setFormData({ ...formData, shared_emails: e.target.value })}
                className={inputClass}
                placeholder="virgülle ayırın: ali@email.com, veli@email.com"
              />
              <p className="mt-1 text-xs text-slate-400">Davetlilere otomatik hatırlatma e-postası gönderilir.</p>
            </div>

            {/* Açıklama */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <AlignLeft className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                  Açıklama / Notlar
                </label>
                <button 
                  type="button" 
                  onClick={summarizeNotesAI}
                  disabled={isAILoading}
                  className="text-[11px] flex items-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition font-medium disabled:opacity-50 tracking-wide"
                >
                  {isAILoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
                  AI ile Özetle
                </button>
              </div>
              <textarea
                rows={3}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className={inputClass + ' resize-none'}
                placeholder="Etkinlikle ilgili not veya açıklama ekleyin..."
              />
            </div>

            {/* Dosya Eki */}
            <div>
              <label className={labelClass}>
                <Paperclip className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
                Dosya Eki
                {formData.attachment_url && (
                  <a
                    href={`${BASE_URL}${formData.attachment_url}`}
                    target="_blank" rel="noreferrer"
                    className="ml-2 normal-case tracking-normal text-indigo-500 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Mevcut eki görüntüle
                  </a>
                )}
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition">
                  <Paperclip className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition flex-shrink-0" />
                  <span className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">
                    {attachmentFile ? attachmentFile.name : 'Dosya seçin veya buraya sürükleyin'}
                  </span>
                </div>
                <input
                  type="file"
                  onChange={e => setAttachmentFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

          </div>

          {/* ── Footer ─────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
            {isEdit ? (
              <button
                type="button" onClick={onDelete}
                className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl transition"
              >
                <Trash2 className="w-4 h-4" />
                Etkinliği Sil
              </button>
            ) : <div />}

            <div className="flex gap-3">
              <button
                type="button" onClick={onClose}
                className="px-5 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                İptal
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20 transition"
              >
                <Save className="w-4 h-4" />
                {isEdit ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(EventModal);
