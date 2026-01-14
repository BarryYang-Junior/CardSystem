
import { AppState, User, ClassSession, Card, UserRole } from './types';
import { INITIAL_CATEGORIES, SUPER_ADMIN_CREDENTIALS } from './constants';

const STORAGE_KEY = 'tooth_edu_db';

const getInitialState = (): AppState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);

  // Default state with Super Admin
  const superAdmin: User = {
    id: 'super-admin-001',
    username: SUPER_ADMIN_CREDENTIALS.username,
    password: btoa(SUPER_ADMIN_CREDENTIALS.password), // Simple encryption for demo
    role: UserRole.SUPER_ADMIN,
    createdAt: Date.now()
  };

  return {
    users: [superAdmin],
    classes: [],
    cards: [],
    categories: INITIAL_CATEGORIES
  };
};

export const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const getState = (): AppState => getInitialState();

export const findUser = (username: string) => {
  return getState().users.find(u => u.username === username);
};

export const encryptPassword = (pwd: string) => btoa(pwd);
export const decryptPassword = (encrypted: string) => atob(encrypted);
