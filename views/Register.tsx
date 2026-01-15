
import React, { useState } from 'react';
import { getState, saveState, encryptPassword } from '../store';
import { UserRole, User } from '../types';
import { INVITE_CODE } from '../constants';

interface RegisterProps {
  onGoToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onGoToLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.TEACHER);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setError('用户名必须仅包含字母和数字');
      return;
    }

    if (inviteCode !== INVITE_CODE) {
      setError('邀请码不正确');
      return;
    }

    const state = getState();
    if (state.users.find(u => u.username === username)) {
      setError('用户名已存在');
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      password: encryptPassword(password),
      role,
      createdAt: Date.now()
    };

    state.users.push(newUser);
    const saved = await saveState(state);
    if (saved) {
      setSuccess(true);
      setTimeout(() => onGoToLogin(), 2000);
    } else {
      setError('云端注册失败，请检查网络连接');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-indigo-800 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">注册新账号</h1>
          <p className="text-slate-500 mt-2">加入 Tooth-Edu 管理系统</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-6 text-sm flex items-center font-medium">
            <i className="fas fa-check-circle mr-2"></i>
            注册成功！正在跳转登录...
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">账号类型</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole(UserRole.TEACHER)}
                className={`py-2 px-4 rounded-lg border text-sm font-medium transition ${
                  role === UserRole.TEACHER ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                教师
              </button>
              <button
                type="button"
                onClick={() => setRole(UserRole.ADMIN)}
                className={`py-2 px-4 rounded-lg border text-sm font-medium transition ${
                  role === UserRole.ADMIN ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                管理员
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">用户名 (字母+数字)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="e.g. TeacherZhang123"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">邀请码</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="请输入管理员提供的邀请码"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            注册
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-600">
            已有账号？{' '}
            <button
              onClick={onGoToLogin}
              className="text-blue-600 font-medium hover:underline"
            >
              去登录
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
