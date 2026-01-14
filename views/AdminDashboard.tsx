
import React, { useState, useEffect } from 'react';
import { getState, saveState } from '../store';
import { User, ClassSession, AppState, UserRole, Student, Card } from '../types';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [appState, setAppState] = useState<AppState>(getState());
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassSession | null>(null);

  // Form State
  const [className, setClassName] = useState('');
  const [classTime, setClassTime] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [studentNames, setStudentNames] = useState<string[]>(['']);
  const [activeCardIds, setActiveCardIds] = useState<string[]>([]);

  const teachers = appState.users.filter(u => u.role === UserRole.TEACHER);
  const myClasses = appState.classes.filter(c => c.adminId === user.username);

  const openCreateModal = () => {
    setEditingClass(null);
    setClassName('');
    setClassTime('');
    setTeacherId('');
    setStudentNames(['']);
    setActiveCardIds([]);
    setShowModal(true);
  };

  const openEditModal = (cls: ClassSession) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setClassTime(cls.time);
    setTeacherId(cls.teacherId || '');
    setStudentNames(cls.students.map(s => s.name));
    setActiveCardIds(cls.activeCardIds || []);
    setShowModal(true);
  };

  const handleAddStudentInput = () => {
    if (studentNames.length < 15) {
      setStudentNames([...studentNames, '']);
    }
  };

  const handleStudentNameChange = (index: number, val: string) => {
    const newNames = [...studentNames];
    newNames[index] = val;
    setStudentNames(newNames);
  };

  const handleRemoveStudentInput = (index: number) => {
    setStudentNames(studentNames.filter((_, i) => i !== index));
  };

  const handleCardSelect = (categoryId: string, cardId: string) => {
    // We need to maintain exactly one card per category if selected.
    // First, find existing cards not in this category
    const otherCards = activeCardIds.filter(id => {
      const card = appState.cards.find(c => c.id === id);
      return card && card.categoryId !== categoryId;
    });
    
    if (cardId === "") {
      setActiveCardIds(otherCards);
    } else {
      setActiveCardIds([...otherCards, cardId]);
    }
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

    if (editingClass) {
      const idx = newState.classes.findIndex(c => c.id === editingClass.id);
      newState.classes[idx] = {
        ...editingClass,
        name: className,
        time: classTime,
        teacherId: teacherId || undefined,
        students,
        activeCardIds
      };
    } else {
      const newClass: ClassSession = {
        id: `class-${Date.now()}`,
        name: className,
        time: classTime,
        adminId: user.username,
        teacherId: teacherId || undefined,
        students,
        activeCardIds
      };
      newState.classes.push(newClass);
    }

    saveState(newState);
    setAppState(newState);
    setShowModal(false);
  };

  const deleteClass = (id: string) => {
    if (confirm('确定要删除这个班级吗？')) {
      const newState = { ...appState };
      newState.classes = newState.classes.filter(c => c.id !== id);
      saveState(newState);
      setAppState(newState);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center">
          <i className="fas fa-user-shield mr-2"></i>
          管理员工作台
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-600 font-medium">你好, {user.username}</span>
          <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">班级管理</h2>
          <button 
            onClick={openCreateModal}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center"
          >
            <i className="fas fa-plus mr-2"></i> 新建班级
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myClasses.length > 0 ? myClasses.map(cls => (
            <div 
              key={cls.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-slate-800">{cls.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(cls)} className="text-slate-400 hover:text-indigo-600"><i className="fas fa-edit"></i></button>
                  <button onClick={() => deleteClass(cls.id)} className="text-slate-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-slate-500 text-sm">
                  <i className="far fa-clock w-5"></i>
                  {cls.time}
                </div>
                <div className="flex items-center text-slate-500 text-sm">
                  <i className="fas fa-user-tie w-5"></i>
                  {cls.teacherId || <span className="text-amber-500 italic">未指定教师</span>}
                </div>
                <div className="flex items-center text-slate-500 text-sm">
                  <i className="fas fa-users w-5"></i>
                  {cls.students.length} 名学员
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-50">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">已激活卡牌:</p>
                <div className="flex flex-wrap gap-1">
                  {(cls.activeCardIds || []).map(cid => {
                    const card = appState.cards.find(c => c.id === cid);
                    const cat = appState.categories.find(ca => ca.id === card?.categoryId);
                    return card ? (
                      <span key={cid} className={`${cat?.color} text-white text-[9px] px-1.5 py-0.5 rounded`}>
                        {card.name}
                      </span>
                    ) : null;
                  })}
                  {(!cls.activeCardIds || cls.activeCardIds.length === 0) && <span className="text-[9px] text-slate-300 italic">未配置卡牌</span>}
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <i className="fas fa-school text-slate-300 text-5xl mb-4"></i>
              <p className="text-slate-500">暂无班级信息，点击右上角新建</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">{editingClass ? '修改班级' : '新建班级'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              <section className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">基础信息</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">班级名称</label>
                    <input 
                      type="text" 
                      value={className} 
                      onChange={e => setClassName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">上课时间</label>
                    <input 
                      type="text" 
                      value={classTime} 
                      onChange={e => setClassTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                      placeholder="e.g. 每周三 15:00"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">授课教师</label>
                    <select 
                      value={teacherId} 
                      onChange={e => setTeacherId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">-- 请选择教师 --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.username}>{t.username}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">课程卡牌配置 (每类限选一个)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appState.categories.map(cat => {
                    const selectedForCat = activeCardIds.find(id => {
                      const card = appState.cards.find(c => c.id === id);
                      return card?.categoryId === cat.id;
                    }) || "";
                    
                    const catCards = appState.cards.filter(c => c.categoryId === cat.id);

                    return (
                      <div key={cat.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center">
                          <span className={`w-2 h-2 rounded-full ${cat.color} mr-2`}></span>
                          {cat.name}
                        </label>
                        <select 
                          value={selectedForCat}
                          onChange={(e) => handleCardSelect(cat.id, e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded bg-white"
                        >
                          <option value="">-- 未选择 --</option>
                          {catCards.map(card => (
                            <option key={card.id} value={card.id}>{card.name}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">学生名单 ({studentNames.length}/15)</h4>
                  <button 
                    type="button" 
                    onClick={handleAddStudentInput}
                    disabled={studentNames.length >= 15}
                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 transition font-medium disabled:opacity-50"
                  >
                    <i className="fas fa-plus mr-1"></i> 添加学生
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {studentNames.map((name, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-xs text-slate-300 w-4">{idx + 1}</span>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={e => handleStudentNameChange(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm" 
                        placeholder="姓名"
                      />
                      {studentNames.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveStudentInput(idx)}
                          className="text-slate-300 hover:text-red-500 transition"
                        >
                          <i className="fas fa-times-circle"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 font-bold"
                >
                  保存设置
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
