import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Tv, Film, Radio, Users } from 'lucide-react';
import { NovaLogo } from './NovaLogo';

interface SplashProps {
  onComplete: () => void;
  isInitializing?: boolean;
}

export function SplashScreen({ onComplete, isInitializing }: SplashProps) {
  const [showTagline, setShowTagline] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Unfold tagline message
    const taglineTimer = setTimeout(() => {
      setShowTagline(true);
    }, 1000);

    // Unfold feature badges
    const badgesTimer = setTimeout(() => {
      setShowBadges(true);
    }, 1800);

    // Complete splash automatically after 8.8s (3.8s + 5s extra)
    const finishTimer = setTimeout(() => {
      onCompleteRef.current?.();
    }, 8800);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(badgesTimer);
      clearTimeout(finishTimer);
    };
  }, []); // Run ONCE on mount so timers are NEVER reset by parent re-renders!

  const wordNova = 'NOVA'.split('');
  const wordStream = 'STREAM'.split('');

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 bg-[#020205] flex flex-col items-center justify-center p-3 sm:p-6 overflow-hidden select-none cursor-pointer"
      onClick={() => onCompleteRef.current?.()}
    >
      {/* Background radial glow & atmosphere */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#E50914]/25 via-purple-700/15 to-cyan-500/10 blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:28px_28px] opacity-30" />

      <div className="relative z-10 flex flex-col items-center space-y-4 sm:space-y-6 max-w-lg w-full text-center">
        {/* Animated Central Emblem */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-red-600/30 to-purple-600/30 rounded-3xl blur-xl animate-pulse" />
          <NovaLogo size="xl" showText={false} animated={true} />
        </motion.div>

        {/* Title NOVA STREAM - Unfolding letter by letter */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-6 gap-y-1">
          {/* Word NOVA */}
          <div className="flex items-center">
            {wordNova.map((char, idx) => (
              <motion.span
                key={`nova-${idx}`}
                initial={{ opacity: 0, y: 22, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.15 + idx * 0.08,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="text-3xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white font-mono px-0.5 sm:px-1 inline-block drop-shadow-[0_0_25px_rgba(229,9,20,0.6)]"
              >
                {char}
              </motion.span>
            ))}
          </div>

          {/* Word STREAM */}
          <div className="flex items-center">
            {wordStream.map((char, idx) => (
              <motion.span
                key={`stream-${idx}`}
                initial={{ opacity: 0, y: 22, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.5 + idx * 0.08,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="text-3xl sm:text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-red-100 to-[#FF5A5F] font-mono px-0.5 sm:px-1 inline-block drop-shadow-[0_0_30px_rgba(229,9,20,0.8)]"
              >
                {char}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Luminous Neon Beam expanding under the title */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.7, ease: 'easeOut' }}
          className="w-36 sm:w-72 h-[2px] bg-gradient-to-r from-transparent via-[#E50914] to-transparent shadow-[0_0_15px_#E50914]"
        />

        {/* Slogan Message Unfolding: « Le numérique autrement dans la télé » */}
        <div className="min-h-12 flex items-center justify-center">
          <AnimatePresence>
            {showTagline && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-2xl glass-strong border border-red-500/40 shadow-[0_0_30px_rgba(229,9,20,0.35)] max-w-[92vw] text-center"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF5A5F] animate-spin flex-shrink-0" />
                <span className="text-[11px] sm:text-base font-extrabold tracking-wide sm:tracking-widest bg-gradient-to-r from-white via-cyan-200 to-purple-300 bg-clip-text text-transparent uppercase leading-snug">
                  Le numérique autrement dans la télé
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feature Pill tags unfolding */}
        <AnimatePresence>
          {showBadges && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 text-[10px] sm:text-[11px] text-white/60 font-medium px-2"
            >
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                <Tv className="w-3 h-3 text-[#FF5A5F]" /> Direct
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                <Film className="w-3 h-3 text-amber-400" /> Cinéma 4K
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                <Radio className="w-3 h-3 text-cyan-400" /> Radios
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                <Users className="w-3 h-3 text-purple-400" /> Watch Party
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar Loader */}
        <div className="w-40 sm:w-64 h-1 rounded-full bg-white/10 overflow-hidden mt-3 relative">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 8.7, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-[#E50914] via-amber-400 to-[#FF5A5F] shadow-[0_0_12px_#E50914]"
          />
        </div>
      </div>

      {/* Tap anywhere or skip button for instant access */}
      <div className="absolute bottom-4 left-0 right-0 px-4 flex items-center justify-between pointer-events-auto">
        <span className="text-[10px] sm:text-xs text-white/40 font-mono">
          Toucher l'écran pour passer
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCompleteRef.current?.();
          }}
          className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold transition shadow-lg cursor-pointer flex items-center gap-1.5 active:scale-95"
        >
          <span>Passer</span>
          <span>→</span>
        </button>
      </div>
    </motion.div>
  );
}
