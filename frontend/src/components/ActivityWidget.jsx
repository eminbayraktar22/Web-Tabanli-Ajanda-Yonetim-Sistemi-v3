import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Activity, Plus, Edit2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const ActivityWidget = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities?limit=10');
      setActivities(res.data.data);
    } catch (error) {
      console.error('Activities fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    if (action === 'CREATE') return <Plus className="w-3.5 h-3.5 text-green-500" />;
    if (action === 'UPDATE') return <Edit2 className="w-3.5 h-3.5 text-blue-500" />;
    if (action === 'DELETE') return <Trash2 className="w-3.5 h-3.5 text-red-500" />;
    return <Activity className="w-3.5 h-3.5 text-slate-500" />;
  };

  const getActionText = (log) => {
    const name = log.User?.name || 'Biri';
    const title = log.details?.title || log.entity_type;
    
    if (log.action === 'CREATE') return <span><b>{name}</b>, <i>{title}</i> oluşturdu.</span>;
    if (log.action === 'UPDATE') {
        if(log.details?.status === 'done') return <span><b>{name}</b>, <i>{title}</i> görevini tamamladı!</span>;
        return <span><b>{name}</b>, <i>{title}</i> güncelledi.</span>;
    }
    if (log.action === 'DELETE') return <span><b>{name}</b>, <i>{title}</i> sildi.</span>;
    return <span><b>{name}</b> işlem yaptı.</span>;
  };

  if (loading) return <div className="text-center p-4 text-sm text-slate-500">Hareketler yükleniyor...</div>;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5">
       <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center mb-4">
         <Activity className="w-4 h-4 mr-2 text-indigo-500" /> Son Hareketler
       </h3>
       <div className="space-y-4">
         {activities.length === 0 ? (
           <p className="text-xs text-slate-500 text-center py-4">Henüz bir hareket yok.</p>
         ) : (
           activities.map(log => (
             <div key={log.id} className="flex gap-3 relative">
                <div className="absolute top-6 bottom-[-16px] left-[15px] w-[2px] bg-slate-100 dark:bg-slate-800 last:hidden"></div>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 z-10">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 pb-1">
                   <p className="text-xs text-slate-700 dark:text-slate-300">
                     {getActionText(log)}
                   </p>
                   <span className="text-[10px] text-slate-400 mt-0.5 block">
                     {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: tr })}
                   </span>
                </div>
             </div>
           ))
         )}
       </div>
    </div>
  );
};
export default ActivityWidget;
