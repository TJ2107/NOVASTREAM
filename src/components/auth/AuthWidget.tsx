import React, { useState } from 'react';
import { User, LogIn, LogOut, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface Props {
  collapsed?: boolean;
}

export function AuthWidget({ collapsed = false }: Props) {
  const { user, isAdmin, signInWithGoogle, signOut } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async () => {
    setLoading(true);
    try {
      if (user) {
        await signOut();
      } else {
        await signInWithGoogle();
      }
    } catch (error) {
      // handled
    } finally {
      setLoading(false);
    }
  };

  if (collapsed) {
    return (
      <button
        onClick={handleAuthAction}
        disabled={loading}
        className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition shadow-md ${
          user
            ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white'
            : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
        }`}
        title={user ? `Connecté: ${user.displayName || user.email}` : 'Connexion Google'}
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
        ) : user ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <LogIn className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <div className="p-3 rounded-2xl glass border border-white/10 space-y-2.5">
      {user ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-indigo-950 border border-indigo-400/40">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate">{user.displayName || 'Utilisateur'}</span>
                {isAdmin && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] font-mono font-bold">
                    ADMIN
                  </span>
                )}
              </div>
              <span className="text-[10px] text-white/60 truncate block">{user.email}</span>
            </div>
          </div>

          <button
            onClick={handleAuthAction}
            disabled={loading}
            className="p-2 rounded-xl glass hover:bg-white/15 text-rose-400 hover:text-rose-300 transition"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 flex items-center justify-center text-cyan-300">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Compte Google</span>
              <span className="text-[10px] text-white/60 block">Synchronisez vos favoris & avis</span>
            </div>
          </div>

          <button
            onClick={handleAuthAction}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{loading ? 'Connexion...' : 'Connexion Google'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
