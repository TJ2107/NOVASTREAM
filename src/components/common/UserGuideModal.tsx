import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Film, 
  Users, 
  Radio, 
  Shield, 
  Compass, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Check, 
  Play,
  Tv2
} from 'lucide-react';
import { NovaLogo } from './NovaLogo';

interface UserGuideModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function UserGuideModal({ forceOpen = false, onClose }: UserGuideModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStep(0);
      return;
    }

    const hasSeenGuide = localStorage.getItem('novastream_user_guide_seen_2026');
    if (!hasSeenGuide) {
      // Delay slightly for smooth entrance after login
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('novastream_user_guide_seen_2026', 'true');
    if (onClose) onClose();
  };

  const steps = [
    {
      title: "Bienvenue sur NOVASTREAM",
      subtitle: "Votre plateforme multimédia universelle",
      description: "Profitez d'un accès illimité à la TV en direct, au cinéma VOD, aux radios mondiales et aux salons partagés dans une interface ultra-fluide.",
      icon: Sparkles,
      color: "from-red-500 to-rose-600",
      bgGlow: "bg-red-500/20",
      highlight: "Expérience 4K & HD immersive"
    },
    {
      title: "TV en Direct & Guide EPG",
      subtitle: "Zapping instantané et grilles TV",
      description: "Explorez des centaines de chaînes TV internationales, actualités, sports et divertissements avec un guide EPG intégré et un mode Multi-Vues 4 écrans.",
      icon: Tv,
      color: "from-red-500 to-amber-500",
      bgGlow: "bg-red-500/20",
      highlight: "Multi-Vues et flux optimisés"
    },
    {
      title: "Catalogue Cinéma & Séries VOD",
      subtitle: "Vos films et séries préférés",
      description: "Parcourez des milliers de films et séries classés par genres. Reprenez votre lecture là où vous l'avez laissée avec reprise automatique et multi-pistes.",
      icon: Film,
      color: "from-purple-500 to-indigo-600",
      bgGlow: "bg-purple-500/20",
      highlight: "Synopsis, notes et streaming rapide"
    },
    {
      title: "Salons Live Watch Party & Duo",
      subtitle: "Regardez ensemble à distance",
      description: "Créez un salon privé en un clic, invitez vos proches avec un code ou lien magique, discutez dans le chat en direct et synchronisez votre lecture à la seconde près.",
      icon: Users,
      color: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/20",
      highlight: "Synchro parfaite & Chat interactif"
    },
    {
      title: "Radios, VPN & Mode TV",
      subtitle: "Tout-en-un pour votre confort",
      description: "Écoutez des milliers de radios mondiales avec visualiseur audio, activez la protection VPN intégrée et naviguez facilement avec une télécommande virtuelle ou physique.",
      icon: Radio,
      color: "from-emerald-500 to-teal-600",
      bgGlow: "bg-emerald-500/20",
      highlight: "Compatible Smart TV & Télécommandes"
    }
  ];

  if (!isOpen) return null;

  const current = steps[currentStep];
  const StepIcon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl animate-fadeIn select-none">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#E50914]/15 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl glass-strong rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <NovaLogo size="sm" showText={true} />
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-white/50">
              Étape {currentStep + 1} sur {steps.length}
            </span>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              title="Passer le guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-10 flex flex-col items-center text-center space-y-6">
          {/* Animated Icon Container */}
          <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br ${current.color} flex items-center justify-center shadow-xl shadow-red-500/15 transform hover:scale-105 transition-transform duration-300`}>
            <div className={`absolute inset-0 rounded-3xl ${current.bgGlow} blur-xl animate-pulse`} />
            <StepIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white relative z-10" />
          </div>

          {/* Title & Description */}
          <div className="space-y-2 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-[11px] font-semibold tracking-wide">
              <span>{current.highlight}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {current.title}
            </h2>
            <p className="text-sm font-medium text-[#FF5A5F]">
              {current.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed pt-1">
              {current.description}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentStep === idx 
                    ? 'w-8 bg-[#E50914]' 
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                title={`Aller à l'étape ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-5 border-t border-white/10 bg-white/[0.02]">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
              currentStep === 0 
                ? 'opacity-30 cursor-not-allowed text-white/40' 
                : 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Précédent</span>
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className="px-6 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/25 transition cursor-pointer"
            >
              <span>Suivant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-red-500/30 transition transform hover:scale-[1.02] cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Commencer à regarder</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
