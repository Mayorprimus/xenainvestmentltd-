import React from 'react';
import { Bell, Sparkles, ShieldCheck, Tag, ArrowRight, ExternalLink, Calendar } from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementsPageProps {
  onExploreP2P: () => void;
  onExploreStaking: () => void;
  announcements: Announcement[];
}

export const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({
  onExploreP2P,
  onExploreStaking,
  announcements,
}) => {
  const mapped = announcements.map((ann) => ({
    id: ann.id,
    title: ann.title,
    date: ann.date,
    tag: ann.tag || 'Update',
    tagColor: ann.tagColor || 'bg-purple-50 text-[#6D28D9] border-purple-100',
    summary: ann.summary,
    actionText: ann.actionText || 'Read More',
    onAction: ann.actionId === 'p2p' ? onExploreP2P : ann.actionId === 'staking' ? onExploreStaking : () => {},
  }));

  return (
    <div className="space-y-4 sm:space-y-8 animate-fade-in" id="announcements-page-view">
      {/* Header */}
      <div className="bg-white border border-[#EDE9FE] rounded-[24px] p-6 sm:p-8 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#6D28D9] text-xs font-bold border border-purple-100 mb-2">
          <Bell className="w-3.5 h-3.5" />
          <span>Official Announcements & System Updates</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
          News, Events & Protocol Updates
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
          Stay informed about the latest platform campaigns, token listings, staking reward expansions, and technical upgrades.
        </p>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {mapped.map((ann) => (
          <div
            key={ann.id}
            className="bg-white border border-[#EDE9FE] rounded-[24px] p-6 shadow-sm hover:border-purple-200 transition-all space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${ann.tagColor}`}>
                  {ann.tag}
                </span>
                <span className="text-xs text-[#6B7280] flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {ann.date}
                </span>
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-[#171717]">
              {ann.title}
            </h2>

            <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
              {ann.summary}
            </p>

            <div className="pt-2">
              <button
                onClick={ann.onAction}
                className="px-4 py-2 rounded-xl bg-[#F8F7FC] hover:bg-purple-50 text-[#6D28D9] font-bold text-xs border border-[#EDE9FE] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{ann.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
