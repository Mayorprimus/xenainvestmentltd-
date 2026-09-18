import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Zap, Sparkles, Check, Loader2, KeyRound } from 'lucide-react';

interface LoginPageProps {
  onNavigateTab: (tab: string) => void;
  onLogin?: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onLoginSuccess?: () => void;
  onAdminLogin?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateTab, onLogin, onLoginSuccess, onAdminLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputCls =
    'w-full bg-[#F8F7FC] border border-[#EDE9FE] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] focus:bg-white transition-all placeholder:text-[#9CA3AF] pr-10';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password to continue.');
      return;
    }
    setLoading(true);
    if (onLogin) {
      const result = await onLogin(email.trim(), password);
      setLoading(false);
      if (!result.ok) {
        setError(result.error || 'Unable to sign in. Please try again.');
        return;
      }
      return;
    }
    setLoading(false);
    onLoginSuccess ? onLoginSuccess() : onNavigateTab('home');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-10rem)] rounded-[24px] overflow-hidden border border-[#EDE9FE] shadow-lg animate-fade-in" id="login-page-view">
      {/* LEFT: Brand Panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#1E1B4B] via-[#7C3AED] to-[#DB2777] p-10 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center">
            <span className="text-white font-bold text-lg leading-none">X</span>
          </div>
          <span className="font-bold text-xl tracking-tight">XENA Exchange</span>
        </div>

        <div className="relative z-10 space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
            Welcome back.<br />Your wealth, <span className="text-purple-200">secured on-chain.</span>
          </h1>
          <p className="text-sm text-purple-100 leading-relaxed">
            Trade, stake, and earn on the world's fastest P2P and DeFi super-app — backed by smart-contract escrow.
          </p>

          <div className="space-y-2 pt-2">
            {[
              { icon: ShieldCheck, text: '100% escrow-protected P2P trading' },
              { icon: Zap, text: 'Instant 0% fee market execution' },
              { icon: Sparkles, text: 'Up to 52% institutional staking APY' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-xs text-purple-50">
                <span className="w-6 h-6 rounded-lg bg-white/10 border border-white/25 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-purple-100">
          ≤ 2.1 min avg release · 99/100 CertiK audit · 250M XENA in circulation
        </div>
      </div>

      {/* RIGHT: Form */}
      <div className="bg-white p-6 sm:p-10 flex flex-col justify-center">
        <div className="lg:hidden w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#DB2777] flex items-center justify-center mb-4">
          <span className="text-white font-bold text-lg leading-none">X</span>
        </div>

        <div className="max-w-sm w-full mx-auto space-y-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#171717] tracking-tight">Sign in to XENA</h2>
            <p className="text-xs text-[#6B7280] mt-1">Securely access your accounts, vaults, and P2P desk.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-[#171717] block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={`${inputCls} pl-9`} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-[#171717]">Password</label>
                <button type="button" onClick={() => onNavigateTab('signup')} className="text-[10px] font-bold text-[#6D28D9] hover:underline cursor-pointer">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputCls} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6D28D9] cursor-pointer">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-[11px] text-[#6B7280] font-semibold cursor-pointer select-none">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${rememberMe ? 'bg-[#6D28D9] border-[#6D28D9]' : 'bg-white border-[#D1D5DB]'}`}
              >
                {rememberMe && <Check className="w-3 h-3 text-white" />}
              </button>
              Keep me signed in on this device
            </label>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] font-semibold text-red-600 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-bold text-xs shadow-md hover:shadow-[0_4px_16px_rgba(109,40,217,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in securely...</>
              ) : (
                <>Sign In Securely <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-[#6B7280]">
            New to XENA?{' '}
            <button onClick={() => onNavigateTab('signup')} className="font-bold text-[#6D28D9] hover:underline cursor-pointer">
              Create a free account
            </button>
          </p>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[10px] text-[#6B7280]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
            Protected by 2FA, biometric login & cold storage
          </div>
        </div>
      </div>
    </div>
  );
};