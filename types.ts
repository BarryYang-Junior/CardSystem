
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface User {
  id: string;
  username: string;
  password?: string; // Stored hashed/encrypted
  role: UserRole;
  createdAt: number;
}

export interface Card {
  id: string;
  name: string;
  categoryId: string; // One of the 5 main categories
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
  awardedCardIds: string[]; // IDs of cards currently held
}

export interface ClassSession {
  id: string;
  name: string;
  time: string;
  teacherId?: string; // Linked teacher username or ID
  adminId: string;    // Created by
  students: Student[];
  /** 
   * Stores the IDs of the 5 specific cards selected for this class session.
   * One card for each of the 5 main categories.
   */
  activeCardIds: string[]; 
}

export interface AppState {
  users: User[];
  classes: ClassSession[];
  cards: Card[];
  categories: CardCategory[];
}
