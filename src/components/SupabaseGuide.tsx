import React, { useState } from 'react';
import { Copy, Check, Terminal, Database, ShieldAlert, KeyRound, ExternalLink } from 'lucide-react';

export default function SupabaseGuide() {
  const [copied, setCopied] = useState<string | null>(null);

  const sqlQuery = `-- 1. Create expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for expenses
CREATE POLICY "Users can insert their own expenses" 
  ON expenses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own expenses" 
  ON expenses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" 
  ON expenses FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Create RLS policies for budgets
CREATE POLICY "Users can insert their own budgets" 
  ON budgets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own budgets" 
  ON budgets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" 
  ON budgets FOR UPDATE 
  USING (auth.uid() = user_id);
`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div id="supabase-guide-container" className="bg-white rounded-3xl border border-emerald-100 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-emerald-900">Supabase Backend Setup</h2>
            <p className="text-sm text-gray-500 mt-1">Connect Sprout Expense Tracker to your real cloud database in 2 minutes.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://supabase.com"
            target="_blank"
            referrerPolicy="no-referrer"
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full transition-colors"
          >
            Go to Supabase Dashboard
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex gap-4 p-4 border border-emerald-50 rounded-2xl bg-emerald-50/20">
          <div className="p-2 bg-emerald-100/50 rounded-xl text-emerald-700 h-10 w-10 flex items-center justify-center shrink-0">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-emerald-900">1. Create Database Tables</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Open your Supabase project, go to the <b>SQL Editor</b>, click "New query", paste the SQL script below, and run it.
            </p>
          </div>
        </div>

        <div className="flex gap-4 p-4 border border-emerald-50 rounded-2xl bg-emerald-50/20">
          <div className="p-2 bg-emerald-100/50 rounded-xl text-emerald-700 h-10 w-10 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-emerald-900">2. Set Environment Keys</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Copy your <b>Project URL</b> and <b>anon public key</b> from Project Settings &gt; API, and configure them here or in the <b>Settings &gt; Secrets</b> panel.
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-gray-200 rounded-t-2xl border-b border-gray-800">
          <span className="text-xs font-mono font-bold flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            setup_schema.sql
          </span>
          <button
            onClick={() => copyToClipboard(sqlQuery, 'sql')}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            {copied === 'sql' ? (
              <>
                <Check className="w-4.5 h-4.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4.5 h-4.5" />
                <span>Copy SQL</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 bg-gray-950 text-gray-300 font-mono text-[11px] sm:text-xs leading-relaxed rounded-b-2xl overflow-x-auto max-h-[250px] shadow-inner">
          {sqlQuery}
        </pre>
      </div>

      <div className="mt-5 flex items-start gap-2.5 p-3.5 border border-amber-100 rounded-xl bg-amber-50/30 text-amber-800">
        <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-amber-600 mt-0.5" />
        <p className="text-xs leading-relaxed">
          <b>Note on Security:</b> Alternate tables or schema mismatches will cause API errors. Consistently using Row Level Security (RLS) policies ensures users can only read and manage their own expenses.
        </p>
      </div>
    </div>
  );
}
