import React from 'react';
import { Sparkles, Activity, ShieldCheck, Zap } from 'lucide-react';
import { UserProfile } from '../types';

interface WelcomeSectionProps {
  user: UserProfile;
  livePrice: number;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ user, livePrice }) => {
  // Get time-of-day greeting (or default to Good evening per design)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const greeting = getGreeting();

  return (
    <section className="pt-4 pb-2" id="xena-welcome-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
              {greeting}, {user.name.split(' ')[0]} <span className="inline-block animate-wave origin-bottom-right">👋</span>
            </h1>
          </div>
          <p className="text-sm sm:text-base text-[#6B7280] font-normal leading-relaxed">
            Welcome back. Here's an overview of your Xena account.
          </p>
        </div>

        {/* Live Status Indicators with subtle clean styling */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F7FC] border border-[#EDE9FE] rounded-full text-xs font-medium text-[#171717]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
            <span>XENA Chain: <strong className="text-[#6D28D9] font-bold">100% Operational</strong></span>
          </div>

          <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50/70 border border-purple-100 rounded-full text-xs font-semibold text-[#6D28D9]">
            <Zap className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>XENA: ${livePrice.toFixed(4)}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
