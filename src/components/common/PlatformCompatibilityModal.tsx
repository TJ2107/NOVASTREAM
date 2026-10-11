import React, { useState } from 'react';
import { Smartphone, Tv, Monitor, Apple, Globe, CheckCircle2, Download, ShieldCheck, X } from 'lucide-react';

interface PlatformCompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlatformCompatibilityModal({ isOpen, onClose }: PlatformCompatibilityModalProps) {
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'tv' | 'desktop'>('android');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111113] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF5A5F]/20 border border-[#FF5A5F]/40 flex items-center justify-center text-[#FF5A5F]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#F8F7F4]">Compatibilité Multiplateforme</h2>
              <p className="text-xs text-white/50">Guide d'installation et d'optimisation (iOS, Android, Android TV, PC/Mac, TV Connectées)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-black/40 border-b border-white/10">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'android' 
                ? 'bg-[#FF5A5F] text-white shadow-lg accent-glow' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android & Box</span>
          </button>

          <button
            onClick={() => setActiveTab('tv')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tv' 
                ? 'bg-[#FF5A5F] text-white shadow-lg accent-glow' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Android TV / Fire</span>
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ios' 
                ? 'bg-[#FF5A5F] text-white shadow-lg accent-glow' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iOS & iPadOS</span>
          </button>

          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'desktop' 
                ? 'bg-[#FF5A5F] text-white shadow-lg accent-glow' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>PC, Mac & Linux</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {activeTab === 'android' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-1 font-bold">1</div>
                <div>
                  <h3 className="font-bold text-sm text-[#F8F7F4]">Installation PWA Native sur Android</h3>
                  <p className="text-xs text-white/60 mt-1">
                    Ouvrez l'application dans <strong>Google Chrome</strong> sur votre smartphone ou tablette Android. Appuyez sur le menu (trois points en haut à droite) puis sélectionnez <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-1 font-bold">2</div>
                <div>
                  <h3 className="font-bold text-sm text-[#F8F7F4]">Fonctionnalités & Optimisations Android</h3>
                  <ul className="text-xs text-white/60 mt-1 space-y-1 list-disc list-inside">
                    <li>Mode plein écran immersif sans barres de navigation.</li>
                    <li>Support matériel complet HLS.js pour les flux vidéo en direct et VOD.</li>
                    <li>Gestion du proxy de flux intégré pour contourner les blocages CORS et HTTP non sécurisés.</li>
                    <li>Mode hors-ligne et cache persistant pour vos listes et favoris.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tv' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-[#FF5A5F]/20 text-[#FF5A5F] flex items-center justify-center flex-shrink-0 mt-1 font-bold">TV</div>
                <div>
                  <h3 className="font-bold text-sm text-[#F8F7F4]">Optimisé pour Android TV, Box IPTV & Fire TV</h3>
                  <p className="text-xs text-white/60 mt-1">
                    NOVASTREAM intègre un <strong>Mode Télécommande (Smart TV)</strong> complet permettant une navigation fluide à l'aide des flèches directionnelles (D-pad) et du bouton Entrée de votre télécommande.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <h4 className="text-xs font-bold text-[#FF5A5F] uppercase tracking-wider mb-2">Comment l'utiliser sur TV ?</h4>
                  <ul className="text-xs text-white/70 space-y-2">
                    <li>• Activez le <strong>Mode TV</strong> depuis le menu latéral de l'application.</li>
                    <li>• Utilisez le navigateur intégré de votre Box Android ou installez l'APK en PWA.</li>
                    <li>• Contrôlez le volume, les chaînes et les menus uniquement avec la télécommande.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <h4 className="text-xs font-bold text-[#FF5A5F] uppercase tracking-wider mb-2">Autres TV (Tizen / WebOS)</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Sur les Smart TV Samsung (Tizen) ou LG (WebOS), accédez à l'URL de l'application via le navigateur natif de la TV et ajoutez-la aux signets pour un accès rapide plein écran.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-1 font-bold">iOS</div>
                <div>
                  <h3 className="font-bold text-sm text-[#F8F7F4]">Installation sur iPhone et iPad (Safari)</h3>
                  <p className="text-xs text-white/60 mt-1">
                    Sur iOS, l'installation se fait obligatoirement via le navigateur <strong>Safari</strong> :
                  </p>
                  <ol className="text-xs text-white/70 mt-2 space-y-1 list-decimal list-inside">
                    <li>Ouvrez NOVASTREAM dans <strong>Safari</strong>.</li>
                    <li>Appuyez sur le bouton <strong>Partager</strong> <span className="font-bold">⎋</span> dans la barre inférieure.</li>
                    <li>Faites défiler et sélectionnez <strong>"Sur l'écran d'accueil"</strong>.</li>
                    <li>Confirmez en appuyant sur <strong>Ajouter</strong>.</li>
                  </ol>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Gestion des encoches & Safe Areas</h4>
                <p className="text-xs text-white/60">
                  L'interface s'adapte automatiquement aux encoches (Dynamic Island) et barres de gestes iOS grâce aux marges de sécurité intégrées (`viewport-fit=cover`).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-1 font-bold">PC</div>
                <div>
                  <h3 className="font-bold text-sm text-[#F8F7F4]">Windows, macOS & Linux (Chrome / Edge / Firefox)</h3>
                  <p className="text-xs text-white/60 mt-1">
                    Cliquez sur l'icône d'installation dans la barre d'adresse de votre navigateur (Chrome ou Edge) ou utilisez le bouton d'installation de la barre latérale pour installer NOVASTREAM comme application de bureau dédiée.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Raccourcis Clavier</h4>
                  <ul className="text-xs text-white/70 space-y-1.5 font-mono">
                    <li><kbd className="px-1.5 py-0.5 rounded bg-white/10">Espace</kbd> : Lecture / Pause</li>
                    <li><kbd className="px-1.5 py-0.5 rounded bg-white/10">F</kbd> : Plein écran</li>
                    <li><kbd className="px-1.5 py-0.5 rounded bg-white/10">M</kbd> : Muet / Audio</li>
                    <li><kbd className="px-1.5 py-0.5 rounded bg-white/10">Échap</kbd> : Fermer / Retour</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Compatibilité Universelle</h4>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Aucune installation lourde requise. NOVASTREAM fonctionne instantanément sur tous les navigateurs modernes grâce à son architecture PWA et ses proxys de flux intégrés.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Tous systèmes supportés</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#E50914] text-white font-bold text-xs hover:bg-[#F40612] transition-all shadow-lg shadow-red-950/40"
          >
            J'ai compris
          </button>
        </div>

      </div>
    </div>
  );
}
