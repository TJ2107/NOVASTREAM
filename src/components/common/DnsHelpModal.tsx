import React from 'react';
import { AlertTriangle, X, ShieldCheck, Globe } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface DnsHelpModalProps {
  onClose: () => void;
  onReload?: () => void;
  handleNavigateDomain?: (domain: string) => void;
}

export function DnsHelpModal({ onClose, onReload, handleNavigateDomain }: DnsHelpModalProps) {
  const { vpnEnabled, vpnServer, toggleVPN } = useAppStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl glass-strong border border-amber-500/40 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pourquoi « Impossible de trouver l'adresse IP » ?</h3>
              <p className="text-xs text-white/50">Explication technique et solutions immédiates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-white/80 leading-relaxed">
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 space-y-1">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>🚨 Cause du blocage : Filtrage DNS par votre opérateur (FAI)</span>
            </div>
            <p className="text-[11px] text-white/70">
              En France (Orange, Free, SFR, Bouygues) et dans plusieurs pays d'Europe, des ordonnances judiciaires imposent aux fournisseurs d'accès de <strong>bloquer la résolution DNS</strong>. Votre opérateur ment ou renvoie <code className="text-red-400 font-mono">NXDOMAIN</code>, empêchant votre navigateur de trouver son adresse IP.
            </p>
          </div>

          {/* Solution 0 : Swiss VPN */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-teal-950/40 border border-emerald-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-2 text-xs">
                <span className="text-base">🇨🇭</span>
                <span className="text-emerald-300">Solution recommandée : Activer le Bouclier VPN Suisse</span>
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                1 TAP
              </span>
            </div>
            <p className="text-[11px] text-white/80 leading-relaxed italic">
              « Un tap, et votre connexion est chiffrée : au café, à l'hôtel, dans le train. Changez de pays, passez les blocages. Serveurs suisses, pas de logs, pas de bridage. »
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-white/50">
                {vpnEnabled ? `Connecté à ${vpnServer.city} (${vpnServer.ip})` : 'VPN actuellement inactif'}
              </span>
              <button
                onClick={() => {
                  if (!vpnEnabled) toggleVPN();
                  onClose();
                  if (onReload) onReload();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{vpnEnabled ? 'VPN Déjà Actif (Recharger)' : 'Activer en 1 Tap'}</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Solution 3 : Activer le DNS sécurisé dans votre navigateur (2 clics)</span>
            </h4>
            <p className="text-[11px] text-white/70">
              Cette option désactive le filtrage DNS de votre box internet sans installer aucun logiciel :
            </p>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-[11px] font-mono text-cyan-200">
              <div>• <strong>Chrome / Edge / Brave :</strong> Paramètres ➔ Confidentialité et sécurité ➔ Sécurité ➔ Cocher « Utiliser un DNS sécurisé » ➔ Sélectionner <em>Cloudflare (1.1.1.1)</em> ou <em>Google (8.8.8.8)</em>.</div>
              <div>• <strong>Firefox :</strong> Paramètres ➔ Vie privée et sécurité ➔ DNS via HTTPS ➔ Protection maximale (Cloudflare).</div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold text-white transition"
          >
            Compris, fermer
          </button>
        </div>
      </div>
    </div>
  );
}
