import React, { useState } from 'react';
import { Users, CheckCircle, ShieldCheck, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { P2POffer } from '../types';

interface P2PPreviewProps {
  offers: P2POffer[];
  onSelectOffer: (offer: P2POffer) => void;
  onExploreAll?: () => void;
}

export const P2PPreview: React.FC<P2PPreviewProps> = ({
  offers,
  onSelectOffer,
  onExploreAll,
}) => {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

  return (
    <section className="py-2" id="p2p-preview-section">
      <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-5 shadow-sm">
        {/* Title & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EDE9FE]">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-sm font-bold text-[#171717]">
                XENA P2P Marketplace
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#16A34A] text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Escrow Protected
              </span>
            </div>
            <p className="text-xs text-[#6B7280]">
              Buy and sell XENA directly with verified local merchants
            </p>
          </div>

          {/* Trade Type Switcher & View All */}
          <div className="flex items-center gap-2">
            <div className="flex bg-[#F8F7FC] p-0.5 rounded-lg border border-[#EDE9FE]">
              <button
                onClick={() => setTradeType('BUY')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  tradeType === 'BUY'
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#171717]'
                }`}
              >
                Buy XENA
              </button>
              <button
                onClick={() => setTradeType('SELL')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  tradeType === 'SELL'
                    ? 'bg-gradient-to-r from-[#E11D48] to-[#F97316] text-white shadow-sm shadow-rose-200/60'
                    : 'text-[#6B7280] hover:text-[#171717]'
                }`}
              >
                Sell XENA
              </button>
            </div>
          </div>
        </div>

        {/* Offers list */}
        <div className="mt-4 space-y-2.5">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#EDE9FE] hover:border-purple-300 hover:bg-white transition-all grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
            >
              {/* Merchant Info */}
              <div className="sm:col-span-4 flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-[#6D28D9] font-bold text-xs flex items-center justify-center border border-purple-200">
                    {offer.merchantName.charAt(0)}
                  </div>
                  {offer.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#16A34A] ring-1 ring-white"></span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-xs text-[#171717]">
                      {offer.merchantName}
                    </span>
                    <CheckCircle className="w-3 h-3 text-[#16A34A]" />
                  </div>
                  <div className="text-[10px] text-[#6B7280]">
                    {offer.completedOrders} orders · <span className="text-[#16A34A] font-semibold">{offer.completionRate}% completion</span>
                  </div>
                </div>
              </div>

              {/* Price & Limits */}
              <div className="sm:col-span-5 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#6B7280] block">Unit Price</span>
                  <span className="font-bold text-xs text-[#6D28D9] font-mono">
                    ${offer.pricePerXena.toFixed(4)}{' '}
                    <span className="text-[9px] text-[#6B7280] font-sans">USD</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B7280] block">Trade Limit</span>
                  <span className="font-semibold text-[11px] text-[#171717]">
                    ${offer.minLimit} - ${offer.maxLimit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Button: Purple Buy XENA */}
              <div className="sm:col-span-3 flex justify-end">
                <button
                  onClick={() => onSelectOffer(offer)}
                  className="w-full sm:w-auto py-1.5 px-4 rounded-full font-bold text-xs text-white bg-gradient-to-r from-[#7C3AED] to-[#DB2777] hover:shadow-md hover:shadow-fuchsia-200/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>{tradeType === 'BUY' ? 'Buy XENA' : 'Sell XENA'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
