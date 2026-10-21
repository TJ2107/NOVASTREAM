import React, { useState } from 'react';
import {
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Trash2,
  RotateCcw,
  Shield,
  Smartphone,
  Tv,
  CheckCircle2,
  Sparkles,
  Zap,
  Settings as SettingsIcon,
  Activity,
  Radio,
  AlertTriangle,
  HelpCircle,
  Globe,
  Apple,
  Monitor,
  User as UserIcon,
  LogOut,
  Share2,
  Copy,
  Check,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { updateUserSubscription, activatePremiumByEmail } from '../services/analyticsService';
import { VPNBadge } from '../components/common/VPNBadge';
import { DnsHelpModal } from '../components/common/DnsHelpModal';

export function SettingsPage() {
  const { user, isAdmin, signOut } = useAuthStore();
  const {
    volume,
    setVolume,
    playerEngine,
    setPlayerEngine,
    audioBoost,
    setAudioBoost,
    audioMode,
    setAudioMode,
    audioEqualizer,
    setAudioEqualizer,
    clearHistory,
    resetAll,
    history,
    sources,
    tvMode,
    setTVMode,
    subscriptionPlan,
    setSubscriptionPlan
  } = useAppStore();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showDnsHelp, setShowDnsHelp] = useState(false);
  const [compatTab, setCompatTab] = useState<'android' | 'tv' | 'ios' | 'desktop'>('android');
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money' | 'gpay'>('mobile_money');
  const [mobileOperator, setMobileOperator] = useState<'airtel' | 'mtn'>('airtel');
  const [mobileNumber, setMobileNumber] = useState('+242053886817');
  const [targetAccountEmail, setTargetAccountEmail] = useState('');
  const [confirmAccountEmail, setConfirmAccountEmail] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [numberCopied, setNumberCopied] = useState(false);

  const shareMessages = {
    x: "🎬 Découvrez NOVASTREAM, la plateforme ultime de streaming cinéma, TV en direct et Live Watch Party ! Films, séries et flux HD sans interruption. 🚀 Rejoignez-moi dès maintenant : https://novastream.app #Novastream #Streaming #Cinema",
    facebook: "🌟 Envie de vivre une expérience de streaming exceptionnelle ? NOVASTREAM propose des films, des séries en illimité, des chaînes TV du monde entier et des salons Live Watch Party pour regarder vos programmes entre amis ! Venez tester par vous-même 🍿🎬 : https://novastream.app",
    linkedin: "🚀 Innovation & Divertissement : NOVASTREAM redéfinit l'expérience du streaming multimédia avec une interface moderne, des flux TV mondiaux et des espaces collaboratifs Watch Party. Découvrez la plateforme : https://novastream.app #Tech #Streaming #Innovation #Media"
  };

  const handleCopyShare = (platform: 'x' | 'facebook' | 'linkedin') => {
    navigator.clipboard.writeText(shareMessages[platform]).then(() => {
      setCopiedPlatform(platform);
      showToast(`Message de partage ${platform.toUpperCase()} copié avec succès !`);
      setTimeout(() => setCopiedPlatform(null), 3000);
    });
  };

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleClearHistory = () => {
    if (window.confirm('Voulez-vous vraiment vider tout l\'historique de lecture ?')) {
      clearHistory();
      showToast('Historique de lecture vidé avec succès !');
    }
  };

  const handleResetFactory = () => {
    if (window.confirm('Attention : Cette action va réinitialiser tous les réglages, les listes et restaurer les sources d\'origine. Continuer ?')) {
      resetAll();
      showToast('Réinitialisation aux réglages d\'usine effectuée !');
    }
  };

  return (
    <div className="p-3 md:p-8 pb-28 md:pb-12 space-y-6 md:space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-white flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 md:w-8 md:h-8 text-[#FF5A5F]" />
            <span>Paramètres</span>
          </h1>
          <p className="text-white/60 text-[11px] md:text-sm mt-1">
            Configurez votre lecteur et gérez vos données.
          </p>
        </div>
        <VPNBadge compact />
      </div>

      {/* DNS Help Modal */}
      {showDnsHelp && <DnsHelpModal onClose={() => setShowDnsHelp(false)} />}

      {/* Toast Notification */}
      {statusMessage && (
        <div className="p-3.5 rounded-2xl glass-strong border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-3 shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Account Section: Google Account */}
      {user && (
        <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 bg-indigo-950 border-2 border-indigo-500/40 shadow-lg shadow-indigo-950/50">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-indigo-600 to-purple-700">
                    {user.displayName?.[0] || 'U'}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">{user.displayName || 'Utilisateur Google'}</h2>
                  {isAdmin ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-bold">
                      ADMINISTRATEUR
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-semibold">
                      COMPTE ACTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/60 font-mono">{user.email}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connecté avec succès via Google Auth</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-2 transition shadow-sm"
                  title="Accéder au panneau d'administration"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Module Admin</span>
                </Link>
              )}

              <button
                onClick={() => {
                  if (window.confirm('Voulez-vous vraiment vous déconnecter de votre compte Google ?')) {
                    signOut();
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription & Plans Section ($5/mo Ad-Free vs Free with Ads) */}
      <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/10 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 border-b border-white/10 pb-3 md:pb-4">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-lg font-bold text-white">Gestion des Abonnements NOVASTREAM</h2>
            <p className="text-[10px] md:text-xs text-white/50">Choisissez entre l'abonnement gratuit avec publicité et l'abonnement VIP sans publicité pour 5$ / mois.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Free Plan Card */}
          <div className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${subscriptionPlan === 'free' ? 'bg-white/10 border-emerald-500/40 shadow-xl shadow-emerald-500/5' : 'glass border-white/5'}`}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">Plan Standard</span>
                {subscriptionPlan === 'free' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Actif
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-white">Gratuit avec Publicité</h3>
                <p className="text-xs text-amber-400 font-semibold mt-0.5">0 $ <span className="text-white/40 font-normal">/ permanent</span></p>
              </div>
              <ul className="text-xs text-white/70 space-y-2 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Accès gratuit à toutes les chaînes et films</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Bannières et encarts publicitaires intégrés</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Flux HLS.js standard</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                setSubscriptionPlan('free', null);
                if (user?.uid) {
                  updateUserSubscription(user.uid, 'free', null);
                }
                showToast('Vous êtes désormais sur le plan Gratuit avec Pub.');
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${subscriptionPlan === 'free' ? 'bg-white/10 text-white/60 cursor-default' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
              disabled={subscriptionPlan === 'free'}
            >
              <span>{subscriptionPlan === 'free' ? 'Plan Actuel' : 'Basculer vers le Gratuit'}</span>
            </button>
          </div>

          {/* Premium Plan Card ($5/mo) */}
          <div className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 relative overflow-hidden ${subscriptionPlan === 'premium' ? 'bg-gradient-to-br from-amber-950/40 to-purple-950/40 border-amber-500/60 shadow-xl shadow-amber-500/10' : 'glass border-amber-500/30 bg-amber-950/10'}`}>
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> VIP Sans Pub
                </span>
                {subscriptionPlan === 'premium' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Actif
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-white">NovaStream Premium</h3>
                <p className="text-xs text-amber-400 font-bold mt-0.5">5 $ <span className="text-white/60 font-normal">/ mois</span></p>
              </div>
              <ul className="text-xs text-white/80 space-y-2 pt-2">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span><strong>100% Sans Publicité</strong> ni interruption</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Priorité CDN 4K / Ultra HD & Serveurs VIP</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Badge VIP exclusif et Support prioritaire 24/7</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                if (subscriptionPlan === 'premium') {
                  showToast('Votre abonnement Premium 5$/mois est déjà actif !');
                } else {
                  const initialEmail = user?.email || '';
                  setTargetAccountEmail(initialEmail);
                  setConfirmAccountEmail(initialEmail);
                  setPaymentMethod('mobile_money');
                  setMobileOperator('airtel');
                  setPayError(null);
                  setShowPayModal(true);
                }
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${subscriptionPlan === 'premium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-default' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-amber-500/20'}`}
            >
              <Zap className="w-4 h-4" />
              <span>{subscriptionPlan === 'premium' ? 'Abonnement VIP Actif' : 'S\'abonner pour 5$ / mois'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal with Airtel Mobile Money & Email Confirmation */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="glass-strong rounded-3xl p-5 sm:p-8 max-w-lg w-full border border-amber-500/40 space-y-5 shadow-2xl relative my-auto">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">NovaStream Premium Sans Pub</h3>
                  <p className="text-xs text-amber-400 font-semibold">5,00 $ US (3 000 FCFA) • Durée : 1 Mois</p>
                </div>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60">Abonnement</span>
                  <span className="text-white font-bold">1 Mois (30 jours) VIP Sans Pub</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Coupures publicitaires</span>
                  <span className="text-emerald-400 font-bold">Désactivées (0 seconde de pub)</span>
                </div>
                <div className="border-t border-white/10 pt-1.5 flex justify-between font-bold">
                  <span className="text-white">Montant à régler</span>
                  <span className="text-amber-400">5,00 $ / 3 000 FCFA</span>
                </div>
              </div>

              {/* Mode de paiement */}
              <div className="space-y-2.5">
                <label className="text-[11px] text-white/70 block font-semibold">Moyen de paiement</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mobile_money')}
                    className={`p-2.5 rounded-xl text-center text-xs font-bold transition cursor-pointer ${
                      paymentMethod === 'mobile_money'
                        ? 'bg-red-600/25 border border-red-500 text-red-300 shadow-md ring-1 ring-red-500/40'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    Mobile Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl text-center text-xs font-bold transition cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-amber-500/25 border border-amber-500/50 text-amber-300 shadow-md'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    Carte Visa/MC
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gpay')}
                    className={`p-2.5 rounded-xl text-center text-xs font-bold transition cursor-pointer ${
                      paymentMethod === 'gpay'
                        ? 'bg-amber-500/25 border border-amber-500/50 text-amber-300 shadow-md'
                        : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    Google Pay
                  </button>
                </div>

                {paymentMethod === 'mobile_money' && (
                  <div className="space-y-3 pt-1 animate-fadeIn">
                    {/* Operator choice */}
                    <div>
                      <span className="text-[11px] text-white/60 block mb-1">Réseau :</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMobileOperator('airtel')}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            mobileOperator === 'airtel'
                              ? 'bg-red-600/25 border-red-500 text-red-200 ring-1 ring-red-500/40 shadow-sm'
                              : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span>Airtel Money (+242)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMobileOperator('mtn')}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            mobileOperator === 'mtn'
                              ? 'bg-amber-500/25 border-amber-500 text-amber-200 ring-1 ring-amber-500/40 shadow-sm'
                              : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span>MTN Mobile Money</span>
                        </button>
                      </div>
                    </div>

                    {/* Official Airtel Number Box */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/50 via-black to-red-950/20 border border-red-500/40 space-y-1.5 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/70 uppercase font-mono tracking-wider">
                          Numéro récepteur {mobileOperator === 'airtel' ? 'Airtel Money' : 'MTN'} :
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('+242053886817');
                            setNumberCopied(true);
                            setTimeout(() => setNumberCopied(false), 2500);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                        >
                          {numberCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{numberCopied ? 'Copié !' : 'Copier'}</span>
                        </button>
                      </div>
                      <div className="text-base sm:text-lg font-black text-amber-300 font-mono tracking-wider">
                        +242053886817
                      </div>
                      <p className="text-[10px] text-white/70 leading-relaxed">
                        Envoyez <strong>5,00 $ (ou 3 000 FCFA)</strong> vers le <strong>+242053886817</strong>, puis confirmez l'email de votre compte ci-dessous.
                      </p>
                    </div>

                    {/* Email confirmation fields */}
                    <div className="space-y-2.5 pt-1 border-t border-white/10">
                      <div className="space-y-1">
                        <label className="text-[11px] text-amber-300 font-bold block">
                          Email du compte à passer en Premium Sans Pub :
                        </label>
                        <input
                          type="email"
                          value={targetAccountEmail}
                          onChange={(e) => {
                            setTargetAccountEmail(e.target.value);
                            setPayError(null);
                          }}
                          placeholder="votre-email-compte@gmail.com"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#08081c] border border-white/15 text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-amber-400 transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <label className="text-amber-300 font-bold">
                            Confirmer l'Email du compte :
                          </label>
                          {targetAccountEmail && confirmAccountEmail && targetAccountEmail.trim().toLowerCase() === confirmAccountEmail.trim().toLowerCase() && (
                            <span className="text-emerald-400 font-medium flex items-center gap-1 text-[10px]">
                              <Check className="w-3 h-3" /> Emails identiques
                            </span>
                          )}
                        </div>
                        <input
                          type="email"
                          value={confirmAccountEmail}
                          onChange={(e) => {
                            setConfirmAccountEmail(e.target.value);
                            setPayError(null);
                          }}
                          placeholder="Retapez l'adresse email exacte"
                          required
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-[#08081c] border text-xs text-white placeholder-white/30 font-mono focus:outline-none transition ${
                            confirmAccountEmail && targetAccountEmail.trim().toLowerCase() !== confirmAccountEmail.trim().toLowerCase()
                              ? 'border-red-500/70 focus:border-red-400'
                              : 'border-white/15 focus:border-amber-400'
                          }`}
                        />
                      </div>

                      {/* Transaction reference ID */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-white/50 block font-mono">
                          Référence SMS / ID de transaction Airtel (optionnel) :
                        </label>
                        <input
                          type="text"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          placeholder="ex: PP261021.1245.G7894"
                          className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/80 placeholder-white/30 font-mono focus:outline-none focus:border-amber-400 transition"
                        />
                      </div>

                      {payError && (
                        <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-[11px] flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span>{payError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition border border-white/10 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  setPayError(null);
                  if (paymentMethod === 'mobile_money') {
                    const email1 = targetAccountEmail.trim().toLowerCase();
                    const email2 = confirmAccountEmail.trim().toLowerCase();
                    if (!email1 || !email1.includes('@')) {
                      setPayError('Veuillez saisir une adresse email valide.');
                      return;
                    }
                    if (email1 !== email2) {
                      setPayError('Les deux adresses email saisies ne correspondent pas.');
                      return;
                    }

                    setIsProcessingPayment(true);
                    try {
                      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
                      await activatePremiumByEmail(email1, expiresAt, {
                        phone: '+242053886817',
                        operator: mobileOperator === 'airtel' ? 'Airtel Money (+242)' : 'MTN Mobile Money (+242)',
                        amount: '5,00 $ (3 000 FCFA)',
                        transactionRef: transactionRef.trim() || undefined
                      });

                      // If current active user is this email, update active session and store
                      if (user?.email?.trim().toLowerCase() === email1) {
                        setSubscriptionPlan('premium', expiresAt);
                        if (user?.uid) {
                          await updateUserSubscription(user.uid, 'premium', expiresAt);
                        }
                      }

                      setShowPayModal(false);
                      showToast(`🎉 Paiement confirmé ! Le compte ${email1} est passé en Premium Sans Pub pour 1 mois (jusqu'au ${new Date(expiresAt).toLocaleDateString('fr-FR')}) !`);
                    } catch (err: any) {
                      setPayError(err?.message || 'Erreur lors de la confirmation du paiement.');
                    } finally {
                      setIsProcessingPayment(false);
                    }
                  } else {
                    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
                    setSubscriptionPlan('premium', expiresAt);
                    if (user?.uid) {
                      await updateUserSubscription(user.uid, 'premium', expiresAt);
                    }
                    setShowPayModal(false);
                    showToast('🎉 Félicitations ! Votre abonnement Premium 5$/mois sans pub est activé pour 1 mois !');
                  }
                }}
                disabled={isProcessingPayment}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs transition shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isProcessingPayment ? 'Validation...' : 'Confirmer & Activer 1 Mois (5$)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Audio & Volume Management */}
      <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3 md:pb-4">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
            <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-lg font-bold text-white">Système de Réglage des Sons & Volume</h2>
            <p className="text-[10px] md:text-xs text-white/50">Contrôle maître du volume, amplification et préréglages acoustiques.</p>
          </div>
        </div>

        {/* Master Volume Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-white/80 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-purple-400" /> Volume Général (Master)
            </span>
            <span className="font-mono text-purple-300 font-bold bg-purple-600/20 px-2.5 py-1 rounded-lg border border-purple-500/30">
              {Math.round(volume * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="p-2.5 rounded-xl glass hover:bg-white/10 text-white transition"
              title="Couper / Activer le son"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#FF5A5F]"
            />
          </div>
        </div>

        {/* Audio Boost Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl glass border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Amplification Audio (+200%)</span>
              <span className="text-[10px] text-white/40 block">Booste les flux faibles ou mal enregistrés</span>
            </div>
            <button
              onClick={() => setAudioBoost(!audioBoost)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                audioBoost
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'glass text-white/70 hover:text-white'
              }`}
            >
              {audioBoost ? 'ACTIVÉ' : 'Désactivé'}
            </button>
          </div>

          {/* Audio Channels Mode */}
          <div className="p-4 rounded-2xl glass border border-white/5 space-y-2">
            <span className="text-xs font-bold text-white block">Mode Spatial / Canaux Audio</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'stereo', label: 'Stéréo HD' },
                { id: 'surround', label: 'Surround 5.1' },
                { id: 'mono', label: 'Mono / Voix' },
                { id: 'bass_boost', label: 'Bass Boost' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setAudioMode(m.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition ${
                    audioMode === m.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'glass text-white/60 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Equalizer presets */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-white/80 block">Égaliseur Acoustique (EQ)</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'flat', label: 'Neutre (Flat)' },
              { id: 'cinema', label: 'Cinéma & Films' },
              { id: 'voice', label: 'Voix & Dialogues' },
              { id: 'music', label: 'Musique & Live' }
            ].map((eq) => (
              <button
                key={eq.id}
                onClick={() => setAudioEqualizer(eq.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
                  audioEqualizer === eq.id
                    ? 'bg-[#FF5A5F] text-white shadow-md'
                    : 'glass text-white/60 hover:text-white'
                }`}
              >
                {eq.label}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* Section 2: Player Engine Choice */}
      <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3 md:pb-4">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
            <Play className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-lg font-bold text-white">Choix du Lecteur Multimédia (Engine)</h2>
            <p className="text-[10px] md:text-xs text-white/50">Sélectionnez le moteur de lecture adapté à vos flux HLS, IPTV ou VOD.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              id: 'hls.js',
              title: 'HLS.js Engine (Recommandé)',
              desc: 'Idéal pour les flux M3U8, direct TV et VOD multi-débit avec prise en charge CORS intégrée.'
            },
            {
              id: 'native',
              title: 'HTML5 Native Player',
              desc: 'Lecteur natif ultra-léger pour les fichiers MP4, WebM et formats directs compatibles.'
            },
            {
              id: 'proxy',
              title: 'Proxy CORS / HTTPS-to-HTTP',
              desc: 'Route automatiquement les flux non sécurisés HTTP via le proxy serveur pour contourner les blocages Mixed Content.'
            },
            {
              id: 'iframe',
              title: 'Iframe Embed Fallback',
              desc: 'Mode iframe universel pour les portails web externes et intégrations iFrame tierces.'
            }
          ].map((engine) => (
            <div
              key={engine.id}
              onClick={() => {
                setPlayerEngine(engine.id as any);
                showToast(`Moteur de lecteur défini : ${engine.title}`);
              }}
              className={`p-4 rounded-2xl glass cursor-pointer transition-all border ${
                playerEngine === engine.id
                  ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                  : 'border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-white">{engine.title}</span>
                {playerEngine === engine.id && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                    ACTIF
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">{engine.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Compatibilité Multiplateforme */}
      <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Compatibilité Multiplateforme & Installation</h2>
            <p className="text-xs text-white/50">Guide d'installation et d'optimisation (iOS, Android, Android TV, PC/Mac, TV Connectées)</p>
          </div>
        </div>

        {/* Compatibility Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 bg-black/40 rounded-2xl border border-white/10">
          {[
            { id: 'android', label: 'Android & Box', icon: Smartphone },
            { id: 'tv', label: 'Android TV / Fire', icon: Tv },
            { id: 'ios', label: 'iOS & iPadOS', icon: Apple },
            { id: 'desktop', label: 'PC, Mac & Linux', icon: Monitor }
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setCompatTab(tab.id as any)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  compatTab === tab.id
                    ? 'bg-[#FF5A5F] text-white shadow-lg accent-glow'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-4">
          {compatTab === 'android' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-cyan-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">APK & PWA</span>
                    <h3 className="font-bold text-xs text-white">Télécharger le Package APK Android</h3>
                  </div>
                  <p className="text-[11px] text-white/70">
                    Téléchargez le fichier de configuration WebAPK / l'assistant d'installation pour installer NOVASTREAM comme application native sur Android et tablettes.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const apkInfo = {
                      appName: "NOVASTREAM",
                      packageName: "app.novastream.tv",
                      version: "2.4.0",
                      startUrl: window.location.origin,
                      iconUrl: `${window.location.origin}/NOVOSTREAM.png`,
                      description: "Plateforme ultime de streaming cinéma, TV et Watch Party."
                    };
                    const blob = new Blob([JSON.stringify(apkInfo, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'novastream-android-apk-package.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast('Package APK Android / WebAPK téléchargé avec succès !');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition flex items-center gap-2 flex-shrink-0 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Télécharger l'APK / Config</span>
                </button>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">1</div>
                <div>
                  <h3 className="font-bold text-xs text-white">Installation PWA Native sur Android</h3>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    Ouvrez l'application dans <strong>Google Chrome</strong> sur votre smartphone ou tablette Android. Appuyez sur le menu (trois points en haut à droite) puis sélectionnez <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">2</div>
                <div>
                  <h3 className="font-bold text-xs text-white">Fonctionnalités & Optimisations Android</h3>
                  <ul className="text-[11px] text-white/60 mt-1 space-y-1 list-disc list-inside">
                    <li>Mode plein écran immersif sans barres de navigation.</li>
                    <li>Support matériel complet HLS.js pour les flux vidéo en direct et VOD.</li>
                    <li>Gestion du proxy de flux intégré pour contourner les blocages CORS.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {compatTab === 'tv' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-[#FF5A5F]/20 text-[#FF5A5F] flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">TV</div>
                <div>
                  <h3 className="font-bold text-xs text-white">Optimisé pour Android TV, Box IPTV & Fire TV</h3>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    NOVASTREAM intègre un <strong>Mode Télécommande (Smart TV)</strong> complet permettant une navigation fluide à l'aide des flèches directionnelles (D-pad) et du bouton Entrée de votre télécommande.
                  </p>
                </div>
              </div>
            </div>
          )}

          {compatTab === 'ios' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">iOS</div>
                <div>
                  <h3 className="font-bold text-xs text-white">Installation sur iPhone et iPad (Safari)</h3>
                  <ol className="text-[11px] text-white/70 mt-1.5 space-y-1 list-decimal list-inside">
                    <li>Ouvrez NOVASTREAM dans <strong>Safari</strong>.</li>
                    <li>Appuyez sur le bouton <strong>Partager</strong> <span className="font-bold">⎋</span> dans la barre inférieure.</li>
                    <li>Sélectionnez <strong>"Sur l'écran d'accueil"</strong> puis confirmez.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {compatTab === 'desktop' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">PC</div>
                <div>
                  <h3 className="font-bold text-xs text-white">Windows, macOS & Linux (Chrome / Edge / Firefox)</h3>
                  <p className="text-[11px] text-white/60 mt-0.5">
                    Cliquez sur l'icône d'installation dans la barre d'adresse de votre navigateur ou utilisez le bouton d'installation de la barre latérale pour installer NOVASTREAM comme application de bureau dédiée.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Data Management & Factory Reset */}
      <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center font-bold">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Gestion des Données & Réinitialisation</h2>
            <p className="text-xs text-white/50">Nettoyez votre historique ou restaurez l'application à son état d'origine.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl glass border border-white/5 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-white mb-1">Historique de Lecture ({history.length} entrées)</h3>
              <p className="text-[11px] text-white/50">Efface l'historique des vidéos et chaînes récemment consultées.</p>
            </div>
            <button
              onClick={handleClearHistory}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2 transition border border-white/10"
            >
              <Trash2 className="w-4 h-4 text-amber-400" />
              <span>Vider l'historique</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl glass border border-red-500/20 flex flex-col justify-between space-y-4 bg-red-950/10">
            <div>
              <h3 className="text-xs font-bold text-red-300 mb-1">Réinitialisation Usine</h3>
              <p className="text-[11px] text-white/50">Efface toutes vos listes personnalisées, réglages et restaure les démos.</p>
            </div>
            <button
              onClick={handleResetFactory}
              className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition border border-red-500/40"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réinitialiser aux réglages d'usine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 5: Assistance */}
      <div className="glass-strong rounded-3xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Assistance</h2>
              <p className="text-xs text-white/50">Besoin d'aide avec la configuration DNS ou les connexions ?</p>
            </div>
          </div>
          <button
            onClick={() => setShowDnsHelp(true)}
            className="px-4 py-2.5 rounded-xl glass hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 transition flex items-center gap-2 text-xs font-semibold border border-amber-500/30"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Ouvrir l'Aide DNS</span>
          </button>
        </div>
      </div>

      {/* Section 6: Social Sharing Messages */}
      <div className="glass-strong rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Partager NOVASTREAM</h2>
            <p className="text-xs text-white/50">Copiez les messages prêts à l'emploi pour vos réseaux sociaux.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* X / Twitter */}
          <div className="p-4 rounded-2xl glass border border-white/5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span> X (Twitter)
                </span>
                <span className="text-[10px] text-white/40 font-mono">Prêt</span>
              </div>
              <p className="text-[11px] text-white/70 line-clamp-4 bg-black/20 p-2.5 rounded-xl border border-white/5 font-sans">
                {shareMessages.x}
              </p>
            </div>
            <button
              onClick={() => handleCopyShare('x')}
              className="w-full py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-2 transition border border-cyan-500/30 cursor-pointer"
            >
              {copiedPlatform === 'x' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier pour X</span>
                </>
              )}
            </button>
          </div>

          {/* Facebook */}
          <div className="p-4 rounded-2xl glass border border-white/5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Facebook
                </span>
                <span className="text-[10px] text-white/40 font-mono">Prêt</span>
              </div>
              <p className="text-[11px] text-white/70 line-clamp-4 bg-black/20 p-2.5 rounded-xl border border-white/5 font-sans">
                {shareMessages.facebook}
              </p>
            </div>
            <button
              onClick={() => handleCopyShare('facebook')}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 text-xs font-semibold flex items-center justify-center gap-2 transition border border-blue-500/30 cursor-pointer"
            >
              {copiedPlatform === 'facebook' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier pour Facebook</span>
                </>
              )}
            </button>
          </div>

          {/* LinkedIn */}
          <div className="p-4 rounded-2xl glass border border-white/5 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> LinkedIn
                </span>
                <span className="text-[10px] text-white/40 font-mono">Prêt</span>
              </div>
              <p className="text-[11px] text-white/70 line-clamp-4 bg-black/20 p-2.5 rounded-xl border border-white/5 font-sans">
                {shareMessages.linkedin}
              </p>
            </div>
            <button
              onClick={() => handleCopyShare('linkedin')}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center justify-center gap-2 transition border border-indigo-500/30 cursor-pointer"
            >
              {copiedPlatform === 'linkedin' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier pour LinkedIn</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
