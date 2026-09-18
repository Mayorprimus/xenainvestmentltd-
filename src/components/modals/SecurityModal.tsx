import React, { useState } from 'react';
import { X, ShieldCheck, Key, Smartphone, Lock, CheckCircle2, ShieldAlert, Laptop } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  twoFactorEnabled: boolean;
  pinSet: boolean;
  onUpdateSecurity: (settings: { twoFactor: boolean; pinSet: boolean }) => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  twoFactorEnabled: initial2FA,
  pinSet: initialPin,
  onUpdateSecurity,
}) => {
  const [twoFactor, setTwoFactor] = useState(initial2FA);
  const [pinEnabled, setPinEnabled] = useState(initialPin);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSecurity({ twoFactor, pinSet: pinEnabled });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in" id="security-settings-modal">
      <div className="relative w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-2xl shadow-2xl border border-[#EDE9FE] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Mobile drag handle bar */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto sm:hidden mt-3 mb-1 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#EDE9FE] bg-[#F8F7FC] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#171717] text-base">Security & Authentication</h3>
              <p className="text-[11px] text-[#6B7280]">Account Protection Level: Maximum</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[#6B7280] hover:text-[#171717] hover:bg-white transition-colors cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1">
          {/* Item 1: 2FA */}
          <div className="p-3.5 rounded-xl border border-[#EDE9FE] bg-[#F8F7FC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white border border-[#EDE9FE] text-[#6D28D9]">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171717]">Two-Factor Authentication (2FA)</h4>
                <p className="text-[11px] text-[#6B7280]">Google Authenticator / YubiKey active</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={(e) => setTwoFactor(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7C3AED]"></div>
            </label>
          </div>

          {/* Item 2: Transaction PIN */}
          <div className="p-3.5 rounded-xl border border-[#EDE9FE] bg-[#F8F7FC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white border border-[#EDE9FE] text-[#6D28D9]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171717]">Transaction Security PIN</h4>
                <p className="text-[11px] text-[#6B7280]">Required for all withdrawals & trades</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={(e) => setPinEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7C3AED]"></div>
            </label>
          </div>

          {/* Item 3: Whitelisted accounts */}
          <div className="p-3.5 rounded-xl border border-[#EDE9FE] bg-[#F8F7FC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white border border-[#EDE9FE] text-[#6D28D9]">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171717]">Verified Withdrawal Addresses</h4>
                <p className="text-[11px] text-[#6B7280]">3 Whitelisted hardware vaults</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#16A34A] bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
              Whitelisted
            </span>
          </div>

          {/* Item 4: Active Login Protection */}
          <div className="p-3.5 rounded-xl border border-[#EDE9FE] bg-[#F8F7FC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white border border-[#EDE9FE] text-[#6D28D9]">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#171717]">Active Login Session</h4>
                <p className="text-[11px] text-[#6B7280]">TLS 1.3 · IP Verified · Zero Anomaly</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#6D28D9] bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
              Protected
            </span>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:shadow-[0_4px_16px_rgba(109,40,217,0.3)] transition-all flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Security Preferences Saved!</span>
                </>
              ) : (
                'Save Security Preferences'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
