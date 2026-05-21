import React, { useState, useEffect } from 'react';
import { Target, Save, CheckCircle2, DollarSign, Wallet2 } from 'lucide-react';
import { updateBudget, fetchBudgets } from '../supabaseService';
import { Budget } from '../supabaseClient';

interface BudgetSettingsProps {
  onBudgetUpdated: () => void;
  categories: string[];
}

export default function BudgetSettings({ onBudgetUpdated, categories }: BudgetSettingsProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [globalBudget, setGlobalBudget] = useState<string>('800');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      const budgetList = await fetchBudgets();
      setBudgets(budgetList);
      
      const totalBudget = budgetList.find(b => b.category === 'total');
      if (totalBudget) {
        setGlobalBudget(String(totalBudget.amount));
      }

      const categoryAmounts: Record<string, string> = {};
      categories.forEach(cat => {
        const found = budgetList.find(b => b.category === cat);
        categoryAmounts[cat] = found ? String(found.amount) : '';
      });
      setCategoryBudgets(categoryAmounts);
    } catch (e) {
      console.error('Error loading budgets in settings:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [categories]);

  const handleGlobalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalBudget(e.target.value);
  };

  const handleCategoryChange = (category: string, value: string) => {
    setCategoryBudgets(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      // 1. Update global budget
      const globalAmount = parseFloat(globalBudget) || 0;
      await updateBudget('total', globalAmount);

      // 2. Update category budgets
      for (const cat of categories) {
        const val = categoryBudgets[cat];
        if (val !== undefined && val !== '') {
          const catAmount = parseFloat(val) || 0;
          await updateBudget(cat, catAmount);
        }
      }

      setSuccessMsg('Budgets updated successfully!');
      onBudgetUpdated();
      loadData();
      
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    } catch (err) {
      console.error('Error saving budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="budget-settings-container" className="bg-white rounded-3xl border border-emerald-100 p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
          <Target className="w-5.5 h-5.5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Configure Monthly Budgets</h2>
          <p className="text-xs text-gray-500">Set boundaries to trigger warning alerts when categories are close to limits.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Global Monthly Budget card */}
        <div className="p-5 bg-gradient-to-br from-emerald-50/70 to-emerald-100/30 rounded-2xl border border-emerald-100/50">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Wallet2 className="w-4.5 h-4.5 text-emerald-700 font-medium" />
              <label htmlFor="global-budget-input" className="text-sm font-semibold text-emerald-950">Overall Monthly Limit</label>
            </div>
            <span className="text-[10px] font-mono tracking-wider text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded-md font-semibold">ALL CATEGORIES COMBINED</span>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700 font-semibold text-base">$</span>
            <input
              id="global-budget-input"
              type="number"
              min="0"
              step="1"
              required
              value={globalBudget}
              onChange={handleGlobalChange}
              placeholder="e.g. 1000"
              className="w-full bg-white rounded-xl border border-emerald-200/80 py-2.5 pl-8 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-emerald-900 shadow-inner"
            />
          </div>
        </div>

        {/* Category breakdown inputs */}
        <div>
          <h3 className="text-sm font-bold text-emerald-950 mb-3.5 px-1">Per-Category Budgets (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div key={cat} className="flex flex-col gap-1.5 p-3 rounded-xl border border-gray-100 bg-gray-50/40 hover:bg-gray-50/80 transition-colors">
                <div className="text-xs font-semibold text-gray-700 truncate">{cat}</div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={categoryBudgets[cat] || ''}
                    onChange={(e) => handleCategoryChange(cat, e.target.value)}
                    placeholder="Unlimited"
                    className="w-full bg-white rounded-lg border border-gray-200 py-1.5 pl-6 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback + Submit Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div>
            {successMsg && (
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm py-2.5 px-5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-700/10 focus:ring-2 focus:ring-emerald-500/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Budgets</span>
          </button>
        </div>
      </form>
    </div>
  );
}
