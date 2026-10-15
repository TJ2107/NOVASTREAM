import React, { useState } from 'react';
import { 
  Shield, 
  Tv, 
  Film, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Radio, 
  ArrowRight,
  Flame,
  X,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { NovaLogo } from '../common/NovaLogo';

export function AuthGate() {
  const { signInWithGoogle } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('La fenêtre de connexion Google a été fermée avant la finalisation.');
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('La fenêtre contextuelle de connexion a été bloquée par votre navigateur. Veuillez autoriser les popups pour ce site.');
      } else if (err?.code === 'auth/network-request-failed') {
        setErrorMessage('Erreur réseau. Veuillez vérifier votre connexion Internet et réessayer.');
      } else {
        setErrorMessage(err?.message || 'Échec de la connexion avec Google. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (type: 'privacy' | 'terms') => {
    const url = `${window.location.origin}/#${type}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(type);
      setTimeout(() => setCopiedLink(null), 3000);
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#04040a] relative overflow-hidden text-white select-none">
      {/* Dynamic Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#E50914]/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[180px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-xl mx-auto space-y-6">
        {/* Main Card */}
        <div className="glass-strong rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl backdrop-blur-2xl text-center space-y-6 relative overflow-hidden">
          {/* Top subtle glow line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E50914] to-transparent" />

          {/* Logo & Status Badge */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <NovaLogo size="lg" showText={true} />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-[#FF5A5F] text-[11px] font-semibold tracking-wide uppercase">
              <Lock className="w-3.5 h-3.5" />
              <span>Authentification Google requise</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bienvenue sur NOVASTREAM
            </h1>
            <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto leading-relaxed">
              Pour accéder à l'application, regarder les chaînes en direct, les films et participer aux salons Live Watch Party, vous devez être connecté avec votre compte Google.
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-left pt-2">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-red-500/20 text-[#FF5A5F] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Tv className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">TV & Radios HD</span>
                <span className="text-[10px] text-white/50 block">Flux directs mondiaux</span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Live Watch Party</span>
                <span className="text-[10px] text-white/50 block">Synchro & chat en direct</span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Film className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">VOD Cinéma</span>
                <span className="text-[10px] text-white/50 block">Films & séries en illimité</span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">Duo & Sécurité</span>
                <span className="text-[10px] text-white/50 block">Multi-écrans & Bouclier</span>
              </div>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 text-left animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Primary Action Button: Google Sign-In */}
          <div className="pt-2 space-y-3">
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-white/95 active:scale-[0.99] text-gray-900 font-bold text-sm sm:text-base relative flex items-center justify-center transition-all shadow-xl shadow-white/10 group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  <span>Connexion à Google en cours...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 mx-auto">
                  {/* Google SVG Official Icon */}
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continuer avec Google</span>
                </div>
              )}
              {!loading && (
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-0.5 transition-transform absolute right-6" />
              )}
            </button>
            </div>
        </div>

        {/* Informative Footer with Interactive Legal Modals & Copy Links */}
        <div className="text-center text-xs text-white/50 space-y-2">
          <p className="cursor-pointer hover:text-white transition" onClick={() => setModalType('privacy')} title="Cliquez pour consulter la politique de confidentialité">
            © Empreintes Technologies 2026 • NOVASTREAM Cinema • Tous droits réservés
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <button
              onClick={() => setModalType('privacy')}
              className="text-white/60 hover:text-white underline transition flex items-center gap-1"
            >
              Politique de Confidentialité
            </button>
            <button
              onClick={() => handleCopyLink('privacy')}
              className="text-cyan-400 hover:text-cyan-300 p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 transition cursor-pointer"
              title="Copier le lien de la politique de confidentialité"
            >
              {copiedLink === 'privacy' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <span className="text-white/30">•</span>

            <button
              onClick={() => setModalType('terms')}
              className="text-white/60 hover:text-white underline transition flex items-center gap-1"
            >
              Conditions d'Utilisation
            </button>
            <button
              onClick={() => handleCopyLink('terms')}
              className="text-indigo-400 hover:text-indigo-300 p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 transition cursor-pointer"
              title="Copier le lien des conditions d'utilisation"
            >
              {copiedLink === 'terms' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Legal Information Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-white/25 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto text-left">
            <button
              onClick={() => setModalType(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            {modalType === 'privacy' ? (
              <>
                <div className="flex items-center justify-between border-b border-white/10 pb-4 pr-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Politique de Confidentialité & Protection des Données</h2>
                      <p className="text-xs text-white/50">Empreintes Technologies • Édition 2026</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyLink('privacy')}
                    className="p-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition border border-cyan-500/30 cursor-pointer"
                    title="Copier le lien de la politique"
                  >
                    {copiedLink === 'privacy' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="space-y-4 text-xs text-white/80 leading-relaxed max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  <p>
                    Chez <strong>Empreintes Technologies</strong>, nous accordons une importance fondamentale à la transparence, à la sécurité et à la protection de la vie privée de nos utilisateurs sur la plateforme <strong>NOVASTREAM</strong>. La présente Politique de Confidentialité détaille la nature des informations collectées, leur utilisation et vos droits.
                  </p>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">1. Collecte des informations et Authentification Google</h3>
                    <p>
                      L'accès à NOVASTREAM requiert une authentification officielle via Google Sign-In (Firebase Authentication). Lors de votre connexion, nous recueillons uniquement les informations de base autorisées : votre nom complet, votre adresse email professionnelle ou personnelle ainsi que l'URL de votre photo de profil. Ces données permettent d'établir votre profil utilisateur, de personnaliser votre expérience et d'assurer le suivi statistique des connexions journalières sur le module d'administration sécurisé.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">2. Finalité et Traitement des Données</h3>
                    <p>
                      Les informations recueillies sont strictement destinées à :
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-white/70 mt-1 pl-2">
                      <li>Sécuriser l'accès aux flux multimédias et salons Live Watch Party.</li>
                      <li>Alimenter les tableaux de bord statistiques (DAU / MAU) de l'administrateur.</li>
                      <li>Gérer vos préférences locales, vos listes personnalisées et votre historique de lecture chiffré.</li>
                      <li>Traiter vos retours d'expérience et notes d'évaluation.</li>
                    </ul>
                    <p className="mt-1">
                      En aucun cas vos données personnelles ne font l'objet de commercialisation, de cession ou de transfert à des tiers publicitaires.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">3. Sécurité et Hébergement</h3>
                    <p>
                      L'infrastructure technique de NOVASTREAM repose sur Google Cloud et Firebase. Toutes les transmissions de données bénéficient d'un chiffrement de pointe (SSL/TLS en transit et AES-256 au repos). Seul l'administrateur autorisé dispose de privilèges d'accès aux journaux d'activité globale.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">4. Vos Droits et Suppression</h3>
                    <p>
                      Conformément aux réglementations en vigueur sur la protection des données, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Vous pouvez à tout moment vider votre historique ou réinitialiser vos paramètres depuis la page Paramètres, ou révoquer l'accès à l'application directement depuis votre Compte Google.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-white/10 pb-4 pr-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Conditions Générales d'Utilisation (CGU)</h2>
                      <p className="text-xs text-white/50">Empreintes Technologies • Édition 2026</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyLink('terms')}
                    className="p-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 transition border border-indigo-500/30 cursor-pointer"
                    title="Copier le lien des conditions"
                  >
                    {copiedLink === 'terms' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="space-y-4 text-xs text-white/80 leading-relaxed max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  <p>
                    Les présentes Conditions Générales d'Utilisation (CGU) encadrent légalement l'utilisation de la plateforme multimédia interactive <strong>NOVASTREAM</strong>, éditée par <strong>Empreintes Technologies</strong>. Tout accès à l'application implique l'acceptation sans réserve des termes ci-dessous.
                  </p>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">1. Objet et Accès à la Plateforme</h3>
                    <p>
                      NOVASTREAM offre un accès unifié à des flux TV en direct, des radios mondiales, un catalogue VOD cinématographique, des salons de discussion Live Watch Party synchronisés ainsi qu'un mode Duo multi-écrans. L'accès est strictement subordonné à l'authentification sécurisée par compte Google.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">2. Engagements et Comportement de l'Utilisateur</h3>
                    <p>
                      En utilisant NOVASTREAM et en participant aux salons Live Watch Party, l'utilisateur s'engage à :
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-white/70 mt-1 pl-2">
                      <li>Ne pas publier de contenus illicites, diffamatoires, haineux ou portant atteinte aux droits d'autrui.</li>
                      <li>Respecter la stricte confidentialité des autres utilisateurs et l'intégrité des flux de diffusion.</li>
                      <li>Ne pas tenter de contourner les mesures de sécurité ou d'accéder au module d'administration sans habilitation.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">3. Propriété Intellectuelle</h3>
                    <p>
                      L'ensemble de l'architecture logicielle, de l'interface utilisateur, des marques, logos et textes composant NOVASTREAM est la propriété exclusive d'Empreintes Technologies. Toute reproduction, modification ou diffusion non autorisée est strictement interdite.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-1">4. Limitation de Responsabilité</h3>
                    <p>
                      Empreintes Technologies s'efforce d'assurer la disponibilité continue des services NOVASTREAM mais ne saurait être tenue responsable des interruptions de flux imputables aux fournisseurs tiers, aux réseaux Internet ou à des opérations de maintenance.
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setModalType(null)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
