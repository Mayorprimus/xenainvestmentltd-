import React, { useState } from 'react';
import { Clock, Search, Filter, Download, ArrowDownRight, ArrowUpRight, CheckCircle2, AlertCircle, RefreshCw, Copy, Check, ExternalLink, ShieldCheck, ArrowRightLeft, Users, PiggyBank } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionsPageProps {
  transactions: Transaction[];
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({ transactions }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);

  const filteredTransactions = transactions.filter((tx) => {
    // Type filter
    if (filterType !== 'all' && tx.type !== filterType) {
      return false;
    }
    // Status filter
    if (filterStatus !== 'all' && tx.status !== filterStatus) {
      return false;
    }
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = tx.title.toLowerCase().includes(q);
      const matchCounterparty = tx.counterparty?.toLowerCase().includes(q) || false;
      const matchHash = tx.txHash?.toLowerCase().includes(q) || false;
      const matchId = tx.id.toLowerCase().includes(q);
      if (!matchTitle && !matchCounterparty && !matchHash && !matchId) {
        return false;
      }
    }
    return true;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'buy':
        return <ArrowDownRight className="w-4 h-4 text-[#16A34A]" />;
      case 'withdraw':
      case 'sell':
        return <ArrowUpRight className="w-4 h-4 text-[#DC2626]" />;
      case 'send':
        return <ArrowUpRight className="w-4 h-4 text-[#6D28D9]" />;
      case 'receive':
        return <ArrowDownRight className="w-4 h-4 text-[#6D28D9]" />;
      case 'yield':
        return <PiggyBank className="w-4 h-4 text-[#6D28D9]" />;
      case 'p2p':
        return <Users className="w-4 h-4 text-[#7C3AED]" />;
      default:
        return <RefreshCw className="w-4 h-4 text-[#6B7280]" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#16A34A] border border-emerald-100 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Success</span>
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Pending</span>
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#6D28D9] border border-purple-100 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Confirming</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-[#6B7280]">
            {status}
          </span>
        );
    }
  };

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleExport = () => {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  return (
    <div className="space-y-4 sm:space-y-8 animate-fade-in" id="transactions-page-view">
      {/* 1. Header & Summary */}
      <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#6D28D9] text-xs font-bold border border-purple-100 mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Immutable Blockchain Audit Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
              Transaction History & Statements
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
              Complete on-chain ledger records, smart contract executions, and P2P trade settlements.
            </p>
          </div>

          <button
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6D28D9] font-bold text-xs border border-purple-100 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Statement</span>
          </button>
        </div>

        {exportNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-bold text-[#16A34A] flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 stroke-[3]" />
            <span>Statement CSV generated and downloaded successfully!</span>
          </div>
        )}
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by transaction ID, counterparty, or blockchain hash..."
              className="w-full pl-9 pr-4 py-2 bg-[#F8F7FC] border border-[#EDE9FE] rounded-xl text-xs font-medium text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#F8F7FC] border border-[#EDE9FE] rounded-xl px-3 py-2 text-xs font-bold text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#7C3AED] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'All Transactions' },
            { id: 'deposit', label: 'Deposits' },
            { id: 'withdraw', label: 'Withdrawals' },
            { id: 'buy', label: 'Spot Buys' },
            { id: 'sell', label: 'Spot Sells' },
            { id: 'yield', label: 'Staking Yield' },
            { id: 'p2p', label: 'P2P Trades' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterType(item.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                filterType === item.id
                  ? 'bg-purple-50 text-[#6D28D9] font-bold border border-purple-200'
                  : 'bg-[#F8F7FC] text-[#6B7280] border border-[#EDE9FE] hover:text-[#171717]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Transaction Ledger Table */}
      <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE] text-xs text-[#6B7280]">
          <span>Showing {filteredTransactions.length} transaction entries</span>
          <span className="text-[11px] font-mono">Synced with Block #19,482,904</span>
        </div>

        {/* Mobile View: Cards */}
        <div className="sm:hidden divide-y divide-[#EDE9FE]">
          {filteredTransactions.map((tx) => {
            const isPositive = tx.amount > 0;
            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="py-3 flex items-center justify-between gap-3 active:bg-[#F8F7FC] cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#F8F7FC] border border-[#EDE9FE] flex items-center justify-center shrink-0">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-[#171717] truncate">{tx.title}</span>
                      {getStatusBadge(tx.status)}
                    </div>
                    <span className="text-[10px] text-[#6B7280] block truncate">
                      {tx.timestamp} · {tx.counterparty || tx.paymentMethod || 'XENA Network'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`font-bold text-xs font-mono block ${isPositive ? 'text-[#16A34A]' : 'text-[#171717]'}`}>
                    {isPositive ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} {tx.unit}
                  </span>
                  <span className="text-[10px] text-[#6B7280]">
                    ≈ ${(Math.abs(tx.amount) * 4.85).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EDE9FE] text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                <th className="pb-3 pl-2">Type / Action</th>
                <th className="pb-3">Counterparty / Details</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9FE] text-xs">
              {filteredTransactions.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-[#F8F7FC] transition-colors cursor-pointer"
                  >
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#F8F7FC] border border-[#EDE9FE] flex items-center justify-center shrink-0">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <span className="font-bold text-[#171717] block">{tx.title}</span>
                          <span className="text-[10px] font-mono text-[#6B7280] uppercase">{tx.type}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3">
                      <span className="text-[#171717] font-semibold block">{tx.counterparty || tx.paymentMethod || 'XENA Chain Protocol'}</span>
                      {tx.txHash && (
                        <span className="text-[10px] font-mono text-[#7C3AED] truncate block max-w-[180px]">
                          {tx.txHash}
                        </span>
                      )}
                    </td>

                    <td className="py-3 text-[#6B7280] whitespace-nowrap">
                      {tx.timestamp}
                    </td>

                    <td className="py-3 font-mono font-bold whitespace-nowrap">
                      <span className={isPositive ? 'text-[#16A34A]' : 'text-[#171717]'}>
                        {isPositive ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} {tx.unit}
                      </span>
                    </td>

                    <td className="py-3">
                      {getStatusBadge(tx.status)}
                    </td>

                    <td className="py-3 text-right pr-2">
                      <span className="text-xs font-bold text-[#6D28D9] hover:underline">
                        View Receipt →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="py-12 text-center space-y-2">
            <p className="text-sm font-bold text-[#171717]">No transactions match your search filter.</p>
            <p className="text-xs text-[#6B7280]">Try clearing your search query or selecting "All Transactions".</p>
          </div>
        )}
      </div>

      {/* Detailed Receipt Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-[28px] sm:rounded-2xl p-6 max-w-md w-full border border-[#EDE9FE] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto sm:hidden mb-2" />

            <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                  {getTransactionIcon(selectedTx.type)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#171717]">Transaction Receipt</h3>
                  <p className="text-[10px] text-[#6B7280]">ID: {selectedTx.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-[#6B7280] hover:text-[#171717] text-xs font-bold p-1 cursor-pointer"
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

            <div className="space-y-2 text-xs bg-[#F8F7FC] p-4 rounded-xl border border-[#EDE9FE]">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Type:</span>
                <span className="font-bold text-[#171717] uppercase">{selectedTx.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Timestamp:</span>
                <span className="text-[#171717]">{selectedTx.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Counterparty / Channel:</span>
                <span className="font-semibold text-[#171717]">{selectedTx.counterparty || selectedTx.paymentMethod || 'XENA Network'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Network Fee:</span>
                <span className="font-mono text-[#16A34A]">0.0000 XENA (Zero Fee)</span>
              </div>
              {selectedTx.txHash && (
                <div className="pt-2 border-t border-[#EDE9FE] space-y-1">
                  <span className="text-[#6B7280] block">Blockchain Transaction Hash:</span>
                  <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#EDE9FE]">
                    <span className="font-mono text-[11px] text-[#7C3AED] truncate max-w-[240px]">{selectedTx.txHash}</span>
                    <button onClick={() => handleCopy(selectedTx.txHash!)} className="p-1 text-[#7C3AED]">
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-bold text-xs hover:opacity-95 transition-all min-h-[44px] cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
