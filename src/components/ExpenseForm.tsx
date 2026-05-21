import React, { useState } from 'react';
import { PlusCircle, FileText, LayoutList, Calendar, ClipboardSignature, Sparkles } from 'lucide-react';
import { addExpense } from '../supabaseService';
import ReceiptScanner from './ReceiptScanner';

interface ExpenseFormProps {
  onExpenseAdded: () => void;
  categories: string[];
}

export default function ExpenseForm({ onExpenseAdded, categories }: ExpenseFormProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'scanner'>('manual');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Food & Dining');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please specify an expense amount greater than 0.');
      setLoading(false);
      return;
    }

    try {
      await addExpense({
        amount: parsedAmount,
        category,
        description: description.trim() || `Spent on ${category}`,
        date
      });
      
      // Reset form variables
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      onExpenseAdded();
    } catch (err: any) {
      console.error('Error in ExpenseForm:', err);
      setErrorMsg(err?.message || 'Failed to record expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseHandledFromScanner = (extracted: { amount: number; category: string; description: string; date: string }) => {
    setAmount(String(extracted.amount));
    setCategory(extracted.category);
    setDescription(extracted.description);
    setDate(extracted.date);
    setActiveTab('manual'); // instant switch to manual to confirm populated values!
  };

  return (
    <div id="expense-form-container" className="bg-white rounded-3xl border border-emerald-100 p-6 md:p-8 shadow-sm">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-100 mb-6 pb-1">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 pb-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'manual'
              ? 'border-emerald-500 text-emerald-900'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <ClipboardSignature className="w-4 h-4" />
          <span>Manual Input</span>
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center gap-2 pb-3 ml-6 text-xs uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'scanner'
              ? 'border-emerald-500 text-emerald-950'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>Receipt Scanner</span>
        </button>
      </div>

      {activeTab === 'manual' ? (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Large stylized Amount Input */}
          <div className="relative group p-4 border border-emerald-50 bg-gradient-to-r from-emerald-50/20 to-emerald-100/10 rounded-2xl">
            <label htmlFor="amount-input" className="block text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1.5">Amount Spent</label>
            <div className="relative flex items-center">
              <span className="text-2xl font-bold text-emerald-700 mr-2">$</span>
              <input
                id="amount-input"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent border-none text-3xl font-bold tracking-tight text-emerald-950 focus:outline-none focus:ring-0 placeholder:text-emerald-100 placeholder:font-bold font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category selection */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="category-select" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <LayoutList className="w-4 h-4" />
                </span>
                <select
                  id="category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50/50 rounded-xl border border-gray-150 py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-gray-800"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Selection */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="date-input" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  id="date-input"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-gray-50/50 rounded-xl border border-gray-150 py-2 pl-10 pr-4 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description-input" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Description / Note</label>
            <div className="relative">
              <span className="absolute left-3.5 top-[14px] text-gray-400">
                <FileText className="w-4 h-4" />
              </span>
              <input
                id="description-input"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Avocado salad lunch, electric bill payoff, train ticket..."
                className="w-full bg-gray-50/50 rounded-xl border border-gray-150 py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-gray-800 placeholder:text-gray-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-2xl transition-all shadow-sm focus:ring-2 focus:ring-emerald-500/15 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <PlusCircle className="w-5 h-5" />
            )}
            <span>Log Expense Row</span>
          </button>
        </form>
      ) : (
        <ReceiptScanner onExpenseExtracted={handleExpenseHandledFromScanner} categories={categories} />
      )}
    </div>
  );
}
