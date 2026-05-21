import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Expense, Budget } from '../supabaseClient';
import { TrendingUp, PieChart as PieIcon, BarChart3, AlertCircle } from 'lucide-react';

interface OverviewChartsProps {
  expenses: Expense[];
  budgets: Budget[];
  categories: string[];
}

export default function OverviewCharts({ expenses, budgets, categories }: OverviewChartsProps) {
  // 1. Calculate spending by category
  const categoryData = useMemo(() => {
    const sums: Record<string, number> = {};
    categories.forEach(cat => { sums[cat] = 0; });
    
    expenses.forEach(exp => {
      if (sums[exp.category] !== undefined) {
        sums[exp.category] += exp.amount;
      } else {
        sums['Other'] = (sums['Other'] || 0) + exp.amount;
      }
    });

    return categories.map(cat => {
      const budgetObj = budgets.find(b => b.category === cat);
      const budgetLimit = budgetObj ? budgetObj.amount : 0;
      const spent = sums[cat] || 0;
      
      return {
        name: cat,
        Spent: parseFloat(spent.toFixed(2)),
        Budget: budgetLimit,
        isOverBudget: budgetLimit > 0 && spent > budgetLimit
      };
    });
  }, [expenses, budgets, categories]);

  // 2. Total spending summary
  const totalSummary = useMemo(() => {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const globalBudgetObj = budgets.find(b => b.category === 'total');
    const globalBudgetLimit = globalBudgetObj ? globalBudgetObj.amount : 800;
    
    return {
      spent: parseFloat(totalSpent.toFixed(2)),
      limit: globalBudgetLimit,
      percent: globalBudgetLimit > 0 ? Math.min(Math.round((totalSpent / globalBudgetLimit) * 100), 100) : 0,
    };
  }, [expenses, budgets]);

  // 3. Mini alert feed for categories exceeding budget
  const budgetAlerts = useMemo(() => {
    return categoryData.filter(d => d.isOverBudget);
  }, [categoryData]);

  // Color lists for charts
  const COLORS = [
    '#10a310', // Food
    '#0f5132', // Transport (deep green)
    '#34d399', // Entertainment
    '#059669', // Shopping
    '#34d399', // Utilities
    '#22c55e', // Health & Wellness
    '#a7f3d0', // Education
    '#6ee7b7'  // Other
  ];

  return (
    <div id="overview-charts-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Category Spending Graph */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-emerald-100 p-6 shadow-sm flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900">Spent vs Budget Limit</h3>
          </div>
          <span className="text-[10px] font-mono select-none bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-bold">MONTHLY COMPARISON</span>
        </div>

        {expenses.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center opacity-60">
            <TrendingUp className="w-12 h-12 text-emerald-400 mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-emerald-950">No expense records logged yet.</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">Log some manual expenses or upload receipts to generate beautiful real-time analytical charts!</p>
          </div>
        ) : (
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f1" />
                <XAxis 
                  dataKey="name" 
                  stroke="#1c201c" 
                  tickLine={false}
                  fontSize={10}
                  tickFormatter={(val) => val.split(' ')[0]} // Use first word for smaller label space
                />
                <YAxis stroke="#1b231b" tickLine={false} fontSize={10} />
                <Tooltip
                  cursor={{ fill: 'rgba(25, 135, 84, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-950 border border-gray-800 p-3 rounded-2xl text-xs text-white shadow-xl space-y-1">
                          <p className="font-bold text-gray-100">{data.name}</p>
                          <p className="font-semibold text-emerald-400">Spent: <span className="font-mono">${data.Spent}</span></p>
                          {data.Budget > 0 ? (
                            <p className="text-gray-300">Limit: <span className="font-mono">${data.Budget}</span></p>
                          ) : (
                            <p className="text-gray-400 italic">No limit set</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="Spent" fill="#198754" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isOverBudget ? '#ef4444' : COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Bar>
                <Bar dataKey="Budget" fill="#e2ede2" stroke="#bcdbbb" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Budget Meter Summary and Warnings */}
      <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <PieIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-gray-900">Total Spent Tracker</h3>
          </div>

          {/* Meter progress radial representation or simple big-stats */}
          <div className="flex flex-col items-center justify-center p-4 bg-emerald-50/20 rounded-2xl border border-emerald-50/40 text-center">
            <span className="text-xs font-bold text-emerald-800/80 uppercase tracking-widest">Global Budget Used</span>
            
            <div className="my-5 relative flex items-center justify-center">
              {/* Giant clean percentage display */}
              <div className="flex flex-col items-center">
                <span className="text-4xl font-extrabold tracking-tight text-emerald-950 font-mono">
                  {totalSummary.percent}%
                </span>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  of global limit
                </span>
              </div>
            </div>

            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-3">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  totalSummary.percent >= 100 
                    ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' 
                    : totalSummary.percent >= 80 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${totalSummary.percent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between w-full text-xs font-semibold px-0.5">
              <span className="text-gray-500">Spent: <b className="font-mono text-emerald-900">${totalSummary.spent}</b></span>
              <span className="text-gray-500">Limit: <b className="font-mono text-gray-800">${totalSummary.limit}</b></span>
            </div>
          </div>
        </div>

        {/* Dynamic Alerts Feed */}
        <div className="mt-5 space-y-2.5">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5">Smart Budget Warnings</div>
          {budgetAlerts.length > 0 ? (
            <div className="space-y-2 max-h-[120px] overflow-y-auto">
              {budgetAlerts.map((alert) => (
                <div key={alert.name} className="flex gap-2 p-2.5 rounded-xl border border-rose-100 bg-rose-50/40 text-rose-800 items-start">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <b>{alert.name}</b> exceeded by <span className="font-mono font-bold">${parseFloat((alert.Spent - alert.Budget).toFixed(2))}</span> (Spent ${alert.Spent} of ${alert.Budget})
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 border border-emerald-100/40 bg-emerald-50/10 rounded-xl text-center">
              <span className="text-[11px] text-emerald-800 font-semibold">☀️ All categories are within budget limit! Excellent job.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
