import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Calendar, LayoutDashboard, LogOut, Tags, Sun, Moon, ListTodo, Kanban,
  Bell, Search, X, CheckCircle2, Clock, CalendarDays, ChevronRight, User, FileText
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { WorkspaceContext } from '../context/WorkspaceContext';
import WorkspaceSwitcher from '../components/WorkspaceSwitcher';
import AICopilot from '../components/AICopilot';
import useShortcuts from '../hooks/useShortcuts';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api, { BASE_URL } from '../utils/api';

const STORAGE_KEY = 'ajanda_notifications';

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff} sn önce`;
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
  return `${Math.floor(diff / 86400)} gün önce`;
};

const DashboardLayout = ({ onSearchOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  // Mobil sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Arama
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ events: [], tasks: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const searchDebounce = useRef(null);

  // Bildirimler
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const saveNotifications = (list) => {
    setNotifications(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  // Bildirimler API'den yükle
  useEffect(() => {
    if (!user) return;
    api.get('/notifications').then(res => {
      const db = res.data.data || [];
      const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      // Merge: DB öncelikli, aynı id varsa güncelle
      const merged = [...db];
      local.forEach(l => { if (!merged.find(d => d.id === l.id)) merged.push(l); });
      merged.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
      saveNotifications(merged.slice(0, 20));
    }).catch(() => {});
  }, [user]);

  // Socket.IO
  useEffect(() => {
    if (!user?.id) return;
    const socket = io(BASE_URL);
    socket.emit('join', user.id);
    socket.on('notification', (data) => {
      const newNotif = { id: data.id || Date.now().toString(), ...data, is_read: false, created_at: new Date().toISOString() };
      setNotifications(prev => {
        const updated = [newNotif, ...prev].slice(0, 20);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      toast(data.message || data.title, {
        icon: '🔔', duration: 5000,
        style: {
          borderRadius: '12px',
          background: theme === 'dark' ? '#1e293b' : '#fff',
          color: theme === 'dark' ? '#f1f5f9' : '#334155',
          border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0'
        }
      });
    });
    return () => socket.disconnect();
  }, [user, theme]);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Esc ile kapat
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); setNotifOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Global Kısayollar
  useShortcuts({
    'c': () => navigate('/tasks?new=1'),
    'e': () => navigate('/calendar?new=1'),
    '/': (e) => { e.preventDefault(); onSearchOpen(); },
    'm': () => setSidebarOpen(p => !p),
  });

  // Drag & Drop
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      window.dispatchEvent(new CustomEvent('global-file-drop', { detail: { file } }));
      navigate('/tasks?new=1');
    }
  };

  // 300ms debounce arama
  const handleSearch = useCallback((val) => {
    setSearchQuery(val);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!val.trim() || val.trim().length < 2) { setSearchResults({ events: [], tasks: [] }); setSearchOpen(false); return; }
    searchDebounce.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(val.trim())}`);
        setSearchResults(res.data.data || { events: [], tasks: [] });
        setSearchOpen(true);
      } catch { } finally { setSearchLoading(false); }
    }, 300);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
    } catch { }
    saveNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const handleMarkRead = async (id) => {
    try { await api.put(`/notifications/${id}/read`); } catch { }
    saveNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/board', icon: Kanban, label: 'Pano' },
    { to: '/tasks', icon: ListTodo, label: 'Görev Listesi' },
    { to: '/calendar', icon: Calendar, label: 'Takvim' },
    { to: '/notes', icon: FileText, label: 'Notlar' },
    { to: '/categories', icon: Tags, label: 'Etiket & Kategori' },
  ];

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        <span className="ml-3 text-lg font-bold text-slate-800 dark:text-white tracking-tight">AjandaSys</span>
      </div>

      {/* Avatar */}
      <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <Link to="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition" onClick={() => setSidebarOpen(false)}>
          {user?.avatar_url ? (
            <img src={`${BASE_URL}${user.avatar_url}`} alt="Profil" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </Link>
      </div>

      {/* Workspace Switcher */}
      <div className="px-4 pt-4 flex-shrink-0">
        <WorkspaceSwitcher isDark={theme === 'dark'} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
              isActive(to)
                ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 mr-3 ${isActive(to) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1 flex-shrink-0">
        <button onClick={toggleTheme} className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          {theme === 'dark' ? <><Sun className="w-5 h-5 mr-3 text-amber-500" />Açık Tema</> : <><Moon className="w-5 h-5 mr-3 text-slate-500" />Koyu Tema</>}
        </button>
        <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <LogOut className="w-5 h-5 mr-3" />Çıkış Yap
        </button>
      </div>
    </>
  );

  return (
    <div 
      className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-[100] bg-indigo-500/20 backdrop-blur-sm border-4 border-dashed border-indigo-500 rounded-xl flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dosyayı Buraya Bırakın</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-center">Bu dosya ile otomatik olarak<br/>yeni bir görev oluşturulacak.</p>
          </div>
        </div>
      )}

      {/* Mobil Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — Desktop */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm flex-col transition-colors duration-200 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar — Mobil (drawer) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl flex flex-col transition-transform duration-300 md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Ana içerik */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-3 flex-shrink-0">
          {/* Hamburger (mobil) */}
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Cmd+K Arama Butonu */}
          <div className="flex-1 max-w-md">
            <button
              onClick={onSearchOpen}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left text-slate-400 dark:text-slate-500">Ara...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md">
                ⌘K
              </kbd>
            </button>
          </div>


          {/* Bildirim Zili */}
          <div className="relative flex-shrink-0" ref={notifRef}>
            <button onClick={() => setNotifOpen(p => !p)}
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Bildirim Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 sm:right-0 -mr-2 sm:mr-0 top-full mt-2 w-[90vw] sm:w-80 max-w-[320px] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Bildirimler</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Tümünü Okundu</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-400 dark:text-slate-500">Bildirim yok</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <button key={n.id} onClick={() => handleMarkRead(n.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!n.is_read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-slate-200 dark:bg-slate-700' : 'bg-indigo-500'}`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{n.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(n.created_at || n.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Sayfa içeriği */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      <AICopilot />
    </div>
  );
};

export default DashboardLayout;
