import React from 'react';

interface XenaTokenIllustrationProps {
  variant?: 'banner' | 'announcement' | 'compact';
  className?: string;
}

export const XenaTokenIllustration: React.FC<XenaTokenIllustrationProps> = ({
  variant = 'announcement',
  className = '',
}) => {
  if (variant === 'banner') {
    return (
      <div className={`relative w-full max-w-[280px] h-[190px] flex items-center justify-center ${className}`}>
        {/* Ambient radial glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-400/30 to-violet-200/20 blur-2xl rounded-full scale-110 pointer-events-none" />

        <svg
          viewBox="0 0 280 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-2xl overflow-visible"
        >
          <defs>
            {/* 3D Coin Gradients */}
            <linearGradient id="bannerCoinBody" x1="40" y1="20" x2="220" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#DDD6FE" />
              <stop offset="65%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#4C1D95" />
            </linearGradient>

            <linearGradient id="bannerCoinRim" x1="140" y1="20" x2="140" y2="170" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#C4B5FD" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#5B21B6" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="bannerOrbGrad1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>

            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Orbiting halo rings */}
          <ellipse
            cx="140"
            cy="105"
            rx="110"
            ry="45"
            stroke="url(#bannerCoinRim)"
            strokeWidth="1.5"
            strokeDasharray="6 8"
            className="animate-pulse"
            opacity="0.6"
          />

          <ellipse
            cx="140"
            cy="105"
            rx="85"
            ry="32"
            stroke="#DDD6FE"
            strokeWidth="1"
            opacity="0.4"
          />

          {/* Background Floating Nodes */}
          <g className="animate-bounce" style={{ animationDuration: '4s' }}>
            <circle cx="50" cy="55" r="14" fill="url(#bannerOrbGrad1)" opacity="0.85" />
            <circle cx="48" cy="52" r="4" fill="#FFFFFF" opacity="0.8" />
          </g>

          <g className="animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '1s' }}>
            <circle cx="235" cy="140" r="11" fill="url(#bannerOrbGrad1)" opacity="0.8" />
            <circle cx="233" cy="138" r="3" fill="#FFFFFF" opacity="0.7" />
          </g>

          <circle cx="215" cy="45" r="6" fill="#F3E8FF" opacity="0.7" />
          <circle cx="65" cy="155" r="7" fill="#E9D5FF" opacity="0.6" />

          {/* Main 3D XENA Coin */}
          <g transform="translate(140, 100) scale(1)">
            {/* Depth / Extrusion Layer */}
            <path
              d="M -50 -10 C -50 25, 50 25, 50 -10 L 50 6 C 50 41, -50 41, -50 6 Z"
              fill="#4C1D95"
              opacity="0.9"
            />
            <path
              d="M -50 0 C -50 30, 50 30, 50 0 L 50 14 C 50 44, -50 44, -50 14 Z"
              fill="#3B0764"
              opacity="0.7"
            />

            {/* Front Coin Face */}
            <ellipse cx="0" cy="-5" rx="52" ry="34" fill="url(#bannerCoinBody)" />
            <ellipse cx="0" cy="-5" rx="46" ry="29" fill="url(#bannerCoinRim)" opacity="0.4" />
            <ellipse cx="0" cy="-5" rx="43" ry="27" fill="#6D28D9" />

            {/* Inscribed XENA Emblem */}
            <path
              d="M -16 -17 L -4 -5 L -16 7 H -8 L 0 -1 L 8 7 H 16 L 4 -5 L 16 -17 H 8 L 0 -9 L -8 -17 Z"
              fill="#FFFFFF"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
            />
            <circle cx="0" cy="-5" r="3.2" fill="#DDD6FE" />

            {/* Highlight Sparkles */}
            <polygon points="-28,-22 -24,-24 -20,-22 -24,-20" fill="#FFFFFF" opacity="0.9" />
            <polygon points="26,10 29,8 32,10 29,12" fill="#FFFFFF" opacity="0.8" />
          </g>
        </svg>
      </div>
    );
  }

  // Announcement card illustration: Clean, crisp, isometric token with verified shield & speed accents
  return (
    <div className={`relative w-full max-w-[210px] h-[150px] flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-200/40 via-violet-100/30 to-transparent blur-xl rounded-full" />
      <svg
        viewBox="0 0 210 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="annCoinFace" x1="30" y1="20" x2="160" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#5B21B6" />
          </linearGradient>
          <linearGradient id="annCardGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EDE9FE" />
            <stop offset="100%" stopColor="#F5F3FF" />
          </linearGradient>
          <linearGradient id="annShieldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Ambient floating cards */}
        <rect
          x="115"
          y="25"
          width="70"
          height="45"
          rx="10"
          fill="url(#annCardGrad)"
          stroke="#DDD6FE"
          strokeWidth="1.5"
          transform="rotate(12 115 25)"
          className="drop-shadow-md"
        />
        <line x1="125" y1="42" x2="155" y2="48" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" transform="rotate(12 115 25)" />
        <line x1="125" y1="52" x2="145" y2="56" stroke="#C4B5FD" strokeWidth="2.5" strokeLinecap="round" transform="rotate(12 115 25)" />

        {/* Main Floating XENA Coin */}
        <g transform="translate(75, 75)">
          {/* Outer glow aura */}
          <circle cx="0" cy="0" r="44" fill="#EDE9FE" opacity="0.6" />
          <circle cx="0" cy="0" r="38" fill="url(#annCoinFace)" className="drop-shadow-lg" />
          
          {/* Inner ring */}
          <circle cx="0" cy="0" r="32" stroke="#C4B5FD" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />

          {/* Logo symbol */}
          <path
            d="M -14 -14 L -4 -3 L -14 8 H -7 L 0 0 L 7 8 H 14 L 4 -3 L 14 -14 H 7 L 0 -6 L -7 -14 Z"
            fill="#FFFFFF"
            filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
          />
          <circle cx="0" cy="-3" r="2.5" fill="#FDF4FF" />
        </g>

        {/* Floating P2P Verified Badge */}
        <g transform="translate(145, 95)" className="drop-shadow-md">
          <circle cx="0" cy="0" r="16" fill="#16A34A" />
          <path
            d="M -5 -0.5 L -1.5 3 L 5 -3.5"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Sparkles */}
        <path d="M 28 35 L 31 39 L 35 42 L 31 45 L 28 49 L 25 45 L 21 42 L 25 39 Z" fill="#7C3AED" opacity="0.7" />
        <circle cx="180" cy="20" r="3" fill="#A855F7" opacity="0.8" />
      </svg>
    </div>
  );
};
