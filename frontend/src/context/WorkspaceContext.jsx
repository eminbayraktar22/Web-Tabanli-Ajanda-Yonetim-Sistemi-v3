import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
    }
  }, [user]);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const res = await api.get('/workspaces');
      const data = res.data.data;
      setWorkspaces(data);

      const savedWsId = localStorage.getItem('currentWorkspaceId');
      if (savedWsId && data.find(w => w.id === savedWsId)) {
        setCurrentWorkspace(data.find(w => w.id === savedWsId));
      } else if (data.length > 0) {
        setCurrentWorkspace(data[0]);
        localStorage.setItem('currentWorkspaceId', data[0].id);
      }
    } catch (error) {
      console.error('Workspaces loading failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchWorkspace = (workspace) => {
    setCurrentWorkspace(workspace);
    localStorage.setItem('currentWorkspaceId', workspace.id);
    // Reload to refresh all data globally
    window.location.reload();
  };

  const createWorkspace = async (name) => {
    try {
      const res = await api.post('/workspaces', { name });
      await fetchWorkspaces();
      toast.success('Çalışma alanı oluşturuldu');
      return res.data.data;
    } catch (error) {
      toast.error('Çalışma alanı oluşturulamadı');
      throw error;
    }
  };

  const inviteMember = async (id, email) => {
    try {
      await api.post(`/workspaces/${id}/invite`, { email });
      toast.success('Kullanıcı başarıyla davet edildi');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Kullanıcı davet edilemedi');
      throw error;
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      switchWorkspace,
      createWorkspace,
      inviteMember,
      loading
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
