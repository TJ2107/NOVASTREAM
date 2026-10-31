import React, { useState, useEffect } from 'react';
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
  ShieldAlert,
  ShieldCheck,
  Cookie,
  Plus,
  RefreshCw,
  Server,
  Lock,
  ExternalLink,
  Power,
  EyeOff,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore, DEFAULT_PROXY_CONFIG, VPN_SERVERS, type GlobalProxyConfig, type VPNServer } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { updateUserSubscription, activatePremiumByEmail, submitPendingPayment } from '../services/analyticsService';
import { testProxyStreamConnection, type ProxyProbeResult } from '../services/secureStream';
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
    subscriptionExpiresAt,
    setSubscriptionPlan,
    proxyConfig,
    setProxyConfig,
    resetProxyConfig,
    vpnEnabled,
    vpnServer,
    vpnProtocol,
    vpnKillSwitch,
    vpnConnectedSince,
    toggleVPN,
    setVPNServer,
    setVPNProtocol,
    setVPNKillSwitch
  } = useAppStore();

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showDnsHelp, setShowDnsHelp] = useState(false);
  const [compatTab, setCompatTab] = useState<'android' | 'tv' | 'ios' | 'desktop'>('android');
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money' | 'gpay'>('mobile_money');
  const [mobileOperator, setMobileOperator] = useState<'airtel' | 'mtn'>('airtel');
  const [mobileNumber, setMobileNumber] = useState('+242053886817');
  const [senderPhoneNumber, setSenderPhoneNumber] = useState('');
  const [targetAccountEmail, setTargetAccountEmail] = useState('');
  const [confirmAccountEmail, setConfirmAccountEmail] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [numberCopied, setNumberCopied] = useState(false);
  const [paymentSubmittedData, setPaymentSubmittedData] = useState<{
    email: string;
    phone: string;
    txRef: string;
    autoApproved?: boolean;
  } | null>(null);

  const [vpnConnectedTime, setVpnConnectedTime] = useState<string>('00:00:00');
  const [vpnTestResult, setVpnTestResult] = useState<{ domain: string; status: 'ok' | 'blocked'; latency: number } | null>(null);
  const [isVpnTesting, setIsVpnTesting] = useState(false);

  useEffect(() => {
    if (!vpnEnabled || !vpnConnectedSince) {
      setVpnConnectedTime('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const diffSecs = Math.floor((Date.now() - vpnConnectedSince) / 1000);
      const h = Math.floor(diffSecs / 3600);
      const m = Math.floor((diffSecs % 3600) / 60);
      const s = diffSecs % 60;
      const pad = (n: number) => n.toString().padStart(2, '0');
      setVpnConnectedTime(`${pad(h)}:${pad(m)}:${pad(s)}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [vpnEnabled, vpnConnectedSince]);

  const handleTestDomain = async (domain: string) => {
    setIsVpnTesting(true);
    setVpnTestResult(null);
    const start = Date.now();
    try {
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
        headers: { accept: 'application/dns-json' }
      });
      const data = await res.json();
      const latency = Date.now() - start;
      if (data.Answer && data.Answer.length > 0) {
        setVpnTestResult({ domain, status: 'ok', latency });
      } else {
        setVpnTestResult({ domain, status: 'blocked', latency });
      }
    } catch {
      setVpnTestResult({ domain, status: 'blocked', latency: Date.now() - start });
    } finally {
      setIsVpnTesting(false);
    }
  };

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
          <h1 className="text-base sm:text-lg md:text-xl font-black text-white flex items-center gap-2.5">
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
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Actif
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-white">NovaStream Premium</h3>
                <p className="text-xs text-amber-400 font-bold mt-0.5">5 $ <span className="text-white/60 font-normal">/ mois (3 000 FCFA)</span></p>
              </div>

              {/* Real-time Expiration Status & Remaining Days */}
              {subscriptionPlan === 'premium' && subscriptionExpiresAt && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-200 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Statut VIP
                    </span>
                    <span className="text-emerald-400 font-mono font-bold text-[11px]">
                      {Math.max(0, Math.ceil((subscriptionExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)))} jours restants
                    </span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    Expire le : <strong className="text-white font-mono">{new Date(subscriptionExpiresAt).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                  </p>
                  <p className="text-[10px] text-white/50">
                    À expiration, le compte basculera automatiquement sur le plan gratuit avec publicité.
                  </p>
                </div>
              )}

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
                  <span>Paiement Airtel Money (+242053886817) sécurisé</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                const initialEmail = user?.email || '';
                setTargetAccountEmail(initialEmail);
                setConfirmAccountEmail(initialEmail);
                setSenderPhoneNumber('');
                setTransactionRef('');
                setPaymentMethod('mobile_money');
                setMobileOperator('airtel');
                setPayError(null);
                setShowPayModal(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-amber-500/20"
            >
              <Zap className="w-4 h-4" />
              <span>{subscriptionPlan === 'premium' ? 'Prolonger mon abonnement (+30j)' : 'S\'abonner pour 5$ / mois'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Drawer / Modal after Payment Request Submitted */}
      {paymentSubmittedData && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-emerald-500/40 space-y-5 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-white">Demande de Paiement Soumise !</h3>
              <p className="text-xs text-white/60">
                Votre transaction Airtel Money a été transmise à l'administrateur pour vérification.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-white/50">Numéro récepteur :</span>
                <span className="text-amber-300 font-bold">+242053886817 (Airtel)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Votre N° expéditeur :</span>
                <span className="text-white">{paymentSubmittedData.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Compte à activer :</span>
                <span className="text-emerald-300">{paymentSubmittedData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Référence SMS / ID :</span>
                <span className="text-white/80">{paymentSubmittedData.txRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Montant :</span>
                <span className="text-amber-400 font-bold">5,00 $ (3 000 FCFA) • 1 Mois</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-white/50">Statut :</span>
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  En attente de validation
                </span>
              </div>
            </div>

            <p className="text-[11px] text-white/70 leading-relaxed bg-amber-950/30 p-3 rounded-xl border border-amber-500/30">
              💡 <strong>Comment ça fonctionne ?</strong> Dès que l'administrateur vérifie la réception des 3 000 FCFA sur le <strong>+242053886817</strong>, votre compte passera automatiquement en VIP Sans Pub pour 30 jours. Vous n'avez rien d'autre à faire !
            </p>

            <button
              onClick={() => setPaymentSubmittedData(null)}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition cursor-pointer"
            >
              J'ai compris, fermer
            </button>
          </div>
        </div>
      )}

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
                  <p className="text-xs text-amber-400 font-semibold">5,00 $ US (3 000 FCFA) • Durée : 1 Mois (30 jours)</p>
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
                        Étape 1 : Effectuez votre transfert de <strong>5,00 $ (ou 3 000 FCFA)</strong> vers le <strong>+242053886817</strong>, puis renseignez ci-dessous vos informations.
                      </p>
                    </div>

                    {/* Client sender phone & Email confirmation fields */}
                    <div className="space-y-2.5 pt-1 border-t border-white/10">
                      <div className="space-y-1">
                        <label className="text-[11px] text-amber-300 font-bold block">
                          Votre Numéro de téléphone ayant envoyé les fonds :
                        </label>
                        <input
                          type="tel"
                          value={senderPhoneNumber}
                          onChange={(e) => {
                            setSenderPhoneNumber(e.target.value);
                            setPayError(null);
                          }}
                          placeholder="ex: +242 05 388 68 17 ou 06 XXX XX XX"
                          required
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#08081c] border border-white/15 text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-amber-400 transition"
                        />
                      </div>

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
                          Référence SMS / ID de transaction reçu par SMS :
                        </label>
                        <input
                          type="text"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          placeholder="ex: PP261021.1245.G7894 (reçu par SMS)"
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
                    const phone = senderPhoneNumber.trim();

                    if (!phone) {
                      setPayError('Veuillez indiquer le numéro ayant envoyé les fonds.');
                      return;
                    }
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
                      // Submit pending payment to Firestore for admin review
                      const tx = transactionRef.trim() || `AIRTEL-${Date.now().toString().slice(-6)}`;
                      await submitPendingPayment({
                        targetEmail: email1,
                        userId: user?.uid,
                        userName: user?.displayName || 'Client',
                        senderPhone: phone,
                        transactionRef: tx,
                        operator: mobileOperator === 'airtel' ? 'Airtel Money (+242)' : 'MTN Mobile Money (+242)',
                        amount: '5,00 $ (3 000 FCFA)',
                        durationMonths: 1
                      });

                      setShowPayModal(false);
                      setPaymentSubmittedData({
                        email: email1,
                        phone: phone,
                        txRef: tx
                      });
                    } catch (err: any) {
                      setPayError(err?.message || 'Erreur lors de la transmission du paiement.');
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
                <span>{isProcessingPayment ? 'Enregistrement...' : 'Valider mon Paiement (5$)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Section VPN & Sécurité Chiffrée */}
      <div className="glass-strong rounded-3xl p-6 md:p-8 border border-emerald-500/30 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-xl font-black text-white flex items-center gap-2">
                <span>🛡️ Bouclier VPN & Sécurité Suissse</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                  CH 🇨🇭
                </span>
              </h2>
              <p className="text-[11px] md:text-xs text-white/60">
                Chiffrement instantané, contournement des blocages FAI et protection nomade (Wi-Fi public, café, hôtel, train).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVPNKillSwitch(!vpnKillSwitch)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition border ${
                vpnKillSwitch
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
              }`}
            >
              Kill Switch: {vpnKillSwitch ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* User's quote banner */}
        <blockquote className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/20 text-white/90 text-xs leading-relaxed font-medium italic backdrop-blur-md">
          « Un tap, et votre connexion est chiffrée : au café, à l'hôtel, dans le train. Changez de pays, passez les blocages. Serveurs suisses, pas de logs, pas de bridage. »
        </blockquote>

        {/* Main One-Tap Power & Server Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* One-Tap Toggle Box */}
          <div className="lg:col-span-5 glass rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-between text-center relative shadow-xl">
            <div className="space-y-1 mb-4">
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest font-mono block">
                Statut de la Protection
              </span>
              <div className={`text-lg font-black transition-colors ${vpnEnabled ? 'text-emerald-400' : 'text-white/40'}`}>
                {vpnEnabled ? 'PROTÉGÉ & CHIFFRÉ' : 'DÉCONNECTÉ'}
              </div>
              <p className="text-[10px] text-white/60">
                {vpnEnabled
                  ? `Connecté à ${vpnServer.flag} ${vpnServer.country} (${vpnServer.city})`
                  : 'Appuyez pour activer le tunnel chiffré'}
              </p>
            </div>

            {/* Giant One-Tap Button */}
            <div className="relative my-2">
              {vpnEnabled && (
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
              )}
              <button
                onClick={toggleVPN}
                className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-2xl border-4 cursor-pointer ${
                  vpnEnabled
                    ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 border-emerald-300 text-white shadow-emerald-600/50 hover:scale-105'
                    : 'bg-gradient-to-br from-[#1a1a36] to-[#0d0d24] border-white/10 text-white/40 hover:text-white hover:border-white/30 hover:scale-105 shadow-black/60'
                }`}
                title={vpnEnabled ? 'Désactiver le VPN' : 'Activer le VPN en 1 tap'}
              >
                <Power className={`w-8 h-8 mb-1 ${vpnEnabled ? 'animate-pulse' : ''}`} />
                <span className="text-[9px] font-black tracking-wider uppercase">
                  {vpnEnabled ? 'DÉCONNECTER' : 'ACTIVER'}
                </span>
              </button>
            </div>

            {/* Live stats */}
            <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10 text-[10px]">
              <div className="glass p-2 rounded-xl text-center">
                <span className="text-[8px] text-white/40 uppercase block mb-0.5">Durée active</span>
                <span className="font-mono font-bold text-white text-[11px]">{vpnConnectedTime}</span>
              </div>
              <div className="glass p-2 rounded-xl text-center">
                <span className="text-[8px] text-white/40 uppercase block mb-0.5">IP Virtuelle</span>
                <span className="font-mono font-bold text-cyan-300 text-[11px]">
                  {vpnEnabled ? vpnServer.ip : 'Masquée'}
                </span>
              </div>
            </div>
          </div>

          {/* Server Picker */}
          <div className="lg:col-span-7 glass rounded-2xl p-5 border border-white/10 flex flex-col justify-between shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>Emplacement des Serveurs</span>
                </h3>
                <p className="text-[10px] text-white/50">Haute vitesse • Juridiction Suisse 🇨🇭</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                7 serveurs actifs
              </span>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {VPN_SERVERS.map((server) => {
                const isSelected = vpnServer.id === server.id;
                return (
                  <button
                    key={server.id}
                    onClick={() => {
                      setVPNServer(server);
                      if (!vpnEnabled) toggleVPN();
                    }}
                    className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-lg ring-1 ring-emerald-400/50'
                        : 'glass hover:bg-white/10 border-white/5 text-white/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base leading-none flex-shrink-0">{server.flag}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-[10px] truncate flex items-center gap-1">
                          <span>{server.city}</span>
                          {server.isSwiss && (
                            <span className="text-[8px] px-1 py-0 rounded bg-red-600/30 text-red-200 border border-red-500/30 font-bold">
                              CH
                            </span>
                          )}
                        </div>
                        <div className="text-[9px] text-white/40 font-mono mt-0.5 truncate">{server.ip}</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold pl-2 flex-shrink-0">
                      {server.ping}ms
                    </span>
                  </button>
                );
              })}
            </div>

            {/* DNS Tester */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Tester le déblocage DNS :</span>
                </span>
                {vpnTestResult && (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Résolu en {vpnTestResult.latency}ms
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['vavoo.to', 'oha.to', 'huhu.to', 'kool.ws'].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleTestDomain(d)}
                    disabled={isVpnTesting}
                    className="px-2 py-0.5 rounded-lg glass hover:bg-cyan-600/30 border border-white/10 text-[10px] font-mono text-cyan-200 transition cursor-pointer"
                  >
                    Test {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          <div className="glass rounded-xl p-2.5 border border-white/10 space-y-1 text-center">
            <span className="text-lg">🇨🇭</span>
            <h4 className="font-bold text-[11px] text-white">Loi Suisse LPD</h4>
            <p className="text-[9px] text-white/50 leading-tight">100% hors juridiction 14 Eyes</p>
          </div>
          <div className="glass rounded-xl p-2.5 border border-white/10 space-y-1 text-center">
            <span className="text-lg">🙈</span>
            <h4 className="font-bold text-[11px] text-white">Zéro Logs</h4>
            <p className="text-[9px] text-white/50 leading-tight">Aucun historique conservé</p>
          </div>
          <div className="glass rounded-xl p-2.5 border border-white/10 space-y-1 text-center">
            <span className="text-lg">⚡</span>
            <h4 className="font-bold text-[11px] text-white">Anti-Bridage</h4>
            <p className="text-[9px] text-white/50 leading-tight">Bande passante 4K illimitée</p>
          </div>
          <div className="glass rounded-xl p-2.5 border border-white/10 space-y-1 text-center">
            <span className="text-lg">🔐</span>
            <h4 className="font-bold text-[11px] text-white">ChaCha20</h4>
            <p className="text-[9px] text-white/50 leading-tight">Protection Wi-Fi public</p>
          </div>
        </div>
      </div>


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

      {/* Section: Configuration des En-têtes HTTP & Proxy M3U (Réservé exclusivement à l'administrateur) */}
      {isAdmin && (
        <ProxyHeadersManagement
          proxyConfig={proxyConfig}
          onSave={setProxyConfig}
          onReset={resetProxyConfig}
          showToast={showToast}
        />
      )}

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

function ProxyHeadersManagement({
  proxyConfig,
  onSave,
  onReset,
  showToast
}: {
  proxyConfig: GlobalProxyConfig;
  onSave: (config: Partial<GlobalProxyConfig>) => void;
  onReset: () => void;
  showToast: (msg: string) => void;
}) {
  const [enabled, setEnabled] = useState(proxyConfig?.enabled ?? true);
  const [forceAllStreams, setForceAllStreams] = useState(proxyConfig?.forceAllStreams ?? false);
  const [selectedPreset, setSelectedPreset] = useState<'vlc' | 'tivimate' | 'apple' | 'chrome' | 'custom' | 'none'>(
    proxyConfig?.defaultPreset || 'vlc'
  );
  const [userAgent, setUserAgent] = useState(proxyConfig?.defaultUserAgent || 'VLC/3.0.20 LibVLC/3.0.20');
  const [referer, setReferer] = useState(proxyConfig?.defaultReferer || '');
  const [origin, setOrigin] = useState(proxyConfig?.defaultOrigin || '');
  const [cookies, setCookies] = useState(proxyConfig?.defaultCookies || '');
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>(
    proxyConfig?.customHeadersList || []
  );

  // Diagnostic live probe state
  const [testUrl, setTestUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ProxyProbeResult | null>(null);

  // Sync when prop updates
  useEffect(() => {
    if (proxyConfig) {
      setEnabled(proxyConfig.enabled ?? true);
      setForceAllStreams(proxyConfig.forceAllStreams ?? false);
      setSelectedPreset(proxyConfig.defaultPreset || 'vlc');
      setUserAgent(proxyConfig.defaultUserAgent || '');
      setReferer(proxyConfig.defaultReferer || '');
      setOrigin(proxyConfig.defaultOrigin || '');
      setCookies(proxyConfig.defaultCookies || '');
      setCustomHeaders(proxyConfig.customHeadersList || []);
    }
  }, [proxyConfig]);

  const handleApplyPreset = (preset: 'vlc' | 'tivimate' | 'apple' | 'chrome' | 'none') => {
    setSelectedPreset(preset);
    switch (preset) {
      case 'vlc':
        setUserAgent('VLC/3.0.20 LibVLC/3.0.20');
        break;
      case 'tivimate':
        setUserAgent('TiviMate/4.7.0 (Android TV)');
        break;
      case 'apple':
        setUserAgent('AppleCoreMedia/1.0.0.19F72 (iPad; U; CPU OS 15_5 like Mac OS X; fr_fr)');
        break;
      case 'chrome':
        setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        break;
      case 'none':
        setUserAgent('');
        break;
    }
  };

  const handleAddHeaderRow = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }]);
  };

  const handleRemoveHeaderRow = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  const handleHeaderRowChange = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...customHeaders];
    updated[index][field] = val;
    setCustomHeaders(updated);
  };

  const handleSaveAll = () => {
    const validCustom = customHeaders.filter((h) => h.key.trim() && h.value.trim());
    onSave({
      enabled,
      forceAllStreams,
      defaultPreset: selectedPreset,
      defaultUserAgent: userAgent.trim(),
      defaultReferer: referer.trim(),
      defaultOrigin: origin.trim(),
      defaultCookies: cookies.trim(),
      customHeadersList: validCustom
    });
    showToast('Configuration des en-têtes proxy enregistrée avec succès !');
  };

  const handleResetDefaults = () => {
    if (window.confirm('Voulez-vous restaurer les en-têtes proxy recommandés par défaut (VLC) ?')) {
      onReset();
      setSelectedPreset('vlc');
      setUserAgent('VLC/3.0.20 LibVLC/3.0.20');
      setReferer('');
      setOrigin('');
      setCookies('');
      setCustomHeaders([]);
      setForceAllStreams(false);
      setEnabled(true);
      showToast('En-têtes proxy réinitialisés aux valeurs recommandées (VLC).');
    }
  };

  const handleClearHeaders = () => {
    if (window.confirm('Voulez-vous effacer tous les en-têtes personnalisés ?')) {
      setUserAgent('');
      setReferer('');
      setOrigin('');
      setCookies('');
      setCustomHeaders([]);
      setSelectedPreset('none');
      onSave({
        defaultPreset: 'none',
        defaultUserAgent: '',
        defaultReferer: '',
        defaultOrigin: '',
        defaultCookies: '',
        customHeadersList: []
      });
      showToast('Tous les en-têtes proxy ont été effacés.');
    }
  };

  const handleRunDiagnosticTest = async () => {
    if (!testUrl.trim()) {
      showToast('Veuillez entrer une adresse URL de flux à tester.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const builtHeaders: Record<string, string> = {};
    if (userAgent.trim()) builtHeaders['User-Agent'] = userAgent.trim();
    if (referer.trim()) builtHeaders['Referer'] = referer.trim();
    if (origin.trim()) builtHeaders['Origin'] = origin.trim();
    if (cookies.trim()) builtHeaders['Cookie'] = cookies.trim();
    customHeaders.forEach((h) => {
      if (h.key.trim() && h.value.trim()) builtHeaders[h.key.trim()] = h.value.trim();
    });

    const result = await testProxyStreamConnection(testUrl.trim(), builtHeaders);
    setTestResult(result);
    setIsTesting(false);
  };

  return (
    <div className="glass-strong rounded-3xl p-6 md:p-8 border border-white/10 space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-900/40 flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-white">
                En-têtes HTTP & Proxy M3U (User-Agent, Referer, Cookies)
              </h2>
              <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold uppercase">
                Anti-Blocage 403
              </span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold uppercase">
                Réservé Admin
              </span>
            </div>
            <p className="text-xs text-white/60 mt-0.5">
              Contournez les restrictions 403 Forbidden, les blocages d'agents et les exigences de cookies des serveurs IPTV lors du passage par notre proxy HTTPS.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => {
              const nextState = !enabled;
              setEnabled(nextState);
              onSave({ enabled: nextState });
              showToast(nextState ? 'Proxy NovaStream activé.' : 'Proxy NovaStream désactivé.');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
              enabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'glass text-white/50 border-white/10 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
            <span>{enabled ? 'Proxy Actif' : 'Proxy Inactif'}</span>
          </button>
        </div>
      </div>

      {/* Main Options / Force All */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Injection Automatique des En-têtes</span>
              <span className="text-[10px] text-white/50 block">
                Injecte vos en-têtes personnalisés sur tous les flux HTTP et ceux avec configuration spécifique.
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
              ACTIF
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 flex items-center justify-between">
          <div className="space-y-0.5 pr-2">
            <span className="text-xs font-bold text-white block">Forcer le Proxy pour Tous les Flux</span>
            <span className="text-[10px] text-white/50 block">
              Même les flux HTTPS natifs transiteront par le proxy pour garantir la présence des en-têtes et cookies.
            </span>
          </div>
          <button
            onClick={() => {
              const next = !forceAllStreams;
              setForceAllStreams(next);
              onSave({ forceAllStreams: next });
              showToast(next ? 'Forçage du proxy activé pour tous les flux.' : 'Forçage désactivé (mode hybride intelligent).');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              forceAllStreams
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                : 'glass text-white/60 hover:text-white border border-white/10'
            }`}
          >
            {forceAllStreams ? 'OUI' : 'NON'}
          </button>
        </div>
      </div>

      {/* Quick Presets Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white/80 block uppercase tracking-wider text-[11px]">
            Profils Prédéfinis Rapides (1 Clic)
          </span>
          <span className="text-[10px] text-white/40">
            Sélectionnez un profil pour renseigner l'User-Agent recommandé
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'vlc', label: 'VLC Media Player', tag: 'Recommandé IPTV', icon: Server },
            { id: 'tivimate', label: 'TiviMate IPTV', tag: 'Android TV', icon: Tv },
            { id: 'apple', label: 'Apple CoreMedia', tag: 'iOS / Safari HLS', icon: Apple },
            { id: 'chrome', label: 'Chrome Desktop', tag: 'Navigateur PC', icon: Monitor },
            { id: 'none', label: 'Standard / Neutre', tag: 'Sans en-tête', icon: Globe }
          ].map((preset) => {
            const isSelected = selectedPreset === preset.id;
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset.id as any)}
                className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between space-y-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-500 shadow-lg shadow-purple-950/40 text-white'
                    : 'glass border-white/5 hover:border-white/20 text-white/70 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-purple-300' : 'text-white/40'}`} />
                  {isSelected && <span className="text-[10px] text-purple-300 font-bold">✓</span>}
                </div>
                <div>
                  <span className="text-xs font-bold block truncate">{preset.label}</span>
                  <span className="text-[9px] text-white/50 block font-mono">{preset.tag}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Fields: User-Agent, Referer, Cookies, Origin */}
      <div className="space-y-4 pt-1">
        {/* 1. User-Agent */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <span>User-Agent (Agent Utilisateur)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                Principal contournement 403
              </span>
            </label>
            <span className="text-[10px] text-white/40 hidden sm:inline font-mono">En-tête: User-Agent</span>
          </div>
          <input
            type="text"
            value={userAgent}
            onChange={(e) => {
              setUserAgent(e.target.value);
              setSelectedPreset('custom');
            }}
            placeholder="Ex: VLC/3.0.20 LibVLC/3.0.20 ou TiviMate/4.7.0"
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:border-purple-500 outline-none transition"
          />
          <p className="text-[11px] text-white/50 leading-relaxed">
            Transmis à chaque segment HLS (.m3u8, .ts, .m4s). Les serveurs IPTV bloquent 95% des requêtes provenant de navigateurs web ordinaires avec un code 403 Forbidden.
          </p>
        </div>

        {/* 2. Referer & Origin */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span>Referer (Page Référente)</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  Anti-Hotlinking
                </span>
              </label>
            </div>
            <input
              type="text"
              value={referer}
              onChange={(e) => setReferer(e.target.value)}
              placeholder="Ex: https://fournisseur-iptv.com/"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:border-cyan-500 outline-none transition"
            />
            <p className="text-[10px] text-white/50">
              Requis par les fournisseurs qui vérifient que la requête provient bien de leur site web officiel.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <span>Origin (Origine CORS)</span>
              </label>
            </div>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Ex: https://fournisseur-iptv.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:border-cyan-500 outline-none transition"
            />
            <p className="text-[10px] text-white/50">
              Domaine d'origine injecté dans l'en-tête HTTP 'Origin' pour satisfaire les pare-feux stricts.
            </p>
          </div>
        </div>

        {/* 3. Cookies & Session Tokens */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <Cookie className="w-3.5 h-3.5 text-amber-400" />
              <span>Cookies & Jetons de Session (En-tête Cookie)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                Flux avec Session / Auth
              </span>
            </label>
            <span className="text-[10px] text-white/40 hidden sm:inline font-mono">En-tête: Cookie</span>
          </div>
          <textarea
            rows={2}
            value={cookies}
            onChange={(e) => setCookies(e.target.value)}
            placeholder="Ex: PHPSESSID=d9s8f7e6d5c4b3a2; token=eyJhbGci...; cf_clearance=x1y2z3..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:border-amber-500 outline-none transition resize-y"
          />
          <p className="text-[11px] text-white/50 leading-relaxed">
            Format standard de cookies HTTP séparés par des points-virgules (<code>nom=valeur; nom2=valeur2</code>). Ces cookies sont attachés à chaque requête de playlist et de segment .ts via le proxy.
          </p>
        </div>

        {/* 4. Additional Custom Headers (Key / Value) */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">En-têtes Additionnels Personnalisés</span>
              <span className="text-[10px] text-white/50">
                Ajoutez d'autres en-têtes spécifiques (ex: <code>Authorization</code>, <code>X-Forwarded-For</code>, <code>Accept-Language</code>)
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddHeaderRow}
              className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un en-tête</span>
            </button>
          </div>

          {customHeaders.length === 0 ? (
            <div className="p-3 text-center rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-white/40 text-xs">
              Aucun en-tête additionnel configuré. Cliquez sur "+ Ajouter un en-tête" pour en créer un.
            </div>
          ) : (
            <div className="space-y-2">
              {customHeaders.map((hdr, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={hdr.key}
                    onChange={(e) => handleHeaderRowChange(idx, 'key', e.target.value)}
                    placeholder="Nom (ex: Authorization)"
                    className="w-1/3 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:border-purple-500 outline-none"
                  />
                  <input
                    type="text"
                    value={hdr.value}
                    onChange={(e) => handleHeaderRowChange(idx, 'value', e.target.value)}
                    placeholder="Valeur (ex: Bearer eyJ...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:border-purple-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHeaderRow(idx)}
                    className="p-2 rounded-xl glass hover:bg-red-500/20 text-red-400 hover:text-red-300 transition"
                    title="Supprimer cet en-tête"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Live Interactive Diagnostic Tester */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-black/60 to-purple-950/20 border border-purple-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Outil de Test & Diagnostic Live du Proxy
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setTestUrl('http://service-stitcher.clusters.pluto.tv/stitch/hls/channel/5f1712a76f25cb0007204f14/master.m3u8');
            }}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
          >
            Insérer URL exemple
          </button>
        </div>

        <p className="text-[11px] text-white/60 leading-relaxed">
          Saisissez une adresse de flux M3U / M3U8 pour envoyer une requête sonde via le proxy avec vos en-têtes actuels et vérifier instantanément le statut retourné par le serveur.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="https://serveur.com/chaine/live.m3u8"
            className="w-full flex-1 px-3.5 py-2.5 rounded-xl bg-black/70 border border-white/15 text-white font-mono text-xs focus:border-purple-500 outline-none"
          />
          <button
            type="button"
            onClick={handleRunDiagnosticTest}
            disabled={isTesting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition flex-shrink-0 disabled:opacity-50 shadow-lg shadow-purple-900/40 cursor-pointer"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Test en cours...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Tester la connexion</span>
              </>
            )}
          </button>
        </div>

        {/* Diagnostic Results Box */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border space-y-2 text-xs font-mono animate-fade-in ${
              testResult.ok
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-red-950/40 border-red-500/40 text-red-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    testResult.ok ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'
                  }`}
                >
                  HTTP {testResult.status} {testResult.statusText}
                </span>
                <span className="text-white/80 font-bold">
                  {testResult.ok ? 'Connexion réussie !' : 'Requête bloquée ou rejetée'}
                </span>
              </div>
              <span className="text-white/60 text-[11px]">
                Latence : <strong>{testResult.latencyMs} ms</strong>
              </span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div>
                <span className="text-white/50">Type de contenu : </span>
                <span className="text-white font-bold">{testResult.contentType}</span>
              </div>
              {testResult.error && (
                <div>
                  <span className="text-red-400">Erreur : </span>
                  <span className="text-white">{testResult.error}</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-white/70 pt-1 font-sans">
              {testResult.ok ? (
                <span>
                  🎉 <strong>Flux débloqué :</strong> Le serveur accepte les en-têtes configurés. Vous pouvez lire ce flux dans l'application sans rencontrer d'erreur 403.
                </span>
              ) : testResult.status === 403 ? (
                <span>
                  ⚠️ <strong>Code 403 (Forbidden) :</strong> Le serveur bloque la requête. Essayez de sélectionner le profil <strong>VLC Media Player</strong>, ou vérifiez que le <strong>Referer</strong> ou vos <strong>Cookies</strong> sont corrects.
                </span>
              ) : (
                <span>
                  ⚠️ Le serveur a répondu avec le statut {testResult.status}. Vérifiez la validité du lien ou le protocole du flux.
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl glass hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white transition"
          >
            Restaurer défaut (VLC)
          </button>
          <button
            type="button"
            onClick={handleClearHeaders}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl glass hover:bg-red-500/20 text-xs font-semibold text-red-400 hover:text-red-300 transition"
          >
            Effacer tous les en-têtes
          </button>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xl shadow-purple-950/50 cursor-pointer active:scale-98"
        >
          <Check className="w-4 h-4" />
          <span>Enregistrer les en-têtes HTTP</span>
        </button>
      </div>
    </div>
  );
}

export default SettingsPage;
