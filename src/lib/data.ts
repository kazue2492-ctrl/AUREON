import type { Transaction, Budget, Goal, UserProfile, Notification } from '@/types';
import { apiFetch, getToken, HttpError } from './clientAuth';

const STORAGE_KEYS = {
  transactions: 'sanhuu_transactions',
  budgets: 'sanhuu_budgets',
  goals: 'sanhuu_goals',
  profile: 'sanhuu_profile',
  notifications: 'sanhuu_notifications',
  initialized: 'sanhuu_initialized',
};

let _txCache: Transaction[] | null = null;

// ── Local storage helpers ─────────────────────────────────
function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function emitProfileChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('profileUpdated'));
}

function emitDataChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('dataUpdated'));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// ── Initialize ────────────────────────────────────────────
// Fetches all the current user's data from the server and primes the local cache.
// No sample-data fallback: a brand-new user starts with empty state.
export async function initializeData(): Promise<void> {
  if (!getToken()) return;

  try {
    const [transactions, budgets, goals, profileData, notifications] = await Promise.all([
      apiFetch<Transaction[]>('/api/transactions'),
      apiFetch<Budget[]>('/api/budgets'),
      apiFetch<Goal[]>('/api/goals'),
      apiFetch<UserProfile | null>('/api/profile'),
      apiFetch<Notification[]>('/api/notifications'),
    ]);

    setStorage(STORAGE_KEYS.transactions, transactions);
    _txCache = transactions;
    setStorage(STORAGE_KEYS.budgets, budgets);
    setStorage(STORAGE_KEYS.goals, goals);
    if (profileData) setStorage(STORAGE_KEYS.profile, profileData);
    setStorage(STORAGE_KEYS.notifications, notifications);
    localStorage.setItem(STORAGE_KEYS.initialized, 'true');

    emitDataChange();
    emitProfileChange();
  } catch (err) {
    if (err instanceof HttpError && err.status === 401) {
      // apiFetch already cleared auth and redirected
      return;
    }
    console.error('initializeData failed', err);
  }
}

// ── Transactions ─────────────────────────────────────────
export function getTransactions(): Transaction[] {
  if (_txCache === null) {
    _txCache = getStorage<Transaction[]>(STORAGE_KEYS.transactions, []);
  }
  return _txCache;
}

export function addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
  const transactions = getTransactions();
  const newTransaction = { ...transaction, id: generateId() };
  const next = [...transactions, newTransaction];
  setStorage(STORAGE_KEYS.transactions, next);
  _txCache = next;
  apiFetch('/api/transactions', { method: 'POST', body: JSON.stringify(newTransaction) }).catch(console.error);
  return newTransaction;
}

export function updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
  const transactions = getTransactions();
  const index = transactions.findIndex(t => t.id === id);
  if (index === -1) return null;
  const updated = [...transactions];
  updated[index] = { ...updated[index], ...updates };
  setStorage(STORAGE_KEYS.transactions, updated);
  _txCache = updated;
  apiFetch(`/api/transactions/${id}`, { method: 'PUT', body: JSON.stringify(updated[index]) }).catch(console.error);
  return updated[index];
}

export function deleteTransaction(id: string): boolean {
  const transactions = getTransactions();
  const filtered = transactions.filter(t => t.id !== id);
  setStorage(STORAGE_KEYS.transactions, filtered);
  _txCache = filtered;
  apiFetch(`/api/transactions/${id}`, { method: 'DELETE' }).catch(console.error);
  return filtered.length < transactions.length;
}

// ── Budgets ───────────────────────────────────────────────
export function getBudgets(): Budget[] {
  return getStorage<Budget[]>(STORAGE_KEYS.budgets, []);
}

export function addBudget(budget: Omit<Budget, 'id' | 'spent'>): Budget {
  const budgets = getBudgets();
  const newBudget = { ...budget, id: generateId(), spent: 0 };
  setStorage(STORAGE_KEYS.budgets, [...budgets, newBudget]);
  apiFetch('/api/budgets', { method: 'POST', body: JSON.stringify(newBudget) }).catch(console.error);
  return newBudget;
}

