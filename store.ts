
import { AppState, User, ClassSession, Card, UserRole, AwardRecord } from './types';
import { INITIAL_CATEGORIES, SUPER_ADMIN_CREDENTIALS } from './constants';

const STORAGE_KEY = 'tooth_edu_state_local';
const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;

const shouldResetWeeklyCards = (lastUpdate?: number): boolean => {
  if (!lastUpdate) return false;
  const lastDate = new Date(lastUpdate);
  const now = new Date();
  
  // 检查是否跨越了本周五
  const lastFriday = new Date(lastUpdate);
  lastFriday.setDate(lastDate.getDate() + (5 - lastDate.getDay() + 7) % 7);
  lastFriday.setHours(0, 0, 0, 0);
  
  return now.getTime() >= lastFriday.getTime() && now.getDate() !== lastDate.getDate();
};

const getInitialState = (): AppState => {
  const superAdmin = {
    id: 'super-admin-1',
    username: SUPER_ADMIN_CREDENTIALS.username,
    password: btoa(SUPER_ADMIN_CREDENTIALS.password),
    role: UserRole.SUPER_ADMIN,
    createdAt: Date.now()
  };

  const defaultState: AppState = {
    users: [superAdmin],
    classes: [],
    cards: [],
    categories: INITIAL_CATEGORIES,
    weeklyCardIdsSmall: [],
    weeklyCardIdsLarge: [],
    lastCardUpdate: Date.now(),
    awardHistory: []
  };

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      let parsed: AppState = JSON.parse(saved);
      
      // 1. 每周五自动归档
      if (shouldResetWeeklyCards(parsed.lastCardUpdate)) {
        const newRecords: AwardRecord[] = [];
        parsed.classes.forEach(cls => {
          cls.students.forEach(student => {
            if (student.awardedCardIds.length > 0) {
              newRecords.push({
                id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                studentId: student.id,
                studentName: student.name,
                classId: cls.id,
                className: cls.name,
                cardIds: [...student.awardedCardIds],
                timestamp: Date.now(),
                teacherId: cls.teacherId || 'unknown'
              });
              // 归档后清空班级内状态
              student.awardedCardIds = [];
            }
          });
        });

        parsed.awardHistory = [...(parsed.awardHistory || []), ...newRecords];
        parsed.weeklyCardIdsSmall = [];
        parsed.weeklyCardIdsLarge = [];
        parsed.lastCardUpdate = Date.now();
      }

      // 2. 自动清理两个月前的数据
      const now = Date.now();
      if (parsed.awardHistory) {
        parsed.awardHistory = parsed.awardHistory.filter(record => (now - record.timestamp) < TWO_MONTHS_MS);
      } else {
        parsed.awardHistory = [];
      }

      return { ...defaultState, ...parsed };
    } catch (e) {
      return defaultState;
    }
  }
  return defaultState;
};

export const getState = (): AppState => getInitialState();

export const saveState = (state: AppState) => {
  // 保存前也执行一次历史记录清理，确保存储空间健康
  const now = Date.now();
  if (state.awardHistory) {
    state.awardHistory = state.awardHistory.filter(record => (now - record.timestamp) < TWO_MONTHS_MS);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const importState = (content: string): boolean => {
  try {
    const data = JSON.parse(content);
    if (data && typeof data === 'object' && Array.isArray(data.users)) {
       saveState(data);
       return true;
    }
  } catch (e) {}
  return false;
};

export const loginUser = async (username: string, password: string): Promise<User | null> => {
  const state = getState();
  const localUser = state.users.find(u => u.username === username && u.password === btoa(password));
  if (localUser) return localUser;
  return null;
};

export const encryptPassword = (pwd: string) => btoa(pwd);
export const decryptPassword = (encrypted: string) => atob(encrypted);
