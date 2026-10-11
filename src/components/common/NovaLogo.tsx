import React from 'react';

interface NovaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export function NovaLogo({
  size = 'md',
  showText = false,
  animated = true,
  className = '',
  onClick
}: NovaLogoProps) {
  const sizeMap = {
    xs: { box: 'w-6 h-6', text: 'text-sm', subText: 'text-[8px]', starScale: 0.6 },
    sm: { box: 'w-8 h-8', text: 'text-base', subText: 'text-[9px]', starScale: 0.8 },
    md: { box: 'w-10 h-10', text: 'text-lg', subText: 'text-[10px]', starScale: 1 },
    lg: { box: 'w-14 h-14', text: 'text-2xl', subText: 'text-[11px]', starScale: 1.25 },
    xl: { box: 'w-20 h-20', text: 'text-3xl md:text-4xl', subText: 'text-xs', starScale: 1.6 }
  };

  const currentSize = sizeMap[size];

  return (
    <div 
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Vector Glyph Emblem */}
      <div
        className={`relative ${currentSize.box} rounded-xl bg-gradient-to-br from-[#1c0507] via-[#0a0a0b] to-[#000000] border border-white/15 p-1 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-950/40 group overflow-hidden transition-all duration-300 hover:border-red-500/40 hover:shadow-red-900/50`}
      >
        {/* Ambient background bloom */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity"
          style={{
            background: 'radial-gradient(circle at 50% 40%, rgba(229, 9, 20, 0.45) 0%, transparent 70%)'
          }}
        />

        <svg
          viewBox="0 0 100 100"
          className="w-full h-full object-contain relative z-10 drop-shadow-[0_2px_8px_rgba(229,9,20,0.4)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="novaRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF3342" />
              <stop offset="50%" stopColor="#E50914" />
              <stop offset="100%" stopColor="#800208" />
            </linearGradient>

            <linearGradient id="novaWhiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#E5E5EA" />
              <stop offset="100%" stopColor="#9E9EA7" />
            </linearGradient>

            <filter id="novaGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Stylized N: Left Titanium Pillar */}
          <rect x="20" y="24" width="13" height="52" rx="4" fill="url(#novaWhiteGrad)" />

          {/* Dynamic Diagonal Cinema Red Beam with Play slant */}
          <path
            d="M30 25 L65 74 C67 76.5 70 76.5 72 74 L73 72 C74.5 70 74 67.5 72 65 L37 16 C35 13.5 32 13.5 30 16 Z"
            fill="url(#novaRedGrad)"
            filter="url(#novaGlow)"
          />

          {/* Stylized N: Right Titanium Pillar */}
          <rect x="67" y="24" width="13" height="52" rx="4" fill="url(#novaWhiteGrad)" />

          {/* Embedded Central Cinema Play Triangle */}
          <polygon 
            points="46,41 63,50 46,59" 
            fill="#E50914" 
            stroke="#FFFFFF" 
            strokeWidth="2" 
            strokeLinejoin="round" 
          />

          {/* Radiant Nova Cosmic Starburst Flare */}
          <g transform="translate(82, 18)" className={animated ? 'animate-pulse' : ''}>
            <path
              d="M0 -9 Q1 -2 9 0 Q1 2 0 9 Q-1 2 -9 0 Q-1 -2 0 -9 Z"
              fill="#FFFFFF"
            />
            <circle cx="0" cy="0" r="1.5" fill="#E50914" />
          </g>
        </svg>
      </div>

      {/* Optional Wordmark */}
      {showText && (
        <div className="flex flex-col leading-none min-w-0">
          <div className="flex items-center gap-1">
            <span className={`font-black tracking-tight text-white ${currentSize.text} drop-shadow`}>
              NOVA
            </span>
            <span className={`font-black tracking-tight text-[#E50914] ${currentSize.text} drop-shadow`}>
              STREAM
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-ping ml-0.5 inline-block" />
          </div>
          <span className={`${currentSize.subText} font-mono tracking-widest text-[#A1A1A6] uppercase mt-0.5 font-medium`}>
            OLED CINEMA HUB
          </span>
        </div>
      )}
    </div>
  );
}
