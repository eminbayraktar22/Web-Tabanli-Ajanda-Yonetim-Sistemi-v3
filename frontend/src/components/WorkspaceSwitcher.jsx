import React, { useContext, useState } from 'react';
import { WorkspaceContext } from '../context/WorkspaceContext';
import { ChevronDown, Plus, Users, Check, Building } from 'lucide-react';

const WorkspaceSwitcher = ({ isDark }) => {
  const { workspaces, currentWorkspace, switchWorkspace, createWorkspace, inviteMember, loading } = useContext(WorkspaceContext);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  if (loading || !currentWorkspace) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    try {
      const newWs = await createWorkspace(newWsName);
      setNewWsName('');
      setShowCreate(false);
      switchWorkspace(newWs);
    } catch (err) { }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember(currentWorkspace.id, inviteEmail);
      setInviteEmail('');
      setShowInvite(false);
    } catch (err) { }
  };

  return (
    <div className="relative mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors border ${isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div className="text-left truncate">
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>Çalışma Alanı</p>
            <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{currentWorkspace.name}</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl z-50 overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="max-h-60 overflow-y-auto p-2">
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => { switchWorkspace(ws); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg mb-1 transition-colors ${
                    currentWorkspace.id === ws.id 
                      ? (isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-700')
                      : (isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50')
                  }`}
                >
                  <span className="font-medium text-sm truncate">{ws.name}</span>
                  {currentWorkspace.id === ws.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>

            <div className={`p-2 border-t flex flex-col gap-1 ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
              <button 
                onClick={() => { setShowCreate(true); setIsOpen(false); }}
                className={`w-full flex items-center p-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                <Plus className="w-4 h-4 mr-2" /> Yeni Oluştur
              </button>
              {currentWorkspace.role === 'admin' && (
                <button 
                  onClick={() => { setShowInvite(true); setIsOpen(false); }}
                  className={`w-full flex items-center p-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-200'}`}
                >
                  <Users className="w-4 h-4 mr-2" /> Üye Davet Et
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals for Create and Invite */}
      {(showCreate || showInvite) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => {setShowCreate(false); setShowInvite(false);}}>
          <div className={`rounded-2xl shadow-2xl w-full max-w-md p-6 ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {showCreate ? 'Yeni Çalışma Alanı' : 'Üye Davet Et'}
            </h3>
            
            {showCreate ? (
              <form onSubmit={handleCreate}>
                <input 
                  type="text" autoFocus required
                  placeholder="Çalışma Alanı Adı"
                  value={newWsName} onChange={e => setNewWsName(e.target.value)}
                  className={`w-full p-3 rounded-xl border mb-4 outline-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white'}`}
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCreate(false)} className={`px-4 py-2 font-medium rounded-xl transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>İptal</button>
                  <button type="submit" className="px-5 py-2 font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm">Oluştur</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleInvite}>
                <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Kullanıcıları sisteme kayıtlı e-posta adresleri üzerinden davet edebilirsiniz.</p>
                <input 
                  type="email" autoFocus required
                  placeholder="Kullanıcı E-posta Adresi"
                  value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  className={`w-full p-3 rounded-xl border mb-4 outline-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white'}`}
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowInvite(false)} className={`px-4 py-2 font-medium rounded-xl transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>İptal</button>
                  <button type="submit" className="px-5 py-2 font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm">Davet Et</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
