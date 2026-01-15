
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { fetchStateFromServer } from './store';
import Login from './views/Login';
import Register from './views/Register';
import TeacherDashboard from './views/TeacherDashboard';
import AdminDashboard from './views/AdminDashboard';
import SuperAdminDashboard from './views/SuperAdminDashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>('login');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      // 1. 尝试从云端同步最新数据
      await fetchStateFromServer();
      
      // 2. 检查本地会话
      const savedUser = sessionStorage.getItem('logged_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
        setView('dashboard');
      }
      setIsInitializing(false);
    };

    initApp();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('logged_user', JSON.stringify(user));
    setView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('logged_user');
    setView('login');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <i className="fas fa-tooth fa-spin text-5xl text-rose-500 mb-6"></i>
        <p className="text-slate-400 font-bold tracking-widest animate-pulse">CONNECTING TO CLOUD...</p>
      </div>
    );
  }

  if (view === 'login') {
    return <Login onLogin={handleLogin} onGoToRegister={() => setView('register')} />;
  }

  if (view === 'register') {
    return <Register onGoToLogin={() => setView('login')} />;
  }

  if (currentUser) {
    switch (currentUser.role) {
      case UserRole.TEACHER:
        return <TeacherDashboard user={currentUser} onLogout={handleLogout} />;
      case UserRole.ADMIN:
        return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
      case UserRole.SUPER_ADMIN:
        return <SuperAdminDashboard user={currentUser} onLogout={handleLogout} />;
      default:
        return <div>角色无效</div>;
    }
  }

  return <div>请登录</div>;
};

export default App;
