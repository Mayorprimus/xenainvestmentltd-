import React, { useState } from 'react';
import { ShieldCheck, Lock, Smartphone, Key, AlertTriangle, Check, RefreshCw, Eye, EyeOff, Globe, LogOut, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';

interface SecurityPageProps {
  user: UserProfile;
  onUpdateSecurity: (settings: { twoFactor: boolean; pinSet: boolean }) => void;
}

export const SecurityPage: React.FC<SecurityPageProps> = ({ user, onUpdateSecurity }) => {
  const [twoFactor, setTwoFactor] = useState(user.twoFactorEnabled);
  const [pinSet, setPinSet] = useState(user.pinSet);
  const [antiPhishingCode, setAntiPhishingCode] = useState('XENA-SECURE-99');
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Active sessions
  const [sessions, setSessions] = useState([
    { id: '1', device: 'Chrome on macOS (Current)', ip: '192.168.1.42', location: 'San Francisco, US', current: true },
    { id: '2', device: 'XENA Mobile App on iPhone 15 Pro', ip: '172.56.21.9', location: 'San Francisco, US', current: false },
    { id: '3', device: 'Firefox on Linux', ip: '104.28.19.88', location: 'London, UK', current: false },
  ]);

  const handleToggle2FA = () => {
    const next = !twoFactor;
    setTwoFactor(next);
    onUpdateSecurity({ twoFactor: next, pinSet });
    setSavedNotice(next ? 'Two-Factor Authentication (2FA) is now enabled.' : '2FA has been disabled.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleTogglePIN = () => {
    const next = !pinSet;
    setPinSet(next);
    onUpdateSecurity({ twoFactor, pinSet: next });
    setSavedNotice(next ? '6-Digit Security PIN protection enabled.' : 'Security PIN has been removed.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleSaveAntiPhishing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode) return;
    setAntiPhishingCode(newCode);
    setIsEditingCode(false);
    setNewCode('');
    setSavedNotice('Anti-phishing security phrase updated.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleRevokeSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setSavedNotice('Session revoked and logged out successfully.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-8 animate-fade-in" id="security-page-view">
      {/* 1. Header Hero with Security Score */}
      <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#16A34A] text-xs font-bold border border-emerald-100 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Institutional Level Protection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
              Security & Account Protection Center
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
              Manage your hardware multi-factor authentication, cryptographic whitelists, and active session controls.
            </p>
          </div>

          {/* Security Score Badge */}
          <div className="p-4 bg-[#F8F7FC] rounded-2xl border border-[#EDE9FE] flex items-center gap-4 shrink-0">
            <div className="w-14 h-14 rounded-full bg-purple-50 border-4 border-[#7C3AED] flex items-center justify-center text-[#7C3AED] font-extrabold text-base font-mono">
              98%
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#6B7280] block">Security Rating</span>
              <span className="text-sm font-bold text-[#16A34A] block">Maximum Protection</span>
              <span className="text-[10px] text-[#6B7280]">SOC-2 Type II Certified</span>
            </div>
          </div>
        </div>

        {savedNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-bold text-[#16A34A] flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{savedNotice}</span>
          </div>
        )}
      </div>

      {/* 2. Security Feature Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 2FA */}
        <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#171717]">Two-Factor Authentication (2FA)</h3>
                  <p className="text-[11px] text-[#6B7280]">Google Authenticator or YubiKey</p>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${twoFactor ? 'bg-emerald-50 text-[#16A34A]' : 'bg-slate-100 text-[#6B7280]'}`}>
                {twoFactor ? 'Active' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Requires a one-time 6-digit TOTP code for sensitive actions like withdrawals and P2P releases.
            </p>
          </div>

          <button
            onClick={handleToggle2FA}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              twoFactor
                ? 'bg-[#F8F7FC] hover:bg-red-50 text-[#DC2626] border border-[#EDE9FE]'
                : 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:opacity-95 shadow-xs'
            }`}
          >
            {twoFactor ? 'Disable 2FA' : 'Enable 2FA Protection'}
          </button>
        </div>

        {/* Security PIN */}
        <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#171717]">6-Digit Transaction PIN</h3>
                  <p className="text-[11px] text-[#6B7280]">Fast instant authorization</p>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${pinSet ? 'bg-emerald-50 text-[#16A34A]' : 'bg-slate-100 text-[#6B7280]'}`}>
                {pinSet ? 'Configured' : 'Not Set'}
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Quickly authorize smaller spot transactions and internal account transfers without 2FA latency.
            </p>
          </div>

          <button
            onClick={handleTogglePIN}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              pinSet
                ? 'bg-[#F8F7FC] hover:bg-purple-50 text-[#6D28D9] border border-[#EDE9FE]'
                : 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white hover:opacity-95 shadow-xs'
            }`}
          >
            {pinSet ? 'Change / Update PIN' : 'Create 6-Digit PIN'}
          </button>
        </div>

        {/* Anti-Phishing Phrase */}
        <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#171717]">Anti-Phishing Security Phrase</h3>
                <p className="text-[11px] text-[#6B7280]">Included in all authentic XENA system emails</p>
              </div>
            </div>
            <p className="text-xs text-[#6B7280] mb-2">
              Current Anti-Phishing Code: <span className="font-bold text-[#7C3AED] font-mono">{antiPhishingCode}</span>
            </p>

            {isEditingCode && (
              <form onSubmit={handleSaveAntiPhishing} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. MY-VAULT-2026"
                  required
                  className="flex-1 bg-[#F8F7FC] border border-[#EDE9FE] rounded-xl px-3 py-1.5 text-xs text-[#171717]"
                />
                <button type="submit" className="px-3 py-1.5 bg-[#7C3AED] text-white text-xs font-bold rounded-xl">
                  Save
                </button>
              </form>
            )}
          </div>

          <button
            onClick={() => setIsEditingCode(!isEditingCode)}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#F8F7FC] hover:bg-purple-50 text-[#6D28D9] border border-[#EDE9FE] transition-colors cursor-pointer"
          >
            {isEditingCode ? 'Cancel' : 'Change Anti-Phishing Phrase'}
          </button>
        </div>

        {/* Biometrics & Passkeys */}
        <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#171717]">Passkeys & WebAuthn</h3>
                  <p className="text-[11px] text-[#6B7280]">TouchID, FaceID & Hardware FIDO2</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#16A34A]">
                Supported
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Sign transactions cryptographically with native device biometrics with zero risk of key theft.
            </p>
          </div>

          <button
            onClick={() => {
              setSavedNotice('Passkey synchronized with device biometric keychain.');
              setTimeout(() => setSavedNotice(null), 3000);
            }}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#F8F7FC] hover:bg-purple-50 text-[#6D28D9] border border-[#EDE9FE] transition-colors cursor-pointer"
          >
            Register New Biometric Key
          </button>
        </div>
      </div>

      {/* 3. Active Sessions Management */}
      <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
          <div>
            <h3 className="text-sm font-bold text-[#171717]">Active Login Sessions</h3>
            <p className="text-xs text-[#6B7280]">Manage devices currently authenticated with your XENA account</p>
          </div>
          <button
            onClick={() => {
              setSessions((prev) => prev.filter((s) => s.current));
              setSavedNotice('All other sessions terminated.');
              setTimeout(() => setSavedNotice(null), 3000);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#F8F7FC] hover:bg-red-50 text-[#DC2626] font-bold text-xs border border-[#EDE9FE] transition-colors cursor-pointer"
          >
            Revoke All Other Devices
          </button>
        </div>

        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-3.5 bg-[#F8F7FC] rounded-xl border border-[#EDE9FE] flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#EDE9FE] flex items-center justify-center text-[#6B7280]">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#171717]">{session.device}</span>
                    {session.current && (
                      <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-[#16A34A] text-[9px] font-bold border border-emerald-100">
                        Current Session
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#6B7280]">
                    IP: {session.ip} · {session.location}
                  </span>
                </div>
              </div>

              {!session.current && (
                <button
                  onClick={() => handleRevokeSession(session.id)}
                  className="px-3 py-1 rounded-lg bg-white text-[#DC2626] hover:bg-red-50 font-bold text-[11px] border border-[#EDE9FE] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Revoke</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
