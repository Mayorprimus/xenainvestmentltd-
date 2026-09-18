import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Users } from 'lucide-react';
import { XenaTokenIllustration } from './XenaTokenIllustration';

interface AnnouncementCardProps {
  onExploreP2P: () => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ onExploreP2P }) => {
  return (
    <section className="py-2" id="announcement-card-section">
      <div className="bg-white border border-[#EDE9FE] p-6 rounded-[24px] flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
        <div className="max-w-md w-full">
          <span className="inline-block text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-2">
            ✨ New on Xena
          </span>
          <h3 className="text-lg font-bold text-[#171717] mb-1">
            P2P trading is now available
          </h3>
          <p className="text-xs text-[#6B7280] mb-4 leading-relaxed">
            Buy and sell XENA directly with verified users safely and securely with zero escrow fees and instant settlement.
          </p>
          <button
            onClick={onExploreP2P}
            className="bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-1.5 hover:opacity-95 hover:scale-[1.02] transition-all cursor-pointer shadow-md shadow-fuchsia-200/60"
          >
            <span>Explore P2P</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3D Glass graphic badge per Clean Utility design */}
        <div className="w-36 h-28 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-purple-200 shrink-0">
          <div className="w-24 h-18 bg-white/20 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center border border-white/30 text-white">
            <Users className="w-5 h-5 mb-0.5" />
            <span className="font-bold text-sm tracking-wide">P2P</span>
          </div>
        </div>
      </div>
    </section>
  );
};
