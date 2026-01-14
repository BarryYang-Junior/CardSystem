
import React, { useState, useEffect } from 'react';
import { getState, saveState } from '../store';
import { User, ClassSession, AppState, Card, CardCategory } from '../types';

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user, onLogout }) => {
  const [appState, setAppState] = useState<AppState>(getState());
  const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);

  const teacherClasses = appState.classes.filter(c => c.teacherId === user.username);

  const toggleCard = (studentId: string, cardId: string) => {
    const newState = { ...appState };
    const cls = newState.classes.find(c => c.id === selectedClass?.id);
    if (!cls) return;

    const student = cls.students.find(s => s.id === studentId);
    if (!student) return;

    const hasCard = student.awardedCardIds.includes(cardId);
    
    if (hasCard) {
      // Revoke the card
      student.awardedCardIds = student.awardedCardIds.filter(id => id !== cardId);
    } else {
      // Award the card. 
      // Rule: One student can only have one card of a single type.
      // Since only one sub-card is available per category in this session, we just add it.
      // If we wanted to enforce "one card per category" even if multiple were available, 
      // we'd filter out other cards from the same category here.
      const cardToAward = appState.cards.find(c => c.id === cardId);
      if (!cardToAward) return;

      // Filter out any existing card from the SAME category before adding the new one
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
          <i className="fas fa-chalkboard-teacher mr-2"></i>
          教师工作台
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-600 font-medium">你好, {user.username}</span>
          <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition">
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        {!selectedClass ? (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">我的班级列表</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacherClasses.length > 0 ? teacherClasses.map(cls => (
                <div 
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition">{cls.name}</h3>
                    <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded uppercase">{cls.students.length} 名学员</span>
                  </div>
                  <div className="flex items-center text-slate-500 text-sm">
                    <i className="far fa-clock mr-2"></i>
                    {cls.time}
                  </div>
                  <div className="mt-4 flex gap-1">
                     {(cls.activeCardIds || []).slice(0, 3).map(cid => {
                        const cat = appState.categories.find(ca => ca.id === appState.cards.find(c => c.id === cid)?.categoryId);
                        return <span key={cid} className={`w-2 h-2 rounded-full ${cat?.color}`}></span>
                     })}
                     {(cls.activeCardIds || []).length > 3 && <span className="text-[10px] text-slate-400">...</span>}
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
                  <i className="fas fa-calendar-times text-slate-300 text-5xl mb-4"></i>
                  <p className="text-slate-500">暂无分配给您的班级</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <button 
              onClick={() => setSelectedClass(null)}
              className="mb-6 text-slate-500 hover:text-blue-600 flex items-center transition font-medium"
            >
              <i className="fas fa-arrow-left mr-2"></i> 返回列表
            </button>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedClass.name}</h2>
                  <p className="text-slate-500 flex items-center gap-2">
                    <i className="far fa-clock"></i> {selectedClass.time}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(selectedClass.activeCardIds || []).map(cid => {
                    const card = appState.cards.find(c => c.id === cid);
                    const cat = appState.categories.find(ca => ca.id === card?.categoryId);
                    return card ? (
                      <div key={cid} className="flex items-center bg-white px-3 py-1 rounded-full border border-slate-200 text-xs shadow-sm">
                        <span className={`w-2 h-2 rounded-full ${cat?.color} mr-2`}></span>
                        <span className="text-slate-400 mr-1">{cat?.name}:</span>
                        <span className="font-bold text-slate-700">{card.name}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {selectedClass.students.map((student) => {
                    const activeCardsForClass = (selectedClass.activeCardIds || []).map(cid => appState.cards.find(c => c.id === cid)).filter(Boolean) as Card[];

                    return (
                      <div 
                        key={student.id} 
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition"
                      >
                        <div className="flex items-center mb-4 md:mb-0 w-48">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-4 shadow-sm">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{student.name}</h4>
                            <p className="text-[10px] text-slate-400">已获 {student.awardedCardIds.length} 张卡牌</p>
                          </div>
                        </div>
                        
                        <div className="flex-1 flex flex-wrap gap-2 items-center">
                          {activeCardsForClass.map(card => {
                            const isAwarded = student.awardedCardIds.includes(card.id);
                            const cat = appState.categories.find(c => c.id === card.categoryId);
                            return (
                              <button
                                key={card.id}
                                onClick={() => toggleCard(student.id, card.id)}
                                title={cat?.name}
                                className={`px-4 py-2 rounded-lg text-xs font-bold border transition flex items-center gap-2 ${
                                  isAwarded 
                                  ? `${cat?.color} border-transparent text-white shadow-md transform scale-105` 
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                                }`}
                              >
                                {isAwarded && <i className="fas fa-check-circle"></i>}
                                {card.name}
                              </button>
                            );
                          })}
                        </div>

                        <div className="md:ml-4 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                           {student.awardedCardIds.length > 0 && (
                             <button
                                onClick={() => revokeAll(student.id)}
                                className="text-xs text-red-400 hover:text-red-600 font-medium transition flex items-center gap-1"
                             >
                                <i className="fas fa-undo"></i> 重置
                             </button>
                           )}
                        </div>
                      </div>
                    );
                  })}
                  {selectedClass.students.length === 0 && (
                    <div className="text-center py-10 text-slate-400 italic">该班级暂无学生</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
