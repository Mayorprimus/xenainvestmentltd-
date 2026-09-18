import React from 'react';
import { ShoppingCart, ArrowDownCircle, Send, QrCode, Users, TrendingUp, Sparkles } from 'lucide-react';

interface QuickActionsProps {
  onActionClick: (action: 'buy' | 'sell' | 'send' | 'receive' | 'p2p' | 'invest') => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  const actions = [
    {
      id: 'buy',
      title: 'Buy XENA',
      subtitle: 'Instant card / USDT',
      icon: ShoppingCart,
      gradient: 'from-[#7C3AED] to-[#EC4899]',
      glow: 'shadow-purple-200/60',
      badge: '0% Fee',
      badgeClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      id: 'sell',
      title: 'Sell XENA',
      subtitle: 'Direct cash settlement',
      icon: ArrowDownCircle,
      gradient: 'from-[#2563EB] to-[#06B6D4]',
      glow: 'shadow-sky-200/60',
    },
    {
      id: 'send',
      title: 'Send',
      subtitle: 'Instant network transfer',
      icon: Send,
      gradient: 'from-[#059669] to-[#34D399]',
      glow: 'shadow-emerald-200/60',
    },
    {
      id: 'receive',
      title: 'Receive',
      subtitle: 'QR & wallet address',
      icon: QrCode,
      gradient: 'from-[#D97706] to-[#FBBF24]',
      glow: 'shadow-amber-200/60',
    },
    {
      id: 'p2p',
      title: 'P2P',
      subtitle: 'Trade with verified peers',
      icon: Users,
      gradient: 'from-[#E11D48] to-[#F97316]',
      glow: 'shadow-rose-200/60',
      badge: 'Hot',
      badgeClass: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      id: 'invest',
      title: 'Invest',
      subtitle: 'Earn up to 52% APY',
      icon: TrendingUp,
      gradient: 'from-[#6D28D9] to-[#DB2777]',
      glow: 'shadow-fuchsia-200/60',
      badge: '52% APY',
      badgeClass: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
    },
  ];

  return (
    <section className="py-2" id="quick-actions-section">
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onActionClick(action.id as any)}
              className="bg-white p-3 sm:p-4 rounded-2xl border border-[#EDE9FE] shadow-sm hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-6px_rgba(124,58,237,0.18)] active:scale-95 transition-all group flex flex-col items-center justify-center gap-1.5 sm:gap-2 text-center cursor-pointer relative min-h-[82px] sm:min-h-[96px]"
            >
              {action.badge && (
                <span className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${action.badgeClass}`}>
                  {action.badge}
                </span>
              )}
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-md ${action.glow} group-hover:scale-105 group-hover:rotate-3 transition-transform shrink-0`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="w-full">
                <span className="text-[11px] sm:text-xs font-bold text-[#171717] group-hover:text-[#6D28D9] transition-colors block truncate">
                  {action.title}
                </span>
                <span className="text-[10px] text-[#6B7280] block mt-0.5 hidden sm:block truncate">
                  {action.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
