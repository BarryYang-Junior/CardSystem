
import React, { useState, useEffect } from 'react';
import { getState, findUser } from './store';
import { User, UserRole } from './types';
import Login from './views/Login';
import Register from './views/Register';
import TeacherDashboard from './views/TeacherDashboard';
import AdminDashboard from './views/AdminDashboard';
import SuperAdminDashboard from './views/SuperAdminDashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'dashboard'>('login');

  useEffect(() => {
    const savedUser = sessionStorage.getItem('logged_user');
    if (savedUser) {
      const user = findUser(JSON.parse(savedUser).username);
      if (user) {
        setCurrentUser(user);
        setView('dashboard');
      }
    }
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
        return <div>Invalid Role</div>;
    }
  }

  return <div>Loading...</div>;
};

export default App;
