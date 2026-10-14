import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';

interface UserLog {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  role: string;
  lastLogin: any;
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
  const [activeTab, setActiveTab] = useState<'feedback' | 'users'>('feedback');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    // Listen to users collection
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as UserLog),
        uid: docSnap.id
      }));
      setUsersList(items);
    });

    // Listen to feedback collection
    const unsubFeedback = onSnapshot(
      query(collection(db, 'feedback'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as UserFeedback)
        }));
        setFeedbackList(items);
      }
    );

    return () => {
      unsubUsers();
      unsubFeedback();
    };
  }, []);

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

  // Calculate average rating
  const avgRating =
    feedbackList.length > 0
      ? (feedbackList.reduce((acc, curr) => acc + (curr.rating || 5), 0) / feedbackList.length).toFixed(1)
      : '5.0';

  return (
    <div className="min-h-screen bg-[#060612] text-white p-4 md:p-8 select-none space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-strong border border-indigo-500/30 shadow-2xl bg-gradient-to-r from-indigo-950/60 via-[#0c0c26] to-purple-950/60">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
            <ShieldAlert className="w-7 h-7 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white">Module d'Administration</h1>
              <span className="px-3 py-1 rounded-full bg-amber-950 border border-amber-400/40 text-[10px] font-mono text-amber-300 font-bold uppercase">
                ADMIN ACCESS
              </span>
            </div>
            <p className="text-xs text-white/60">
              Suivi en temps réel des utilisateurs connectés, des logs et des critiques pour faire évoluer NOVASTREAM.
            </p>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-3 rounded-2xl glass border border-white/10 flex items-center gap-3">
            <Users className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-[10px] text-white/50 block font-bold">UTILISATEURS</span>
              <span className="text-base font-black text-white">{usersList.length}</span>
            </div>
          </div>

          <div className="px-4 py-3 rounded-2xl glass border border-white/10 flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <div>
              <span className="text-[10px] text-white/50 block font-bold">AVIS & CRITIQUES</span>
              <span className="text-base font-black text-white">{feedbackList.length}</span>
            </div>
          </div>

          <div className="px-4 py-3 rounded-2xl glass border border-white/10 flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <div>
              <span className="text-[10px] text-white/50 block font-bold">NOTE MOYENNE</span>
              <span className="text-base font-black text-amber-300">{avgRating}/5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab switchers */}
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'feedback'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Critiques & Avis Utilisateurs ({feedbackList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Logs Utilisateurs Connectés ({usersList.length})</span>
          </button>
        </div>

        {/* Search & Filters */}
        {activeTab === 'feedback' && (
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
        )}
      </div>

      {/* Content Section */}
      {activeTab === 'feedback' ? (
        <div className="space-y-4">
          {filteredFeedback.length === 0 ? (
            <div className="py-20 text-center rounded-3xl glass border border-white/10">
              <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Aucun avis ou critique enregistré</h3>
              <p className="text-xs text-white/50">Les retours soumis par les utilisateurs apparaîtront ici en temps réel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeedback.map((item) => (
                <div
                  key={item.id}
                  className="p-6 rounded-3xl glass-strong border border-indigo-500/20 hover:border-indigo-500/40 transition space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-950 border border-indigo-400/40">
                          {item.userPhoto ? (
                            <img src={item.userPhoto} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
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
      ) : (
        <div className="space-y-4">
          {usersList.length === 0 ? (
            <div className="py-20 text-center rounded-3xl glass border border-white/10">
              <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Aucun utilisateur connecté pour le moment</h3>
              <p className="text-xs text-white/50">Les connexions Google s'enregistreront automatiquement dans les logs.</p>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {usersList.map((u) => (
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
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-white/40 font-mono text-[11px]">{u.uid}</td>
                        <td className="p-4 text-white/60 font-mono">
                          {u.lastLogin?.toDate ? new Date(u.lastLogin.toDate()).toLocaleString() : 'En ligne'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
