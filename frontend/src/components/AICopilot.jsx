import React, { useState, useRef, useEffect, useContext } from 'react';
import api from '../utils/api';
import { Bot, X, Send, UserIcon, Sparkles, Command, ListTodo, CalendarClock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';

const AICopilot = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([
        { role: 'assistant', text: `Merhaba ${user.name}! Ben Sys Pilot. Ajandanı yönetmene yardımcı olmak için buradayım. Ne yapmak istersin?` }
      ]);
    }
  }, [user, messages.length]);

  const handleSend = async (userText) => {
    if (!userText.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat-with-copilot', { message: userText });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply }]);
    } catch (error) {
      if (error.response?.status === 403) {
        setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ API Anahtarınız tanımlı değil. Lütfen profilinizden sağlayıcı ve API Key ayarlarınızı tamamlayın.' }]);
      } else {
        toast.error('Bağlantı hatası oluştu');
        setMessages(prev => [...prev, { role: 'assistant', text: 'Üzgünüm, şu an sunucuya erişemiyorum.' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Bugünkü Görevlerim", icon: <ListTodo className="w-3.5 h-3.5" />, query: "Bugün yapmam gereken öncelikli görevler neler?" },
    { label: "Yaklaşan Etkinlikler", icon: <CalendarClock className="w-3.5 h-3.5" />, query: "Önümüzdeki birkaç gün içinde hangi etkinliklerim var?" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {/* Tetikleyici Buton */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:scale-105 ${isOpen ? 'bg-slate-800 rotate-90' : 'bg-indigo-600 hover:shadow-indigo-500/50'}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Command className="w-6 h-6" />}
      </button>

      {/* Chat Penceresi */}
      <div 
        className={`absolute bottom-20 right-0 w-[360px] sm:w-[420px] h-[600px] max-h-[85vh] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}
      >
        {/* Üst Kısım (Header) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent dark:from-indigo-500/20 dark:via-purple-500/20 border-b border-slate-100 dark:border-slate-800 p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-lg tracking-tight">Sys Pilot</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Akıllı Sistem Asistanı</p>
            </div>
          </div>
        </div>

        {/* Mesaj Alanı */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6 scroll-smooth">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700'}`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${msg.role === 'user' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-100 rounded-tr-sm border border-indigo-100 dark:border-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm border border-slate-100 dark:border-slate-700 shadow-sm whitespace-pre-wrap'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-slate-800 px-4 py-4 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-700 flex gap-1.5 items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:'0.15s'}}></div>
                 <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:'0.3s'}}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Hızlı Aksiyonlar */}
        {messages.length < 3 && !isLoading && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {quickActions.map((action, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(action.query)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Alt Girdi Alanı */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }} 
          className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-100 dark:border-slate-800"
        >
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Asistana görev verin veya soru sorun..."
              className="w-full pl-4 pr-12 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm dark:text-white shadow-sm transition-all outline-none"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AICopilot;