export function updateBudget(id: string, updates: Partial<Budget>): Budget | null {
  const budgets = getBudgets();
  const index = budgets.findIndex(b => b.id === id);
  if (index === -1) return null;
  budgets[index] = { ...budgets[index], ...updates };
  setStorage(STORAGE_KEYS.budgets, budgets);
  apiFetch(`/api/budgets/${id}`, { method: 'PUT', body: JSON.stringify(budgets[index]) }).catch(console.error);
  return budgets[index];
}

export function deleteBudget(id: string): boolean {
  const budgets = getBudgets();
  const filtered = budgets.filter(b => b.id !== id);
  setStorage(STORAGE_KEYS.budgets, filtered);
  apiFetch(`/api/budgets/${id}`, { method: 'DELETE' }).catch(console.error);
  return filtered.length < budgets.length;
}

// ── Goals ─────────────────────────────────────────────────
export function getGoals(): Goal[] {
  return getStorage<Goal[]>(STORAGE_KEYS.goals, []);
}

export function addGoal(goal: Omit<Goal, 'id' | 'currentAmount' | 'createdAt'>): Goal {
  const goals = getGoals();
  const newGoal: Goal = {
    ...goal, id: generateId(), currentAmount: 0,
    createdAt: new Date().toISOString().split('T')[0],
  };
  setStorage(STORAGE_KEYS.goals, [...goals, newGoal]);
  apiFetch('/api/goals', { method: 'POST', body: JSON.stringify(newGoal) }).catch(console.error);
  emitDataChange();
  return newGoal;
}

export function updateGoal(id: string, updates: Partial<Goal>): Goal | null {
  const goals = getGoals();
  const index = goals.findIndex(g => g.id === id);
  if (index === -1) return null;
  goals[index] = { ...goals[index], ...updates };
  setStorage(STORAGE_KEYS.goals, goals);
  apiFetch(`/api/goals/${id}`, { method: 'PUT', body: JSON.stringify(goals[index]) }).catch(console.error);
  emitDataChange();
  return goals[index];
}

export function deleteGoal(id: string): boolean {
  const goals = getGoals();
  const filtered = goals.filter(g => g.id !== id);
  setStorage(STORAGE_KEYS.goals, filtered);
  apiFetch(`/api/goals/${id}`, { method: 'DELETE' }).catch(console.error);
  emitDataChange();
  return filtered.length < goals.length;
}

// ── Profile ───────────────────────────────────────────────
export const DEFAULT_AVATAR = '/images/default-avatar.png';

const FALLBACK_PROFILE: UserProfile = {
  name: '',
  email: '',
  avatar: DEFAULT_AVATAR,
  currency: 'MNT',
  darkMode: false,
  relationshipStatus: 'individual',
};

export function getProfile(): UserProfile {
  const stored = getStorage<UserProfile>(STORAGE_KEYS.profile, FALLBACK_PROFILE);
  if (!stored.avatar) stored.avatar = DEFAULT_AVATAR;
  return stored;
}

export function updateProfile(updates: Partial<UserProfile>): UserProfile {
  const profile = getProfile();
  const updated = { ...profile, ...updates };
  setStorage(STORAGE_KEYS.profile, updated);
  apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify(updated) }).catch(console.error);
  emitProfileChange();
  return updated;
}

// Seed the local profile cache from the auth response (register/login)
// so getProfile() returns the user's name immediately, before initializeData()
// has fetched the full profile from the server. Otherwise FALLBACK_PROFILE leaks
// an empty `name` into any updateProfile() call made before /api/profile loads.
export function seedProfileFromAuth(user: { name?: string; email?: string }): void {
  if (typeof window === 'undefined') return;
  if (!user?.name && !user?.email) return;
  const existing = getStorage<UserProfile | null>(STORAGE_KEYS.profile, null);
  // Don't clobber a profile that already has data — only seed if missing/empty.
  if (existing && (existing.name || existing.email)) return;
  setStorage<UserProfile>(STORAGE_KEYS.profile, {
    ...FALLBACK_PROFILE,
    name:  user.name  ?? '',
    email: user.email ?? '',
  });
  emitProfileChange();
}

