import React from 'react';
import { TrendingUp, ArrowUpRight, ShieldCheck, PieChart, Sparkles, Layers } from 'lucide-react';
import { UserBalances } from '../types';
import { XenaTokenBadge } from './XenaLogo';

interface MyXenaHoldingsProps {
  balances: UserBalances;
  onTrade: () => void;
}

export const MyXenaHoldings: React.FC<MyXenaHoldingsProps> = ({ balances, onTrade }) => {
  const totalFiatValue = balances.availableXena * balances.currentPrice;
  const initialCost = balances.availableXena * balances.averageBuyPrice;
  const unrealizedPnL = totalFiatValue - initialCost;
  const unrealizedPnLPercent = ((unrealizedPnL / initialCost) * 100) || 0;

  return (
    <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 shadow-sm" id="my-xena-holdings-section">
      {/* Header with Circular Purple XENA Token Icon */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-sm font-bold text-[#171717]">My XENA Holdings</h3>
          <p className="text-xs text-[#6B7280]">Spot balance & position</p>
        </div>
        <button
          onClick={onTrade}
          className="text-xs font-bold text-[#6D28D9] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Trade</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {/* Balance Callout */}
      <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-[#EDE9FE]">
        <div>
          <span className="text-xs text-[#6B7280] block">Available Balance</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gradient">
              {balances.availableXena.toLocaleString('en-US', { minimumFractionDigits: 2 })} XENA
            </span>
          </div>
          <span className="text-xs text-[#6B7280]">
            ≈ ${(balances.availableXena * balances.usdRate).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs text-[#6B7280] block">Unrealized Profit</span>
          <span className="text-xs font-bold text-[#16A34A] flex items-center justify-end gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+${unrealizedPnL.toFixed(2)} (+{unrealizedPnLPercent.toFixed(1)}%)</span>
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
          <span className="text-[10px] text-slate-500 block">Avg Buy Price</span>
          <span className="text-xs font-bold text-slate-700 font-mono">
            ${balances.averageBuyPrice.toFixed(4)}
          </span>
        </div>

        <div className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-100">
          <span className="text-[10px] text-purple-500 block">Market Price</span>
          <span className="text-xs font-bold text-purple-800 font-mono">
            ${balances.currentPrice.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
};
