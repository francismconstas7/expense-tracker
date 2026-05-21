import { createClient } from '@supabase/supabase-js';

// We fetch the keys from environment variables or custom manual setup stored in localStorage
const getInitialConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const savedUrl = localStorage.getItem('SPROUT_SUPABASE_URL');
  const savedKey = localStorage.getItem('SPROUT_SUPABASE_ANON_KEY');
  
  return {
    url: savedUrl || envUrl || '',
    key: savedKey || envKey || '',
    isDemoMode: localStorage.getItem('SPROUT_DEMO_MODE') !== 'false' && !(savedUrl || envUrl),
  };
};

let { url, key, isDemoMode } = getInitialConfig();

export const isSupabaseConfigured = () => {
  return !!(url && key);
};

export const getSupabaseConfig = () => {
  return { url, key, isDemoMode };
};

export const setSupabaseConfig = (newUrl: string, newKey: string) => {
  if (newUrl.trim() && newKey.trim()) {
    localStorage.setItem('SPROUT_SUPABASE_URL', newUrl.trim());
    localStorage.setItem('SPROUT_SUPABASE_ANON_KEY', newKey.trim());
    localStorage.setItem('SPROUT_DEMO_MODE', 'false');
    url = newUrl.trim();
    key = newKey.trim();
    isDemoMode = false;
    // Recreate the client
    supabase = createClient(url, key);
    return true;
  }
  return false;
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('SPROUT_SUPABASE_URL');
  localStorage.removeItem('SPROUT_SUPABASE_ANON_KEY');
  localStorage.setItem('SPROUT_DEMO_MODE', 'true');
  url = import.meta.env.VITE_SUPABASE_URL || '';
  key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  isDemoMode = !url;
  supabase = url && key ? createClient(url, key) : null;
};

export const setDemoMode = (demo: boolean) => {
  localStorage.setItem('SPROUT_DEMO_MODE', String(demo));
  isDemoMode = demo;
};

// Initialize Supabase. If credentials are not present, we will gracefully handle operations locally
export let supabase = isSupabaseConfigured() ? createClient(url, key) : null;

// ==========================================
// MOCK DATA GENERATOR & PERSISTENCE
// ==========================================
export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

// Initial mock expenses to populate when user initializes demo mode
const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    user_id: 'demo-user',
    amount: 42.50,
    category: 'Food & Dining',
    description: 'Weekly organic groceries from local farmer market',
    date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-2',
    user_id: 'demo-user',
    amount: 15.00,
    category: 'Entertainment',
    description: 'Monthly streaming service subscription',
    date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp-3',
    user_id: 'demo-user',
    amount: 120.00,
    category: 'Shopping',
    description: 'New leather boots',
    date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp-4',
    user_id: 'demo-user',
    amount: 18.25,
    category: 'Transportation',
    description: 'Subway pass reload & transit ticket',
    date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp-5',
    user_id: 'demo-user',
    amount: 85.00,
    category: 'Utilities',
    description: 'High speed fiber internet',
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp-6',
    user_id: 'demo-user',
    amount: 60.00,
    category: 'Health & Wellness',
    description: 'Yoga workshop session',
    date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp-7',
    user_id: 'demo-user',
    amount: 32.40,
    category: 'Food & Dining',
    description: 'Cozy dinner with friends',
    date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
  }
];

const DEFAULT_BUDGETS: Budget[] = [
  { id: 'b-1', user_id: 'demo-user', category: 'total', amount: 800, created_at: new Date().toISOString() },
  { id: 'b-2', user_id: 'demo-user', category: 'Food & Dining', amount: 250, created_at: new Date().toISOString() },
  { id: 'b-3', user_id: 'demo-user', category: 'Entertainment', amount: 80, created_at: new Date().toISOString() },
  { id: 'b-4', user_id: 'demo-user', category: 'Shopping', amount: 200, created_at: new Date().toISOString() },
  { id: 'b-5', user_id: 'demo-user', category: 'Transportation', amount: 100, created_at: new Date().toISOString() },
  { id: 'b-6', user_id: 'demo-user', category: 'Utilities', amount: 150, created_at: new Date().toISOString() },
  { id: 'b-7', user_id: 'demo-user', category: 'Health & Wellness', amount: 100, created_at: new Date().toISOString() },
  { id: 'b-8', user_id: 'demo-user', category: 'Education', amount: 50, created_at: new Date().toISOString() },
];

export const getLocalDatabase = () => {
  const expensesStr = localStorage.getItem('SPROUT_EXPENSES');
  const budgetsStr = localStorage.getItem('SPROUT_BUDGETS');
  const usersStr = localStorage.getItem('SPROUT_USERS');
  const currentUserId = localStorage.getItem('SPROUT_CURRENT_USER_ID');
  
  if (!expensesStr) localStorage.setItem('SPROUT_EXPENSES', JSON.stringify(DEFAULT_EXPENSES));
  if (!budgetsStr) localStorage.setItem('SPROUT_BUDGETS', JSON.stringify(DEFAULT_BUDGETS));
  if (!usersStr) {
    const defaultUser: UserProfile = { id: 'demo-user', email: 'demo@sprout.io', created_at: new Date().toISOString() };
    localStorage.setItem('SPROUT_USERS', JSON.stringify([defaultUser]));
    if (!currentUserId) {
      localStorage.setItem('SPROUT_CURRENT_USER_ID', 'demo-user');
    }
  }

  return {
    expenses: expensesStr ? JSON.parse(expensesStr) as Expense[] : DEFAULT_EXPENSES,
    budgets: budgetsStr ? JSON.parse(budgetsStr) as Budget[] : DEFAULT_BUDGETS,
    users: usersStr ? JSON.parse(usersStr) as UserProfile[] : [{ id: 'demo-user', email: 'demo@sprout.io', created_at: new Date().toISOString() }],
    currentUserId: localStorage.getItem('SPROUT_CURRENT_USER_ID') || 'demo-user',
  };
};

export const updateLocalDatabase = (data: { expenses?: Expense[]; budgets?: Budget[]; users?: UserProfile[]; currentUserId?: string | null }) => {
  if (data.expenses) localStorage.setItem('SPROUT_EXPENSES', JSON.stringify(data.expenses));
  if (data.budgets) localStorage.setItem('SPROUT_BUDGETS', JSON.stringify(data.budgets));
  if (data.users) localStorage.setItem('SPROUT_USERS', JSON.stringify(data.users));
  if (data.currentUserId !== undefined) {
    if (data.currentUserId === null) {
      localStorage.removeItem('SPROUT_CURRENT_USER_ID');
    } else {
      localStorage.setItem('SPROUT_CURRENT_USER_ID', data.currentUserId);
    }
  }
};
