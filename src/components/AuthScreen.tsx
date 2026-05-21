import React, { useState } from 'react';
import { signUpUser, signInUser } from '../supabaseService';
import { Sprout, LogIn, UserPlus, HelpCircle, Terminal, KeyRound, Database, ToggleLeft, ToggleRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { 
  isSupabaseConfigured as isConfigd, 
  getSupabaseConfig as getConfig, 
  setSupabaseConfig as setConfig, 
  clearSupabaseConfig as clearConfig, 
  setDemoMode 
} from '../supabaseClient';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [view, setView] = useState<'login' | 'signup' | 'configure'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Supabase Configuration inputs
  const currentConfig = getConfig();
  const [sbUrl, setSbUrl] = useState(currentConfig.url);
  const [sbKey, setSbKey] = useState(currentConfig.key);
  const [showConfigAlert, setShowConfigAlert] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (view === 'signup') {
        const { user, error } = await signUpUser(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Account registered successfully! Welcome.');
          setTimeout(() => {
            onAuthSuccess();
          }, 1500);
        }
      } else {
        const { user, error } = await signInUser(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          onAuthSuccess();
        }
      }
    } catch (err: any) {
      console.error('Error during security authorization:', err);
      setErrorMsg(err?.message || 'Authorization failed. Please double check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      setDemoMode(true);
      // In demo mode we log in 'demo@sprout.io'
      await signInUser('demo@sprout.io', 'any-password');
      onAuthSuccess();
    } catch (err) {
      console.error('Guest login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!sbUrl.trim() || !sbKey.trim()) {
      setErrorMsg('Please provide both a valid Supabase Project URL and Anon API Key.');
      return;
    }

    try {
      const success = setConfig(sbUrl, sbKey);
      if (success) {
        setSuccessMsg('Supabase API client configured and verified!');
        setShowConfigAlert(false);
        setTimeout(() => {
          setView('login');
          setSuccessMsg('');
        }, 1500);
      } else {
        setErrorMsg('Invalid inputs. Please verify credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save configure.');
    }
  };

  const handleClearConfig = () => {
    clearConfig();
    setSbUrl('');
    setSbKey('');
    setSuccessMsg('Reset to offline sandbox demo mode.');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const isConfigured = isConfigd();

  return (
    <div id="auth-panel" className="min-h-screen bg-gradient-to-tr from-emerald-50/20 via-white to-emerald-50/10 flex flex-col justify-center items-center p-4">
      {/* Container Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-emerald-100 p-6 md:p-8 shadow-sm">
        
        {/* App Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 mb-3 shadow-inner">
            <Sprout className="w-8 h-8 animate-[bounce_3s_infinite]" />
          </div>
          <h1 className="text-2xl font-black text-gray-950 tracking-tight">Sprout Expense Tracker</h1>
          <p className="text-xs text-gray-400 mt-1 max-w-[280px]">Grow your savings with smart category limits and modern ledger statistics.</p>
        </div>

        {/* Global connection notification badge */}
        <div className="mb-4">
          {isConfigured ? (
            <div className="flex items-center gap-1.5 justify-center py-1.5 px-3 bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-800 rounded-full select-none">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>CONNECTED TO CLOUD SUPABASE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 justify-center py-1.5 px-3 bg-amber-50 border border-amber-100 text-[10px] font-bold text-amber-800 rounded-full select-none">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>OFFLINE SANDBOX MODE ACTIVE</span>
            </div>
          )}
        </div>

        {/* Sub-view selection tabs when not configuring */}
        {view !== 'configure' && (
          <div className="flex bg-gray-50 p-1 rounded-2xl mb-6">
            <button
              onClick={() => { setView('login'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                view === 'login' ? 'bg-white text-emerald-950 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
            <button
              onClick={() => { setView('signup'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                view === 'signup' ? 'bg-white text-emerald-950 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </button>
          </div>
        )}

        {/* Inner Forms */}
        {view === 'configure' ? (
          <div className="space-y-4">
            <div className="text-sm font-bold text-emerald-950">SUPABASE CLOUD DIRECT LINK</div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Link your live database to synchronize transaction sheets across platforms.
            </p>

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold">
                ✨ {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="sb-url-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Supabase Project URL</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Database className="w-4 h-4" /></span>
                  <input
                    id="sb-url-input"
                    type="text"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    placeholder="https://your-proj-id.supabase.co"
                    className="w-full bg-gray-50/50 rounded-xl border border-gray-150 py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-gray-800 font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="sb-key-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Anon Public Key</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><KeyRound className="w-4 h-4" /></span>
                  <input
                    id="sb-key-input"
                    type="password"
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-gray-50/50 rounded-xl border border-gray-150 py-2.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-gray-800 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={saveConfiguration}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Save & Connect
              </button>
              {isConfigured && (
                <button
                  type="button"
                  onClick={handleClearConfig}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Disconnect
                </button>
              )}
              <button
                type="button"
                onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold">
                ✨ {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="space-y-3.5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-gray-50/50 rounded-xl border border-gray-150 py-2.5 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-gray-800"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password-input" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Security Password</label>
                <input
                  id="password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-gray-50/50 rounded-xl border border-gray-150 py-2.5 px-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-gray-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-2xl transition-all shadow-sm cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 mx-auto border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : view === 'login' ? (
                'Sign In'
              ) : (
                'Create Sprout Ledger'
              )}
            </button>

            {/* Quick Demo Option Divider */}
            <div className="relative py-2 flex items-center">
              <div className="flex-grow border-t border-gray-150"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest">OR TRY OFFLINE</span>
              <div className="flex-grow border-t border-gray-150"></div>
            </div>

            {/* explore sandbox */}
            <button
              type="button"
              onClick={handleGuestAccess}
              className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-2xl transition-all border border-emerald-100/60 cursor-pointer"
            >
              <HelpCircle className="w-4.5 h-4.5 text-emerald-600" />
              <span>Explore Instant Demo Sandbox</span>
            </button>
          </form>
        )}

        {/* Footer actions toggle configuration details */}
        {view !== 'configure' && (
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => { setView('configure'); setErrorMsg(''); setSuccessMsg(''); }}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer hover:underline"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isConfigured ? 'Adjust Supabase Keys' : 'Configure Supabase Keys'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="text-[10px] text-gray-400 mt-4 select-none">
        🌿 Designed for Sustainable Savings & Clean Ledgers.
      </div>
    </div>
  );
}
