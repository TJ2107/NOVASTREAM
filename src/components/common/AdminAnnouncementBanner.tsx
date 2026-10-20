import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Info,
  Sparkles,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Megaphone
} from 'lucide-react';
import {
  Announcement,
  subscribeToActiveAnnouncements
} from '../../services/announcementService';
import { useAuthStore } from '../../store/useAuthStore';

const STORAGE_KEY = 'novastream_dismissed_announcements';

export function AdminAnnouncementBanner() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToActiveAnnouncements((list) => {
      // Filter for this user: target is 'all' or targetEmail matches user email or target matches uid
      const relevant = list.filter((item) => {
        if (!item.active) return false;
        if (item.target === 'all' || !item.target) return true;
        if (user?.email && item.targetEmail && item.targetEmail.toLowerCase() === user.email.toLowerCase()) return true;
        if (user?.uid && item.target === user.uid) return true;
        return false;
      });
      setAnnouncements(relevant);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Only take active announcements not dismissed yet
  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.includes(a.id));

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  // Display the first or highest priority announcement
  const current = visibleAnnouncements[0];
  const isExpanded = expandedId === current.id;
  const isUrgent = current.priority === 'urgent';

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'alert':
        return {
          icon: AlertTriangle,
          badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
          containerBorder: 'border-red-500/40 bg-gradient-to-r from-red-950/80 via-black to-red-950/40',
          accent: 'text-red-400',
          label: 'Alerte Admin'
        };
      case 'promotion':
        return {
          icon: Sparkles,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          containerBorder: 'border-amber-500/40 bg-gradient-to-r from-amber-950/80 via-[#120e03] to-purple-950/40',
          accent: 'text-amber-400',
          label: 'Offre Spéciale'
        };
      case 'update':
        return {
          icon: CheckCircle2,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          containerBorder: 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-black to-teal-950/40',
          accent: 'text-emerald-400',
          label: 'Mise à jour'
        };
      case 'info':
      default:
        return {
          icon: Info,
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          containerBorder: 'border-indigo-500/40 bg-gradient-to-r from-indigo-950/80 via-[#0a0a20] to-cyan-950/40',
          accent: 'text-cyan-400',
          label: 'Message Admin'
        };
    }
  };

  const config = getTypeConfig(current.type);
  const IconComponent = config.icon;

  return (
    <div className={`relative z-20 border-b px-3 sm:px-6 py-2.5 sm:py-3 transition-all backdrop-blur-xl ${config.containerBorder} ${
      isUrgent ? 'shadow-[0_4px_25px_rgba(229,9,20,0.3)] animate-pulse' : 'shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        {/* Left info */}
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
            <IconComponent className={`w-4 h-4 ${config.accent}`} />
          </div>

          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${config.badgeColor}`}>
                {config.label}
              </span>
              {current.pinned && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                  Épinglé
                </span>
              )}
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                {current.title}
              </h4>
            </div>

            <p className={`text-[11px] sm:text-xs text-white/80 leading-relaxed ${isExpanded ? '' : 'line-clamp-1 sm:line-clamp-2'}`}>
              {current.content}
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center justify-end gap-2 flex-shrink-0 pt-1 sm:pt-0">
          {current.content.length > 80 && (
            <button
              onClick={() => setExpandedId(isExpanded ? null : current.id)}
              className="text-[11px] text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition flex items-center gap-1 cursor-pointer"
            >
              <span>{isExpanded ? 'Réduire' : 'Lire plus'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={() => handleDismiss(current.id)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/10"
            title="Masquer ce message"
          >
            <X className="w-3.5 h-3.5 text-white/70" />
            <span>Fermer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
