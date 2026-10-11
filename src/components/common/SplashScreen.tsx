import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { NovaLogo } from './NovaLogo';

interface SplashProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashProps) {
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const taglineTimer = setTimeout(() => {
      setShowTagline(true);
    }, 4500);

    const finishTimer = setTimeout(() => {
      onComplete();
    }, 10000);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  const letters = 'NOVA STREAM'.split('');

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 bg-[#020205] flex flex-col items-center justify-center p-4 overflow-hidden select-none"
    >
      {/* Background radial glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-red-600/20 via-purple-600/20 to-cyan-600/20 blur-[120px] pointer-events-none animate-pulse" />

      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Animated Letter Contour Stream */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-3">
          {letters.map((char, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: idx * 0.12,
                duration: 0.6,
                type: 'spring',
                stiffness: 120
              }}
              className="relative text-3xl sm:text-5xl md:text-7xl font-black tracking-wider text-white uppercase font-mono px-1 py-2 group"
            >
              {/* Character text */}
              <span className="relative z-10 bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(229,9,20,0.6)]">
                {char === ' ' ? '\u00A0' : char}
              </span>

              {/* Glowing light stream tracing contour */}
              <motion.span
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
                transition={{
                  delay: idx * 0.12 + 0.2,
                  duration: 1.2,
                  ease: 'easeInOut'
                }}
                className="absolute inset-0 rounded-xl border-2 border-[#E50914] shadow-[0_0_20px_#E50914] pointer-events-none"
              />
            </motion.div>
          ))}
        </div>

        {/* Tagline Reveal */}
        <AnimatePresence>
          {showTagline && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex items-center gap-2.5 px-6 py-2.5 rounded-2xl glass-strong border border-red-500/40 shadow-[0_0_30px_rgba(229,9,20,0.4)]"
            >
              <Sparkles className="w-4 h-4 text-[#E50914] animate-spin" />
              <span className="text-sm md:text-base font-extrabold tracking-widest bg-gradient-to-r from-white via-cyan-300 to-purple-400 bg-clip-text text-transparent uppercase">
                Le futur est là
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Skip button for convenience */}
      <button
        onClick={onComplete}
        className="absolute bottom-8 right-8 px-4 py-2 rounded-xl glass text-white/50 hover:text-white text-xs font-semibold transition"
      >
        Passer →
      </button>
    </motion.div>
  );
}
