
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export type ClassLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type Campus = '138' | '158' | '168';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  createdAt: number;
}

export interface Card {
  id: string;
  name: string;
  categoryId: string;
  description: string;
}

export interface CardCategory {
  id: string;
  name: string;
  color: string;
}

export interface Student {
  id: string;
  name: string;
  awardedCardIds: string[];
}

export interface ClassSession {
  id: string;
  name: string;
  time: string;
  level: ClassLevel;
  campus: Campus;
  teacherId?: string;
  adminId: string;
  students: Student[];
}

export interface AwardRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  cardIds: string[];
  timestamp: number;
  teacherId: string;
}

export interface AppState {
  users: User[];
  classes: ClassSession[];
  cards: Card[];
  categories: CardCategory[];
  weeklyCardIdsSmall: string[];
  weeklyCardIdsLarge: string[];
  lastCardUpdate?: number;
  awardHistory: AwardRecord[]; // 新增：评价历史记录
}
