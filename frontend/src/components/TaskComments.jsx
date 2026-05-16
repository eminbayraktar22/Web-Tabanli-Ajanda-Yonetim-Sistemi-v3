import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Send, Trash2, User } from 'lucide-react';

const TaskComments = ({ taskId, isDark }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/tasks/${taskId}/comments`);
      setComments(res.data.data);
    } catch (error) {
      toast.error('Yorumlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, { content: newComment });
      setComments([...comments, res.data.data]);
      setNewComment('');
    } catch (error) {
      toast.error('Yorum eklenemedi');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments(comments.filter(c => c.id !== id));
      toast.success('Yorum silindi');
    } catch (error) {
      toast.error('Yorum silinemedi');
    }
  };

  if (loading) return <div className="p-4 text-center text-sm text-slate-500">Yükleniyor...</div>;

  return (
    <div className={`mt-4 border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
      <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>Yorumlar ve Takım İçi İletişim</h4>
      <div className="space-y-3 max-h-40 overflow-y-auto mb-3 pr-2">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-2">Henüz yorum yok. İlk yorumu sen yap!</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className={`flex gap-2 p-2.5 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
               {c.User?.avatar_url ? (
                  <img src={`${api.defaults.baseURL.replace('/api', '')}${c.User.avatar_url}`} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
               ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-indigo-600" />
                  </div>
               )}
               <div className="flex-1">
                 <div className="flex justify-between items-center">
                   <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.User?.name}</span>
                   <button type="button" onClick={() => handleDelete(c.id)} className="text-slate-400 hover:text-red-500 transition"><Trash2 className="w-3 h-3"/></button>
                 </div>
                 <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{c.content}</p>
               </div>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newComment} 
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => {
            if(e.key === 'Enter') { e.preventDefault(); handleAdd(e); }
          }}
          placeholder="Yorum yaz..."
          className={`flex-1 px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
        />
        <button type="button" onClick={handleAdd} disabled={!newComment.trim()} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
export default TaskComments;
