import { supabase, isSupabaseConfigured, getSupabaseConfig, getLocalDatabase, updateLocalDatabase, Expense, Budget } from './supabaseClient';

export interface UserSession {
  id: string;
  email: string;
}

// Helper to determine if we should use mock or real database
const useMock = () => {
  return !isSupabaseConfigured() || getSupabaseConfig().isDemoMode;
};

// ==========================================
// AUTHENTICATION SERVICES
// ==========================================

export const getCurrentUser = async (): Promise<UserSession | null> => {
  if (useMock()) {
    const db = getLocalDatabase();
    if (!db.currentUserId) return null;
    const user = db.users.find(u => u.id === db.currentUserId);
    if (!user) return null;
    return { id: user.id, email: user.email };
  }

  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { id: user.id, email: user.email || '' };
};

export const signUpUser = async (email: string, password: string): Promise<{ user: UserSession | null; error: Error | null }> => {
  if (useMock()) {
    const db = getLocalDatabase();
    const cleanEmail = email.trim().toLowerCase();
    
    if (db.users.some(u => u.email === cleanEmail)) {
      return { user: null, error: new Error('A user with this email already exists.') };
    }
    
    const newUser = {
      id: Math.random().toString(36).substring(2, 11),
      email: cleanEmail,
      created_at: new Date().toISOString()
    };
    
    const updatedUsers = [...db.users, newUser];
    updateLocalDatabase({
      users: updatedUsers,
      currentUserId: newUser.id
    });
    
    // Seed some initial demo expenses for the brand new registered user so they don't start totally empty
    const initialExpensesForUser = [
      {
        id: 'exp-u1',
        user_id: newUser.id,
        amount: 25.00,
        category: 'Food & Dining',
        description: 'Welcome lunch at Sprout Cafe',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      },
      {
        id: 'exp-u2',
        user_id: newUser.id,
        amount: 8.50,
        category: 'Transportation',
        description: 'Transit fare back home',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      }
    ];

    const initialBudgetsForUser = [
      { id: 'b-u1', user_id: newUser.id, category: 'total', amount: 500, created_at: new Date().toISOString() },
      { id: 'b-u2', user_id: newUser.id, category: 'Food & Dining', amount: 150, created_at: new Date().toISOString() },
      { id: 'b-u3', user_id: newUser.id, category: 'Transportation', amount: 50, created_at: new Date().toISOString() },
    ];
    
    updateLocalDatabase({
      expenses: [...db.expenses, ...initialExpensesForUser],
      budgets: [...db.budgets, ...initialBudgetsForUser]
    });

    return { user: { id: newUser.id, email: newUser.email }, error: null };
  }

  if (!supabase) return { user: null, error: new Error('Supabase client not initialized') };
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { user: null, error: new Error(error.message) };
  if (!data.user) return { user: null, error: new Error('Sign up completed but no user returned. Check your email confirmation settings.') };
  
  return { user: { id: data.user.id, email: data.user.email || '' }, error: null };
};

export const signInUser = async (email: string, password: string): Promise<{ user: UserSession | null; error: Error | null }> => {
  if (useMock()) {
    const db = getLocalDatabase();
    const cleanEmail = email.trim().toLowerCase();
    
    const user = db.users.find(u => u.email === cleanEmail);
    // In demo/mock mode, we allow any password to log in if the email is found. 
    // If user doesn't exist, we auto-create them to make the app incredibly friction-free!
    if (!user) {
      return signUpUser(email, password);
    }
    
    updateLocalDatabase({ currentUserId: user.id });
    return { user: { id: user.id, email: user.email }, error: null };
  }

  if (!supabase) return { user: null, error: new Error('Supabase client not initialized') };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: new Error(error.message) };
  if (!data.user) return { user: null, error: new Error('Invalid user or password') };
  
  return { user: { id: data.user.id, email: data.user.email || '' }, error: null };
};

