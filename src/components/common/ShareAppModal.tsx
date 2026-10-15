import React, { useState } from 'react';
import { Share2, X, Copy, Check, ExternalLink, MessageSquare, Sparkles } from 'lucide-react';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareAppModal({ isOpen, onClose }: ShareAppModalProps) {
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'x' | 'facebook' | 'linkedin'>('x');

  if (!isOpen) return null;

  const appUrl = window.location.origin;

  const messages = {
    x: `Découvrez STREAMBOX, le lecteur multimédia universel ultime ! 🚀 Profitez de la TV en direct, de films, séries et radios en PWA ultra-rapide. 📺✨ Testez-le dès maintenant : ${appUrl} #Streaming #Tech #PWA #Streambox`,
    facebook: `🎬 Envie d'une expérience streaming complète et sans compromis ?\n\nDécouvrez STREAMBOX, votre nouveau lecteur multimédia universel ! 🌟\n\n✨ Au programme :\n📺 TV en direct & Mosaïque multi-écrans\n🍿 Films & Séries en streaming HD\n📻 Radios du monde entier\n🛡️ Sécurité & Portails intégrés\n📲 Application PWA fluide et responsive sur tous vos appareils !\n\n👉 Venez l'essayer ici : ${appUrl}\n\n#Streaming #Media #Cinema #Streambox`,
    linkedin: `🚀 Ravi de partager STREAMBOX, une application web progressive (PWA) de pointe pour le streaming multimédia universel.\n\nDéveloppée avec une architecture moderne, elle regroupe TV en direct, films, séries, radios et outils multi-écrans (mode Duo / Mosaïque) avec une expérience utilisateur fluide et immersive.\n\nDécouvrez la plateforme : ${appUrl}\n\n#WebDevelopment #React #PWA #Streaming #Innovation`
  };

  const handleCopy = (platform: 'x' | 'facebook' | 'linkedin' | 'link') => {
    let textToCopy = '';
    if (platform === 'link') {
      textToCopy = appUrl;
    } else {
      textToCopy = messages[platform];
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2500);
  };

  const handleShareDirect = (platform: 'x' | 'facebook' | 'linkedin') => {
    const text = encodeURIComponent(messages[platform]);
    const url = encodeURIComponent(appUrl);
    
    let shareUrl = '';
    if (platform === 'x') {
      shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
    } else if (platform === 'linkedin') {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=500');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Partager STREAMBOX <Sparkles className="w-4 h-4 text-cyan-400" />
              </h2>
              <p className="text-xs text-zinc-400">Partagez l'application avec vos réseaux et vos amis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Platform Tabs */}
          <div className="flex rounded-xl bg-zinc-950 p-1.5 border border-white/10 gap-1">
            <button
              onClick={() => setActiveTab('x')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'x'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>𝕏 / Twitter</span>
            </button>
            <button
              onClick={() => setActiveTab('facebook')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'facebook'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>Facebook</span>
            </button>
            <button
              onClick={() => setActiveTab('linkedin')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'linkedin'
                  ? 'bg-sky-700 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>LinkedIn</span>
            </button>
          </div>

          {/* Active Message Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Message prêt pour {activeTab === 'x' ? '𝕏 (Twitter)' : activeTab === 'facebook' ? 'Facebook' : 'LinkedIn'}
              </span>
              <button
                onClick={() => handleCopy(activeTab)}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
              >
                {copiedPlatform === activeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier le texte</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 text-sm text-zinc-200 whitespace-pre-line leading-relaxed font-sans">
              {messages[activeTab]}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleShareDirect(activeTab)}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Publier sur {activeTab === 'x' ? '𝕏' : activeTab === 'facebook' ? 'Facebook' : 'LinkedIn'}</span>
            </button>

            <button
              onClick={() => handleCopy('link')}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 transition-colors"
            >
              {copiedPlatform === 'link' ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Lien copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-zinc-400" />
                  <span>Copier le lien direct</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-950/80 border-t border-white/10 flex items-center justify-between text-xs text-zinc-500">
          <span>STREAMBOX PWA</span>
          <span>Partagez sans modération 🎬</span>
        </div>
      </div>
    </div>
  );
}
