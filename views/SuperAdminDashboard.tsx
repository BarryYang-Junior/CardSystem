
import React, { useState, useEffect } from 'react';
import { getState, saveState, encryptPassword, decryptPassword } from '../store';
import { User, AppState, UserRole, Card, CardCategory, ClassSession } from '../types';

interface SuperAdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user, onLogout }) => {
  const [appState, setAppState] = useState<AppState>(getState());
  const [activeTab, setActiveTab] = useState<'classes' | 'accounts' | 'cards'>('classes');
  
  // Filtering for classes
  const [teacherFilter, setTeacherFilter] = useState('');
  
  // Card Creation state
  const [newCardName, setNewCardName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState(appState.categories[0].id);

  const filteredClasses = appState.classes.filter(c => 
    teacherFilter === '' || c.teacherId === teacherFilter
  );

  const teachers = appState.users.filter(u => u.role === UserRole.TEACHER);
  const admins = appState.users.filter(u => u.role === UserRole.ADMIN);

  const deleteUser = (id: string) => {
    if (confirm('确定要删除该账号吗？关联的数据可能会受到影响。')) {
      const newState = { ...appState };
      newState.users = newState.users.filter(u => u.id !== id);
      saveState(newState);
      setAppState(newState);
    }
  };

  const changeUserPassword = (id: string) => {
    const newPwd = prompt('请输入新密码:');
    if (newPwd) {
      const newState = { ...appState };
      const userIdx = newState.users.findIndex(u => u.id === id);
      if (userIdx > -1) {
        newState.users[userIdx].password = encryptPassword(newPwd);
        saveState(newState);
        setAppState(newState);
        alert('密码已修改');
      }
    }
  };

  const addCard = () => {
    if (!newCardName.trim()) return;
    const newState = { ...appState };
    const newCard: Card = {
      id: `card-${Date.now()}`,
      name: newCardName.trim(),
      categoryId: selectedCatId,
      description: ''
    };
    newState.cards.push(newCard);
    saveState(newState);
    setAppState(newState);
    setNewCardName('');
  };

  const deleteCard = (id: string) => {
    const newState = { ...appState };
    newState.cards = newState.cards.filter(c => c.id !== id);
    saveState(newState);
    setAppState(newState);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="text-xl font-bold flex items-center text-rose-500">
          <i className="fas fa-crown mr-2"></i>
          终极管理员系统
        </h1>
        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('classes')}
              className={`text-sm font-medium hover:text-rose-400 transition ${activeTab === 'classes' ? 'text-rose-500 underline underline-offset-8' : ''}`}
            >
              班级总览
            </button>
            <button 
              onClick={() => setActiveTab('accounts')}
              className={`text-sm font-medium hover:text-rose-400 transition ${activeTab === 'accounts' ? 'text-rose-500 underline underline-offset-8' : ''}`}
            >
              账号管理
            </button>
            <button 
              onClick={() => setActiveTab('cards')}
              className={`text-sm font-medium hover:text-rose-400 transition ${activeTab === 'cards' ? 'text-rose-500 underline underline-offset-8' : ''}`}
            >
              卡牌设置
            </button>
          </div>
          <button onClick={onLogout} className="text-slate-400 hover:text-rose-500 transition">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-slate-800">全校班级总览</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">筛选教师:</span>
                <select 
                  className="border border-slate-200 rounded-lg px-3 py-1 text-sm bg-slate-50"
                  value={teacherFilter}
                  onChange={e => setTeacherFilter(e.target.value)}
                >
                  <option value="">显示全部</option>
                  {teachers.map(t => <option key={t.id} value={t.username}>{t.username}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClasses.length > 0 ? filteredClasses.map(cls => (
                <div key={cls.id} className="bg-white p-5 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 border-b pb-2 mb-3">{cls.name}</h3>
                  <div className="text-sm text-slate-600 space-y-1">
                    <p><span className="font-medium">教师:</span> {cls.teacherId || '未分配'}</p>
                    <p><span className="font-medium">管理员:</span> {cls.adminId}</p>
                    <p><span className="font-medium">时间:</span> {cls.time}</p>
                    <p><span className="font-medium">人数:</span> {cls.students.length}/15</p>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center text-slate-400">未找到符合条件的班级</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <i className="fas fa-user-shield mr-2 text-indigo-500"></i> 管理员列表
              </h2>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-sm uppercase font-bold">
                    <tr>
                      <th className="px-6 py-3">用户名</th>
                      <th className="px-6 py-3">明文密码 (查看)</th>
                      <th className="px-6 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {admins.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-medium">{a.username}</td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{decryptPassword(a.password || '')}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => changeUserPassword(a.id)} className="text-indigo-600 hover:underline mr-4">改密</button>
                          <button onClick={() => deleteUser(a.id)} className="text-rose-500 hover:underline">删除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <i className="fas fa-graduation-cap mr-2 text-emerald-500"></i> 教师列表
              </h2>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-sm uppercase font-bold">
                    <tr>
                      <th className="px-6 py-3">用户名</th>
                      <th className="px-6 py-3">明文密码 (查看)</th>
                      <th className="px-6 py-3">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teachers.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-medium">{t.username}</td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">{decryptPassword(t.password || '')}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => changeUserPassword(t.id)} className="text-indigo-600 hover:underline mr-4">改密</button>
                          <button onClick={() => deleteUser(t.id)} className="text-rose-500 hover:underline">删除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">卡牌维度子类管理</h2>
            
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">添加新卡牌</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">所属大类</label>
                  <select 
                    value={selectedCatId}
                    onChange={e => setSelectedCatId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                  >
                    {appState.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">细分卡牌名称</label>
                  <input 
                    type="text" 
                    value={newCardName}
                    onChange={e => setNewCardName(e.target.value)}
                    placeholder="例如: 深度理解, 乐于助人"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={addCard}
                    className="bg-rose-500 text-white px-6 py-2 rounded-lg hover:bg-rose-600 transition font-bold"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {appState.categories.map(cat => (
                <div key={cat.id} className="border-b border-slate-100 pb-4 last:border-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-3 h-3 rounded-full ${cat.color}`}></span>
                    <h4 className="font-bold text-slate-700">{cat.name}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {appState.cards.filter(c => c.categoryId === cat.id).map(card => (
                      <div key={card.id} className="group relative">
                        <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm text-slate-600 flex items-center shadow-sm">
                          {card.name}
                          <button 
                            onClick={() => deleteCard(card.id)}
                            className="ml-2 text-slate-300 group-hover:text-rose-500 transition"
                          >
                            <i className="fas fa-times-circle"></i>
                          </button>
                        </span>
                      </div>
                    ))}
                    {appState.cards.filter(c => c.categoryId === cat.id).length === 0 && (
                      <span className="text-xs text-slate-400 italic">暂无细分子类</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default SuperAdminDashboard;
