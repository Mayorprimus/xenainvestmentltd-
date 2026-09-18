import React, { useState } from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight, Send, QrCode, RefreshCw, ShieldCheck, Plus, Trash2, Check, ArrowRightLeft, DollarSign } from 'lucide-react';
import { UserBalances } from '../types';
import { XenaTokenBadge } from '../components/XenaLogo';

interface WalletPageProps {
  balances: UserBalances;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenSend: () => void;
  onOpenReceive: () => void;
  onTrade: () => void;
  onInternalTransfer: (amount: number, from: string, to: string) => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({
  balances,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenSend,
  onOpenReceive,
  onTrade,
  onInternalTransfer,
}) => {
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState('Spot Wallet');
  const [transferTo, setTransferTo] = useState('Staking Vault');
  const [transferAmount, setTransferAmount] = useState('100');
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  // Address whitelist
  const [whitelistAddresses, setWhitelistAddresses] = useState([
    { id: '1', label: 'Hardware Ledger Nano', address: '0x8A79c45b736b47D93bC8419D', network: 'XENA Network' },
    { id: '2', label: 'Cold Storage Vault', address: '0x4F129aE785C04921F38491c', network: 'Ethereum (ERC-20)' },
  ]);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNetwork, setNewNetwork] = useState('XENA Network');
  const [showAddAddress, setShowAddAddress] = useState(false);

  const totalXenaAmount = balances.totalXena ?? balances.totalBalance ?? (balances.availableXena + balances.investedXena);
  const totalFiat = totalXenaAmount * balances.usdRate;
  const spotFiat = balances.availableXena * balances.usdRate;
  const investedFiat = balances.investedXena * balances.usdRate;

  const cryptoAssets = [
    {
      symbol: 'XENA',
      name: 'Xena Token',
      network: 'XENA Network',
      balance: balances.availableXena,
      price: balances.currentPrice,
      value: spotFiat,
      change: '+12.4%',
      isNative: true,
    },
    {
      symbol: 'USDT',
      name: 'Tether USD',
      network: 'TRC-20 / ERC-20',
      balance: 1450.00,
      price: 1.00,
      value: 1450.00,
      change: '+0.01%',
      isNative: false,
      chipClass: 'bg-teal-50 text-teal-600 border-teal-100',
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      network: 'Solana Native',
      balance: 14.8,
      price: 188.40,
      value: 2788.32,
      change: '+8.1%',
      isNative: false,
      chipClass: 'bg-slate-800 text-white border-slate-700',
    },
  ];

