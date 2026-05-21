import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sprout, 
  PlusCircle, 
  Trash2, 
  LogOut, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Calendar, 
  FileText, 
  Tag, 
  SlidersHorizontal, 
  Search, 
  Database, 
  Sparkles, 
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle as QuestionIcon,
  ChevronDown,
  Info
} from 'lucide-react';
import { 
  fetchExpenses, 
  fetchBudgets, 
  deleteExpense, 
  getCurrentUser, 
  signOutUser, 
  UserSession 
} from './supabaseService';
import { Expense, Budget, getSupabaseConfig, isSupabaseConfigured } from './supabaseClient';
import AuthScreen from './components/AuthScreen';
import ExpenseForm from './components/ExpenseForm';
import OverviewCharts from './components/OverviewCharts';
import BudgetSettings from './components/BudgetSettings';
import SupabaseGuide from './components/SupabaseGuide';

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Utilities',
  'Health & Wellness',
  'Education',
  'Other'
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // UI tabs & views
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'budgets' | 'setup'>('dashboard');
  const [successNotification, setSuccessNotification] = useState('');

  // Determine current configuration state
  const config = getSupabaseConfig();
  const isCloudConnected = isSupabaseConfigured() && !config.isDemoMode;

  const checkUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (e) {
      console.error('Error checking authentication status:', e);
    } finally {
      setAuthChecked(true);
    }
  };

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [expenseList, budgetList] = await Promise.all([
        fetchExpenses(),
        fetchBudgets()
      ]);
      setExpenses(expenseList);
      setBudgets(budgetList);
    } catch (error) {
      console.error('Error compiling transactions ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, [refreshTrigger]);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, refreshTrigger]);

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const triggerDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('Are you calling to delete this expense permanently?')) {
      try {
        const success = await deleteExpense(id);
        if (success) {
          setSuccessNotification('Expense successfully removed!');
          triggerDataRefresh();
          setTimeout(() => setSuccessNotification(''), 3000);
        }
      } catch (e) {
        console.error('Error removing expense:', e);
      }
    }
  };

  // Computations for statistics
  const dashboardStats = useMemo(() => {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const averageCost = expenses.length > 0 ? totalSpent / expenses.length : 0;
    
    // Find biggest category spending
    const categorySums: Record<string, number> = {};
    expenses.forEach(exp => {
      categorySums[exp.category] = (categorySums[exp.category] || 0) + exp.amount;
    });

    let biggestCategory = 'None';
    let biggestAmount = 0;
    Object.entries(categorySums).forEach(([cat, amt]) => {
      if (amt > biggestAmount) {
        biggestAmount = amt;
        biggestCategory = cat;
      }
    });

    // Monthly overall budget calculation
    const totalBudgetObj = budgets.find(b => b.category === 'total');
    const monthlyLimit = totalBudgetObj ? totalBudgetObj.amount : 800;
    const isOver = totalSpent >= monthlyLimit;
    const percentRemaining = Math.max(0, 100 - (monthlyLimit > 0 ? (totalSpent / monthlyLimit) * 100 : 0));

    // Daily average spending based on current month's expenses
    const daysInMonth = new Date().getDate(); // number of days since start of the month
    const dailySpendAverage = totalSpent / Math.max(daysInMonth, 1);

    return {
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      averageCost: parseFloat(averageCost.toFixed(2)),
      biggestCategory,
      biggestAmount: parseFloat(biggestAmount.toFixed(2)),
      monthlyLimit,
      isOver,
      percentRemaining: parseFloat(percentRemaining.toFixed(1)),
      dailySpendAverage: parseFloat(dailySpendAverage.toFixed(2))
    };
  }, [expenses, budgets]);

  // Filtered expense list computation
  const filteredAndSortedExpenses = useMemo(() => {
    let result = [...expenses];

    // Apply Search Query matching
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase().trim();
      result = result.filter(exp => 
        exp.description.toLowerCase().includes(term) || 
        exp.category.toLowerCase().includes(term) ||
        String(exp.amount).includes(term)
      );
    }

    // Apply Category Filter matching
    if (selectedFilterCategory !== 'All') {
      result = result.filter(exp => exp.category === selectedFilterCategory);
    }

    // Apply Sorting Rules
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [expenses, searchQuery, selectedFilterCategory, sortBy]);

  // Loading state when checking user
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="p-4 bg-emerald-50 rounded-2xl animate-[bounce_1.5s_infinite] text-emerald-600 mb-4">
          <Sprout className="w-10 h-10" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Booting Sprout Engine...</p>
      </div>
    );
  }

  // Auth gate
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={triggerDataRefresh} />;
  }

  return (
    <div className="min-h-screen bg-[#f8faf8] flex flex-col text-gray-800 antialiased font-sans">
      
      {/* Dynamic Floating Toast Notifications */}
      {successNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gray-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-gray-800 animate-[bounce_0.5s_ease-out]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotification}</span>
        </div>
      )}

      {/* Top Header Panel Section */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-emerald-100/50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          
          {/* Logo Brand Accent */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
              <Sprout className="w-5.5 h-5.5 font-bold" />
            </div>
            <div>
              <span className="text-sm font-black text-gray-950 tracking-tight block sm:inline">Sprout</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ml-1.5 select-none text-[10px] sm:text-xs">
                {isCloudConnected ? 'Cloud Active' : 'Offline Sandbox'}
              </span>
            </div>
          </div>

          {/* Center Navigation for large screens only */}
          <nav className="hidden md:flex items-center gap-1.5 bg-gray-50/50 p-1 rounded-full border border-gray-100">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'transactions' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Ledger
            </button>
            <button
              onClick={() => setActiveTab('budgets')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'budgets' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Budgets
            </button>
            {/* <button
              onClick={() => setActiveTab('setup')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'setup' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Supabase Link
            </button> */}
          </nav>

          {/* User Signout Button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono select-none">AUTHORIZED SECURE</span>
              <span className="text-xs font-semibold text-gray-700 truncate max-w-[150px]">{currentUser.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Secure logout button"
              className="p-2 sm:px-3 sm:py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-red-600 rounded-xl transition-all flex items-center gap-1.5 border border-gray-150 cursor-pointer text-xs font-bold uppercase tracking-wider"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Small Screen Secondary Sub-Bar Navigation */}
        <div className="md:hidden flex border-t border-emerald-50 overflow-x-auto scrollbar-none px-2 py-2 gap-1 bg-white/50 justify-around">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 text-center py-2 px-1 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-950 font-black' : 'text-gray-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 text-center py-2 px-1 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'transactions' ? 'bg-emerald-50 text-emerald-950 font-black' : 'text-gray-400'
            }`}
          >
            Ledger
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex-1 text-center py-2 px-1 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'budgets' ? 'bg-emerald-50 text-emerald-950 font-black' : 'text-gray-400'
            }`}
          >
            Budgets
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`flex-1 text-center py-2 px-1 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all ${
              activeTab === 'setup' ? 'bg-emerald-50 text-emerald-950 font-black' : 'text-gray-400'
            }`}
          >
            Deploy
          </button>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">

        {/* Global Alert Notification regarding offline fallback */}
        {!isCloudConnected && (
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/30 rounded-3xl border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700 shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">You are running inside Sprout Local Sandbox</h4>
                <p className="text-xs text-emerald-800/85 mt-0.5 leading-relaxed">
                  Data is safely cached inside this secure sandbox frame. Link a real Supabase account anytime in the <b>Supabase Link</b> tab!
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('setup')}
              className="text-xs font-bold text-emerald-900 bg-white/80 hover:bg-white border border-emerald-100 py-1.5 px-3.5 rounded-xl transition-all select-none shrink-0"
            >
              Connect Database Now
            </button>
          </div>
        )}

        {/* View Layout Selector router */}

        {/* DASHBOARD TAB CONTAINER */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Quick Metrics Cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div id="stat-card-total" className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex flex-col justify-between group hover:scale-[1.01] transition-all">
                <div className="flex items-center justify-between mb-3 text-emerald-600">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Month Spending</span>
                  <p className="p-1 px-1.5 bg-emerald-50 rounded-lg text-emerald-700 font-mono text-[10px] sm:text-xs">USD</p>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold tracking-tight text-gray-950 font-mono">
                    ${dashboardStats.totalSpent}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Spent of ${dashboardStats.monthlyLimit} total limit</span>
                  </p>
                </div>
              </div>

              <div id="stat-card-average" className="bg-white rounded-3xl p-4 border border-emerald-100/80 shadow-sm flex flex-col justify-between group hover:scale-[1.01] transition-all">
                <div className="flex items-center justify-between mb-3 text-emerald-600">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Average item</span>
                  <p className="p-1 px-1.5 bg-sky-50 rounded-lg text-sky-700 font-mono text-[10px] sm:text-xs">COST</p>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold tracking-tight text-gray-950 font-mono">
                    ${dashboardStats.averageCost}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    <span>Average per transaction item</span>
                  </p>
                </div>
              </div>

              <div id="stat-card-biggest" className="bg-white rounded-3xl p-4 border border-emerald-100/80 shadow-sm flex flex-col justify-between group hover:scale-[1.01] transition-all">
                <div className="flex items-center justify-between mb-3 text-emerald-700">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Biggest Category</span>
                  <p className="p-1 px-1.5 bg-amber-50 rounded-lg text-amber-700 font-mono text-[10px] sm:text-xs">SPIKE</p>
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 truncate">
                    {dashboardStats.biggestCategory}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-500 font-bold" />
                    <span>Totaled <b className="font-mono text-gray-700">${dashboardStats.biggestAmount}</b></span>
                  </p>
                </div>
              </div>

              <div id="stat-card-daily" className="bg-white rounded-3xl p-4 border border-emerald-100/80 shadow-sm flex flex-col justify-between group hover:scale-[1.01] transition-all">
                <div className="flex items-center justify-between mb-3 text-emerald-700">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Daily Pace</span>
                  <p className="p-1 px-1.5 bg-rose-50 rounded-lg text-rose-700 font-mono text-[10px] sm:text-xs">RATE</p>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold tracking-tight text-gray-950 font-mono">
                    ${dashboardStats.dailySpendAverage}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-rose-500 font-bold" />
                    <span>Per day pacing this month</span>
                  </p>
                </div>
              </div>

            </div>

            {/* Split layout: Input / Receipt parser in left, Overview Charts in right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Add Expense Forms Column */}
              <div className="lg:col-span-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-md font-bold text-emerald-950 px-1">Record Cost Rows</h2>
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest select-none font-bold">LOG ACTION</span>
                </div>
                <ExpenseForm onExpenseAdded={triggerDataRefresh} categories={CATEGORIES} />
              </div>

              {/* Data Visualization Column */}
              <div className="lg:col-span-2 space-y-4 animate-[fadeIn_0.5s_ease-out]">
                <div className="flex items-center justify-between">
                  <h2 className="text-md font-bold text-emerald-950 px-1">Aggregated Visualization Charts</h2>
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest select-none font-bold">REAL-TIME TELEMETRY</span>
                </div>
                <OverviewCharts expenses={expenses} budgets={budgets} categories={CATEGORIES} />
              </div>

            </div>

            {/* Bottom brief preview of recent ledger activities */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-md font-bold text-emerald-950 px-1">Recent Ledger Rows</h2>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  View All Transaction Rows ({expenses.length}) &rarr;
                </button>
              </div>

              {expenses.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-150 p-8 text-center opacity-60">
                  <p className="text-sm font-semibold text-gray-500">No active expense entries recorded yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Start entering transaction details on the left, or use the dynamic receipt scanner to pre-fill logs instantly!</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-emerald-50 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-mono uppercase text-[9px] tracking-wider md:text-[10px]">
                          <th className="p-4 font-bold">Date</th>
                          <th className="p-4 font-bold">Category</th>
                          <th className="p-4 font-bold">Notes / Description</th>
                          <th className="p-4 font-bold text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {expenses.slice(0, 4).map((exp) => (
                          <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 text-xs font-semibold font-mono text-gray-600">{exp.date}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                                {exp.category}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-gray-700 font-semibold max-w-[200px] truncate">{exp.description}</td>
                            <td className="p-4 text-xs text-right font-extrabold font-mono text-emerald-950">
                              ${parseFloat(exp.amount.toFixed(2))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* LEDGER TRANSACTIONS LIST TAB */}
        {activeTab === 'transactions' && (
          <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            
            {/* Filter toolbar structure */}
            <div className="bg-white rounded-3xl border border-emerald-50 p-5 md:p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row gap-3 justify-between md:items-center">
                
                {/* Search query box */}
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ledger notes, prices, or tag metrics..."
                    className="w-full bg-gray-50/50 rounded-xl border border-gray-150 py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-gray-800"
                  />
                </div>

                {/* Filters selection alignment */}
                <div className="flex flex-wrap items-center gap-2.5">
                  
                  {/* Category Filter */}
                  <div className="flex items-center gap-1 bg-gray-50/50 border border-gray-150 rounded-xl py-1.5 px-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1.5">Category:</span>
                    <select
                      value={selectedFilterCategory}
                      onChange={(e) => setSelectedFilterCategory(e.target.value)}
                      className="bg-transparent border-none text-xs font-bold text-gray-700 focus:outline-none pr-3"
                    >
                      <option value="All">All Categories</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Sort alignment selector */}
                  <div className="flex items-center gap-1 bg-gray-50/50 border border-gray-150 rounded-xl py-1.5 px-3">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1.5">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent border-none text-xs font-bold text-gray-700 focus:outline-none pr-3"
                    >
                      <option value="date-desc">Latest Date</option>
                      <option value="date-asc">Earliest Date</option>
                      <option value="amount-desc">Amount (High to Low)</option>
                      <option value="amount-asc">Amount (Low to High)</option>
                    </select>
                  </div>

                </div>

              </div>
            </div>

            {/* Results section table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-emerald-950">Matching Ledger Records ({filteredAndSortedExpenses.length})</h3>
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest font-bold">STRICT ACCESS CONTROL ENABLED</span>
              </div>

              {filteredAndSortedExpenses.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-150 p-12 text-center opacity-70">
                  <div className="p-4 bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-3">
                    <SlidersHorizontal className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-950">No search matches found</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Try resetting category tags or custom filter configurations to discover hidden logs.</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-emerald-50 shadow-sm overflow-hidden.">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50/60 border-b border-gray-100 text-gray-400 font-mono uppercase text-[9px] tracking-wider md:text-[10px]">
                          <th className="p-4 md:p-5 font-bold">Date</th>
                          <th className="p-4 md:p-5 font-bold">Category</th>
                          <th className="p-4 md:p-5 font-bold">Notes / Description</th>
                          <th className="p-4 md:p-5 font-bold text-right">Amount</th>
                          <th className="p-4 md:p-5 font-bold text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredAndSortedExpenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 md:p-5 text-xs font-semibold font-mono text-gray-600">{exp.date}</td>
                            <td className="p-4 md:p-5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                                {exp.category}
                              </span>
                            </td>
                            <td className="p-4 md:p-5 text-xs text-gray-700 font-semibold max-w-[250px] truncate">{exp.description}</td>
                            <td className="p-4 md:p-5 text-xs text-right font-extrabold font-mono text-emerald-950">
                              ${parseFloat(exp.amount.toFixed(2))}
                            </td>
                            <td className="p-4 md:p-5 text-center">
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                title="Delete expense row"
                                aria-label={`Delete purchase on ${exp.date}`}
                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* BUDGET SETTINGS TAB */}
        {activeTab === 'budgets' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.5s_ease-out]">
            
            {/* Main Form container columns */}
            <div className="lg:col-span-2">
              <BudgetSettings onBudgetUpdated={triggerDataRefresh} categories={CATEGORIES} />
            </div>

            {/* Informational Guidelines helpful content on the right side */}
            <div className="bg-white rounded-3xl border border-emerald-100 p-6 md:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4 text-emerald-800">
                  <Info className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h3 className="font-bold text-emerald-950 text-sm uppercase tracking-wide">Dynamic Budget Boundaries</h3>
                </div>
                <div className="space-y-4 text-xs font-medium text-gray-600 leading-relaxed">
                  <p>
                    Budgets are essential structural rules that determine when Sprout starts sounding alarms regarding negative wallet paces.
                  </p>
                  <p>
                    <b>1. Global Budget limit</b> coordinates spending across all category buckets combined. This produces the radial percentage display on your dashboard.
                  </p>
                  <p>
                    <b>2. Category-Specific constraints</b> are voluntary filters to lock particular categories (e.g. food delivery or online clothing shopping limits).
                  </p>
                  <p>
                    <b>3. Smart Alarm warnings</b> appear whenever category transaction aggregations breach 100% of defined values.
                  </p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-150 mt-6 bg-emerald-50/20 p-4 rounded-2xl border border-dashed border-emerald-100/60">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block mb-1">PRO TIP</span>
                <span className="text-[11px] text-gray-650 leading-relaxed">
                  Clear values to "Unlimited" mode for discretionary spending areas with variable costs to prevent false diagnostic warnings.
                </span>
              </div>
            </div>

          </div>
        )}

        {/* DEPLOYMENT & DATABASE SCHEMA TAB */}
        {/*
        activeTab === 'setup' && (
          <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <SupabaseGuide />
          </div>
        )
        */}

      </main>

      {/* Modern Compact Site Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 md:py-8 mt-12">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-450 select-none">
          
          <div className="flex items-center gap-2 text-gray-400">
            <Sprout className="w-4 h-4 text-emerald-500" />
            <span>Sprout Eco Tracker Inc &copy; 2026. All Rights Reserved.</span>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setActiveTab('setup')} className="hover:text-emerald-700 cursor-pointer text-gray-400">Database Guidelines</button>
            <span>&bull;</span>
            <span className="text-gray-400">Authored for Secure Savings</span>
          </div>

        </div>
      </footer>
    </div>
  );
}

