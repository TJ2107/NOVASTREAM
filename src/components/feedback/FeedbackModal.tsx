import React, { useState } from 'react';
import { MessageSquarePlus, X, Star, Send, Check } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../store/useAuthStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: Props) {
  const { user } = useAuthStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState<'suggestion' | 'bug' | 'critique' | 'autre'>('suggestion');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user ? user.uid : 'anonymous',
        userName: user?.displayName || 'Visiteur Anonyme',
        userEmail: user?.email || 'non-renseigné',
        userPhoto: user?.photoURL || '',
        rating,
        category,
        comment: comment.trim(),
        timestamp: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setComment('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl glass-strong border border-indigo-500/40 p-6 md:p-8 space-y-6 shadow-2xl bg-[#0a0a1a]">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
              <MessageSquarePlus className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Vos Critiques & Avis</h3>
              <p className="text-xs text-white/60">Aidez NOVASTREAM à évoluer selon vos retours</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass hover:bg-white/10 text-white/70 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 text-2xl">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">Merci pour votre retour !</h4>
            <p className="text-xs text-white/60 max-w-xs">
              Votre commentaire a bien été transmis à l'équipe de développement et au module d'administration.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Category selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/80">Type de retour</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['suggestion', 'bug', 'critique', 'autre'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition ${
                      category === cat
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                        : 'glass text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Stars */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/80">Note globale</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-mono font-bold text-cyan-300">{rating}/5</span>
              </div>
            </div>

            {/* Comment textarea */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/80">Votre commentaire / critique</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ex: J'aimerais que l'application propose plus de chaînes sportives ou une meilleure fluidité en mode Duo..."
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition resize-none"
                required
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl transition"
            >
              {submitting ? (
                <span>Envoi en cours...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Envoyer mon avis</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
