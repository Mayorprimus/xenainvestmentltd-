import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  ShieldCheck,
  Clock,
  ArrowRight,
  Building2,
  CreditCard,
  Smartphone,
  DollarSign,
  Zap,
  Copy,
  Check,
  Shield,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { P2POffer, P2PTrade } from '../../types';

interface P2PTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: P2POffer | null;
  initialPaymentMethod?: string;
  onPaymentSubmitted: (trade: P2PTrade) => void;
}

export const P2PTradeModal: React.FC<P2PTradeModalProps> = ({
  isOpen,
  onClose,
  offer,
  initialPaymentMethod,
  onPaymentSubmitted,
}) => {
  const [fiatAmount, setFiatAmount] = useState<string>('285');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [step, setStep] = useState<'create' | 'payment' | 'done'>('create');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins timer

  // Available payment methods list normalized
  const availableMethods = React.useMemo(() => {
    if (!offer) return ['Bank Transfer'];
    if (offer.paymentMethods && offer.paymentMethods.length > 0) {
      return offer.paymentMethods;
    }
    if (offer.paymentMethod) {
      return offer.paymentMethod.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return ['Bank Transfer', 'Revolut', 'Wise'];
  }, [offer]);

  useEffect(() => {
    if (offer) {
      if (initialPaymentMethod && availableMethods.includes(initialPaymentMethod)) {
        setSelectedMethod(initialPaymentMethod);
      } else {
        setSelectedMethod(availableMethods[0] || 'Bank Transfer');
      }
      setFiatAmount(Math.max(offer.minLimit, Math.min(285, offer.maxLimit)).toString());
      setStep('create');
      setTimeLeft(900);
    }
  }, [offer, initialPaymentMethod, availableMethods, isOpen]);

  // Escrow Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'payment' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  if (!isOpen || !offer) return null;

  const fiat = parseFloat(fiatAmount) || 0;
  const xenaReceived = (fiat / offer.pricePerXena).toFixed(2);
  const activeMethod = selectedMethod || availableMethods[0] || 'Bank Transfer';

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getMethodIcon = (methodName: string) => {
    const lower = methodName.toLowerCase();
    if (lower.includes('bank') || lower.includes('wire')) return <Building2 className="w-4 h-4" />;
    if (lower.includes('revolut') || lower.includes('wise') || lower.includes('card')) return <CreditCard className="w-4 h-4" />;
    if (lower.includes('apple') || lower.includes('zelle') || lower.includes('cash')) return <Smartphone className="w-4 h-4" />;
    if (lower.includes('sepa') || lower.includes('instant')) return <Zap className="w-4 h-4" />;
    return <DollarSign className="w-4 h-4" />;
  };

  const getPaymentDetails = (method: string) => {
    const lower = method.toLowerCase();
    if (lower.includes('revolut')) {
      return {
        recipient: 'XENA Liquidity Desk Ltd',
        identifierLabel: 'Revtag ID',
        identifierValue: '@xena_merchant_desk',
        speed: 'Instant (Under 1 min)',
        instructions: 'Open your Revolut app, search for @xena_merchant_desk, and send the exact fiat amount with the reference code.',
      };
    }
    if (lower.includes('wise')) {
      return {
        recipient: 'XENA Global Settlements',
        identifierLabel: 'Wise Recipient Email',
        identifierValue: 'pay.settle@xena-vault.com',
        speed: 'Instant / 1-2 mins',
        instructions: 'Send money to our verified Wise business address. Make sure to enter the unique reference code in the transfer note.',
      };
    }
    if (lower.includes('sepa')) {
      return {
        recipient: 'XENA European Escrow Desk',
        identifierLabel: 'SEPA Instant IBAN',
        identifierValue: 'EU89 XENA 0038 9120 4810 92',
        speed: 'SEPA Instant (10 seconds)',
        instructions: 'Use SEPA Instant transfer from your banking app. Instant fund arrival triggers automatic escrow release.',
      };
    }
    if (lower.includes('zelle')) {
      return {
        recipient: 'XENA US Custody LLC',
        identifierLabel: 'Zelle Registered Email',
        identifierValue: 'zelle.us@xena-desk.com',
        speed: 'Instant (1-2 mins)',
        instructions: 'Send payment via Zelle directly to our verified commercial account.',
      };
    }
    if (lower.includes('apple')) {
      return {
        recipient: 'XENA Merchant Verified',
        identifierLabel: 'Apple Cash Phone ID',
        identifierValue: '+1 (555) 392-8192',
        speed: 'Instant 1-Click',
        instructions: 'Send Apple Cash to the verified merchant phone number with your trade ID in the note.',
      };
    }
    if (lower.includes('paypal')) {
      return {
        recipient: 'XENA Verified Merchant Desk',
        identifierLabel: 'PayPal.Me Link',
        identifierValue: 'paypal.me/xenaMerchantDesk',
        speed: 'Instant',
        instructions: 'Send as Friends & Family or Goods & Services per merchant confirmation.',
      };
    }
    // Default Bank Transfer
    return {
      recipient: 'XENA Escrow Global Bank Account',
      identifierLabel: 'IBAN / Account Number',
      identifierValue: 'GB29 XENA 0042 9182 3847 21',
      sortCode: '40-22-81',
      swiftBic: 'XENAGB2L',
      speed: 'Instant to 5 mins',
      instructions: 'Transfer funds using your regular mobile banking app with the payment reference included.',
    };
  };

  const currentDetails = getPaymentDetails(activeMethod);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (fiat < offer.minLimit || fiat > offer.maxLimit) return;
    setStep('payment');
  };

  const handleConfirmPaid = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('done');
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7C3AED', '#A855F7', '#10B981'],
        });
      } catch {}

      const receivedNum = parseFloat(xenaReceived) || 0;
      const now = Date.now().toString();
      const newTrade: P2PTrade = {
        id: `p2p-tx-${now.slice(-6)}`,
        offerId: offer.id,
        merchantName: offer.merchantName,
        type: 'BUY',
        method: activeMethod,
        fiatAmount: fiat,
        currency: offer.currency || 'USD',
        xenaAmount: receivedNum,
        pricePerXena: offer.pricePerXena,
        buyerEmail: '',
        status: 'awaiting_validation',
        reference: `XN-84920-P2P`,
        time: 'Just now',
      };

      onPaymentSubmitted(newTrade);
      setTimeout(() => {
        setStep('create');
        onClose();
      }, 2200);
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      id="p2p-trade-modal"
    >
      <div className="relative w-full max-w-xl bg-white rounded-t-[28px] sm:rounded-[24px] shadow-2xl border border-[#EDE9FE] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto sm:hidden mt-3 mb-1 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#EDE9FE] bg-[#F8F7FC] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
              P2P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-[#171717] text-sm sm:text-base">
                  {offer.type === 'SELL' ? 'Sell XENA to' : 'Buy XENA from'} {offer.merchantName}
                </h3>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-[#6B7280]">
                Smart Escrow Locked · 0% Trading Fee · Verified Counterparty
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#171717] hover:bg-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: CREATE ORDER & SELECT PAYMENT METHOD */}
          {step === 'create' && (
            <form onSubmit={handleCreateOrder} className="space-y-4.5">
              {/* Merchant Trust Bar */}
              <div className="p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#EDE9FE] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-[#6D28D9] flex items-center justify-center font-bold text-xs">
                    {offer.merchantName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-[#171717] flex items-center gap-1">
                      {offer.merchantName}
                      <CheckCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span className="text-[10px] text-[#6D28D9] font-extrabold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
                        {offer.merchantTier || 'VIP Merchant'}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6B7280]">
                      {offer.completedOrders || offer.ordersCount || 100}+ orders · {offer.completionRate}% completion · ⚡ ~{offer.responseTimeMinutes || 2}m speed
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[#6B7280] font-medium">Unit Price</div>
                  <div className="font-extrabold text-sm text-[#6D28D9] font-mono">
                    ${offer.pricePerXena.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* SECTION: SELECT PAYMENT METHOD (PROMINENT & EASY) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-[#171717] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>Select Payment Method to Pay</span>
                  </label>
                  <span className="text-[10px] text-[#6D28D9] font-bold">
                    {availableMethods.length} Channels Accepted
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableMethods.map((method) => {
                    const isSelected = activeMethod.toLowerCase() === method.toLowerCase();
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setSelectedMethod(method)}
                        className={`p-3 rounded-xl border text-xs font-bold text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'border-[#7C3AED] bg-purple-50/80 text-[#6D28D9] ring-2 ring-[#7C3AED]/20 shadow-xs'
                            : 'border-[#EDE9FE] bg-[#F8F7FC] text-[#171717] hover:bg-white hover:border-purple-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-purple-200/60 text-[#6D28D9]' : 'bg-white text-slate-600 border border-[#EDE9FE]'}`}>
                            {getMethodIcon(method)}
                          </div>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-[10px]">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="block truncate font-bold text-[11px]">{method}</span>
                          <span className="text-[9px] text-[#6B7280] font-normal block">0% fee · Fast release</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Live Account Preview for Selected Payment Method */}
                <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-purple-100 text-[#6D28D9]">
                      {getMethodIcon(activeMethod)}
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B7280] block">Paying with:</span>
                      <span className="font-bold text-[#171717]">{activeMethod}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#6B7280] block">{currentDetails.identifierLabel}</span>
                    <span className="font-mono font-bold text-[11px] text-[#6D28D9]">{currentDetails.identifierValue}</span>
                  </div>
                </div>
              </div>

              {/* Amount to Pay (Fiat) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#171717]">
                  <span>I Want to Pay</span>
                  <span className="text-[#6B7280] font-normal text-[11px]">
                    Limit: ${offer.minLimit} – ${offer.maxLimit.toLocaleString()} {offer.currency || 'USD'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={fiatAmount}
                    onChange={(e) => setFiatAmount(e.target.value)}
                    min={offer.minLimit}
                    max={offer.maxLimit}
                    step="any"
                    required
                    className="w-full px-4 py-3 text-base font-extrabold text-[#171717] bg-[#F8F7FC] border border-[#EDE9FE] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] focus:bg-white pr-20 transition-all font-mono"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 font-bold text-xs text-[#6B7280] bg-white px-2 py-1 rounded-lg border border-[#EDE9FE]">
                    <span>{offer.currency || 'USD'}</span>
                  </div>
                </div>

                {/* Quick Budget Chips */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#6B7280] font-medium">Quick Fill:</span>
                  {[offer.minLimit, 100, 250, 500, offer.maxLimit].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFiatAmount(val.toString())}
                      className="px-2 py-0.5 rounded-md bg-[#F8F7FC] hover:bg-purple-50 text-[10px] font-bold text-[#6B7280] hover:text-[#6D28D9] border border-[#EDE9FE] transition-colors cursor-pointer"
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* XENA Amount Received */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#171717]">
                  <span>I Will Receive</span>
                  <span className="text-emerald-700 font-bold text-[10px]">Zero Escrow Fees</span>
                </div>
                <div className="p-3.5 bg-gradient-to-r from-purple-50/70 to-indigo-50/70 border border-purple-100 rounded-2xl flex items-center justify-between">
                  <span className="text-lg font-black text-[#6D28D9] font-mono">
                    {xenaReceived} XENA
                  </span>
                  <span className="text-xs font-extrabold text-[#7C3AED] bg-white px-2.5 py-1 rounded-xl border border-purple-200">
                    ≈ ${fiat.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:shadow-[0_4px_16px_rgba(109,40,217,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Proceed to Escrow Payment ({activeMethod})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: ESCROW PAYMENT & CONFIRMATION */}
          {step === 'payment' && (
            <div className="space-y-4.5 animate-fade-in">
              {/* Escrow Timer Alert */}
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold">Escrow Lock Active</span>
                    <span className="font-mono font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200">
                      ⏱ {formatTimer(timeLeft)}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/90 leading-relaxed">
                    Merchant's <strong className="font-bold">{xenaReceived} XENA</strong> is locked in the smart contract. Transfer <strong className="font-bold">${fiatAmount} USD</strong> using <strong className="font-bold">{activeMethod}</strong> before timer expires.
                  </p>
                </div>
              </div>

              {/* Merchant Account Details Card */}
              <div className="p-4 sm:p-5 bg-[#F8F7FC] rounded-2xl border border-[#EDE9FE] space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#EDE9FE]">
                  <span className="font-extrabold text-[#171717] flex items-center gap-1.5">
                    {getMethodIcon(activeMethod)}
                    <span>{activeMethod} Payment Instructions</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Verified Merchant
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Account Name */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Account Name:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#171717]">{currentDetails.recipient}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentDetails.recipient, 'recipient')}
                        className="text-slate-400 hover:text-[#7C3AED] p-0.5"
                        title="Copy"
                      >
                        {copiedField === 'recipient' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Payment Identifier (IBAN / Revtag / Email) */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">{currentDetails.identifierLabel}:</span>
                    <div className="flex items-center gap-1.5">
                      <code className="font-mono font-extrabold text-[#6D28D9] bg-white px-2 py-0.5 rounded-lg border border-[#EDE9FE]">
                        {currentDetails.identifierValue}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(currentDetails.identifierValue, 'identifier')}
                        className="text-slate-400 hover:text-[#7C3AED] p-0.5"
                        title="Copy"
                      >
                        {copiedField === 'identifier' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Payment Reference Code */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280]">Required Reference:</span>
                    <div className="flex items-center gap-1.5">
                      <code className="font-mono font-extrabold text-[#171717] bg-white px-2 py-0.5 rounded-lg border border-[#EDE9FE]">
                        XN-84920-P2P
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy('XN-84920-P2P', 'ref')}
                        className="text-slate-400 hover:text-[#7C3AED] p-0.5"
                        title="Copy Reference"
                      >
                        {copiedField === 'ref' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Total Fiat to Transfer */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#EDE9FE]">
                    <span className="font-bold text-[#171717]">Exact Transfer Amount:</span>
                    <span className="text-base font-black text-[#171717] font-mono">
                      ${fiatAmount} {offer.currency || 'USD'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-[#EDE9FE] text-[11px] text-[#6B7280] space-y-1">
                  <div className="font-bold text-[#171717]">💡 Transfer Tip:</div>
                  <p>{currentDetails.instructions}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('create')}
                  className="px-4 py-3 border border-[#EDE9FE] rounded-xl text-xs font-bold text-[#6B7280] hover:bg-[#F8F7FC] hover:text-[#171717] transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPaid}
                  disabled={isProcessing}
                  className="flex-1 py-3.5 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-[#16A34A] to-emerald-600 hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Verifying Settlement & Escrow Release...
                    </span>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>I Have Completed the Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUBMITTED — AWAITING ADMIN VALIDATION */}
          {step === 'done' && (
            <div className="py-8 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-[#171717]">Payment Submitted for Review</h4>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                  Admin will now verify your <strong className="text-[#6D28D9] font-bold">{activeMethod}</strong> settlement. Your <strong className="text-[#6D28D9] font-bold">+{xenaReceived} XENA</strong> will be released to your balance once the payment is validated.
                </p>
              </div>

              <div className="p-3 bg-[#F8F7FC] rounded-xl border border-[#EDE9FE] max-w-xs mx-auto text-xs text-[#6B7280] space-y-1">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="text-amber-600 font-bold">Awaiting admin validation</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Reference</span>
                  <span className="font-mono font-bold text-[#171717]">XN-84920-P2P</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
