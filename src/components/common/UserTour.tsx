import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Shield, Users, Play, ChevronRight, ChevronLeft, X, Sparkles, Rocket } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightTarget?: string;
}

const STEPS: TourStep[] = [
  {
    title: "Bienvenue sur StreamBox",
    description: "Votre lecteur multimédia universel nouvelle génération pour la TV en direct, les films VOD, les séries et les radios mondiales.",
    icon: <Sparkles className="w-8 h-8 text-[#E50914]" />
  },
  {
    title: "Navigation & Sidebar",
    description: "Utilisez la barre latérale à gauche (ou le menu mobile) pour explorer instantanément vos chaînes favorites, films, portails TV et réglages.",
    icon: <Compass className="w-8 h-8 text-blue-500" />
  },
  {
    title: "Sécurité & VPN Suisse",
    description: "StreamBox intègre un tunnel VPN chiffré (Bunker Suisse) pour protéger votre vie privée, contourner les restrictions et stabiliser vos flux.",
    icon: <Shield className="w-8 h-8 text-emerald-500" />
  },
  {
    title: "Duo Watch Party",
    description: "Regardez vos films et matchs en direct synchronisés avec vos amis en temps réel grâce au mode Duo et au chat intégré.",
    icon: <Users className="w-8 h-8 text-purple-500" />
  },
  {
    title: "Lecteur & Cast",
    description: "Profitez d'un lecteur HLS/Dash ultra-rapide avec égaliseur audio, multi-pistes, et diffusion Cast sur votre téléviseur.",
    icon: <Rocket className="w-8 h-8 text-amber-500" />
  }
];

export const UserTour: React.FC = () => {
  const { hasSeenTour, setHasSeenTour } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);

  if (hasSeenTour) {
    return null;
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setHasSeenTour(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setHasSeenTour(true);
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-lg glass-strong border border-white/15 rounded-2xl p-6 shadow-2xl bg-[#0c0c14]/95 text-white overflow-hidden"
      >
        {/* Glow background accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#E50914]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30">
              Étape {currentStep + 1} sur {STEPS.length}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-white/50 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            title="Passer le tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center text-center py-4 relative z-10"
          >
            <div className="w-16 h-16 rounded-2xl glass border border-white/10 flex items-center justify-center mb-5 shadow-lg bg-white/5">
              {step.icon}
            </div>

            <h3 className="text-2xl font-bold mb-3 tracking-tight">{step.title}</h3>
            <p className="text-sm text-white/70 leading-relaxed max-w-md">{step.description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-1.5 my-6">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep ? 'w-8 bg-[#E50914]' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              currentStep === 0
                ? 'opacity-40 cursor-not-allowed text-white/40'
                : 'hover:bg-white/10 text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              Passer
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#E50914] hover:bg-[#b80710] text-white shadow-lg shadow-[#E50914]/30 transition-all transform hover:scale-[1.02]"
            >
              {currentStep === STEPS.length - 1 ? 'Commencer' : 'Suivant'}
              {currentStep < STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
