
import React, { useState, useEffect, useRef } from 'react';
import { getState, saveState, encryptPassword, decryptPassword, importState } from '../store';
import { User, AppState, UserRole, Card, CardCategory, ClassSession, Campus, Student } from '../types';

interface SuperAdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const RadarChart: React.FC<{ data: number[], labels: string[] }> = ({ data, labels }) => {
  const center = 100;
  const radius = 70;
  const sides = 5;
  const max = Math.max(...data, 1);

  const getPoint = (value: number, index: number) => {
    const r = (value / max) * radius;
    const angle = (index * 2 * Math.PI) / sides - Math.PI / 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const points = data.map((v, i) => getPoint(v, i));
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1].map(lvl => {
    const gp = Array.from({ length: sides }).map((_, i) => getPoint(lvl * max, i));
    return gp.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  });

  return (
    <div className="relative w-full aspect-square max-w-[300px] mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
        {gridLevels.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#e2e8f0" strokeWidth="1" />
        ))}
        {Array.from({ length: sides }).map((_, i) => {
          const p = getPoint(max, i);
          return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth="1" />;
        })}
        <path d={pathData} fill="rgba(244, 63, 94, 0.3)" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#f43f5e" />
        ))}
        {labels.map((l, i) => {
          const p = getPoint(max * 1.25, i);
          return (
            <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-slate-500">
              {l}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user, onLogout }) => {
  const [appState, setAppState] = useState<AppState>(getState());
  const [activeTab, setActiveTab] = useState<'classes' | 'accounts' | 'cards' | 'stats' | 'system'>('classes');
  const [campusFilter, setCampusFilter] = useState<Campus | 'all'>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // 新增：添加卡牌的模态框状态
  const [addingToCategory, setAddingToCategory] = useState<CardCategory | null>(null);
  const [newCardName, setNewCardName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAllStudents = () => {
    const studentMap = new Map<string, { student: Student, campus: Campus, className: string }>();
    appState.classes.forEach(cls => {
      if (campusFilter !== 'all' && cls.campus !== campusFilter) return;
      cls.students.forEach(s => {
        studentMap.set(s.id, { student: s, campus: cls.campus, className: cls.name });
      });
    });
    return Array.from(studentMap.values());
  };

  const getStudentStats = (studentId: string) => {
    const awardedIds: string[] = [];
    appState.classes.forEach(cls => {
      const s = cls.students.find(st => st.id === studentId);
      if (s) awardedIds.push(...s.awardedCardIds);
    });
    return appState.categories.map(cat => {
      return awardedIds.filter(id => {
        const card = appState.cards.find(c => c.id === id);
        return card?.categoryId === cat.id;
      }).length;
    });
  };

  const teachers = appState.users.filter(u => u.role === UserRole.TEACHER);
  const admins = appState.users.filter(u => u.role === UserRole.ADMIN);
  const allStudents = getAllStudents();

  const changeUserPassword = (userId: string) => {
    const newPwd = prompt('请输入新密码:');
    if (newPwd) {
      setAppState(prev => {
        const next = { ...prev };
        const userIdx = next.users.findIndex(u => u.id === userId);
        if (userIdx > -1) {
          next.users[userIdx] = { ...next.users[userIdx], password: btoa(newPwd) };
          saveState(next);
        }
        return next;
      });
      alert('密码已更新');
    }
  };

  const confirmAddCard = () => {
    if (!addingToCategory || !newCardName.trim()) return;
    
    const newCard: Card = { 
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
      name: newCardName.trim(), 
      categoryId: addingToCategory.id, 
      description: '' 
    };
    
    setAppState(prev => {
      const next = {
        ...prev,
        cards: [...prev.cards, newCard]
      };
      saveState(next);
      return next;
    });
    
    setAddingToCategory(null);
    setNewCardName('');
  };

  const removeCard = (cardId: string) => {
    if (!window.confirm('确定要删除这张评价卡牌吗？该操作不会影响已发放的数据。')) return;
    
    setAppState(prev => {
      const next = {
        ...prev,
        cards: prev.cards.filter(c => c.id !== cardId)
      };
      saveState(next);
      return next;
    });
  };

  const handleExportData = () => {
    const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tooth_edu_backup_${new Date().toLocaleDateString()}.json`;
    a.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (importState(ev.target?.result as string)) {
        alert('导入成功');
        window.location.reload();
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <i className="fas fa-crown text-rose-500 text-2xl"></i>
          <span className="font-black tracking-tighter text-xl uppercase italic">Tooth-Edu Super</span>
        </div>
        <div className="flex gap-2">
          {['classes', 'accounts', 'cards', 'stats', 'system'].map((t) => (
            <button 
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === t ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              {t === 'classes' && '班级总览'}
              {t === 'accounts' && '账号管理'}
              {t === 'cards' && '评价细项'}
              {t === 'stats' && '数据分析'}
              {t === 'system' && '数据同步'}
            </button>
          ))}
          <button onClick={onLogout} className="ml-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 transition">
            <i className="fas fa-power-off"></i>
          </button>
        </div>
      </nav>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-2xl font-black text-slate-800">全学员评价画像</h2>
                <p className="text-sm text-slate-400 italic">跨维度统计学员获得的成长卡牌</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase">校区筛选:</span>
                <select 
                  value={campusFilter} 
                  onChange={e => setCampusFilter(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="all">全部校区</option>
                  <option value="138">138 校区</option>
                  <option value="158">158 校区</option>
                  <option value="168">168 校区</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {allStudents.map(({ student, campus, className }) => (
                <div 
                  key={student.id} 
                  onClick={() => setSelectedStudentId(student.id)}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-rose-500 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-rose-50 transition">
                      <i className="fas fa-user-graduate text-slate-300 group-hover:text-rose-500"></i>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${campus === '138' ? 'bg-purple-50 text-purple-600' : campus === '158' ? 'bg-orange-50 text-orange-600' : 'bg-cyan-50 text-cyan-600'}`}>
                      {campus} 校区
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{student.name}</h3>
                  <p className="text-xs text-slate-400 truncate mb-4">{className}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-1">
                      {getStudentStats(student.id).map((v, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-full border-2 border-white ${appState.categories[i].color}`} title={`${appState.categories[i].name}: ${v}`}></div>
                      ))}
                    </div>
                    <span className="text-xs font-black text-rose-500 group-hover:translate-x-1 transition-transform">查看画像 <i className="fas fa-chevron-right ml-1"></i></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800 uppercase italic">Class Monitor</h2>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                   {['all', '138', '158', '168'].map(c => (
                     <button key={c} onClick={() => setCampusFilter(c as any)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${campusFilter === c ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                        {c === 'all' ? '全部' : `${c} 校区`}
                     </button>
                   ))}
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {appState.classes.filter(c => campusFilter === 'all' || c.campus === campusFilter).map(cls => (
                  <div key={cls.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between mb-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${cls.campus === '138' ? 'bg-purple-600 text-white' : cls.campus === '158' ? 'bg-orange-500 text-white' : 'bg-cyan-600 text-white'}`}>Campus {cls.campus}</span>
                      <span className="text-xs font-bold text-slate-300">ID: {cls.id.slice(-4)}</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-2">{cls.name}</h3>
                    <div className="space-y-2 text-xs font-bold text-slate-500">
                      <p><i className="fas fa-chalkboard-teacher mr-2 text-rose-400"></i>教师: {cls.teacherId || '未指派'}</p>
                      <p><i className="fas fa-clock mr-2 text-rose-400"></i>时间: {cls.time}</p>
                      <p><i className="fas fa-users mr-2 text-rose-400"></i>学员: {cls.students.length} 人</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center"><i className="fas fa-user-shield mr-2 text-indigo-500"></i> 管理员管理</h2>
              <div className="space-y-4">
                {admins.map(a => (
                  <div key={a.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition">
                    <div>
                      <p className="font-bold text-slate-800">{a.username}</p>
                      <p className="text-[10px] text-slate-400 font-mono">PWD: {decryptPassword(a.password || '')}</p>
                    </div>
                    <button onClick={() => changeUserPassword(a.id)} className="w-8 h-8 rounded-full bg-white text-indigo-500 border border-slate-200 hover:bg-indigo-500 hover:text-white transition shadow-sm"><i className="fas fa-key text-xs"></i></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center"><i className="fas fa-chalkboard-teacher mr-2 text-emerald-500"></i> 教师管理</h2>
              <div className="space-y-4">
                {teachers.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-emerald-100 transition">
                    <div>
                      <p className="font-bold text-slate-800">{t.username}</p>
                      <p className="text-[10px] text-slate-400 font-mono">PWD: {decryptPassword(t.password || '')}</p>
                    </div>
                    <button onClick={() => changeUserPassword(t.id)} className="w-8 h-8 rounded-full bg-white text-emerald-500 border border-slate-200 hover:bg-emerald-500 hover:text-white transition shadow-sm"><i className="fas fa-key text-xs"></i></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-black text-slate-800 mb-8 uppercase italic">Pedagogical Framework</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {appState.categories.map(cat => (
                <div key={cat.id} className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${cat.color} shadow-lg shadow-current/20`}></div>
                    <h3 className="font-black text-slate-700 uppercase tracking-widest text-xs">{cat.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {appState.cards.filter(c => c.categoryId === cat.id).map(card => (
                      <div key={card.id} className="group relative">
                        <span className="inline-block px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 group-hover:border-rose-300 transition cursor-default pr-7">
                          {card.name}
                          <button 
                            onClick={() => removeCard(card.id)} 
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <i className="fas fa-times text-[10px]"></i>
                          </button>
                        </span>
                      </div>
                    ))}
                    <button 
                      onClick={() => setAddingToCategory(cat)} 
                      className="px-3 py-1 border border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-400 hover:border-slate-800 hover:text-slate-800 transition"
                    >
                      <i className="fas fa-plus mr-1"></i>添加
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="bg-slate-900 rounded-3xl p-12 text-center text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
             <div className="relative z-10 max-w-xl mx-auto">
               <div className="w-20 h-20 bg-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-rose-500/40 rotate-12">
                  <i className="fas fa-cloud-upload-alt text-3xl"></i>
               </div>
               <h2 className="text-3xl font-black mb-4">数据本地安全存储</h2>
               <p className="text-slate-400 text-sm mb-10 leading-relaxed">系统数据采用浏览器离线数据库。建议每周进行一次手动备份导出，以防设备丢失。导入功能将完全还原历史快照。</p>
               <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={handleExportData} className="flex-1 bg-white text-slate-900 py-4 rounded-2xl font-black hover:scale-105 transition-transform"><i className="fas fa-download mr-2"></i> 导出完整备份</button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black border border-slate-700 hover:bg-slate-700 transition"><i className="fas fa-upload mr-2"></i> 恢复备份</button>
                  <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".json" className="hidden" />
               </div>
             </div>
          </div>
        )}
      </main>

      {/* 新增：添加细项的自定义模态框 */}
      {addingToCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[60]">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-black text-slate-800">添加评价细项</h3>
                <button onClick={() => setAddingToCategory(null)} className="text-slate-400 hover:text-slate-600 transition"><i className="fas fa-times"></i></button>
             </div>
             <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className={`w-3 h-3 rounded-full ${addingToCategory.color}`}></div>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">当前维度：{addingToCategory.name}</span>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">细项名称</label>
                   <input 
                    autoFocus
                    type="text" 
                    value={newCardName}
                    onChange={(e) => setNewCardName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmAddCard()}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none font-medium transition"
                    placeholder="输入评价词汇（如：主动思考）"
                   />
                </div>
                <div className="flex gap-3 pt-2">
                   <button 
                    onClick={() => setAddingToCategory(null)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-200 transition"
                   >
                    取消
                   </button>
                   <button 
                    onClick={confirmAddCard}
                    disabled={!newCardName.trim()}
                    className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition shadow-lg shadow-rose-500/30 disabled:opacity-50 disabled:shadow-none"
                   >
                    确认添加
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {selectedStudentId && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl">
             <div className="p-8 pb-0 flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">成长画像统计</h3>
                <button onClick={() => setSelectedStudentId(null)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition"><i className="fas fa-times"></i></button>
             </div>
             <div className="p-8">
                <div className="mb-8 p-6 bg-slate-50 rounded-3xl text-center">
                   <div className="w-20 h-20 bg-white rounded-[30px] shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <span className="text-3xl font-black text-rose-500">{allStudents.find(s => s.student.id === selectedStudentId)?.student.name.charAt(0)}</span>
                   </div>
                   <h4 className="text-xl font-black text-slate-800">{allStudents.find(s => s.student.id === selectedStudentId)?.student.name}</h4>
                   <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{allStudents.find(s => s.student.id === selectedStudentId)?.campus} 校区 · {allStudents.find(s => s.student.id === selectedStudentId)?.className}</p>
                </div>
                
                <RadarChart 
                  data={getStudentStats(selectedStudentId)} 
                  labels={appState.categories.map(c => c.name)} 
                />

                <div className="mt-8 grid grid-cols-5 gap-2">
                   {appState.categories.map((cat, i) => (
                     <div key={cat.id} className="text-center">
                        <div className={`text-lg font-black ${cat.color.replace('bg-', 'text-')}`}>{getStudentStats(selectedStudentId)[i]}</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase">{cat.name.slice(0,2)}</div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="p-8 bg-slate-50 flex justify-center">
                <button onClick={() => setSelectedStudentId(null)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm">确认关闭</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