// ── Notifications ─────────────────────────────────────────
export function getNotifications(): Notification[] {
  return getStorage<Notification[]>(STORAGE_KEYS.notifications, []);
}

export function markNotificationRead(id: string): void {
  const notifications = getNotifications();
  const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
  setStorage(STORAGE_KEYS.notifications, updated);
  apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(console.error);
}

export function addNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
  const notifications = getNotifications();
  const newNotification: Notification = {
    ...notification, id: generateId(),
    createdAt: new Date().toISOString().split('T')[0],
  };
  setStorage(STORAGE_KEYS.notifications, [newNotification, ...notifications]);
  apiFetch('/api/notifications', { method: 'POST', body: JSON.stringify(newNotification) }).catch(console.error);
  return newNotification;
}

// ── Analytics Helpers ─────────────────────────────────────
export function getTotalBalance(): number {
  return getTransactions().reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
}

export function getMonthlyIncome(month?: string, year?: number): number {
  const now = new Date();
  const m = month ?? String(now.getMonth() + 1).padStart(2, '0');
  const y = year ?? now.getFullYear();
  return getTransactions()
    .filter(t => t.type === 'income' && t.date.startsWith(`${y}-${m}`))
    .reduce((acc, t) => acc + t.amount, 0);
}

export function getMonthlyExpense(month?: string, year?: number): number {
  const now = new Date();
  const m = month ?? String(now.getMonth() + 1).padStart(2, '0');
  const y = year ?? now.getFullYear();
  return getTransactions()
    .filter(t => t.type === 'expense' && t.date.startsWith(`${y}-${m}`))
    .reduce((acc, t) => acc + t.amount, 0);
}

export function getCategoryExpenses(month?: string, year?: number): Record<string, number> {
  const now = new Date();
  const m = month ?? String(now.getMonth() + 1).padStart(2, '0');
  const y = year ?? now.getFullYear();
  const expenses: Record<string, number> = {};
  getTransactions()
    .filter(t => t.type === 'expense' && t.date.startsWith(`${y}-${m}`))
    .forEach(t => { expenses[t.category] = (expenses[t.category] || 0) + t.amount; });
  return expenses;
}

export function getLast6MonthsData(): { months: string[]; income: number[]; expenses: number[] } {
  const transactions = getTransactions();
  const months: string[] = [];
  const income: number[] = [];
  const expenses: number[] = [];
  const now = new Date();
  const monthNames = ['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар','7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push(monthNames[d.getMonth()]);
    const monthTx = transactions.filter(t => t.date.startsWith(prefix));
    income.push(monthTx.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0));
    expenses.push(monthTx.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0));
  }
  return { months, income, expenses };
}

export function getWeeklyData(): { days: string[]; expenses: number[] } {
  const dayNames = ['Дав','Мяг','Лха','Пүр','Баа','Бям','Ням'];
  const days: string[] = [];
  const expenses: number[] = [];
  const transactions = getTransactions();
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push(dayNames[d.getDay()]);
    expenses.push(
      transactions.filter(t => t.type === 'expense' && t.date === dateStr)
        .reduce((acc, t) => acc + t.amount, 0)
    );
  }
  return { days, expenses };
}

export function getSavingsGrowth(): { months: string[]; savings: number[] } {
  const { months, income, expenses } = getLast6MonthsData();
  return { months, savings: income.map((inc, i) => Math.max(0, inc - expenses[i])) };
}

// Total money the user has set aside across all financial goals.
// This is what the "Хэмнэлт" (Savings) card surfaces — the sum of every
// deposit they have made toward their goals.
export function getGoalSavings(): number {
  return getGoals().reduce((acc, g) => acc + (g.currentAmount || 0), 0);
}
