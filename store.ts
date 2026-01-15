
import { AppState, User, UserRole } from './types';
import { INITIAL_CATEGORIES, SUPER_ADMIN_CREDENTIALS } from './constants';

// 自动识别当前访问的服务器 IP，并指向 3000 端口的后端服务
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SERVER_IP = isLocal ? 'localhost' : window.location.hostname;
const API_BASE = `http://${SERVER_IP}:3000/api`;

export const getState = (): AppState => {
  const cached = localStorage.getItem('tooth_edu_cache');
  if (cached) return JSON.parse(cached);
  return {
    users: [],
    classes: [],
    cards: [],
    categories: INITIAL_CATEGORIES,
    weeklyCardIdsSmall: [],
    weeklyCardIdsLarge: [],
    awardHistory: []
  };
};

// 从服务器拉取最新状态
export const fetchStateFromServer = async (): Promise<AppState | null> => {
  try {
    const res = await fetch(`${API_BASE}/state`, {
       method: 'GET',
       headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const state = await res.json();
      // 如果后端返回了空状态，则不覆盖本地默认配置
      if (state && state.categories) {
        localStorage.setItem('tooth_edu_cache', JSON.stringify(state));
        return state;
      }
    }
  } catch (e) {
    console.error("无法连接到云端服务器:", API_BASE);
  }
  return null;
};

export const saveState = async (state: AppState) => {
  localStorage.setItem('tooth_edu_cache', JSON.stringify(state));
  try {
    const res = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    });
    return res.ok;
  } catch (e) {
    console.warn("云端同步失败，数据仅保存在本地浏览器");
    return false;
  }
};

export const loginUser = async (username: string, password: string): Promise<User | null> => {
  // 1. 优先尝试超级管理员
  if (username === SUPER_ADMIN_CREDENTIALS.username && password === SUPER_ADMIN_CREDENTIALS.password) {
    return {
      id: 'super-admin-1',
      username: SUPER_ADMIN_CREDENTIALS.username,
      role: UserRole.SUPER_ADMIN,
      createdAt: Date.now()
    };
  }

  // 2. 调用云端 API 登录
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("登录服务连接失败");
  }
  return null;
};

export const archiveCurrentAwards = async (records: any[]) => {
  try {
    await fetch(`${API_BASE}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records })
    });
  } catch (e) {
    console.error("归档失败");
  }
};

export const encryptPassword = (pwd: string) => btoa(pwd);
export const decryptPassword = (encrypted: string) => atob(encrypted);
export const importState = (content: string) => true;
