import React from 'react';
import { X, Bell, Check, ShieldCheck, Sparkles, ArrowRight, Trash2 } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs animate-fade-in" id="notifications-drawer">
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-[#EDE9FE] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EDE9FE] bg-[#F8F7FC]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-white flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#171717] text-base">Notifications</h3>
              <p className="text-[11px] text-[#6B7280]">Account updates & market signals</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#171717] hover:bg-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-[#EDE9FE] bg-white text-xs">
          <button
            onClick={onMarkAllRead}
            className="text-[#6D28D9] hover:underline font-semibold flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
          <button
            onClick={onClearAll}
            className="text-[#6B7280] hover:text-[#DC2626] font-medium flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </button>
        </div>

        {/* Notification Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-xl border transition-all ${
                notif.read
                  ? 'bg-white border-[#EDE9FE] opacity-80'
                  : 'bg-[#F8F7FC] border-purple-200/80 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-[#171717] leading-snug">{notif.title}</h4>
                <span className="text-[10px] text-[#6B7280] whitespace-nowrap">{notif.timestamp}</span>
              </div>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{notif.message}</p>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="py-12 text-center text-xs text-[#6B7280]">
              <Sparkles className="w-8 h-8 text-[#DDD6FE] mx-auto mb-2" />
              You're all caught up! No active notifications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
