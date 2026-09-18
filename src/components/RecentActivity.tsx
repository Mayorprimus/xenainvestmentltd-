import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, TrendingUp, Users, ShoppingCart, Clock, CheckCircle2, AlertCircle, Search, Filter, ExternalLink, Sparkles } from 'lucide-react';
import { Transaction, TransactionType } from '../types';

interface RecentActivityProps {
  transactions: Transaction[];
  onViewAll?: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ transactions, onViewAll }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-4 h-4 text-[#16A34A]" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-[#6B7280]" />;
      case 'investment':
        return <TrendingUp className="w-4 h-4 text-[#7C3AED]" />;
      case 'p2p_buy':
      case 'p2p_sell':
        return <Users className="w-4 h-4 text-[#6D28D9]" />;
      case 'buy':
      case 'sell':
        return <ShoppingCart className="w-4 h-4 text-[#7C3AED]" />;
      case 'staking_reward':
        return <Sparkles className="w-4 h-4 text-[#16A34A]" />;
      default:
        return <ArrowDownRight className="w-4 h-4 text-[#6D28D9]" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-200/60">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-[#F59E0B] border border-amber-200/60 animate-pulse">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-50 text-[#6B7280] border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'deposit' && tx.type === 'deposit') ||
      (filterType === 'withdrawal' && tx.type === 'withdrawal') ||
      (filterType === 'investment' && tx.type === 'investment') ||
      (filterType === 'p2p' && (tx.type === 'p2p_buy' || tx.type === 'p2p_sell'));

    const matchesSearch =
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.counterparty && tx.counterparty.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <section className="py-2" id="recent-activity-section">
      <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 shadow-sm">
        {/* Header with Title & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EDE9FE]">
          <div>
            <h2 className="text-sm font-bold text-[#171717]">
              Recent Activity
            </h2>
            <p className="text-xs text-[#6B7280]">
              Real-time ledger of deposits, investments, and transfers
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex bg-[#F8F7FC] p-0.5 rounded-lg border border-[#EDE9FE] text-[11px] font-semibold">
              {[
                { id: 'all', label: 'All' },
                { id: 'deposit', label: 'Deposits' },
                { id: 'withdrawal', label: 'Withdrawals' },
                { id: 'investment', label: 'Investments' },
                { id: 'p2p', label: 'P2P' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    filterType === tab.id
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-white shadow-sm shadow-fuchsia-200/60 font-bold'
                      : 'text-[#6B7280] hover:text-[#171717]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile View: Clean Card List */}
        <div className="sm:hidden divide-y divide-[#EDE9FE]/70">
          {filteredTransactions.map((tx) => {
            const isPositive = tx.amount > 0;
            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="py-3 px-1 flex items-center justify-between gap-3 active:bg-[#F8F7FC] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#F8F7FC] border border-[#EDE9FE] flex items-center justify-center shrink-0">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#171717] truncate">
                        {tx.title}
                      </span>
                      {getStatusBadge(tx.status)}
                    </div>
                    <span className="text-[10px] text-[#6B7280] block truncate">
                      {tx.timestamp} · {tx.counterparty || tx.paymentMethod || 'XENA Chain'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`font-bold text-xs font-mono block ${isPositive ? 'text-[#16A34A]' : 'text-[#171717]'}`}>
                    {isPositive ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} {tx.unit}
                  </span>
                  <span className="text-[10px] text-[#6B7280]">
                    ≈ ${Math.abs(tx.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredTransactions.length === 0 && (
            <div className="py-8 text-center text-xs text-[#6B7280]">
              No transactions matching your selection.
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EDE9FE] text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                <th className="py-3 px-2">Transaction</th>
                <th className="py-3 px-2">Amount</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9FE]/60">
              {filteredTransactions.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-[#F8F7FC] transition-colors cursor-pointer group text-xs"
                  >
                    {/* Icon & Title */}
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#F8F7FC] border border-[#EDE9FE] flex items-center justify-center flex-shrink-0 group-hover:border-purple-300 transition-colors">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-[#171717] block leading-tight">
                            {tx.title}
                          </span>
                          <span className="text-[10px] text-[#6B7280]">
                            {tx.counterparty || tx.paymentMethod || 'XENA Network'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-2">
                      <div className="font-bold text-xs font-mono leading-tight">
                        <span className={isPositive ? 'text-[#16A34A]' : 'text-[#171717]'}>
                          {isPositive ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()}{' '}
                          <span className="text-[10px] font-sans text-[#6B7280]">{tx.unit}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-[#6B7280]">
                        ≈ ${Math.abs(tx.amount).toLocaleString()} USD
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-2">
                      {getStatusBadge(tx.status)}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-2 text-right text-[11px] font-medium text-[#6B7280]">
                      {tx.timestamp}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredTransactions.length === 0 && (
            <div className="py-8 text-center text-xs text-[#6B7280]">
              No transactions matching your selection.
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal on Click (Bottom Sheet on mobile) */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-[28px] sm:rounded-2xl p-6 max-w-sm w-full border border-[#EDE9FE] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Mobile drag bar */}
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto sm:hidden mb-2" />

            <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                  {getTransactionIcon(selectedTx.type)}
                </div>
                <h4 className="font-bold text-sm text-[#171717]">Transaction Receipt</h4>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-[#6B7280] hover:text-[#171717] text-xs font-bold p-1"
              >
                Close
              </button>
            </div>

            <div className="text-center py-2">
              <span className="text-2xl font-extrabold text-[#171717] font-mono">
                {selectedTx.amount > 0 ? `+${selectedTx.amount}` : selectedTx.amount} {selectedTx.unit}
              </span>
              <div className="mt-1 flex justify-center">{getStatusBadge(selectedTx.status)}</div>
            </div>

            <div className="space-y-2 text-xs bg-[#F8F7FC] p-3.5 rounded-xl border border-[#EDE9FE]">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Reference ID:</span>
                <span className="font-mono text-[#171717]">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Time:</span>
                <span className="text-[#171717]">{selectedTx.timestamp}</span>
              </div>
              {selectedTx.txHash && (
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Blockchain Hash:</span>
                  <span className="font-mono text-[#7C3AED] truncate max-w-[160px]">{selectedTx.txHash}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-bold text-xs hover:opacity-95 transition-all min-h-[44px]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
