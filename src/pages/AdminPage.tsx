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
  Tv,
  CreditCard,
  Copy,
  X,
  XCircle,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import {
  getTodayKey,
  PaymentRecord,
  approvePayment,
  rejectPayment,
  setManualSubscription
} from '../services/analyticsService';
import {
  Announcement,
  AnnouncementType,
  AnnouncementPriority,
  createAnnouncement,
  toggleAnnouncementActive,
  deleteAnnouncement,
  subscribeToAdminAnnouncements
} from '../services/announcementService';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllReadNotifications,
  subscribeToAdminNotifications
} from '../services/notificationService';
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
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'payments' | 'users' | 'feedback' | 'notifications' | 'communication'>('stats');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);

  // Mobile Money Payments Management State
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [manualTargetEmail, setManualTargetEmail] = useState('');
  const [manualDurationDays, setManualDurationDays] = useState<number>(30);
  const [manualPlanChoice, setManualPlanChoice] = useState<'premium' | 'free'>('premium');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [adminActionToast, setAdminActionToast] = useState<string | null>(null);
  const [confirmDowngradeUid, setConfirmDowngradeUid] = useState<string | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; payment: PaymentRecord | null; reason: string }>({
    open: false,
    payment: null,
    reason: 'Fonds non reçus sur le compte Airtel Money (+242053886817)'
  });

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
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as UserLog),
          uid: docSnap.id
        }));
        setUsersList(items);
      },
      (err) => {
        console.warn('Admin users snapshot error (handled):', err);
      }
    );

    // Listen to feedback collection in real time
    const unsubFeedback = onSnapshot(
      collection(db, 'feedback'),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as UserFeedback),
          id: docSnap.id
        })).sort((a, b) => {
          const tA = (a.timestamp as any)?.toMillis?.() || (a.timestamp as any)?.seconds * 1000 || 0;
          const tB = (b.timestamp as any)?.toMillis?.() || (b.timestamp as any)?.seconds * 1000 || 0;
          return tB - tA;
        });
        setFeedbackList(items);
      },
      (err) => {
        console.warn('Admin feedback snapshot error (handled):', err);
      }
    );

    // Listen to payments collection in real time
    const unsubPayments = onSnapshot(
      collection(db, 'payments'),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          ...(docSnap.data() as PaymentRecord),
          id: docSnap.id
        })).sort((a, b) => {
          const tA = (a.createdAt as any)?.toMillis?.() || (a.createdAt as any)?.seconds * 1000 || 0;
          const tB = (b.createdAt as any)?.toMillis?.() || (b.createdAt as any)?.seconds * 1000 || 0;
          return tB - tA;
        });
        setPaymentsList(items);
      },
      (err) => {
        console.warn('Admin payments snapshot error (handled):', err);
      }
    );

    // Listen to notifications collection in real time using notificationService
    const unsubNotifications = subscribeToAdminNotifications((items) => {
      setNotifications(items);
    });

    // Listen to announcements in real time
    const unsubAnnouncements = subscribeToAdminAnnouncements((list) => {
      setAnnouncementsList(list);
    });

    return () => {
      unsubUsers();
      unsubFeedback();
      unsubPayments();
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
      (item.userName || '').toLowerCase().includes(q) ||
      (item.userEmail || '').toLowerCase().includes(q) ||
      (item.comment || '').toLowerCase().includes(q)
    );
  });

  // Subscription counts
  const premiumCount = useMemo(() => {
    return usersList.filter((u) => u.subscriptionPlan === 'premium').length;
  }, [usersList]);

  const freeCount = useMemo(() => {
    return usersList.length - premiumCount;
  }, [usersList, premiumCount]);

  // Payments counts & memos
  const pendingPayments = useMemo(() => {
    return paymentsList.filter((p) => p.status === 'pending');
  }, [paymentsList]);

  const approvedPayments = useMemo(() => {
    return paymentsList.filter((p) => p.status === 'approved');
  }, [paymentsList]);

  const rejectedPayments = useMemo(() => {
    return paymentsList.filter((p) => p.status === 'rejected');
  }, [paymentsList]);

  const filteredPayments = useMemo(() => {
    return paymentsList.filter((p) => {
      if (paymentFilter !== 'all' && p.status !== paymentFilter) return false;
      if (!paymentSearchQuery.trim()) return true;
      const q = paymentSearchQuery.toLowerCase();
      return (
        (p.targetEmail || '').toLowerCase().includes(q) ||
        (p.senderPhone || '').toLowerCase().includes(q) ||
        (p.transactionRef || '').toLowerCase().includes(q) ||
        (p.userName || '').toLowerCase().includes(q)
      );
    });
  }, [paymentsList, paymentFilter, paymentSearchQuery]);

  // Helper to render subscription badge with real-time expiration tracking
  const renderSubscriptionBadge = (plan?: 'free' | 'premium', expiresAt?: number | null) => {
    if (plan === 'premium') {
      const isExpired = expiresAt ? Date.now() > expiresAt : false;
      const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24))) : null;

      if (isExpired && expiresAt) {
        return (
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/50 text-[10px] font-bold font-mono">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>VIP Expiré</span>
            </span>
            <span className="text-[9px] text-rose-400/90 font-mono block">
              le {new Date(expiresAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
        );
      }

      return (
        <div className="space-y-0.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-purple-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>VIP Sans Pub (5$)</span>
          </span>
          {daysLeft !== null && (
            <span className={`text-[10px] font-mono block ${daysLeft <= 3 ? 'text-amber-400 font-bold animate-pulse' : 'text-emerald-400'}`}>
              {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''} (jusqu'au {new Date(expiresAt!).toLocaleDateString('fr-FR')})
            </span>
          )}
        </div>
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

          {/* Airtel Mobile Money Payments Counter */}
          <div
            onClick={() => setActiveTab('payments')}
            className={`px-3 py-2 rounded-xl glass border cursor-pointer transition shadow-sm ${
              pendingPayments.length > 0
                ? 'border-red-500/50 bg-red-950/30 ring-1 ring-red-500/40'
                : 'border-amber-500/30 bg-amber-950/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                pendingPayments.length > 0 ? 'bg-red-500/25 text-red-300' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] text-amber-300/90 block font-bold leading-tight uppercase truncate">
                  Paiements Airtel
                </span>
                <div className="flex items-baseline gap-1">
                  {pendingPayments.length > 0 ? (
                    <span className="text-xs font-black text-red-300 animate-pulse font-mono">
                      {pendingPayments.length} à valider !
                    </span>
                  ) : (
                    <span className="text-sm font-black text-amber-300">
                      {approvedPayments.length} validés
                    </span>
                  )}
                </div>
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
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap flex-shrink-0 cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-gradient-to-r from-red-600 via-amber-600 to-orange-500 text-white shadow-lg shadow-red-600/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Paiements Airtel (+242)</span>
            {pendingPayments.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-mono font-black animate-pulse shadow-md">
                {pendingPayments.length} à valider
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white/70 text-[10px] font-mono">
                {paymentsList.length}
              </span>
            )}
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
                          <div>{renderSubscriptionBadge(u.subscriptionPlan, u.subscriptionExpiresAt)}</div>
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
                                {renderSubscriptionBadge(u.subscriptionPlan, u.subscriptionExpiresAt)}
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

      {/* TAB: AIRTEL MONEY PAYMENTS & SUBSCRIPTIONS */}
      {activeTab === 'payments' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Banner */}
          <div className="p-4 sm:p-6 rounded-3xl glass-strong border border-amber-500/40 bg-gradient-to-r from-red-950/60 via-[#140b24] to-amber-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-950/50 flex-shrink-0">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Paiements & Abonnements Airtel Money
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-red-950 border border-red-500/50 text-[10px] font-mono text-red-300 font-bold uppercase">
                    +242053886817
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-0.5">
                  Vérifiez les transferts reçus sur le numéro récepteur officiel, validez les abonnements 1 mois (30 jours) et gérez les expirations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {pendingPayments.length > 0 ? (
                <div className="px-3.5 py-1.5 rounded-xl bg-red-600/30 text-red-300 border border-red-500/50 text-xs font-mono font-bold flex items-center gap-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span>{pendingPayments.length} en attente de vérification</span>
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Tous les paiements sont à jour</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Toast */}
          {adminActionToast && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 animate-fadeIn shadow-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-semibold">{adminActionToast}</span>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`p-4 rounded-2xl glass border transition ${
              pendingPayments.length > 0 ? 'border-red-500/50 bg-red-950/20 shadow-lg shadow-red-950/30' : 'border-white/10'
            }`}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-white/60 font-medium uppercase text-[10px]">En Attente</span>
                <Clock className={`w-4 h-4 ${pendingPayments.length > 0 ? 'text-red-400 animate-spin' : 'text-white/30'}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-black ${pendingPayments.length > 0 ? 'text-red-300' : 'text-white'}`}>
                  {pendingPayments.length}
                </span>
                <span className="text-[10px] text-white/40">demande(s)</span>
              </div>
              <p className="text-[10px] text-white/50 mt-1">À vérifier sur le +242053886817</p>
            </div>

            <div className="p-4 rounded-2xl glass border border-emerald-500/30 bg-emerald-950/10">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-emerald-300/80 font-medium uppercase text-[10px]">Paiements Validés</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {approvedPayments.length}
                </span>
                <span className="text-[10px] text-emerald-300/60 font-mono">abonnements</span>
              </div>
              <p className="text-[10px] text-white/50 mt-1">Mode Sans Pub 1 mois accordé</p>
            </div>

            <div className="p-4 rounded-2xl glass border border-amber-500/30 bg-amber-950/10">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-amber-300/80 font-medium uppercase text-[10px]">Revenus Collectés</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                  {approvedPayments.length * 5}$
                </span>
                <span className="text-[11px] text-amber-300/70 font-mono font-bold">
                  ({(approvedPayments.length * 3000).toLocaleString('fr-FR')} FCFA)
                </span>
              </div>
              <p className="text-[10px] text-white/50 mt-1">Totalité des encaissements Mobile Money</p>
            </div>

            <div className="p-4 rounded-2xl glass border border-purple-500/30 bg-purple-950/10">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-purple-300/80 font-medium uppercase text-[10px]">Abonnés VIP Actifs</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-purple-300">
                  {premiumCount}
                </span>
                <span className="text-[10px] text-purple-300/60 font-mono">comptes</span>
              </div>
              <p className="text-[10px] text-white/50 mt-1">Comptes sans pub actuellement</p>
            </div>
          </div>

          {/* SECTION 1: PENDING PAYMENTS (URGENT VALIDATION) */}
          <div className="p-5 sm:p-6 rounded-3xl glass-strong border border-amber-500/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <h4 className="text-sm sm:text-base font-black text-white">
                  Demandes de Paiement En Attente de Validation ({pendingPayments.length})
                </h4>
              </div>
              <span className="text-[11px] text-white/50 font-mono">Priorité Haute</span>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="py-8 text-center rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400/60 mx-auto" />
                <p className="text-xs font-semibold text-white/70">
                  Aucun paiement en attente.
                </p>
                <p className="text-[11px] text-white/40">
                  Dès qu'un client soumet une confirmation de transfert Airtel Money, elle s'affichera ici en temps réel.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingPayments.map((p) => {
                  const isLoading = actionLoadingId === p.id;
                  return (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl bg-gradient-to-br from-red-950/40 via-black to-amber-950/30 border border-red-500/50 space-y-4 shadow-xl relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono font-bold uppercase">
                            EN ATTENTE DE VÉRIFICATION
                          </span>
                          <h5 className="text-sm font-black text-white mt-2">{p.targetEmail}</h5>
                          <span className="text-[11px] text-white/50">{p.userName || 'Client NOVASTREAM'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-black text-amber-300 font-mono block">
                            5,00 $ (3 000 FCFA)
                          </span>
                          <span className="text-[10px] text-white/40 font-mono">1 Mois Sans Pub</span>
                        </div>
                      </div>

                      {/* Payment Details Box */}
                      <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-white/50">N° Expéditeur Airtel :</span>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-amber-300">{p.senderPhone}</strong>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(p.senderPhone);
                                setCopiedRef(`phone-${p.id}`);
                                setTimeout(() => setCopiedRef(null), 2000);
                              }}
                              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition cursor-pointer"
                              title="Copier le numéro"
                            >
                              {copiedRef === `phone-${p.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-white/50">N° Récepteur :</span>
                          <span className="text-white font-bold">+242053886817</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-white/50">ID / Réf SMS Airtel :</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white/90 font-bold">{p.transactionRef}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(p.transactionRef);
                                setCopiedRef(`ref-${p.id}`);
                                setTimeout(() => setCopiedRef(null), 2000);
                              }}
                              className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition cursor-pointer"
                              title="Copier la référence de transaction"
                            >
                              {copiedRef === `ref-${p.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[11px]">
                          <span className="text-white/40">Soumis le :</span>
                          <span className="text-white/60">
                            {p.createdAt?.toDate ? new Date(p.createdAt.toDate()).toLocaleString('fr-FR') : 'Récemment'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons: 1-Click Validation & Reject */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          disabled={isLoading}
                          onClick={async () => {
                            if (!p.id) return;
                            setActionLoadingId(p.id);
                            try {
                              const res = await approvePayment(p.id, p.targetEmail, 30, user?.email || 'cyber.kan587@gmail.com');
                              setAdminActionToast(`🎉 Paiement validé pour ${p.targetEmail} ! Abonnement 1 mois actif jusqu'au ${new Date(res.expiresAt).toLocaleDateString('fr-FR')}.`);
                              setTimeout(() => setAdminActionToast(null), 5000);
                            } catch (err: any) {
                              setAdminActionToast(`Erreur : ${err?.message || 'Échec de validation'}`);
                              setTimeout(() => setAdminActionToast(null), 5000);
                            } finally {
                              setActionLoadingId(null);
                            }
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isLoading ? 'Validation...' : 'Valider & Activer (30j)'}</span>
                        </button>

                        <button
                          disabled={isLoading}
                          onClick={() => {
                            setRejectModal({
                              open: true,
                              payment: p,
                              reason: 'Fonds non reçus sur le compte Airtel Money (+242053886817)'
                            });
                          }}
                          className="py-2.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Refuser</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: MANUAL ACTIVATION / EXTENSION BY ADMIN */}
          <div className="p-5 sm:p-6 rounded-3xl glass-strong border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Activation ou Prolongation Manuelle par l'Administrateur</span>
                </h4>
                <p className="text-xs text-white/50 mt-0.5">
                  Attribuez ou prolongez manuellement un abonnement VIP Sans Pub pour n'importe quel compte client.
                </p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!manualTargetEmail.trim()) return;
                setActionLoadingId('manual-submit');
                try {
                  const res = await setManualSubscription(manualTargetEmail.trim(), manualPlanChoice, manualDurationDays);
                  setAdminActionToast(
                    manualPlanChoice === 'premium'
                      ? `Compte ${manualTargetEmail} passé en Premium Sans Pub pour ${manualDurationDays} jours (jusqu'au ${res.expiresAt ? new Date(res.expiresAt).toLocaleDateString('fr-FR') : ''}) !`
                      : `Compte ${manualTargetEmail} rétrogradé sur le plan Gratuit.`
                  );
                  setManualTargetEmail('');
                  setTimeout(() => setAdminActionToast(null), 5000);
                } catch (err: any) {
                  setAdminActionToast(`Erreur : ${err?.message || 'Échec de la mise à jour'}`);
                  setTimeout(() => setAdminActionToast(null), 5000);
                } finally {
                  setActionLoadingId(null);
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1"
            >
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] text-white/70 block font-semibold">Email du compte client :</label>
                <input
                  type="email"
                  value={manualTargetEmail}
                  onChange={(e) => setManualTargetEmail(e.target.value)}
                  placeholder="client@gmail.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-white/70 block font-semibold">Durée :</label>
                <select
                  value={manualDurationDays}
                  onChange={(e) => setManualDurationDays(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0e0e29] border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400 transition cursor-pointer"
                >
                  <option value={30}>1 Mois (30 jours)</option>
                  <option value={60}>2 Mois (60 jours)</option>
                  <option value={90}>3 Mois (90 jours)</option>
                  <option value={180}>6 Mois (180 jours)</option>
                  <option value={365}>1 An (365 jours)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={actionLoadingId === 'manual-submit'}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{actionLoadingId === 'manual-submit' ? 'Enregistrement...' : 'Activer / Prolonger'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 3: PAYMENTS HISTORY TABLE */}
          <div className="p-5 sm:p-6 rounded-3xl glass-strong border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>Historique des Transactions Mobile Money</span>
                </h4>
                <p className="text-xs text-white/50">Toutes les demandes de paiement enregistrées dans Firestore.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                  <input
                    type="text"
                    value={paymentSearchQuery}
                    onChange={(e) => setPaymentSearchQuery(e.target.value)}
                    placeholder="Filtrer par email, tel ou réf..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition font-mono w-48 sm:w-60"
                  />
                </div>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-[#0e0e29] border border-white/10 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="all">Tous ({paymentsList.length})</option>
                  <option value="pending">En attente ({pendingPayments.length})</option>
                  <option value="approved">Validés ({approvedPayments.length})</option>
                  <option value="rejected">Rejetés ({rejectedPayments.length})</option>
                </select>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-white/[0.02] border border-white/5">
                <CreditCard className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white/60">Aucune transaction trouvée.</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards View (< md) */}
                <div className="block md:hidden space-y-3">
                  {filteredPayments.map((p) => (
                    <div key={p.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          p.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : p.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {p.status === 'approved' ? 'VALIDÉ' : p.status === 'rejected' ? 'REJETÉ' : 'EN ATTENTE'}
                        </span>
                        <span className="text-amber-300 font-bold">{p.amount || '5,00 $ (3 000 FCFA)'}</span>
                      </div>

                      <div className="text-white font-bold">{p.targetEmail}</div>
                      <div className="text-white/60 text-[11px] flex justify-between">
                        <span>Expéditeur : {p.senderPhone}</span>
                        <span>Réf : {p.transactionRef}</span>
                      </div>
                      <div className="text-white/40 text-[10px] flex justify-between border-t border-white/5 pt-1.5">
                        <span>{p.createdAt?.toDate ? new Date(p.createdAt.toDate()).toLocaleDateString('fr-FR') : 'Date récente'}</span>
                        {p.approvedBy && <span>Validé par : {p.approvedBy}</span>}
                        {p.rejectionReason && <span className="text-rose-300">Raison : {p.rejectionReason}</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View (>= md) */}
                <div className="hidden md:block rounded-2xl border border-white/10 overflow-hidden bg-black/20">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono font-bold text-white/60">
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Compte Client</th>
                        <th className="p-3.5">N° Expéditeur</th>
                        <th className="p-3.5">Réf Transaction</th>
                        <th className="p-3.5">Montant</th>
                        <th className="p-3.5">Statut</th>
                        <th className="p-3.5">Détails / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs font-mono">
                      {filteredPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition">
                          <td className="p-3.5 text-white/60">
                            {p.createdAt?.toDate ? new Date(p.createdAt.toDate()).toLocaleDateString('fr-FR') : 'Récemment'}
                          </td>
                          <td className="p-3.5 font-bold text-white">{p.targetEmail}</td>
                          <td className="p-3.5 text-amber-300">{p.senderPhone}</td>
                          <td className="p-3.5 text-white/80">{p.transactionRef}</td>
                          <td className="p-3.5 text-white font-bold">{p.amount || '5,00 $'}</td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : p.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}>
                              {p.status === 'approved' ? 'VALIDÉ' : p.status === 'rejected' ? 'REJETÉ' : 'EN ATTENTE'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {p.status === 'pending' ? (
                              <button
                                onClick={async () => {
                                  if (!p.id) return;
                                  setActionLoadingId(p.id);
                                  try {
                                    const res = await approvePayment(p.id, p.targetEmail, 30, user?.email || 'cyber.kan587@gmail.com');
                                    setAdminActionToast(`Paiement validé pour ${p.targetEmail} ! VIP actif jusqu'au ${new Date(res.expiresAt).toLocaleDateString('fr-FR')}.`);
                                    setTimeout(() => setAdminActionToast(null), 5000);
                                  } finally {
                                    setActionLoadingId(null);
                                  }
                                }}
                                className="px-3 py-1 rounded-lg bg-emerald-500 text-black font-bold text-[11px] hover:bg-emerald-400 transition cursor-pointer"
                              >
                                Valider 30j
                              </button>
                            ) : p.status === 'approved' ? (
                              <span className="text-[10px] text-white/50">
                                {p.expiresAt ? `Expire le ${new Date(p.expiresAt).toLocaleDateString('fr-FR')}` : 'Actif'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-rose-300 truncate max-w-[150px] block" title={p.rejectionReason}>
                                {p.rejectionReason || 'Rejeté'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* SECTION 4: SUBSCRIBERS EXPIRATION MONITORING */}
          <div className="p-5 sm:p-6 rounded-3xl glass-strong border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Suivi des Expirations des Comptes Abonnés</span>
                </h4>
                <p className="text-xs text-white/50">
                  Statut de l'abonnement en temps réel : jours restants, alertes d'expiration automatique et prolongation en 1 clic.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {usersList.map((u) => {
                const isPremium = u.subscriptionPlan === 'premium';
                const expiresAt = u.subscriptionExpiresAt;
                const isExpired = expiresAt ? Date.now() > expiresAt : false;
                const daysRemaining = expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24))) : null;

                return (
                  <div
                    key={u.uid}
                    className={`p-4 rounded-2xl border space-y-3 transition ${
                      isPremium && !isExpired
                        ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                        : isExpired
                        ? 'bg-rose-950/20 border-rose-500/30'
                        : 'bg-white/[0.03] border-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-white text-xs truncate block">{u.name || 'Utilisateur'}</span>
                        <span className="text-[11px] text-white/50 font-mono truncate block">{u.email}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex-shrink-0 ${
                        isPremium && !isExpired
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : isExpired
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-white/10 text-white/50'
                      }`}>
                        {isPremium && !isExpired ? 'VIP ACTIF' : isExpired ? 'EXPIRÉ' : 'GRATUIT'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono space-y-1">
                      {isPremium && !isExpired && expiresAt && (
                        <div className="flex justify-between items-center text-emerald-300">
                          <span>Temps restant :</span>
                          <strong>{daysRemaining} jours ({new Date(expiresAt).toLocaleDateString('fr-FR')})</strong>
                        </div>
                      )}
                      {isExpired && expiresAt && (
                        <div className="flex justify-between items-center text-rose-300">
                          <span>Expiré le :</span>
                          <span>{new Date(expiresAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                      {!isPremium && !isExpired && (
                        <div className="text-white/40">
                          Abonnement standard avec publicité
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={async () => {
                          setActionLoadingId(`extend-${u.uid}`);
                          try {
                            const res = await setManualSubscription(u.email, 'premium', 30, u.uid);
                            setAdminActionToast(`Abonnement prolongé de 30 jours pour ${u.email} (jusqu'au ${res.expiresAt ? new Date(res.expiresAt).toLocaleDateString('fr-FR') : ''}) !`);
                            setTimeout(() => setAdminActionToast(null), 5000);
                          } catch (err: any) {
                            setAdminActionToast(`Erreur : ${err?.message || 'Action échouée'}`);
                            setTimeout(() => setAdminActionToast(null), 5000);
                          } finally {
                            setActionLoadingId(null);
                          }
                        }}
                        disabled={actionLoadingId === `extend-${u.uid}`}
                        className="flex-1 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-[11px] transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{actionLoadingId === `extend-${u.uid}` ? 'En cours...' : '+30 jours'}</span>
                      </button>

                      {(isPremium || !!expiresAt || u.subscriptionPlan === 'premium') && (
                        confirmDowngradeUid === u.uid ? (
                          <div className="flex items-center gap-1.5 animate-fadeIn">
                            <button
                              disabled={actionLoadingId === `downgrade-${u.uid}`}
                              onClick={async () => {
                                setActionLoadingId(`downgrade-${u.uid}`);
                                try {
                                  await setManualSubscription(u.email, 'free', 0, u.uid);
                                  setAdminActionToast(`Compte ${u.email} rétabli avec succès sur le plan Gratuit (avec pub).`);
                                  setConfirmDowngradeUid(null);
                                  setTimeout(() => setAdminActionToast(null), 5000);
                                } catch (err: any) {
                                  setAdminActionToast(`Erreur : ${err?.message || 'Échec de réinitialisation'}`);
                                  setTimeout(() => setAdminActionToast(null), 5000);
                                } finally {
                                  setActionLoadingId(null);
                                }
                              }}
                              className="py-1.5 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] border border-rose-400/40 transition cursor-pointer flex items-center gap-1 disabled:opacity-50 shadow-md shadow-rose-900/40"
                              title="Confirmer la rétrogradation"
                            >
                              <CheckCircle2 className="w-3 h-3 text-white" />
                              <span>{actionLoadingId === `downgrade-${u.uid}` ? 'En cours...' : 'Confirmer ?'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={actionLoadingId === `downgrade-${u.uid}`}
                              onClick={() => setConfirmDowngradeUid(null)}
                              className="py-1.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-[11px] border border-white/10 transition cursor-pointer"
                              title="Annuler"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={actionLoadingId === `downgrade-${u.uid}`}
                            onClick={() => setConfirmDowngradeUid(u.uid)}
                            className="py-1.5 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-[11px] transition cursor-pointer font-medium"
                            title="Rétablir le compte sur le plan standard gratuit avec pub"
                          >
                            Rétablir Gratuit
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
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
                        <div>{renderSubscriptionBadge(u.subscriptionPlan, u.subscriptionExpiresAt)}</div>
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
                              {renderSubscriptionBadge(u.subscriptionPlan, u.subscriptionExpiresAt)}
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
          {/* Header Actions */}
          <div className="p-4 sm:p-5 rounded-3xl glass-strong border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-950/40 via-[#0c0c26] to-orange-950/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">Centre de Notifications Admin</h3>
                <p className="text-xs text-white/60">
                  {notifications.filter(n => !n.read).length} non lue(s) sur {notifications.length} au total. Le compteur diminue jusqu'à zéro une fois lues.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {notifications.some(n => !n.read) && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await markAllNotificationsAsRead();
                      setAdminActionToast('Toutes les notifications ont été marquées comme lues !');
                      setTimeout(() => setAdminActionToast(null), 4000);
                    } catch (err: any) {
                      setAdminActionToast(`Erreur : ${err?.message || 'Échec'}`);
                      setTimeout(() => setAdminActionToast(null), 4000);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Tout marquer comme lu (0 non lue)</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteAllReadNotifications();
                      setAdminActionToast('Notifications lues supprimées avec succès.');
                      setTimeout(() => setAdminActionToast(null), 4000);
                    } catch (err: any) {
                      setAdminActionToast(`Erreur : ${err?.message || 'Échec'}`);
                      setTimeout(() => setAdminActionToast(null), 4000);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-semibold transition border border-white/10 cursor-pointer"
                >
                  Supprimer les lues
                </button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="py-20 text-center rounded-3xl glass border border-white/10">
              <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Aucune notification</h3>
              <p className="text-xs text-white/50">Les nouvelles connexions et paiements d'abonnés apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={async () => {
                    if (!n.read) {
                      try {
                        await markNotificationAsRead(n.id);
                      } catch (e) {
                        console.error(e);
                      }
                    }
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer ${
                    n.read ? 'bg-white/[0.03] border-white/5 opacity-75' : 'bg-amber-950/30 border-amber-500/40 shadow-lg shadow-amber-950/20'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      n.read ? 'bg-white/10 text-white/50' : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                    }`}>
                      {n.type === 'payment_pending' || n.type === 'payment_approved' ? <CreditCard className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                          n.read ? 'bg-white/10 text-white/50 border-white/10' : 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                        }`}>
                          {n.read ? 'LUE' : 'NON LUE'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-white/5 border border-white/10 text-white/70">
                          {n.type}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {n.title || (n.type === 'new_user' ? 'Nouvel Abonné' : 'Notification Airtel Money')}
                        </h4>
                      </div>

                      <p className="text-xs text-white/80 leading-relaxed">
                        {n.message || `${n.userName || 'Client'} (${n.userEmail}) vient de s'inscrire ou d'effectuer une action.`}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-white/40 font-mono pt-1">
                        <span>{n.timestamp?.toDate ? new Date(n.timestamp.toDate()).toLocaleString('fr-FR') : 'Récemment'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notification Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                    {!n.read ? (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await markNotificationAsRead(n.id);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Marquer comme lu (réduit le compteur)"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Marquer comme lu</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                        <Check className="w-3.5 h-3.5" />
                        <span>Lu</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await deleteNotification(n.id);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition cursor-pointer"
                      title="Supprimer la notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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

      {/* Rejection Modal */}
      {rejectModal.open && rejectModal.payment && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-strong rounded-3xl p-6 max-w-md w-full border border-rose-500/40 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <XCircle className="w-5 h-5" />
                <span>Refuser le Paiement Airtel Money</span>
              </div>
              <button
                onClick={() => setRejectModal({ open: false, payment: null, reason: '' })}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-white/50">Compte :</span>
                <span className="text-white font-bold">{rejectModal.payment.targetEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">N° Expéditeur :</span>
                <span className="text-amber-300">{rejectModal.payment.senderPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Réf SMS :</span>
                <span className="text-white/80">{rejectModal.payment.transactionRef}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/80 block">Motif du refus :</label>
              <select
                value={rejectModal.reason}
                onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl bg-[#0e0e29] border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400 transition cursor-pointer"
              >
                <option value="Fonds non reçus sur le compte Airtel Money (+242053886817)">
                  Fonds non reçus sur le compte Airtel Money (+242053886817)
                </option>
                <option value="Référence de transaction introuvable ou incorrecte">
                  Référence de transaction introuvable ou incorrecte
                </option>
                <option value="Montant envoyé inférieur à 3 000 FCFA (5,00 $)">
                  Montant envoyé inférieur à 3 000 FCFA (5,00 $)
                </option>
                <option value="Numéro expéditeur non identifié">
                  Numéro expéditeur non identifié
                </option>
              </select>

              <textarea
                value={rejectModal.reason}
                onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
                rows={2}
                placeholder="Précisez le motif..."
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-rose-400 transition resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, payment: null, reason: '' })}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold transition border border-white/10 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!rejectModal.payment?.id) return;
                  try {
                    await rejectPayment(
                      rejectModal.payment.id,
                      rejectModal.payment.targetEmail,
                      rejectModal.reason,
                      user?.email || 'cyber.kan587@gmail.com'
                    );
                    setAdminActionToast(`Paiement refusé pour ${rejectModal.payment.targetEmail}.`);
                    setTimeout(() => setAdminActionToast(null), 4000);
                  } catch (err: any) {
                    setAdminActionToast(`Erreur : ${err?.message || 'Échec du refus'}`);
                    setTimeout(() => setAdminActionToast(null), 5000);
                  } finally {
                    setRejectModal({ open: false, payment: null, reason: '' });
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Confirmer le Refus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Toast for instant feedback anywhere on the page */}
      {adminActionToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md p-4 rounded-2xl bg-black/95 backdrop-blur-xl border border-emerald-500/50 shadow-2xl shadow-emerald-950/60 text-white text-xs flex items-center gap-3 animate-fadeIn">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="font-semibold text-emerald-200 flex-1 leading-snug">{adminActionToast}</span>
          <button
            type="button"
            onClick={() => setAdminActionToast(null)}
            className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

