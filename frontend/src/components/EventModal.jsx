import React from 'react';
import { X, Download } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
            {mode === 'add' ? 'Yeni Etkinlik Düzenle' : 'Etkinlik Detayları'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Etkinlik Başlığı</label>
            <input
              type="text" required
              value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
              placeholder="Örn: Proje Toplantısı"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Başlangıç</label>
              <input
                type="datetime-local" required
                value={formData.start_datetime} onChange={e => setFormData({ ...formData, start_datetime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bitiş</label>
              <input
                type="datetime-local" required
                value={formData.end_datetime} onChange={e => setFormData({ ...formData, end_datetime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tekrarlama</label>
              <select
                value={formData.rrule} onChange={e => setFormData({ ...formData, rrule: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-colors"
              >
                <option value="">Tekrar Etmez</option>
                <option value="daily">Her Gün</option>
                <option value="weekly">Her Hafta</option>
                <option value="monthly">Her Ay</option>
                <option value="yearly">Her Yıl</option>
              </select>
            </div>
          </div>

          {/* Ekstra Seçenekler */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              <input
                type="checkbox" id="allDayCB"
                checked={formData.all_day} onChange={e => setFormData({ ...formData, all_day: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="allDayCB" className="text-sm font-medium text-slate-700 dark:text-slate-300">Tüm Gün Etkinliği</label>
            </div>
            
            <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex justify-between items-center">
                  <span>Dosya Eki (Opsiyonel)</span>
                  {formData.attachment_url && (
                    <a href={`http://localhost:3001${formData.attachment_url}`} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline text-xs flex items-center font-semibold">
                      <Download className="w-3 h-3 mr-1"/> Mevcut Ek
                    </a>
                  )}
                </label>
                <input
                  type="file"
                  onChange={e => setAttachmentFile(e.target.files[0])}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 rounded-lg text-sm"
                />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori (Renk)</label>
              <select
                required
                value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
              >
                {categories.length === 0 && <option value="">Kategori Bulunamadı</option>}
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Davetliler (E-Posta)</label>
              <input
                type="text"
                value={formData.shared_emails} onChange={e => setFormData({ ...formData, shared_emails: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                placeholder="virgülle ayırın (a@b.com, c@d.com)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Açıklama (Opsiyonel)</label>
            <textarea
              rows="3"
              value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none transition-colors"
              placeholder="Açıklama veya notlarınızı buraya girebilirsiniz..."
            ></textarea>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2">
            {mode === 'edit' ? (
              <button type="button" onClick={onDelete} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium px-4 py-2 rounded-lg transition">SİL</button>
            ) : (
              <div></div>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium px-4 py-2 rounded-lg transition">İptal</button>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 rounded-lg transition shadow-md shadow-indigo-200 dark:shadow-none">Kaydet</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(EventModal);
