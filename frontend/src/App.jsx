import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import CommandPalette from './components/CommandPalette';

// Sayfalar
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Categories from './pages/Categories';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Board from './pages/Board';

function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd+K / Ctrl+K global kısayolu
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <div translate="no" className="notranslate">
        <Toaster position="top-right" />
      </div>
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <Routes>
        {/* Misafir Rotaları */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Korumalı Rotalar */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout onSearchOpen={() => setPaletteOpen(true)} />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/board" element={<Board />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
