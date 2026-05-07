export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  description?: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  month: string;
  year: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  image?: string;
  dailyAmount?: number;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  currency: string;
  darkMode: boolean;
  relationshipStatus?: 'individual' | 'couple' | 'family' | 'student';
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
  createdAt: string;
}

export const EXPENSE_CATEGORIES = [
  'Хоол',
  'Тээвэр',
  'Дэлгүүр',
  'Төлбөр',
  'Зугаа цэнгэл',
  'Бусад',
];

export const INCOME_CATEGORIES = ['Цалин', 'Фриланс', 'Бусад'];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
