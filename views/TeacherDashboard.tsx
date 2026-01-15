
import React, { useState } from 'react';
import { getState, saveState } from '../store';
import { User, ClassSession, AppState, Card, AwardRecord } from '../types';

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, onLogout }) => {
  const [appState, setAppState] = useState<AppState>(getState());
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
  const [activeTab, setActiveTab] = useState<'classes' | 'history'>('classes');

  const teacherClasses = appState.classes.filter(c => c.teacherId === user.username);
  
  // 筛选属于该教师的历史记录
  const myHistory = (appState.awardHistory || [])
    .filter(rec => rec.teacherId === user.username)
    .sort((a, b) => b.timestamp - a.timestamp);

  const getWeeklyCardsForSelected = () => {
    if (!selectedClass) return [];
    const isSmall = ['L1', 'L2', 'L3'].includes(selectedClass.level);
    const field = isSmall ? 'weeklyCardIdsSmall' : 'weeklyCardIdsLarge';
    return appState[field]
      .map(id => appState.cards.find(c => c.id === id))
      .filter(Boolean) as Card[];
  };

  const weeklyCards = getWeeklyCardsForSelected();

  const toggleCard = (studentId: string, cardId: string) => {
    const newState = { ...appState };
    const cls = newState.classes.find(c => c.id === selectedClass?.id);
    if (!cls) return;
    const student = cls.students.find(s => s.id === studentId);
    if (!student) return;

    const hasCard = student.awardedCardIds.includes(cardId);
    if (hasCard) {
      student.awardedCardIds = student.awardedCardIds.filter(id => id !== cardId);
    } else {
      const cardToAward = appState.cards.find(c => c.id === cardId);
      if (!cardToAward) return;
      const otherCategoryCards = student.awardedCardIds.filter(id => {
        const c = appState.cards.find(card => card.id === id);
        return c?.categoryId !== cardToAward.categoryId;
      });
      student.awardedCardIds = [...otherCategoryCards, cardId];
    }

    saveState(newState);
    setAppState(newState);
    setSelectedClass({ ...cls });
  };

  const revokeAll = (studentId: string) => {
    const newState = { ...appState };
    const cls = newState.classes.find(c => c.id === selectedClass?.id);
    if (!cls) return;
    const student = cls.students.find(s => s.id === studentId);
    if (student) {
        student.awardedCardIds = [];
        saveState(newState);
        setAppState(newState);
        setSelectedClass({ ...cls });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-blue-600 flex items-center">
          <i className="fas fa-chalkboard-teacher mr-2"></i> 教师工作台
        </h1>
        <div className="flex items-center gap-6">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => { setActiveTab('classes'); setSelectedClass(null); }} 
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${activeTab === 'classes' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              我的班级
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              评价记录
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-600 font-medium">你好, {user.username}</span>
            <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition"><i className="fas fa-sign-out-alt"></i></button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        {activeTab === 'classes' ? (
          !selectedClass ? (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">我的班级列表</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teacherClasses.map(cls => (
                  <div 
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition">{cls.name}</h3>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${['L1','L2','L3'].includes(cls.level) ? 'bg-sky-50 text-sky-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {cls.level}
                        </span>
                        <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-md">{cls.campus}校区</span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs mb-4 uppercase tracking-wider font-semibold">
                      {['L1','L2','L3'].includes(cls.level) ? '小阶课程' : '大阶课程'}
                    </p>
                    <div className="text-slate-500 text-sm"><i className="far fa-clock mr-2"></i>{cls.time}</div>
                    <div className="mt-4 flex gap-1">
                       <span className="text-[10px] text-slate-400 font-medium">{cls.students.length} 名学员</span>
                    </div>
                  </div>
                ))}
                {teacherClasses.length === 0 && <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">暂无班级</div>}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <button onClick={() => setSelectedClass(null)} className="text-slate-500 hover:text-blue-600 flex items-center transition font-medium"><i className="fas fa-arrow-left mr-2"></i> 返回列表</button>
              
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-100">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-bold text-slate-800">{selectedClass.name}</h2>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${['L1','L2','L3'].includes(selectedClass.level) ? 'bg-sky-500 text-white' : 'bg-indigo-600 text-white'}`}>
                          {selectedClass.level}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm italic">{['L1','L2','L3'].includes(selectedClass.level) ? '本周适用：小阶评价体系' : '本周适用：大阶评价体系'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {weeklyCards.length > 0 ? weeklyCards.map(card => {
                        const cat = appState.categories.find(ca => ca.id === card.categoryId);
                        return (
                          <div key={card.id} className="flex items-center bg-white px-3 py-1 rounded-full border border-slate-200 text-xs shadow-sm">
                            <span className={`w-2 h-2 rounded-full ${cat?.color} mr-2`}></span>
                            <span className="font-bold text-slate-700">{card.name}</span>
                          </div>
                        );
                      }) : (
                        <span className="text-xs text-amber-500 font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200 animate-pulse">未配置本周卡牌</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {selectedClass.students.map((student) => (
                      <div key={student.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition">
                        <div className="flex items-center mb-4 md:mb-0 w-40 shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">{student.name.charAt(0)}</div>
                          <h4 className="font-bold text-slate-800 truncate">{student.name}</h4>
                        </div>
                        <div className="flex-1 flex flex-wrap gap-2">
                          {weeklyCards.map(card => {
                            const isAwarded = student.awardedCardIds.includes(card.id);
                            const cat = appState.categories.find(c => c.id === card.categoryId);
                            return (
                              <button
                                key={card.id}
                                onClick={() => toggleCard(student.id, card.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition flex items-center gap-2 ${isAwarded ? `${cat?.color} border-transparent text-white shadow-md transform scale-105` : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
                              >
                                {isAwarded && <i className="fas fa-check-circle"></i>}
                                {card.name}
                              </button>
                            );
                          })}
                        </div>
                        <div className="md:ml-4 mt-4 md:mt-0">
                           {student.awardedCardIds.length > 0 && <button onClick={() => revokeAll(student.id)} className="text-xs text-red-400 hover:text-red-600 transition"><i className="fas fa-undo mr-1"></i>重置</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">历史足迹 (近两月)</h2>
              <div className="text-xs text-slate-400 font-medium italic">* 系统将自动清理两个月前的评价记录</div>
            </div>
            
            <div className="space-y-4">
              {myHistory.length > 0 ? (
                myHistory.map(record => (
                  <div key={record.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="min-w-[120px]">
                      <div className="text-xs font-bold text-blue-500 uppercase tracking-tighter">{new Date(record.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-300 font-mono mt-0.5">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div className="flex items-center gap-3 min-w-[150px]">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{record.studentName.charAt(0)}</div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{record.studentName}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{record.className}</div>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-1.5">
                      {record.cardIds.map(cid => {
                        const card = appState.cards.find(c => c.id === cid);
                        const cat = appState.categories.find(ca => ca.id === card?.categoryId);
                        return (
                          <span key={cid} className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-white ${cat?.color || 'bg-slate-300'}`}>
                            {card?.name || '未知卡牌'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                  <i className="fas fa-history text-4xl text-slate-100 mb-4"></i>
                  <p className="text-slate-400 font-medium">暂无归档的历史评价记录</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
