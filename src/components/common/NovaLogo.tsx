import React, { useState } from 'react';

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
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    xs: { box: 'w-6 h-6', text: 'text-sm', subText: 'text-[8px]' },
    sm: { box: 'w-8 h-8', text: 'text-base', subText: 'text-[9px]' },
    md: { box: 'w-10 h-10', text: 'text-lg', subText: 'text-[10px]' },
    lg: { box: 'w-14 h-14', text: 'text-2xl', subText: 'text-[11px]' },
    xl: { box: 'w-20 h-20 sm:w-24 sm:h-24', text: 'text-3xl md:text-4xl', subText: 'text-xs' }
  };

  const currentSize = sizeMap[size];

  return (
    <div 
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Official Master Logo Image Container */}
      <div
        className={`relative ${currentSize.box} rounded-2xl flex items-center justify-center flex-shrink-0 group overflow-hidden transition-all duration-300 drop-shadow-[0_4px_16px_rgba(229,9,20,0.35)]`}
      >
        {!imgError ? (
          <img
            src="/NOVOSTREAM.png"
            alt="NOVASTREAM Logo"
            className={`w-full h-full object-contain rounded-2xl select-none ${animated ? 'transition-transform duration-300 group-hover:scale-105' : ''}`}
            onError={() => setImgError(true)}
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-red-600 to-black p-1 flex items-center justify-center font-black text-white text-xs">
            N
          </div>
        )}
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
