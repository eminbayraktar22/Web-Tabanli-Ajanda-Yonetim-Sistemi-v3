import React, { useContext } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const AuthLayout = () => {
  const { token, isLoading } = useContext(AuthContext);
  
  // Eğer state hala yükleniyorsa, Auth ekranlarında da beyaz ekran veya yükleniyor göstermek mantıklıdır
  // Ki loop oluşmasın.
  if (isLoading) {
     return <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-slate-500 font-medium font-sans">Sistem Yükleniyor...</div>;
  }

  // Token state'de varsa, kullanıcı giriş yapmış demektir, doğrudan ana sayfaya yönlendir
  if (token) {
     return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 dark:from-slate-950 dark:to-slate-900 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
      <div className="w-full max-w-4xl mx-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
