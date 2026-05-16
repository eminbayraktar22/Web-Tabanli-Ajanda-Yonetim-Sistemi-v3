import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { token, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-indigo-600 font-medium">Yükleniyor...</div>;
  }

  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
