import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Power,
  Lock,
  Globe,
  Zap,
  CheckCircle2,
  RefreshCw,
  Server,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
  Clock,
  Activity,
  KeyRound,
  EyeOff
} from 'lucide-react';
import { useAppStore, VPN_SERVERS, type VPNServer } from '../store/useAppStore';

export function VPNPage() {
  const navigate = useNavigate();
  const {
    vpnEnabled,
    vpnServer,
    vpnProtocol,
    vpnKillSwitch,
    vpnConnectedSince,
    toggleVPN,
    setVPNServer,
    setVPNProtocol,
    setVPNKillSwitch,
    tvMode
  } = useAppStore();

  const [connectedTime, setConnectedTime] = useState<string>('00:00:00');
  const [dataSaved, setDataSaved] = useState<string>('1.4 Go');
  const [testResult, setTestResult] = useState<{ domain: string; status: 'ok' | 'blocked'; latency: number } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Connection timer
  useEffect(() => {
    if (!vpnEnabled || !vpnConnectedSince) {
      setConnectedTime('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const diffSecs = Math.floor((Date.now() - vpnConnectedSince) / 1000);
      const h = Math.floor(diffSecs / 3600);
      const m = Math.floor((diffSecs % 3600) / 60);
      const s = diffSecs % 60;
      const pad = (n: number) => n.toString().padStart(2, '0');
      setConnectedTime(`${pad(h)}:${pad(m)}:${pad(s)}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [vpnEnabled, vpnConnectedSince]);

  const handleTestDomain = async (domain: string) => {
    setIsTesting(true);
    setTestResult(null);
    const start = Date.now();
    try {
      const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
        headers: { accept: 'application/dns-json' }
      });
      const data = await res.json();
      const latency = Date.now() - start;
      if (data.Answer && data.Answer.length > 0) {
        setTestResult({ domain, status: 'ok', latency });
      } else {
        setTestResult({ domain, status: 'blocked', latency });
      }
    } catch {
      setTestResult({ domain, status: 'blocked', latency: Date.now() - start });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 pb-32 md:pb-16 max-w-6xl mx-auto space-y-8 select-none">
      {/* Hero Header with requested quote */}
      <div className="relative rounded-3xl overflow-hidden glass-strong border border-emerald-500/30 p-6 md:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-[#0a0a24]/60 to-teal-950/30 pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 font-mono shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>🇨🇭 BOUCLIER VPN SUISSE & CHIFFREMENT ÉTENDU</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
            VPN NOVASTREAM
          </h1>

          {/* User's exact prompt highlighted */}
          <blockquote className="p-3 rounded-2xl bg-black/40 border border-emerald-500/20 text-white/90 text-xs md:text-sm leading-relaxed font-medium italic backdrop-blur-md">
            « Un tap, et votre connexion est chiffrée : au café, à l'hôtel, dans le train. Changez de pays, passez les blocages. Serveurs suisses, pas de logs, pas de bridage. »
          </blockquote>

          <p className="text-[10px] md:text-xs text-white/60">
            Protégez vos flux vidéo contre le filtrage DNS de votre opérateur (Orange, Free, SFR, Bouygues), contournez les blocages géographiques et profitez d'une bande passante illimitée sous juridiction suisse stricte.
          </p>
        </div>
      </div>

      {/* Main One-Tap Power Center */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Giant One-Tap Button Card */}
        <div className="xl:col-span-4 glass-strong rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/5">
              Kill Switch: {vpnKillSwitch ? 'ON' : 'OFF'}
            </span>
          </div>

          <div className="space-y-1 mb-6">
            <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest font-mono">
              État du Bouclier
            </h3>
            <div
              className={`text-xl font-black transition-colors ${
                vpnEnabled ? 'text-emerald-400' : 'text-white/40'
              }`}
            >
              {vpnEnabled ? 'PROTÉGÉ & CHIFFRÉ' : 'DÉCONNECTÉ'}
            </div>
            <p className="text-[10px] text-white/50">
              {vpnEnabled
                ? `Connecté à ${vpnServer.flag} ${vpnServer.country} (${vpnServer.city})`
                : 'Appuyez pour activer la protection'}
            </p>
          </div>

          {/* Giant One-Tap Toggle Button */}
          <div className="relative my-2">
            {vpnEnabled && (
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
            )}

            <button
              onClick={toggleVPN}
              className={`relative w-28 h-28 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-2xl border-4 ${
                vpnEnabled
                  ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 border-emerald-300 text-white shadow-emerald-600/50 hover:scale-105'
                  : 'bg-gradient-to-br from-[#1a1a36] to-[#0d0d24] border-white/10 text-white/40 hover:text-white hover:border-white/30 hover:scale-105 shadow-black/60'
              } ${tvMode ? 'tv-focusable' : ''}`}
              title={vpnEnabled ? 'Désactiver le VPN' : 'Activer le VPN en 1 tap'}
            >
              <Power className={`w-8 h-8 md:w-10 md:h-10 mb-1 ${vpnEnabled ? 'animate-pulse' : ''}`} />
              <span className="text-[9px] md:text-[10px] font-black tracking-wider uppercase">
                {vpnEnabled ? 'DÉCONNECTER' : 'ACTIVER'}
              </span>
            </button>
          </div>

          {/* Real-time stats footer */}
          <div className="w-full grid grid-cols-2 gap-2 mt-6 pt-4 border-t border-white/10 text-[10px]">
            <div className="glass p-2 rounded-xl">
              <span className="text-[8px] text-white/40 uppercase block mb-0.5">Durée active</span>
              <span className="font-mono font-bold text-white text-[11px]">{connectedTime}</span>
            </div>
            <div className="glass p-2 rounded-xl">
              <span className="text-[8px] text-white/40 uppercase block mb-0.5">IP Virtuelle</span>
              <span className="font-mono font-bold text-cyan-300 text-[11px]">
                {vpnEnabled ? vpnServer.ip : 'Masquée'}
              </span>
            </div>
          </div>
        </div>

        {/* Swiss & Global Servers Selector */}
        <div className="xl:col-span-8 glass-strong rounded-2xl md:rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col justify-between shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Emplacement des Serveurs</span>
              </h3>
              <p className="text-[10px] text-white/50">Serveurs ultra-rapides • Priorité Suisse 🇨🇭</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full self-start">
              7 serveurs actifs
            </span>
          </div>

          {/* Servers list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto max-h-[320px] pr-1">
            {VPN_SERVERS.map((server) => {
              const isSelected = vpnServer.id === server.id;
              return (
                <button
                  key={server.id}
                  onClick={() => {
                    setVPNServer(server);
                    if (!vpnEnabled) toggleVPN();
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-400 text-white shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/50'
                      : 'glass hover:bg-white/10 border-white/5 text-white/80 hover:text-white'
                  } ${tvMode ? 'tv-focusable' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg leading-none flex-shrink-0">{server.flag}</span>
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

                  <div className="text-right flex-shrink-0 pl-2">
                    <span className="text-[9px] font-mono text-emerald-400 block font-bold">
                      {server.ping}ms
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick DNS & Portals bypass tester */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-white flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Tester le déblocage DNS :</span>
              </span>
              {testResult && (
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Résolu en {testResult.latency}ms
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['vavoo.to', 'oha.to', 'huhu.to', 'kool.ws'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleTestDomain(d)}
                  disabled={isTesting}
                  className="px-2 py-0.5 rounded-lg glass hover:bg-cyan-600/30 border border-white/10 text-[10px] font-mono text-cyan-200 transition"
                >
                  Test {d}
                </button>
              ))}

              <button
                onClick={() => navigate('/browser')}
                className="ml-auto px-2 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-semibold flex items-center gap-1 transition"
              >
                <span>Navigateur</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Features: Swiss servers, No logs, No throttling, Military encryption */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass rounded-2xl p-3 border border-white/10 space-y-1">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-lg">
            🇨🇭
          </div>
          <h4 className="font-bold text-xs text-white">Serveurs Suisses</h4>
          <p className="text-[10px] text-white/50 leading-relaxed">
            Hébergés sous la stricte loi suisse sur la protection des données (LPD). Aucun accord 14 Eyes.
          </p>
        </div>

        <div className="glass rounded-2xl p-3 border border-white/10 space-y-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <EyeOff className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-white">Politique Zéro Logs</h4>
          <p className="text-[10px] text-white/50 leading-relaxed">
            Aucun historique de navigation, aucune adresse IP source ni requête DNS ne sont jamais enregistrés.
          </p>
        </div>

        <div className="glass rounded-2xl p-3 border border-white/10 space-y-1">
          <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-white">Aucun Bridage FAI</h4>
          <p className="text-[10px] text-white/50 leading-relaxed">
            Contournez les limitations de bande passante appliquées par les opérateurs pendant les heures de pointe.
          </p>
        </div>

        <div className="glass rounded-2xl p-3 border border-white/10 space-y-1">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Lock className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs text-white">Chiffrement ChaCha20</h4>
          <p className="text-[10px] text-white/50 leading-relaxed">
            Sécurité maximale sur les réseaux Wi-Fi publics (gares, hôtels, aéroports, cafés) en un seul tap.
          </p>
        </div>
      </div>

      {/* Mobility Scenarios Banner: Cafe, Hotel, Train, Bypass Blocks */}
      <div className="glass-strong rounded-3xl p-4 md:p-6 border border-white/10 space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>Protection Nomade en 1 Tap : Partout où vous voyagez</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <div className="text-xl">☕</div>
            <h4 className="font-bold text-white text-xs">Au café</h4>
            <p className="text-[10px] text-white/60 leading-relaxed">
              Les Wi-Fi des cafés ne sont pas sécurisés. Un simple tap active le tunnel chiffré pour masquer vos mots de passe et votre trafic vidéo contre les pirates sur le même réseau.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <div className="text-xl">🏨</div>
            <h4 className="font-bold text-white text-xs">À l'hôtel</h4>
            <p className="text-[10px] text-white/60 leading-relaxed">
              Les connexions d'hôtels bloquent souvent l'IPTV et brident le débit vidéo. Notre serveur suisse élimine le bridage pour un streaming haute définition fluide et sans coupures.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <div className="text-xl">🚆</div>
            <h4 className="font-bold text-white text-xs">Dans le train</h4>
            <p className="text-[10px] text-white/60 leading-relaxed">
              Grâce au protocole WireGuard résilient et au Kill Switch intégré, vos flux vidéo continuent de fonctionner automatiquement même lors des changements d'antennes relais 4G/5G.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VPNPage;
