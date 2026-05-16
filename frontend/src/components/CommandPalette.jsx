import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CalendarDays, CheckSquare, Tag, LayoutDashboard, User, X, ArrowRight, Clock, LogOut, Sun, Moon, Plus } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const QUICK_LINKS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', group: 'Sayfalar' },
  { label: 'Takvim', icon: CalendarDays, path: '/calendar', group: 'Sayfalar' },
  { label: 'Görevler', icon: CheckSquare, path: '/tasks', group: 'Sayfalar' },
  { label: 'Kategoriler', icon: Tag, path: '/categories', group: 'Sayfalar' },
  { label: 'Profil', icon: User, path: '/profile', group: 'Sayfalar' },
];

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ events: [], tasks: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const SYSTEM_ACTIONS = [
    { label: 'Yeni Görev', icon: Plus, action: () => navigate('/tasks?new=1'), group: 'Aksiyonlar' },
    { label: 'Yeni Etkinlik', icon: Plus, action: () => navigate('/calendar?new=1'), group: 'Aksiyonlar' },
    { label: theme === 'dark' ? 'Açık Tema' : 'Koyu Tema', icon: theme === 'dark' ? Sun : Moon, action: () => toggleTheme(), group: 'Aksiyonlar' },
    { label: 'Çıkış Yap', icon: LogOut, action: () => { logout(); navigate('/login'); }, group: 'Aksiyonlar' },
  ];

  // Input'a odaklan
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults({ events: [], tasks: [] });
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Arama
  useEffect(() => {
    if (!query.trim()) { setResults({ events: [], tasks: [] }); return; }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [evRes, tkRes] = await Promise.all([
          api.get(`/events?search=${encodeURIComponent(query)}`),
          api.get(`/tasks?search=${encodeURIComponent(query)}`)
        ]);
        setResults({
          events: (evRes.data.data || []).slice(0, 5),
          tasks: (tkRes.data.data || []).slice(0, 5)
        });
      } catch {
        setResults({ events: [], tasks: [] });
      } finally { setIsLoading(false); }
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  const filteredLinks = query
    ? QUICK_LINKS.filter(l => l.label.toLowerCase().includes(query.toLowerCase()))
    : QUICK_LINKS;

  const filteredActions = query
    ? SYSTEM_ACTIONS.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
    : SYSTEM_ACTIONS;

  const allItems = [
    ...filteredActions.map(a => ({ type: 'action', ...a })),
    ...filteredLinks.map(l => ({ type: 'link', ...l })),
    ...results.events.map(e => ({ type: 'event', label: e.title, path: '/calendar', sub: new Date(e.start_datetime).toLocaleDateString('tr-TR'), icon: CalendarDays, group: 'Etkinlikler' })),
    ...results.tasks.map(t => ({ type: 'task', label: t.title, path: '/tasks', sub: t.status === 'done' ? 'Tamamlandı' : t.status === 'in-progress' ? 'Yapılıyor' : 'Bekliyor', icon: CheckSquare, group: 'Görevler' })),
  ];

  const go = useCallback((item) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
    onClose();
  }, [navigate, onClose]);

  // Klavye gezinme
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, allItems.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && allItems[activeIndex]) go(allItems[activeIndex]);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, allItems, activeIndex, go, onClose]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  if (!isOpen) return null;

  // Sonuçları gruplara ayır
  const grouped = {};
  allItems.forEach(item => {
    if (!grouped[item.group]) grouped[item.group] = [];
    grouped[item.group].push(item);
  });

  let globalIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Arama Kutusu */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ara: etkinlik, görev, sayfa..."
            className="flex-1 bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Sonuçlar */}
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400 text-sm">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Aranıyor...
            </div>
          )}

          {!isLoading && allItems.length === 0 && query && (
            <div className="py-10 text-center text-slate-400 text-sm">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>"{query}" için sonuç bulunamadı</p>
            </div>
          )}

          {!isLoading && Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {group}
              </p>
              {items.map((item) => {
                const idx = globalIndex++;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={`${group}-${item.label}`}
                    onClick={() => go(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item.label}
                      </p>
                      {item.sub && (
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.sub}
                        </p>
                      )}
                    </div>
                    <ArrowRight className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Alt bilgi */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">↑↓</kbd> Gezin</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-mono">↵</kbd> Aç</span>
          </div>
          <span className="text-[11px] text-slate-400">{allItems.length} sonuç</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
