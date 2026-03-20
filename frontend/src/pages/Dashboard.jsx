import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [stats, setStats] = useState({ today: 0, week: 0, categoriesCount: 0 });
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Eşzamanlı API çağrıları
                const [eventsRes, categoriesRes] = await Promise.all([
                    api.get('/events'),
                    api.get('/categories')
                ]);

                const events = eventsRes.data.data || [];
                const categories = categoriesRes.data.data || [];
                
                // --- İstatistik Hesaplamaları ---
                const now = new Date();
                
                // Bugünün Başlangıcı ve Bitişi
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
                
                // Bu Haftanın Bitişi (Şu andan itibaren +7 gün)
                const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

                let todayCount = 0;
                let weekCount = 0;
                const futureEvents = [];

                events.forEach(event => {
                    const eventStart = new Date(event.start_datetime);
                    const eventEnd = new Date(event.end_datetime);

                    // Etkinlik bugün mü? (Bugün başlıyor veya bugün bitiyor veya bugünü kapsıyor)
                    if (eventStart <= endOfToday && eventEnd >= startOfToday) {
                        todayCount++;
                    }

                    // Etkinlik bu hafta içinde mi?
                    if (eventStart <= endOfWeek && eventEnd >= now) {
                        weekCount++;
                    }

                    // Yaklaşanlar listesi için (Geçmemiş olanlar)
                    if (eventEnd >= now) {
                        futureEvents.push(event);
                    }
                });

                // Başlama tarihine göre sırala ve en yakın 5 tanesini al
                futureEvents.sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
                setUpcomingEvents(futureEvents.slice(0, 5));

                setStats({
                    today: todayCount,
                    week: weekCount,
                    categoriesCount: categories.length
                });

            } catch (error) {
                console.error('Dashboard data error:', error);
                toast.error('Veriler yüklenirken bir hata oluştu');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatDate = (isoString) => {
        const options = { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(isoString).toLocaleDateString('tr-TR', options);
    };

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-96 mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 h-32 flex flex-col justify-center">
                            <div className="h-4 bg-slate-200 rounded w-16 mb-4"></div>
                            <div className="h-10 bg-slate-200 rounded w-12 mb-2"></div>
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 h-64"></div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 font-sans tracking-tight">Genel Bakış</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Ajandanızdaki özet ipuçlarına hızlıca göz atın.</p>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:shadow-md transition-all">
                    <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">Bugün</h3>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 font-sans">{stats.today}</p>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center">
                        <CalendarIcon className="w-3 h-3 mr-1"/> Sıradaki Etkinlik Sayısı
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-500/50 hover:shadow-md transition-all">
                    <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">Bu Hafta (+7 Gün)</h3>
                    <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 font-sans">{stats.week}</p>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center">
                         <CalendarIcon className="w-3 h-3 mr-1"/> Toplam Planlanan İş
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-500/50 hover:shadow-md transition-all">
                    <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">Aktif Kategoriler</h3>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 font-sans">{stats.categoriesCount}</p>
                    <span className="text-xs text-slate-400 dark:text-slate-500 mt-2 flex items-center">
                         <CalendarIcon className="w-3 h-3 mr-1"/> Tanımlı Kategori Sayısı
                    </span>
                </div>
            </div>

            {/* Yaklaşan Etkinlikler Listesi */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                 <div className="px-6 py-5 border-b border-slate-100/80 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">Yaklaşan Etkinlikler</h2>
                 </div>
                 
                 <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {upcomingEvents.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                            <p>Yakın zamanda planlanmış bir etkinliğiniz görünmüyor.</p>
                            <p className="text-sm mt-1">Takvim üzerinden hemen bir tane oluşturabilirsiniz.</p>
                        </div>
                    ) : (
                        upcomingEvents.map(event => (
                            <div key={event.id} className="p-4 sm:p-6 hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <div>
                                    <h4 className="font-medium text-slate-800 dark:text-slate-200 text-base">{event.title}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{event.description || 'Açıklama belirtilmemiş'}</p>
                                </div>
                                <div className="flex-shrink-0 text-left sm:text-right">
                                    <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-700/10 dark:ring-indigo-300/20">
                                       {formatDate(event.start_datetime)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                 </div>
            </div>
        </div>
    );
};

export default Dashboard;