export const signOutUser = async (): Promise<{ error: Error | null }> => {
  if (useMock()) {
    updateLocalDatabase({ currentUserId: null });
    return { error: null };
  }

  if (!supabase) return { error: new Error('Supabase client not initialized') };
  const { error } = await supabase.auth.signOut();
  if (error) return { error: new Error(error.message) };
  return { error: null };
};


// ==========================================
// EXPENSE SERVICES
// ==========================================

export const fetchExpenses = async (): Promise<Expense[]> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  if (useMock()) {
    const db = getLocalDatabase();
    return db.expenses
      .filter(exp => exp.user_id === currentUser.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  if (!supabase) return [];
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses from Supabase:', error);
    throw error;
  }
  return data || [];
};

export const addExpense = async (expenseData: Omit<Expense, 'id' | 'user_id' | 'created_at'>): Promise<Expense> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to add expenses.');

  if (useMock()) {
    const db = getLocalDatabase();
    const newExpense: Expense = {
      ...expenseData,
      id: 'exp-' + Math.random().toString(36).substring(2, 11),
      user_id: currentUser.id,
      created_at: new Date().toISOString()
    };
    
    updateLocalDatabase({
      expenses: [newExpense, ...db.expenses]
    });
    return newExpense;
  }

  if (!supabase) throw new Error('Supabase client not initialized');
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      ...expenseData,
      user_id: currentUser.id
    }])
    .select()
    .single();

  if (error) {
    console.error('Error adding expense to Supabase:', error);
    throw error;
  }
  return data;
};

export const deleteExpense = async (id: string): Promise<boolean> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to delete expenses.');

  if (useMock()) {
    const db = getLocalDatabase();
    const expenseToDelete = db.expenses.find(exp => exp.id === id && exp.user_id === currentUser.id);
    if (!expenseToDelete) return false;
    
    updateLocalDatabase({
      expenses: db.expenses.filter(exp => exp.id !== id)
    });
    return true;
  }

  if (!supabase) throw new Error('Supabase client not initialized');
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUser.id);

  if (error) {
    console.error('Error deleting expense from Supabase:', error);
    throw error;
  }
  return true;
};


// ==========================================
// BUDGET SERVICES
// ==========================================

export const fetchBudgets = async (): Promise<Budget[]> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  if (useMock()) {
    const db = getLocalDatabase();
    return db.budgets.filter(b => b.user_id === currentUser.id);
  }

  if (!supabase) return [];
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', currentUser.id);

  if (error) {
    console.error('Error fetching budgets from Supabase:', error);
    throw error;
  }
  return data || [];
};

export const updateBudget = async (category: string, amount: number): Promise<Budget> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('You must be signed in to update budgets.');

  if (useMock()) {
    const db = getLocalDatabase();
    const updatedBudgets = [...db.budgets];
    const index = updatedBudgets.findIndex(b => b.user_id === currentUser.id && b.category === category);
    
    let resultBudget: Budget;
    
    if (index >= 0) {
      updatedBudgets[index] = {
        ...updatedBudgets[index],
        amount,
      };
      resultBudget = updatedBudgets[index];
    } else {
      const newBudget: Budget = {
        id: 'b-' + Math.random().toString(36).substring(2, 11),
        user_id: currentUser.id,
        category,
        amount,
        created_at: new Date().toISOString()
      };
      updatedBudgets.push(newBudget);
      resultBudget = newBudget;
    }
    
    updateLocalDatabase({ budgets: updatedBudgets });
    return resultBudget;
  }

  if (!supabase) throw new Error('Supabase client not initialized');
  
  // Try to use UPSERT because we have a unique constraint on (user_id, category)
  const { data, error } = await supabase
    .from('budgets')
    .upsert({
      user_id: currentUser.id,
      category,
      amount
    }, {
      onConflict: 'user_id,category'
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting budget to Supabase:', error);
    throw error;
  }
  return data;
};
