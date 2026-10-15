import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Users,
  MessageSquare,
  Star,
  Search,
  RefreshCcw,
  Clock,
  Mail,
  UserCheck,
  Award,
  Sparkles,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Calendar,
  Activity,
  CheckCircle2,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { getTodayKey } from '../services/analyticsService';
import { Link } from 'react-router-dom';

interface UserLog {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  role: string;
  lastLogin: any;
  lastLoginDate?: string;
  loginDates?: string[];
}

interface UserFeedback {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhoto: string;
  rating: number;
  category: string;
  comment: string;
  timestamp: any;
}

export default function AdminPage() {
  const { user, isAdmin } = useAuthStore();
  const [usersList, setUsersList] = useState<UserLog[]>([]);
  const [feedbackList, setFeedbackList] = useState<UserFeedback[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'feedback'>('stats');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const todayKey = useMemo(() => getTodayKey(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  useEffect(() => {
    // Listen to users collection in real time
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as UserLog),
        uid: docSnap.id
      }));
      setUsersList(items);
    });

    // Listen to feedback collection in real time
    const unsubFeedback = onSnapshot(
      query(collection(db, 'feedback'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as UserFeedback),
          id: docSnap.id
        }));
        setFeedbackList(items);
      }
    );

    return () => {
      unsubUsers();
      unsubFeedback();
    };
  }, []);

  // Helper to parse date from user's lastLogin
  const isUserConnectedOnDate = (u: UserLog, dateKey: string) => {
    if (u.lastLoginDate === dateKey) return true;
    if (u.loginDates && Array.isArray(u.loginDates) && u.loginDates.includes(dateKey)) return true;
    if (u.lastLogin) {
      try {
        const d = u.lastLogin.toDate ? u.lastLogin.toDate() : new Date(u.lastLogin);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}` === dateKey;
        }
      } catch (e) {
        // ignore format issues
      }
    }
    return false;
  };

  // Generate last 14 days list for stats & charts
  const past14Days = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      list.push(`${y}-${m}-${day}`);
    }
    return list;
  }, []);

  // Compute stats per day for the last 14 days
  const dailyStatsMap = useMemo(() => {
    return past14Days.map((dateKey) => {
      const connectedUsers = usersList.filter((u) => isUserConnectedOnDate(u, dateKey));
      return {
        dateKey,
        count: connectedUsers.length,
        users: connectedUsers
      };
    });
  }, [past14Days, usersList]);

  // Today stats
  const todayUsers = useMemo(() => {
    return usersList.filter((u) => isUserConnectedOnDate(u, todayKey));
  }, [usersList, todayKey]);

  const todayCount = todayUsers.length;

  // Selected date users
  const selectedDateUsers = useMemo(() => {
    return usersList.filter((u) => isUserConnectedOnDate(u, selectedDate));
  }, [usersList, selectedDate]);

  // Peak daily active users in the past 14 days
  const maxDayCount = useMemo(() => {
    const max = Math.max(...dailyStatsMap.map((d) => d.count), 1);
    return max;
  }, [dailyStatsMap]);

  // Average daily users
  const avgDailyUsers = useMemo(() => {
    if (dailyStatsMap.length === 0) return 0;
    const total = dailyStatsMap.reduce((acc, curr) => acc + curr.count, 0);
    return (total / dailyStatsMap.length).toFixed(1);
  }, [dailyStatsMap]);

  // Format date helper in French
  const formatDateLabel = (dateKey: string) => {
    if (dateKey === todayKey) return "Aujourd'hui";
    const [year, month, day] = dateKey.split('-').map(Number);
    const d = new Date(year, month - 1, day);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    if (dateKey === yKey) return 'Hier';

    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatFullDate = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Filtered feedback
  const filteredFeedback = feedbackList.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.userName.toLowerCase().includes(q) ||
      item.userEmail.toLowerCase().includes(q) ||
      item.comment.toLowerCase().includes(q)
    );
  });

  // Filtered all users
  const filteredAllUsers = usersList.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.uid && u.uid.toLowerCase().includes(q))
    );
  });

  // Calculate average rating
  const avgRating =
    feedbackList.length > 0
      ? (feedbackList.reduce((acc, curr) => acc + (curr.rating || 5), 0) / feedbackList.length).toFixed(1)
      : '5.0';

  // Strict Access Control: Only admin account allowed
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#060612] text-white p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-[#FF5A5F] flex items-center justify-center border border-red-500/30 shadow-xl shadow-red-950/50">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl md:text-2xl font-black">Accès Réservé à l'Administrateur</h2>
        <p className="text-xs md:text-sm text-white/60 max-w-md leading-relaxed">
          Ce module est exclusivement réservé au compte administrateur (<span className="text-amber-400 font-mono font-semibold">cyber.kan587@gmail.com</span>). Vous n'avez pas les droits d'accès à cette section.
        </p>
        <Link 
          to="/" 
          className="mt-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition border border-white/10"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060612] text-white p-4 md:p-8 select-none space-y-8 animate-fadeIn pb-24">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-3xl glass-strong border border-indigo-500/30 shadow-2xl bg-gradient-to-r from-indigo-950/60 via-[#0c0c26] to-purple-950/60">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/50 flex-shrink-0">
            <ShieldAlert className="w-7 h-7 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white">Module d'Administration & Statistiques</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-400/40 text-[10px] font-mono text-amber-300 font-bold uppercase">
                ADMIN ACCESS
              </span>
            </div>
            <p className="text-xs text-white/60 mt-0.5">
              Suivi en temps réel des connexions par jour, logs d'utilisateurs et critiques d'évolution de NOVASTREAM.
            </p>
          </div>
        </div>

        {/* Top KPIs Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Daily Active Users (DAU) Counter */}
          <div className="px-4 py-3 rounded-2xl glass border border-emerald-500/30 bg-emerald-950/15 flex items-center gap-3 shadow-md">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 relative">
              <Activity className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-300/80 block font-bold leading-tight">AUJOURD'HUI</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-emerald-400">{todayCount}</span>
                <span className="text-[10px] text-emerald-200/60 font-mono">actifs</span>
              </div>
            </div>
          </div>

          {/* Total Registered Users */}
          <div className="px-4 py-3 rounded-2xl glass border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-white/50 block font-bold leading-tight">INSCRITS</span>
              <span className="text-lg font-black text-white">{usersList.length}</span>
            </div>
          </div>

          {/* Feedback Count */}
          <div className="px-4 py-3 rounded-2xl glass border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-white/50 block font-bold leading-tight">AVIS & RETOURS</span>
              <span className="text-lg font-black text-white">{feedbackList.length}</span>
            </div>
          </div>

          {/* Average Rating */}
          <div className="px-4 py-3 rounded-2xl glass border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <span className="text-[10px] text-white/50 block font-bold leading-tight">NOTE MOYENNE</span>
              <span className="text-lg font-black text-amber-300">{avgRating}/5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-300" />
            <span>Compteur & Stats par Jour</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-200 text-[10px] font-mono">
              {todayCount} aujourd'hui
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Tous les Utilisateurs ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'feedback'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Critiques & Avis ({feedbackList.length})</span>
          </button>
        </div>

        {/* Contextual Action / Info */}
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>Aujourd'hui : {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* TAB 1: DAILY STATS & CONNECTED USERS COUNTER */}
      {activeTab === 'stats' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Highlights Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-3xl glass-strong border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-black/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-emerald-300/80 tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Connectés Aujourd'hui (DAU)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold animate-pulse">
                  EN DIRECT
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl md:text-5xl font-black text-white">{todayCount}</span>
                <span className="text-xs text-white/60 font-mono">
                  {usersList.length > 0 ? `(${((todayCount / usersList.length) * 100).toFixed(0)}% du total)` : ''}
                </span>
              </div>
              <p className="text-xs text-white/60">
                Nombre d'utilisateurs uniques qui ont accédé à l'application aujourd'hui ({todayKey}).
              </p>
            </div>

            <div className="p-6 rounded-3xl glass border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-white/60 tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Pic Journalier (14j)
                </span>
                <span className="text-[10px] text-white/40 font-mono">Record récent</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl md:text-5xl font-black text-amber-300">{maxDayCount}</span>
                <span className="text-xs text-white/60 font-mono">utilisateurs max/j</span>
              </div>
              <p className="text-xs text-white/60">
                Plus haut pic d'utilisateurs distincts connectés sur une même journée.
              </p>
            </div>

            <div className="p-6 rounded-3xl glass border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-white/60 tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Moyenne Quotidienne
                </span>
                <span className="text-[10px] text-white/40 font-mono">Sur 14 jours</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl md:text-5xl font-black text-cyan-300">{avgDailyUsers}</span>
                <span className="text-xs text-white/60 font-mono">users / jour</span>
              </div>
              <p className="text-xs text-white/60">
                Moyenne d'utilisateurs connectés quotidiennement sur les deux dernières semaines.
              </p>
            </div>
          </div>

          {/* Interactive Daily Active Users Bar Chart (14 days) */}
          <div className="p-6 rounded-3xl glass-strong border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <span>Évolution des Utilisateurs Connectés par Jour</span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Cliquez sur une barre pour afficher la liste des utilisateurs connectés pour cette date spécifique.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-white/70">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Aujourd'hui
                </span>
                <span className="flex items-center gap-1.5 text-white/70 ml-2">
                  <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> Autres Jours
                </span>
              </div>
            </div>

            {/* Bar Chart Container */}
            <div className="pt-8 pb-4 px-2">
              <div className="h-48 flex items-end gap-2 sm:gap-4 justify-between border-b border-white/10 pb-2">
                {dailyStatsMap.map((item) => {
                  const isSelected = selectedDate === item.dateKey;
                  const isToday = item.dateKey === todayKey;
                  // Compute bar height percentage relative to peak
                  const heightPercent = maxDayCount > 0 ? Math.max((item.count / maxDayCount) * 100, 8) : 8;

                  return (
                    <button
                      key={item.dateKey}
                      onClick={() => setSelectedDate(item.dateKey)}
                      className="group flex-1 flex flex-col items-center justify-end h-full focus:outline-none transition-all cursor-pointer relative"
                      title={`${item.dateKey}: ${item.count} utilisateur(s) connecté(s)`}
                    >
                      {/* Top Count Tooltip / Label */}
                      <span
                        className={`text-[11px] font-mono font-bold mb-1.5 transition-all ${
                          isSelected
                            ? 'text-white scale-110 drop-shadow-[0_0_8px_#10b981]'
                            : item.count > 0
                            ? 'text-white/80 group-hover:text-white'
                            : 'text-white/30'
                        }`}
                      >
                        {item.count}
                      </span>

                      {/* The Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 relative ${
                          isToday
                            ? isSelected
                              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] border-t-2 border-white'
                              : 'bg-gradient-to-t from-emerald-700/80 to-emerald-500/80 hover:brightness-125'
                            : isSelected
                            ? 'bg-gradient-to-t from-indigo-600 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] border-t-2 border-white'
                            : item.count > 0
                            ? 'bg-gradient-to-t from-indigo-900 to-indigo-600/70 hover:from-indigo-800 hover:to-indigo-500'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-sm" />
                        )}
                      </div>

                      {/* Day Label */}
                      <span
                        className={`text-[10px] mt-2 font-mono truncate max-w-full transition-colors ${
                          isSelected
                            ? 'text-emerald-300 font-bold'
                            : isToday
                            ? 'text-emerald-400 font-semibold'
                            : 'text-white/40 group-hover:text-white/70'
                        }`}
                      >
                        {formatDateLabel(item.dateKey)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Header Banner */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white capitalize">
                    {formatFullDate(selectedDate)}
                  </h4>
                  <p className="text-xs text-white/50">
                    {selectedDate === todayKey ? 'Journée en cours (Direct)' : 'Historique journalier'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Total utilisateurs connectés ce jour :</span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-mono font-bold text-sm border border-emerald-500/30">
                  {selectedDateUsers.length}
                </span>
              </div>
            </div>

            {/* Users connected on selected date */}
            <div className="space-y-3">
              {selectedDateUsers.length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <Users className="w-8 h-8 text-white/20 mx-auto" />
                  <p className="text-xs font-semibold text-white/60">
                    Aucun utilisateur ne s'est connecté le {formatFullDate(selectedDate)}.
                  </p>
                  <p className="text-[11px] text-white/40">
                    Sélectionnez un autre jour dans le graphique pour consulter les logs correspondants.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/20">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono font-bold text-white/60">
                          <th className="p-3.5">Utilisateur</th>
                          <th className="p-3.5">Email</th>
                          <th className="p-3.5">Rôle</th>
                          <th className="p-3.5">Dernière activité</th>
                          <th className="p-3.5">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs">
                        {selectedDateUsers.map((u) => (
                          <tr key={u.uid} className="hover:bg-white/[0.02] transition">
                            <td className="p-3.5 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl overflow-hidden bg-indigo-950 border border-indigo-400/40 flex-shrink-0">
                                {u.photoURL ? (
                                  <img src={u.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                                    {u.name?.[0] || 'U'}
                                  </div>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{u.name || 'Utilisateur'}</span>
                                <span className="text-[10px] text-white/40 font-mono truncate max-w-[140px] block">
                                  {u.uid}
                                </span>
                              </div>
                            </td>
                            <td className="p-3.5 text-white/70 font-mono">{u.email}</td>
                            <td className="p-3.5">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  u.role === 'admin'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                    : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                                }`}
                              >
                                {u.role ? u.role.toUpperCase() : 'USER'}
                              </span>
                            </td>
                            <td className="p-3.5 text-white/60 font-mono">
                              {u.lastLogin?.toDate
                                ? new Date(u.lastLogin.toDate()).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })
                                : 'Actif'}
                            </td>
                            <td className="p-3.5">
                              {selectedDate === todayKey ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Actif aujourd'hui
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 text-white/60 text-[10px]">
                                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                                  Présent ce jour
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL REGISTERED USERS & LOGS */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, email ou UID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 transition"
              />
            </div>
            <div className="text-xs text-white/50 font-mono">
              Total inscrits dans Firestore : <span className="text-white font-bold">{usersList.length}</span>
            </div>
          </div>

          {filteredAllUsers.length === 0 ? (
            <div className="py-20 text-center rounded-3xl glass border border-white/10">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Aucun utilisateur trouvé</h3>
              <p className="text-xs text-white/50">Modifiez votre recherche ou attendez de nouvelles connexions.</p>
            </div>
          ) : (
            <div className="rounded-3xl glass-strong border border-indigo-500/20 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono font-bold text-white/60">
                      <th className="p-4">Utilisateur</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Rôle</th>
                      <th className="p-4">UID Firestore</th>
                      <th className="p-4">Dernière Connexion</th>
                      <th className="p-4">Statut Jour</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredAllUsers.map((u) => {
                      const isOnlineToday = isUserConnectedOnDate(u, todayKey);
                      return (
                        <tr key={u.uid} className="hover:bg-white/[0.02] transition">
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-indigo-950 border border-indigo-400/40 flex-shrink-0">
                              {u.photoURL ? (
                                <img src={u.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                                  {u.name?.[0] || 'U'}
                                </div>
                              )}
                            </div>
                            <span className="font-bold text-white">{u.name}</span>
                          </td>
                          <td className="p-4 text-white/70 font-mono">{u.email}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                u.role === 'admin'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                  : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                              }`}
                            >
                              {u.role ? u.role.toUpperCase() : 'USER'}
                            </span>
                          </td>
                          <td className="p-4 text-white/40 font-mono text-[11px]">{u.uid}</td>
                          <td className="p-4 text-white/60 font-mono">
                            {u.lastLogin?.toDate ? new Date(u.lastLogin.toDate()).toLocaleString() : 'Récemment'}
                          </td>
                          <td className="p-4">
                            {isOnlineToday ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                                Actif aujourd'hui
                              </span>
                            ) : (
                              <span className="text-white/40 text-[10px] font-mono">Hors ligne</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USER FEEDBACK & CRITIQUES */}
      {activeTab === 'feedback' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher dans les avis..."
                  className="pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition w-60"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl bg-[#0e0e29] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 transition cursor-pointer"
              >
                <option value="all">Toutes catégories</option>
                <option value="suggestion">Suggestions</option>
                <option value="bug">Bugs</option>
                <option value="critique">Critiques</option>
                <option value="autre">Autres</option>
              </select>
            </div>

            <span className="text-xs text-white/50 font-mono">
              {filteredFeedback.length} avis affiché(s)
            </span>
          </div>

          {filteredFeedback.length === 0 ? (
            <div className="py-20 text-center rounded-3xl glass border border-white/10">
              <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Aucun avis utilisateur trouvé</h3>
              <p className="text-xs text-white/50">Les critiques et avis laissés par les utilisateurs apparaîtront ici.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeedback.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-3xl glass-strong border border-white/10 space-y-4 shadow-xl hover:border-indigo-500/40 transition group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl overflow-hidden bg-indigo-950 border border-indigo-400/40 flex-shrink-0">
                          {item.userPhoto ? (
                            <img src={item.userPhoto} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                              {item.userName?.[0] || 'U'}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white block">{item.userName}</span>
                          <span className="text-[11px] text-white/50 block">{item.userEmail}</span>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold capitalize ${
                          item.category === 'bug'
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            : item.category === 'suggestion'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                            : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                        }`}
                      >
                        {item.category}
                      </span>
                    </div>

                    <p className="text-sm text-white/90 bg-white/[0.03] p-4 rounded-2xl border border-white/5 font-medium leading-relaxed">
                      "{item.comment}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-xs font-mono text-amber-300 font-bold">{item.rating}/5</span>
                    </div>

                    <span className="text-[11px] text-white/40 font-mono">
                      {item.timestamp?.toDate ? new Date(item.timestamp.toDate()).toLocaleString() : 'Récemment'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
