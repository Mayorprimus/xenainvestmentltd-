import React from 'react';

interface XenaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const XenaLogo: React.FC<XenaLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-lg', dot: 'w-1.5 h-1.5' },
    md: { box: 'w-9 h-9', icon: 'w-5 h-5', text: 'text-xl', dot: 'w-2 h-2' },
    lg: { box: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-2xl', dot: 'w-2.5 h-2.5' },
    xl: { box: 'w-16 h-16', icon: 'w-9 h-9', text: 'text-3xl', dot: 'w-3 h-3' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`} id="xena-brand-logo">
      <div
        className={`relative ${currentSize.box} rounded-xl bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#A855F7] p-0.5 shadow-[0_4px_16px_rgba(109,40,217,0.35)] flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-105`}
      >
        {/* Inner subtle glow */}
        <div className="w-full h-full rounded-[10px] bg-gradient-to-tr from-[#5B21B6] to-[#8B5CF6] flex items-center justify-center relative overflow-hidden">
          {/* Subtle light reflection overlay */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-[10px] pointer-events-none" />
          
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`${currentSize.icon} text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]`}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Elegant XENA 'X' with diamond core & nodes */}
            <path
              d="M5 4.5L10.2 12L5 19.5H8.2L12 14.1L15.8 19.5H19L13.8 12L19 4.5H15.8L12 9.9L8.2 4.5H5Z"
              fill="currentColor"
            />
            <circle cx="12" cy="12" r="1.8" fill="#F8F7FC" />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex items-baseline tracking-tight">
          <span className={`font-extrabold ${currentSize.text} tracking-wider bg-gradient-to-r from-[#171717] via-[#2E1065] to-[#6D28D9] bg-clip-text text-transparent`}>
            XENA
          </span>
          <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-[#7C3AED] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100/80">
            PRO
          </span>
        </div>
      )}
    </div>
  );
};

export const XenaTokenBadge: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#A855F7] p-[2px] shadow-[0_4px_14px_rgba(109,40,217,0.3)] inline-flex items-center justify-center flex-shrink-0 relative overflow-hidden ${className}`}
    >
      <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#5B21B6] to-[#8B5CF6] flex items-center justify-center relative">
        <div className="absolute inset-0 bg-radial from-white/30 to-transparent pointer-events-none rounded-full" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          style={{ width: size * 0.55, height: size * 0.55 }}
          className="text-white drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 4.5L10.2 12L5 19.5H8.2L12 14.1L15.8 19.5H19L13.8 12L19 4.5H15.8L12 9.9L8.2 4.5H5Z"
            fill="currentColor"
          />
          <circle cx="12" cy="12" r="1.7" fill="#FFFFFF" />
        </svg>
      </div>
    </div>
  );
};
