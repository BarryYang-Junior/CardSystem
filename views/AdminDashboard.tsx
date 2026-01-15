
import React, { useState } from 'react';
import { getState, saveState } from '../store';
import { User, ClassSession, AppState, UserRole, Student, ClassLevel, Campus } from '../types';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [appState, setAppState] = useState<AppState>(getState());
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);
  const [cardTab, setCardTab] = useState<'small' | 'large'>('small');

  const myClasses = appState.classes.filter(c => c.adminId === user.username);
  const teachers = appState.users.filter(u => u.role === UserRole.TEACHER);

  // Form State
  const [className, setClassName] = useState('');
  const [classTime, setClassTime] = useState('');
  const [classLevel, setClassLevel] = useState<ClassLevel>('L1');
  const [campus, setCampus] = useState<Campus>('138');
  const [teacherId, setTeacherId] = useState('');
  const [studentNames, setStudentNames] = useState<string[]>(['']);

  const openCreateModal = () => {
    setEditingClass(null);
    setClassName('');
    setClassTime('');
    setClassLevel('L1');
    setCampus('138');
    setTeacherId('');
    setStudentNames(['']);
    setShowModal(true);
  };

  const openEditModal = (cls: ClassSession) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setClassTime(cls.time);
    setClassLevel(cls.level);
    setCampus(cls.campus);
    setTeacherId(cls.teacherId || '');
    setStudentNames(cls.students.map(s => s.name));
    setShowModal(true);
  };

  const handleWeeklyCardSelect = (type: 'small' | 'large', categoryId: string, cardId: string) => {
    const newState = { ...appState };
    const field = type === 'small' ? 'weeklyCardIdsSmall' : 'weeklyCardIdsLarge';
    const otherCards = newState[field].filter(id => {
      const card = newState.cards.find(c => c.id === id);
      return card && card.categoryId !== categoryId;
    });
    newState[field] = cardId === "" ? otherCards : [...otherCards, cardId];
    newState.lastCardUpdate = Date.now();
    saveState(newState);
    setAppState(newState);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newState = { ...appState };
    
    const students: Student[] = studentNames
      .filter(n => n.trim() !== '')
      .map((name, idx) => {
        const existingStudent = editingClass?.students.find(s => s.name === name);
        return {
          id: existingStudent?.id || `student-${Date.now()}-${idx}`,
          name: name.trim(),
          awardedCardIds: existingStudent?.awardedCardIds || []
        };
      });

    const classData = {
      name: className,
      time: classTime,
      level: classLevel,
      campus: campus,
      adminId: user.username,
      teacherId: teacherId || undefined,
      students
    };

    if (editingClass) {
      const idx = newState.classes.findIndex(c => c.id === editingClass.id);
      if (idx > -1) newState.classes[idx] = { ...editingClass, ...classData };
    } else {
      newState.classes.push({ id: `class-${Date.now()}`, ...classData });
    }

    saveState(newState);
    setAppState(newState);
    setShowModal(false);
  };

  const deleteClass = (id: string) => {
    if (window.confirm('确定要删除这个班级吗？')) {
      const newState = { ...appState };
      newState.classes = newState.classes.filter(c => c.id !== id);
      saveState(newState);
      setAppState(newState);
    }
  };

  const getCampusColor = (c: Campus) => {
    switch(c) {
      case '138': return 'bg-purple-100 text-purple-700 border-purple-200';
      case '158': return 'bg-orange-100 text-orange-700 border-orange-200';
      case '168': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center">
          <i className="fas fa-user-shield mr-2"></i> 管理员工作台
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-600 font-medium">你好, {user.username}</span>
          <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition"><i className="fas fa-sign-out-alt"></i></button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">本周教学卡牌配置</h2>
              <p className="text-xs text-slate-400">分级设置，每周五自动清空。</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setCardTab('small')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${cardTab === 'small' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>小阶 (L1-L3)</button>
              <button onClick={() => setCardTab('large')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${cardTab === 'large' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>大阶 (L4-L5)</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {appState.categories.map(cat => {
              const field = cardTab === 'small' ? 'weeklyCardIdsSmall' : 'weeklyCardIdsLarge';
              const selectedId = appState[field].find(id => appState.cards.find(c => c.id === id)?.categoryId === cat.id) || "";
              return (
                <div key={cat.id} className={`p-4 rounded-xl border-2 transition-all ${selectedId ? 'bg-white border-indigo-500 shadow-md' : 'bg-slate-50 border-dashed border-slate-200'}`}>
                  <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center"><span className={`w-2 h-2 rounded-full ${cat.color} mr-2`}></span> {cat.name}</label>
                  <select value={selectedId} onChange={(e) => handleWeeklyCardSelect(cardTab, cat.id, e.target.value)} className="w-full text-sm font-medium bg-transparent outline-none cursor-pointer">
                    <option value="">-- 请选择 --</option>
                    {appState.cards.filter(c => c.categoryId === cat.id).map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">班级列表</h2>
          <button onClick={openCreateModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center"><i className="fas fa-plus mr-2"></i> 新建班级</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myClasses.map(cls => (
            <div key={cls.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{cls.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${getCampusColor(cls.campus)}`}>
                      {cls.campus} 校区
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600`}>
                      {cls.level}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(cls)} className="text-slate-400 hover:text-indigo-600"><i className="fas fa-edit"></i></button>
                  <button onClick={() => deleteClass(cls.id)} className="text-slate-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-slate-500">
                <p><i className="far fa-clock mr-2 text-indigo-300"></i> {cls.time}</p>
                <p><i className="fas fa-user-tie mr-2 text-indigo-300"></i> {cls.teacherId || '未指派'}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">{editingClass ? '修改班级' : '新建班级'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-xl"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">班级名称</label>
                  <input type="text" value={className} onChange={e => setClassName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="例如: 创意乐高周六班" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">所属校区</label>
                  <select value={campus} onChange={e => setCampus(e.target.value as Campus)} className="w-full px-3 py-2 border rounded-lg bg-white outline-none">
                    <option value="138">138 校区</option>
                    <option value="158">158 校区</option>
                    <option value="168">168 校区</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">课程等级</label>
                  <select value={classLevel} onChange={e => setClassLevel(e.target.value as ClassLevel)} className="w-full px-3 py-2 border rounded-lg bg-white outline-none">
                    <option value="L1">L1 (小阶)</option>
                    <option value="L2">L2 (小阶)</option>
                    <option value="L3">L3 (小阶)</option>
                    <option value="L4">L4 (大阶)</option>
                    <option value="L5">L5 (大阶)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">上课时间</label>
                  <input type="text" value={classTime} onChange={e => setClassTime(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none" placeholder="周六 10:00-11:30" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">授课教师</label>
                  <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white outline-none">
                    <option value="">-- 未指派 --</option>
                    {teachers.map(t => <option key={t.id} value={t.username}>{t.username}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">学生名单 ({studentNames.length}/15)</label>
                  <button type="button" onClick={() => setStudentNames([...studentNames, ''])} disabled={studentNames.length >= 15} className="text-xs text-indigo-600 font-bold hover:underline">+ 添加学生</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {studentNames.map((name, idx) => (
                    <div key={idx} className="relative group">
                      <input type="text" value={name} onChange={e => {
                        const next = [...studentNames];
                        next[idx] = e.target.value;
                        setStudentNames(next);
                      }} className="w-full px-3 py-1.5 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder={`姓名`} />
                      {studentNames.length > 1 && (
                        <button type="button" onClick={() => setStudentNames(studentNames.filter((_, i) => i !== idx))} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition">
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 text-slate-500 font-medium hover:text-slate-800 transition">取消</button>
                <button type="submit" className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition">
                  <i className="fas fa-save mr-2"></i>保存班级
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
