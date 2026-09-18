import React from 'react';
import { Home, TrendingUp, Users, PiggyBank, Clock3, Wallet, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onQuickTrade?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'market',
      label: 'Markets',
      icon: TrendingUp,
    },
    {
      id: 'investments',
      label: 'Earn',
      icon: PiggyBank,
    },
    {
      id: 'p2p',
      label: 'P2P',
      icon: Users,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EDE9FE] px-2 py-1 shadow-[0_-4px_20px_rgba(109,40,217,0.06)]"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      id="mobile-bottom-navigation"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 min-w-[56px] min-h-[48px] cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#6D28D9]'
                  : 'text-[#6B7280] hover:text-[#171717]'
              }`}
              aria-label={item.label}
            >
              <div className="relative">
                <div
                  className={`rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-[#7C3AED] to-[#DB2777] text-white shadow-md shadow-fuchsia-300/50 scale-110'
                      : 'text-[#6B7280] p-1'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#DB2777] rounded-full" />
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 ${
                  isActive ? 'font-bold text-[#6D28D9]' : 'font-medium text-[#6B7280]'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
