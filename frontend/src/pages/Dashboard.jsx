import React, { useState, useEffect } from 'react';
import {
  CalendarDays, CheckCircle2, TrendingUp, LayoutDashboard,
  Clock, ListTodo, ArrowRight, Plus, Timer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ActivityWidget from '../components/ActivityWidget';

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
    </div>
    <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-2" />
    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32" />
  </div>
);

const StatCard = ({ label, value, description, icon: Icon, colorClass, bgClass, borderClass }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border ${borderClass} hover:shadow-md transition-all duration-200`}>
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <div className={`w-10 h-10 ${bgClass} rounded-xl flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
    </div>
    <p className={`text-3xl font-bold ${colorClass} font-sans tracking-tight`}>{value}</p>
    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>
  </div>
);

const DONUT_COLORS = ['#94a3b8', '#f59e0b', '#10b981'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-lg text-xs font-semibold text-slate-700 dark:text-slate-300">
        {payload[0].name}: {payload[0].value}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, taskStatusRes, upcomingRes] = await Promise.all([
          api.get('/stats/summary'),
          api.get('/stats/tasks-by-status'),
          api.get('/stats/upcoming')
        ]);
        setSummary(summaryRes.data.data);
        setTaskStatus(taskStatusRes.data.data);
        setUpcomingEvents(upcomingRes.data.data || []);
      } catch {
        try {
          const [eventsRes, tasksRes] = await Promise.all([api.get('/events'), api.get('/tasks')]);
          const events = eventsRes.data.data || [];
          const tasks = tasksRes.data.data || [];
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const endOfToday = new Date(startOfToday.getTime() + 86400000 - 1);
          const endOfWeek = new Date(now.getTime() + 7 * 86400000);
          let todayEvents = 0, weekEvents = 0;
          const future = [];
          events.forEach(ev => {
            const s = new Date(ev.start_datetime), e = new Date(ev.end_datetime);
            if (s <= endOfToday && e >= startOfToday) todayEvents++;
            if (s <= endOfWeek && e >= now) weekEvents++;
            if (e >= now) future.push(ev);
          });
          future.sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
          setUpcomingEvents(future.slice(0, 5));
          const done = tasks.filter(t => t.status === 'done').length;
          const todo = tasks.filter(t => t.status === 'todo').length;
          const inProg = tasks.filter(t => t.status === 'in-progress').length;
          setSummary({ todayEvents, weekEvents, totalEvents: events.length, totalTasks: tasks.length, doneTasks: done, completionRate: tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0 });
          setTaskStatus({ todo, inProgress: inProg, done, total: tasks.length });
        } catch { toast.error('Veriler yüklenirken hata oluştu'); }
      } finally { setIsLoading(false); }
    };
    fetchAll();
  }, []);

  const formatDate = (iso) => new Date(iso).toLocaleDateString('tr-TR', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const formatTime = (seconds) => {
    if (!seconds) return '0 dk';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}s ${m}d`;
    return `${m} dk`;
  };

  const taskTotal = taskStatus?.total || 0;
  const donutData = [
    { name: 'Bekliyor', value: taskStatus?.todo || 0 },
    { name: 'Yapılıyor', value: taskStatus?.inProgress || 0 },
    { name: 'Bitti', value: taskStatus?.done || 0 },
  ];
  const barData = [
    { name: 'Bekliyor', value: taskStatus?.todo || 0, fill: '#94a3b8' },
    { name: 'Yapılıyor', value: taskStatus?.inProgress || 0, fill: '#f59e0b' },
    { name: 'Bitti', value: taskStatus?.done || 0, fill: '#10b981' },
  ];

  return (
    <div>
      {/* Başlık */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-sans tracking-tight">Genel Bakış</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Ajandanızdaki özet bilgilere hızlıca göz atın.</p>
      </div>

      {/* Stat Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {isLoading ? [1,2,3,4,5].map(i => <SkeletonCard key={i} />) : (
          <>
            <StatCard label="Bugünkü Etkinlikler" value={summary?.todayEvents ?? 0} description="Bugün gerçekleşen etkinlikler" icon={CalendarDays} colorClass="text-indigo-600 dark:text-indigo-400" bgClass="bg-indigo-50 dark:bg-indigo-900/30" borderClass="border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/40" />
            <StatCard label="Bu Hafta" value={summary?.weekEvents ?? 0} description="Önümüzdeki 7 günde etkinlik" icon={TrendingUp} colorClass="text-violet-600 dark:text-violet-400" bgClass="bg-violet-50 dark:bg-violet-900/30" borderClass="border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-500/40" />
            <StatCard label="Tamamlanan Görevler" value={`${summary?.completionRate ?? 0}%`} description={`${summary?.doneTasks ?? 0} / ${summary?.totalTasks ?? 0} görev tamamlandı`} icon={CheckCircle2} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-50 dark:bg-emerald-900/30" borderClass="border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-500/40" />
            <StatCard label="Toplam Etkinlik" value={summary?.totalEvents ?? 0} description="Tüm zamanlar etkinlik sayısı" icon={LayoutDashboard} colorClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-50 dark:bg-amber-900/30" borderClass="border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-500/40" />
            <StatCard label="Harcanan Mesai" value={formatTime(summary?.totalTimeSpent)} description="Görevlere harcanan toplam süre" icon={Timer} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-50 dark:bg-blue-900/30" borderClass="border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-500/40" />
          </>
        )}
      </div>

      {/* Alt Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Görev Durumu — Donut + Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-slate-400" /> Görev Durumu
            </h2>
            <Link to="/tasks" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              Tümü <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />)}
            </div>
          ) : taskTotal === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <ListTodo className="w-7 h-7 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Henüz görev yok</p>
              <Link to="/tasks" className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                <Plus className="w-3 h-3" /> İlk görevi ekle
              </Link>
            </div>
          ) : (
            <>
              {/* Donut Chart */}
              <div className="h-36 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                      {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex justify-around mt-1 mb-4">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[i] }} />
                    <span className="text-slate-500 dark:text-slate-400">{d.name}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{d.value}</span>
                  </div>
                ))}
              </div>
              {/* Bar Chart */}
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barSize={28}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Yaklaşan Etkinlikler */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Yaklaşan Etkinlikler
            </h2>
            <Link to="/calendar" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              Takvime Git <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1,2,3].map(i => (
                <div key={i} className="p-5 flex gap-4 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                <CalendarDays className="w-8 h-8 text-indigo-300 dark:text-indigo-700" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Yaklaşan etkinlik yok</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">Takvimden yeni bir etkinlik ekleyin.</p>
              <Link to="/calendar" className="mt-1 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Etkinlik Ekle
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingEvents.map(event => (
                <div key={event.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-4">
                  <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-offset-2 dark:ring-offset-slate-900"
                    style={{ backgroundColor: event.Category?.color_hex || '#6366f1' }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{event.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{formatDate(event.start_datetime)}</p>
                  </div>
                  {event.Category && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: (event.Category.color_hex || '#6366f1') + '20', color: event.Category.color_hex || '#6366f1' }}>
                      {event.Category.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Son Hareketler */}
      <div className="mt-6">
         <ActivityWidget />
      </div>
    </div>
  );
};

export default Dashboard;
