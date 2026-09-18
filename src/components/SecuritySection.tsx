import React from 'react';
import { ShieldCheck, Check, ArrowRight, Lock, Key, Smartphone, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';

interface SecuritySectionProps {
  user: UserProfile;
  onOpenSecuritySettings: () => void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  user,
  onOpenSecuritySettings,
}) => {
  const securityItems = [
    {
      title: 'Two-factor authentication',
      desc: user.twoFactorEnabled ? 'Enabled via Authenticator App' : 'Recommended to enable',
      active: user.twoFactorEnabled,
      icon: Smartphone,
    },
    {
      title: 'Transaction PIN',
      desc: user.pinSet ? 'Active for withdrawals & orders' : 'Set up 4-digit PIN',
      active: user.pinSet,
      icon: Lock,
    },
    {
      title: 'Verified withdrawal accounts',
      desc: `${user.verifiedAccountsCount} whitelisted addresses`,
      active: true,
      icon: Key,
    },
    {
      title: 'Login protection',
      desc: 'Anomaly detection & TLS 1.3 Active',
      active: true,
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-2" id="security-section">
      <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EDE9FE]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-sm font-bold text-[#171717]">
                Account Security & Protection
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#6D28D9] text-[10px] font-bold border border-purple-100 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                SOC-2 Certified
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Continuous cryptographic verification defends your assets
            </p>
          </div>

          <button
            onClick={onOpenSecuritySettings}
            className="text-xs font-bold text-[#6D28D9] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Security Settings</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Checklist items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {securityItems.map((item, index) => {
            return (
              <div
                key={index}
                className="p-3 rounded-xl bg-[#F8F7FC] border border-[#EDE9FE] flex items-start gap-2.5"
              >
                <div className="p-1 rounded-full bg-emerald-50 text-[#16A34A] border border-emerald-200 mt-0.5 shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#171717] leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
