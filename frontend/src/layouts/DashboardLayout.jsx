import React, { useContext, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import { Calendar, LayoutDashboard, LogOut, Tags, Sun, Moon, ListTodo } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    let socket;
    if (user && user.id) {
      socket = io('http://localhost:3001');
      socket.emit('join', user.id);
      
      socket.on('notification', (data) => {
        toast(data.message, { 
          icon: '🔔', 
          duration: 6000,
          style: {
            borderRadius: '10px',
            background: theme === 'dark' ? '#1e293b' : '#fff',
            color: theme === 'dark' ? '#fff' : '#334155',
            border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0'
          }
        });
      });
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, [user, theme]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* İnsan tasarımı zarif bir Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors duration-200">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400 font-semibold" />
          <span className="ml-3 text-lg font-bold text-slate-800 dark:text-white tracking-tight">AjandaSys</span>
        </div>
        
        {/* User Card Link */}
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
           <Link to="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition" title="Hesap Ayarları">
              {user?.avatar_url ? (
                <img src={`http://localhost:3001${user.avatar_url}`} alt="Profil" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shadow-sm">
                   {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0 pr-2">
                 <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</h4>
                 <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
           </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400" />
            Dashboard
          </Link>
          
          <Link to="/tasks" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
             <ListTodo className="w-5 h-5 mr-3 text-slate-400 dark:text-slate-500" />
             Görev Pano
          </Link>

          <Link to="/calendar" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
             <Calendar className="w-5 h-5 mr-3 text-slate-400 dark:text-slate-500" />
             Takvim
          </Link>

          <Link to="/categories" className="flex items-center px-4 py-3 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
             <Tags className="w-5 h-5 mr-3 text-slate-400 dark:text-slate-500" />
             Etiket & Kategori
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button 
            onClick={toggleTheme}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? (
               <><Sun className="w-5 h-5 mr-3 text-amber-500" /> Açık Tema</>
            ) : (
               <><Moon className="w-5 h-5 mr-3 text-slate-500" /> Koyu Tema</>
            )}
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Ana İçerik Alanı (Outlet) */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
            <Outlet />
        </div>
      </main>

    </div>
  );
};

export default DashboardLayout;
