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
  ArrowUpRight,
  Bell,
  Megaphone,
  Send,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Pin,
  AlertTriangle,
  Info,
  Check,
  Eye,
  Tv
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { getTodayKey } from '../services/analyticsService';
import {
  Announcement,
  AnnouncementType,
  AnnouncementPriority,
  createAnnouncement,
  toggleAnnouncementActive,
  deleteAnnouncement,
  subscribeToAdminAnnouncements
} from '../services/announcementService';
import { Link } from 'react-router-dom';

interface UserLog {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  role: string;
  subscriptionPlan?: 'free' | 'premium';
  subscriptionExpiresAt?: number | null;
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
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'feedback' | 'notifications' | 'communication'>('stats');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);

  // Communication & Announcements State
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgContent, setMsgContent] = useState('');
  const [msgType, setMsgType] = useState<AnnouncementType>('info');
  const [msgPriority, setMsgPriority] = useState<AnnouncementPriority>('normal');
  const [msgTarget, setMsgTarget] = useState<'all' | 'specific'>('all');
  const [msgTargetEmail, setMsgTargetEmail] = useState('');
  const [msgPinned, setMsgPinned] = useState(false);
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [sendSuccessMsg, setSendSuccessMsg] = useState('');
  
  const todayKey = useMemo(() => getTodayKey(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [chartDaysRange, setChartDaysRange] = useState<7 | 14>(7);

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

    // Listen to notifications collection in real time
    const unsubNotifications = onSnapshot(
      query(collection(db, 'notifications'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as any),
          id: docSnap.id
        }));
        setNotifications(items);
      }
    );

    // Listen to announcements in real time
    const unsubAnnouncements = subscribeToAdminAnnouncements((list) => {
      setAnnouncementsList(list);
    });

    return () => {
      unsubUsers();
      unsubFeedback();
      unsubNotifications();
      unsubAnnouncements();
    };
  }, []);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgContent.trim()) return;

    setIsSendingMsg(true);
    setSendSuccessMsg('');
    try {
      await createAnnouncement({
        title: msgTitle,
        content: msgContent,
        type: msgType,
        priority: msgPriority,
        target: msgTarget,
        targetEmail: msgTarget === 'specific' ? msgTargetEmail.trim() : '',
        authorName: user?.displayName || 'Administrateur NOVASTREAM',
        authorEmail: user?.email || 'cyber.kan587@gmail.com',
        pinned: msgPinned
      });

      setSendSuccessMsg('Message diffusé avec succès à tous les abonnés !');
      setMsgTitle('');
      setMsgContent('');
      setMsgPriority('normal');
      setMsgPinned(false);
      setTimeout(() => setSendSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to send announcement:', err);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await toggleAnnouncementActive(id, !currentActive);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await deleteAnnouncement(id);
    } catch (err) {
      console.error(err);
    }
  };

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

  // Generate last 7 or 14 days list for stats & charts
  const pastDaysRange = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = chartDaysRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      list.push(`${y}-${m}-${day}`);
    }
    return list;
  }, [chartDaysRange]);

  // Compute stats per day for the selected days range
  const dailyStatsMap = useMemo(() => {
    return pastDaysRange.map((dateKey) => {
      const connectedUsers = usersList.filter((u) => isUserConnectedOnDate(u, dateKey));
      return {
        dateKey,
        count: connectedUsers.length,
        users: connectedUsers
      };
    });
  }, [pastDaysRange, usersList]);

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

  // Subscription counts
  const premiumCount = useMemo(() => {
    return usersList.filter((u) => u.subscriptionPlan === 'premium').length;
  }, [usersList]);

  const freeCount = useMemo(() => {
    return usersList.length - premiumCount;
  }, [usersList, premiumCount]);

  // Helper to render subscription badge
  const renderSubscriptionBadge = (plan?: 'free' | 'premium') => {
    if (plan === 'premium') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono shadow-sm">
          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
          <span>VIP Sans Pub (5$)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 text-[10px] font-medium font-mono">
        <Tv className="w-3 h-3 text-cyan-400" />
        <span>Gratuit (avec Pub)</span>
      </span>
    );
  };

  // Filtered all users with subscription filter
  const filteredAllUsers = usersList.filter((u) => {
    if (subscriptionFilter !== 'all') {
      const plan = u.subscriptionPlan || 'free';
      if (plan !== subscriptionFilter) return false;
    }
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
    <div className="min-h-screen bg-[#060612] text-white p-3 md:p-6 select-none space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 md:p-6 rounded-3xl glass-strong border border-indigo-500/30 shadow-2xl bg-gradient-to-r from-indigo-950/60 via-[#0c0c26] to-purple-950/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/50 flex-shrink-0">
            <ShieldAlert className="w-5 h-5 md:w-6 md:h-6 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-xl font-black text-white">Administration</h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-400/40 text-[9px] font-mono text-amber-300 font-bold uppercase">
                ADMIN
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-white/60 mt-0.5">
              Statistiques et gestion utilisateurs.
            </p>
          </div>
        </div>

        {/* Top KPIs Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {/* Daily Active Users (DAU) Counter */}
          <div className="px-3 py-2 rounded-xl glass border border-emerald-500/30 bg-emerald-950/15 flex items-center gap-2 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] text-emerald-300/80 block font-bold leading-tight uppercase">Actifs</span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black text-emerald-400">{todayCount}</span>
              </div>
            </div>
          </div>

          {/* VIP Premium Subscribers */}
          <div className="px-3 py-2 rounded-xl glass border border-amber-500/30 bg-amber-950/20 flex items-center gap-2 shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="text-[9px] text-amber-300/80 block font-bold leading-tight uppercase">VIP 5$/m</span>
              <span className="text-sm font-black text-amber-300">{premiumCount}</span>
            </div>
          </div>

          {/* Free Subscribers */}
          <div className="px-3 py-2 rounded-xl glass border border-white/10 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
              <Tv className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <span className="text-[9px] text-white/50 block font-bold leading-tight uppercase">Gratuits</span>
              <span className="text-sm font-black text-white">{freeCount}</span>
            </div>
          </div>

          {/* Total Registered Users */}
          <div className="px-3 py-2 rounded-xl glass border border-white/10 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] text-white/50 block font-bold leading-tight uppercase">Inscrits</span>
              <span className="text-sm font-black text-white">{usersList.length}</span>
            </div>
          </div>

          {/* Average Rating */}
          <div className="px-3 py-2 rounded-xl glass border border-white/10 flex items-center gap-2 col-span-2 sm:col-span-1">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <span className="text-[9px] text-white/50 block font-bold leading-tight uppercase">Note</span>
              <span className="text-sm font-black text-amber-300">{avgRating}</span>
            </div>
          </div>
        </div>
      </div>


      {/* Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-300" />
            <span>Stats par Jour</span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/60 text-emerald-200 text-[10px] font-mono">
              {todayCount} actifs
            </span>
          </button>

          <button
            onClick={() => setActiveTab('communication')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeTab === 'communication'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-600/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Megaphone className="w-4 h-4 text-cyan-300" />
            <span>Communiquer avec les Users</span>
            {announcementsList.filter(a => a.active).length > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-cyan-950/80 text-cyan-200 text-[10px] font-mono border border-cyan-400/40">
                {announcementsList.filter(a => a.active).length} actif(s)
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Utilisateurs ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Avis ({feedbackList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Notifs ({notifications.filter(n => !n.read).length})</span>
          </button>
        </div>

        {/* Contextual Action / Info */}
        <div className="flex items-center gap-2 text-xs text-white/50 flex-shrink-0">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>Aujourd'hui : {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <span>Évolution des Utilisateurs Connectés</span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Cliquez sur une barre pour afficher la liste des utilisateurs connectés pour cette date.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* 7j / 14j Toggle */}
                <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => setChartDaysRange(7)}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      chartDaysRange === 7 ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    7 Jours
                  </button>
                  <button
                    onClick={() => setChartDaysRange(14)}
                    className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                      chartDaysRange === 14 ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    14 Jours
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-white/70">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Aujourd'hui
                  </span>
                  <span className="flex items-center gap-1 text-white/70 ml-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Autres
                  </span>
                </div>
              </div>
            </div>

            {/* Bar Chart Container with horizontal scroll support on mobile */}
            <div className="pt-8 pb-4 px-1 overflow-x-auto no-scrollbar">
              <div className={`h-48 flex items-end gap-2 sm:gap-4 justify-between border-b border-white/10 pb-2 ${chartDaysRange === 14 ? 'min-w-[520px]' : 'min-w-[320px]'}`}>
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
                <>
                  {/* Mobile Card View (< md) */}
                  <div className="block md:hidden space-y-2.5">
                    {selectedDateUsers.map((u) => (
                      <div key={u.uid} className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-indigo-950 border border-indigo-400/40 flex-shrink-0">
                              {u.photoURL ? (
                                <img src={u.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                                  {u.name?.[0] || 'U'}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-white text-xs truncate block">{u.name || 'Utilisateur'}</span>
                              <span className="text-[10px] text-white/50 font-mono truncate block">{u.email}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex-shrink-0 ${
                            u.role === 'admin' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                          }`}>
                            {u.role ? u.role.toUpperCase() : 'USER'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                          <div>{renderSubscriptionBadge(u.subscriptionPlan)}</div>
                          <span className="text-white/50 font-mono text-[10px]">
                            {u.lastLogin?.toDate ? new Date(u.lastLogin.toDate()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Actif'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (>= md) */}
                  <div className="hidden md:block rounded-2xl border border-white/10 overflow-hidden bg-black/20">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[620px]">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono font-bold text-white/60">
                            <th className="p-3.5">Utilisateur</th>
                            <th className="p-3.5">Email</th>
                            <th className="p-3.5">Rôle</th>
                            <th className="p-3.5">Abonnement</th>
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
                              <td className="p-3.5">
                                {renderSubscriptionBadge(u.subscriptionPlan)}
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
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL REGISTERED USERS & LOGS */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Search bar & Subscription filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 max-w-xl w-full">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, email ou UID..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 transition"
                />
              </div>

              <select
                value={subscriptionFilter}
                onChange={(e) => setSubscriptionFilter(e.target.value as 'all' | 'free' | 'premium')}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl bg-[#0e0e29] border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-400 transition cursor-pointer"
              >
                <option value="all">Tous abonnements ({usersList.length})</option>
                <option value="premium">⭐ VIP Premium ({premiumCount})</option>
                <option value="free">📺 Gratuit ({freeCount})</option>
              </select>
            </div>

            <div className="text-xs text-white/50 font-mono flex items-center gap-2">
              <span>Affichés : <strong className="text-white">{filteredAllUsers.length}</strong></span>
              <span>/</span>
              <span>Total : <strong className="text-white">{usersList.length}</strong></span>
            </div>
          </div>

          {filteredAllUsers.length === 0 ? (
            <div className="py-20 text-center rounded-3xl glass border border-white/10">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Aucun utilisateur trouvé</h3>
              <p className="text-xs text-white/50">Modifiez votre recherche ou attendez de nouvelles connexions.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View (< md) */}
              <div className="block md:hidden space-y-3">
                {filteredAllUsers.map((u) => {
                  const isOnlineToday = isUserConnectedOnDate(u, todayKey);
                  return (
                    <div key={u.uid} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-950 border border-indigo-400/40 flex-shrink-0">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                                {u.name?.[0] || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-white text-xs truncate block">{u.name || 'Utilisateur'}</span>
                            <span className="text-[11px] text-white/60 font-mono truncate block">{u.email}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex-shrink-0 ${
                          u.role === 'admin' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                        }`}>
                          {u.role ? u.role.toUpperCase() : 'USER'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                        <div>{renderSubscriptionBadge(u.subscriptionPlan)}</div>
                        {isOnlineToday ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                            Actif aujourd'hui
                          </span>
                        ) : (
                          <span className="text-white/40 text-[10px] font-mono">Hors ligne</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block rounded-3xl glass-strong border border-indigo-500/20 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono font-bold text-white/60">
                        <th className="p-4">Utilisateur</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Rôle</th>
                        <th className="p-4">Abonnement</th>
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
                            <td className="p-4">
                              {renderSubscriptionBadge(u.subscriptionPlan)}
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
            </>
          )}
        </div>
      )}

      {/* TAB 3: USER FEEDBACK & CRITIQUES */}
      {activeTab === 'feedback' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher dans les avis..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-[#0e0e29] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-400 transition cursor-pointer"
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

      {/* TAB 4: NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className="space-y-4 animate-fadeIn">
          {notifications.length === 0 ? (
            <div className="py-20 text-center rounded-3xl glass border border-white/10">
              <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Aucune notification</h3>
              <p className="text-xs text-white/50">Les nouvelles connexions d'abonnés apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border ${n.read ? 'bg-white/5 border-white/5' : 'bg-amber-950/20 border-amber-500/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Nouvel Abonné</h4>
                      <p className="text-xs text-white/70">{n.userName} ({n.userEmail}) vient de s'inscrire !</p>
                    </div>
                    <span className="text-[10px] text-white/40 ml-auto font-mono">
                      {n.timestamp?.toDate ? new Date(n.timestamp.toDate()).toLocaleString() : 'Récemment'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: COMMUNICATION & BROADCAST TO USERS */}
      {activeTab === 'communication' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="p-4 sm:p-6 rounded-3xl glass-strong border border-blue-500/30 bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-purple-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-500/20 text-cyan-300 flex items-center justify-center border border-blue-400/30 flex-shrink-0">
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Communiquer avec les Utilisateurs & Abonnés
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Publiez des messages officiels, alertes, annonces ou offres VIP visibles sur les écrans des abonnés en temps réel.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-cyan-300 text-xs font-mono font-bold border border-blue-400/30">
                {announcementsList.filter((a) => a.active).length} actif(s) en direct
              </span>
            </div>
          </div>

          {/* Form & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <div className="lg:col-span-7 p-4 sm:p-6 rounded-3xl glass-strong border border-white/10 space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>Rédiger une nouvelle annonce</span>
                </h4>
                <span className="text-[11px] text-white/40">Diffusion instantanée</span>
              </div>

              {sendSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-semibold">{sendSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSendAnnouncement} className="space-y-4">
                {/* Type Selector */}
                <div>
                  <label className="text-xs font-bold text-white/80 block mb-2">Type d'annonce :</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'info', label: 'Information', icon: Info, color: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300' },
                      { id: 'alert', label: 'Alerte urgente', icon: AlertTriangle, color: 'border-rose-500/50 bg-rose-950/40 text-rose-300' },
                      { id: 'promotion', label: 'Offre / VIP', icon: Sparkles, color: 'border-amber-500/50 bg-amber-950/40 text-amber-300' },
                      { id: 'update', label: 'Mise à jour', icon: CheckCircle2, color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' }
                    ].map((t) => {
                      const Icon = t.icon;
                      const isSelected = msgType === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setMsgType(t.id as AnnouncementType)}
                          className={`p-2 sm:p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            isSelected
                              ? `${t.color} ring-2 ring-white/20 shadow-md`
                              : 'border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority & Target */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-white/80 block mb-1.5">Destinataires :</label>
                    <select
                      value={msgTarget}
                      onChange={(e) => setMsgTarget(e.target.value as 'all' | 'specific')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0c24] border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400 transition cursor-pointer"
                    >
                      <option value="all">📢 Tous les utilisateurs (Global)</option>
                      <option value="specific">🎯 Utilisateur spécifique (Email)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white/80 block mb-1.5">Priorité :</label>
                    <select
                      value={msgPriority}
                      onChange={(e) => setMsgPriority(e.target.value as AnnouncementPriority)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c0c24] border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400 transition cursor-pointer"
                    >
                      <option value="normal">Standard (Bannière discrète)</option>
                      <option value="urgent">🔴 Urgent (Clignotant prioritaire)</option>
                    </select>
                  </div>
                </div>

                {/* Specific target email input */}
                {msgTarget === 'specific' && (
                  <div>
                    <label className="text-xs font-bold text-white/80 block mb-1.5">
                      Email de l'abonné ciblé :
                    </label>
                    <input
                      type="email"
                      value={msgTargetEmail}
                      onChange={(e) => setMsgTargetEmail(e.target.value)}
                      placeholder="ex: abonne@example.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="text-xs font-bold text-white/80 block mb-1.5">Titre du message :</label>
                  <input
                    type="text"
                    value={msgTitle}
                    onChange={(e) => setMsgTitle(e.target.value)}
                    placeholder="ex: Nouveaux flux et chaînes cinéma ajoutés !"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="text-xs font-bold text-white/80 block mb-1.5">Contenu du message :</label>
                  <textarea
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    placeholder="Écrivez le message que les utilisateurs verront affiché en direct sur leur application..."
                    rows={4}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition resize-none"
                  />
                </div>

                {/* Pinned Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinned-check"
                    checked={msgPinned}
                    onChange={(e) => setMsgPinned(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="pinned-check" className="text-xs text-white/70 flex items-center gap-1.5 cursor-pointer select-none">
                    <Pin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Épingler cette annonce en haut de l'écran</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSendingMsg || !msgTitle.trim() || !msgContent.trim()}
                  className={`w-full py-3 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-xl ${
                    isSendingMsg || !msgTitle.trim() || !msgContent.trim()
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:brightness-110 text-white shadow-indigo-600/30 cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isSendingMsg ? 'Diffusion en cours...' : 'Diffuser le message aux abonnés'}</span>
                </button>
              </form>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-5 p-4 sm:p-6 rounded-3xl glass-strong border border-white/10 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>Aperçu en direct (Vue utilisateur)</span>
                  </h4>
                  <span className="text-[10px] text-white/40 font-mono">Simulation</span>
                </div>

                <p className="text-xs text-white/60 mb-4">
                  Voici le rendu exact tel qu'il apparaîtra sur l'application des abonnés :
                </p>

                {/* Simulated Announcement Banner */}
                <div className={`p-4 rounded-2xl border backdrop-blur-xl ${
                  msgType === 'alert'
                    ? 'border-red-500/50 bg-gradient-to-r from-red-950/80 via-black to-red-950/40 text-red-300'
                    : msgType === 'promotion'
                    ? 'border-amber-500/50 bg-gradient-to-r from-amber-950/80 via-[#151005] to-purple-950/40 text-amber-300'
                    : msgType === 'update'
                    ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-950/80 via-black to-teal-950/40 text-emerald-300'
                    : 'border-indigo-500/50 bg-gradient-to-r from-indigo-950/80 via-[#0a0a20] to-cyan-950/40 text-cyan-300'
                } ${msgPriority === 'urgent' ? 'animate-pulse shadow-lg shadow-red-950/50' : ''}`}>
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {msgType === 'alert' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                      {msgType === 'promotion' && <Sparkles className="w-4 h-4 text-amber-400" />}
                      {msgType === 'update' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      {msgType === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-white/10 border border-white/20">
                          {msgType.toUpperCase()}
                        </span>
                        {msgPinned && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300">
                            ÉPINGLÉ
                          </span>
                        )}
                        <span className="text-xs font-bold text-white truncate">
                          {msgTitle || 'Titre de votre annonce ici...'}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/80 leading-relaxed">
                        {msgContent || 'Le texte complet du message apparaîtra ici avec une lisibilité fluide sur mobile, tablette et TV.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info tips */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 text-[11px] text-white/50">
                <span className="font-bold text-white/70 block">💡 Options administrateur :</span>
                <p>• Les abonnés peuvent fermer l'annonce en cliquant sur "Fermer".</p>
                <p>• Vous pouvez désactiver ou supprimer un message en 1 clic dans la liste ci-dessous.</p>
              </div>
            </div>
          </div>

          {/* List of Published Announcements */}
          <div className="p-4 sm:p-6 rounded-3xl glass-strong border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-cyan-400" />
                  <span>Historique des messages diffusés ({announcementsList.length})</span>
                </h4>
                <p className="text-xs text-white/50 mt-0.5">
                  Gérez l'activation en direct ou supprimez les messages obsolètes.
                </p>
              </div>
            </div>

            {announcementsList.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <Megaphone className="w-8 h-8 text-white/20 mx-auto" />
                <p className="text-xs font-semibold text-white/60">
                  Aucun message n'a encore été diffusé.
                </p>
                <p className="text-[11px] text-white/40">
                  Remplissez le formulaire ci-dessus pour envoyer votre premier message à vos abonnés.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcementsList.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      item.active
                        ? 'bg-white/[0.04] border-white/15 shadow-md'
                        : 'bg-white/[0.01] border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {item.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                        {item.type === 'promotion' && <Sparkles className="w-4 h-4 text-amber-400" />}
                        {item.type === 'update' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        {item.type === 'info' && <Info className="w-4 h-4 text-cyan-400" />}
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                            item.active ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/10 text-white/40 border-white/10'
                          }`}>
                            {item.active ? 'EN LIGNE' : 'DÉSACTIVÉ'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-white/5 border border-white/10 text-white/70">
                            {item.type}
                          </span>
                          {item.priority === 'urgent' && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                              URGENT
                            </span>
                          )}
                          <span className="text-xs font-bold text-white truncate">{item.title}</span>
                        </div>

                        <p className="text-xs text-white/70 leading-relaxed line-clamp-2">
                          {item.content}
                        </p>

                        <div className="flex items-center gap-3 text-[10px] text-white/40 font-mono pt-1 flex-wrap">
                          <span>Cible : <strong className="text-white/60">{item.target === 'all' ? 'Tous les abonnés' : item.targetEmail}</strong></span>
                          <span>•</span>
                          <span>{item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleString('fr-FR') : 'Récemment'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Toggle Active + Delete */}
                    <div className="flex items-center gap-2.5 flex-shrink-0 self-end md:self-center">
                      <button
                        onClick={() => handleToggleActive(item.id, item.active)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          item.active
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                            : 'bg-white/10 hover:bg-white/20 text-white/60 border border-white/10'
                        }`}
                        title={item.active ? 'Désactiver le message' : 'Activer le message'}
                      >
                        {item.active ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-white/40" />}
                        <span>{item.active ? 'Désactiver' : 'Activer'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteAnnouncement(item.id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
