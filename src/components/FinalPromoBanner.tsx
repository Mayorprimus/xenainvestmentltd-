import React from 'react';
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { XenaTokenIllustration } from './XenaTokenIllustration';

interface FinalPromoBannerProps {
  onExplore: () => void;
}

export const FinalPromoBanner: React.FC<FinalPromoBannerProps> = ({ onExplore }) => {
  return (
    <section className="py-2" id="final-promotional-banner">
      <div className="w-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-purple-200">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">Invest. Trade. Grow.</h3>
          <p className="text-xs text-purple-100 mb-0 leading-relaxed">
            Everything you need to manage your XENA assets in one place with zero escrow fees.
          </p>
        </div>
        <button
          onClick={onExplore}
          className="bg-white text-[#6D28D9] text-xs font-bold px-6 py-2.5 rounded-full hover:bg-purple-50 hover:scale-[1.02] transition-all shadow-sm shrink-0 cursor-pointer"
        >
          Explore Xena Dashboard
        </button>
      </div>
    </section>
  );
};
