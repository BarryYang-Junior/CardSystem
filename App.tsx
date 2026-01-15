
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
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
    // 检查本地会话
    const savedUser = sessionStorage.getItem('logged_user');
    if (savedUser) {
      // 在真实系统中，这里应该发送一个请求到后端 /api/me 验证 Token 的有效性
      setCurrentUser(JSON.parse(savedUser));
      setView('dashboard');
    }
    setIsInitializing(false);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <i className="fas fa-circle-notch fa-spin text-3xl"></i>
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
