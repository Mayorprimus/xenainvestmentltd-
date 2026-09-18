import React, { useState, useEffect } from 'react';
import { Search, X, TrendingUp, Users, ArrowUpRight, ArrowDownRight, Shield, Layers } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onActionClick: (action: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onActionClick,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : {};
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { title: 'Buy XENA Token', category: 'Trade', icon: TrendingUp, action: () => onActionClick('buy') },
    { title: 'Sell XENA Token', category: 'Trade', icon: TrendingUp, action: () => onActionClick('sell') },
    { title: 'Deposit Funds (Instant SEPA / Crypto)', category: 'Wallet', icon: ArrowDownRight, action: () => onActionClick('deposit') },
    { title: 'Withdraw XENA', category: 'Wallet', icon: ArrowUpRight, action: () => onActionClick('withdraw') },
    { title: 'P2P Verified Merchants', category: 'Marketplace', icon: Users, action: () => { onNavigate('p2p'); onClose(); } },
    { title: 'Active Yield & Staking Plans', category: 'Investments', icon: Layers, action: () => { onNavigate('investments'); onClose(); } },
    { title: 'Security Settings & 2FA', category: 'Account', icon: Shield, action: () => onActionClick('security') },
  ];

  const filtered = quickLinks.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 sm:pt-20 p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#EDE9FE] overflow-hidden max-h-[88vh] flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#EDE9FE] shrink-0">
          <Search className="w-5 h-5 text-[#7C3AED] mr-2.5 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search XENA actions, P2P, earn..."
            className="w-full text-sm font-medium text-[#171717] placeholder:text-[#6B7280] focus:outline-none"
          />
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#171717] hover:bg-[#F8F7FC] cursor-pointer" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-[60vh] sm:max-h-80 overflow-y-auto flex-1">
          <div className="px-3 py-1.5 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
            Quick Actions & Navigations
          </div>
          {filtered.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={item.action}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F8F7FC] transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#171717]">{item.title}</div>
                    <div className="text-[10px] text-[#6B7280]">{item.category}</div>
                  </div>
                </div>
                <span className="text-[10px] text-[#7C3AED] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Jump →
                </span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-[#6B7280]">
              No matching actions or assets found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