  const handleAddWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newAddress) return;
    setWhitelistAddresses((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        label: newLabel,
        address: newAddress,
        network: newNetwork,
      },
    ]);
    setNewLabel('');
    setNewAddress('');
    setShowAddAddress(false);
  };

  const handleDeleteAddress = (id: string) => {
    setWhitelistAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(transferAmount);
    if (!num || num <= 0) return;
    onInternalTransfer(num, transferFrom, transferTo);
    setTransferSuccess(`Successfully transferred ${num} XENA from ${transferFrom} to ${transferTo}!`);
    setTimeout(() => {
      setTransferSuccess(null);
      setTransferModalOpen(false);
    }, 2500);
  };

  return (
    <div className="space-y-4 sm:space-y-8 animate-fade-in" id="wallet-page-view">
      {/* 1. Portfolio Net Worth Header Card */}
      <div className="bg-gradient-to-br from-[#1E1B4B] via-[#6D28D9] to-[#0E7490] rounded-[24px] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#22D3EE]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-[#F59E0B]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-wider text-purple-300">
              Total Portfolio Net Worth
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono">
                ${totalFiat.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-green-400">
                +8.45% (24h)
              </span>
            </div>
            <span className="text-xs text-slate-300 block font-mono">
              ≈ {totalXenaAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} XENA
            </span>
          </div>

          {/* Quick Action Button Bar */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={onOpenDeposit}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-bold text-xs hover:opacity-95 shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Deposit</span>
            </button>

            <button
              onClick={onOpenWithdraw}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw</span>
            </button>

            <button
              onClick={onOpenSend}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>

            <button
              onClick={onOpenReceive}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Receive</span>
            </button>

            <button
              onClick={() => setTransferModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 backdrop-blur-md flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer</span>
            </button>
          </div>
        </div>

        {/* Sub-Accounts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-purple-200 block">Spot Wallet</span>
            <span className="font-bold text-white font-mono block mt-0.5">
              {balances.availableXena.toLocaleString()} XENA
            </span>
            <span className="text-[10px] text-slate-300">≈ ${spotFiat.toLocaleString()} USD</span>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-purple-200 block">Staking Vault</span>
            <span className="font-bold text-white font-mono block mt-0.5">
              {balances.investedXena.toLocaleString()} XENA
            </span>
            <span className="text-[10px] text-slate-300">≈ ${investedFiat.toLocaleString()} USD</span>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-purple-200 block">P2P Escrow</span>
            <span className="font-bold text-white font-mono block mt-0.5">0.00 XENA</span>
            <span className="text-[10px] text-slate-300">In Active Escrow</span>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-purple-200 block">Naira Wallet</span>
            <span className="font-bold text-white font-mono block mt-0.5">
              ₦{balances.nairaBalance.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-300">Escrow-protected fiat</span>
          </div>
        </div>
      </div>

      {/* 2. Supported Multi-Assets List */}
      <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
          <div>
            <h3 className="text-sm font-bold text-[#171717]">Asset Balances</h3>
            <p className="text-xs text-[#6B7280]">Spot balances across all supported multi-chain networks</p>
          </div>
          <button
            onClick={onTrade}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-white font-bold text-xs hover:opacity-95 transition-all shadow-sm shadow-fuchsia-200/40 cursor-pointer"
          >
            Instant Swap
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EDE9FE] text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                <th className="pb-3 pl-2">Asset</th>
                <th className="pb-3">Network</th>
                <th className="pb-3">Balance</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Fiat Value</th>
                <th className="pb-3 text-right pr-2">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9FE] text-xs">
              {cryptoAssets.map((asset) => (
                <tr key={asset.symbol} className="hover:bg-[#F8F7FC] transition-colors">
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-2.5">
                      {asset.isNative ? (
                        <XenaTokenBadge size={28} />
                      ) : (
                        <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center border ${asset.chipClass}`}>
                          {asset.symbol.substring(0, 3)}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-[#171717] block">{asset.symbol}</span>
                        <span className="text-[10px] text-[#6B7280]">{asset.name}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-md bg-[#F8F7FC] border border-[#EDE9FE] text-[10px] font-semibold text-[#6B7280]">
                      {asset.network}
                    </span>
                  </td>

                  <td className="py-3 font-mono font-bold text-[#171717]">
                    {asset.balance.toLocaleString()} {asset.symbol}
                  </td>

                  <td className="py-3 font-mono text-[#171717]">
                    ${asset.price.toLocaleString()}
                  </td>

                  <td className="py-3 font-mono font-bold text-[#6D28D9]">
                    ${asset.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 text-right pr-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={onOpenDeposit}
                        className="px-2.5 py-1 rounded-lg bg-[#F8F7FC] hover:bg-purple-50 text-[#6D28D9] font-bold text-[11px] border border-[#EDE9FE] cursor-pointer"
                      >
                        Deposit
                      </button>
                      <button
                        onClick={onOpenWithdraw}
                        className="px-2.5 py-1 rounded-lg bg-[#F8F7FC] hover:bg-purple-50 text-[#6B7280] hover:text-[#171717] font-bold text-[11px] border border-[#EDE9FE] cursor-pointer"
                      >
                        Withdraw
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Whitelisted Withdrawal Addresses */}
      <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <div>
              <h3 className="text-sm font-bold text-[#171717]">Whitelisted Withdrawal Addresses</h3>
              <p className="text-xs text-[#6B7280]">Withdrawals are cryptographically restricted to verified whitelist addresses</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddAddress(!showAddAddress)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6D28D9] font-bold text-xs border border-purple-100 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Address</span>
          </button>
        </div>

        {showAddAddress && (
          <form onSubmit={handleAddWhitelist} className="p-4 bg-[#F8F7FC] rounded-2xl border border-[#EDE9FE] space-y-3 animate-fade-in">
            <h4 className="text-xs font-bold text-[#171717]">New Whitelisted Destination</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (e.g. Ledger Cold Wallet)"
                required
                className="bg-white border border-[#EDE9FE] rounded-xl px-3 py-2 text-xs text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="0x... Wallet Address"
                required
                className="bg-white border border-[#EDE9FE] rounded-xl px-3 py-2 text-xs font-mono text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
              <select
                value={newNetwork}
                onChange={(e) => setNewNetwork(e.target.value)}
                className="bg-white border border-[#EDE9FE] rounded-xl px-3 py-2 text-xs font-bold text-[#171717] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              >
                <option value="XENA Network">XENA Network</option>
                <option value="Ethereum (ERC-20)">Ethereum (ERC-20)</option>
                <option value="BNB Smart Chain">BNB Smart Chain</option>
                <option value="Solana">Solana</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddAddress(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#6B7280] font-semibold hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#7C3AED] text-white text-xs font-bold hover:opacity-95"
              >
                Save to Whitelist
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {whitelistAddresses.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-[#F8F7FC] rounded-xl border border-[#EDE9FE] flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-[#171717] block">{item.label}</span>
                <span className="font-mono text-[11px] text-[#6B7280]">{item.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-md bg-white border border-[#EDE9FE] text-[10px] text-[#6D28D9] font-semibold">
                  {item.network}
                </span>
                <button
                  onClick={() => handleDeleteAddress(item.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove from whitelist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Internal Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-[#EDE9FE] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="font-bold text-sm text-[#171717]">Internal Account Transfer</h3>
              </div>
              <button onClick={() => setTransferModalOpen(false)} className="text-xs text-[#6B7280] font-bold">
                Close
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-3">
              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">From Account</label>
                <select
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
                  className="w-full bg-[#F8F7FC] border border-[#EDE9FE] rounded-xl px-3 py-2 text-xs font-bold text-[#171717]"
                >
                  <option value="Spot Wallet">Spot Wallet ({balances.availableXena} XENA)</option>
                  <option value="Staking Vault">Staking Vault ({balances.investedXena} XENA)</option>
                  <option value="Funding Account">Funding Account (0.00 XENA)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">To Destination Account</label>
                <select
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  className="w-full bg-[#F8F7FC] border border-[#EDE9FE] rounded-xl px-3 py-2 text-xs font-bold text-[#171717]"
                >
                  <option value="Staking Vault">Staking Vault</option>
                  <option value="Spot Wallet">Spot Wallet</option>
                  <option value="Funding Account">Funding Account</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#6B7280] block mb-1">Transfer Amount (XENA)</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-[#F8F7FC] border border-[#EDE9FE] rounded-xl px-3 py-2 text-sm font-bold font-mono text-[#171717]"
                  required
                />
              </div>

              {transferSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-[#16A34A] text-xs font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0 stroke-[3]" />
                  <span>{transferSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-bold text-xs hover:opacity-95 shadow-md cursor-pointer"
              >
                Execute 0% Fee Transfer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
