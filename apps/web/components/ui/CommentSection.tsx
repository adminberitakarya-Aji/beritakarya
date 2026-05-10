'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Clock, MoreHorizontal, Reply, ThumbsUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface Comment {
  id: string;
  content: string;
  authorName?: string;
  authorEmail?: string;
  status: string;
  createdAt: string;
  user?: { name: string };
  replies?: Comment[];
}

export default function CommentSection({ articleId }: { articleId: string }) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/comments/article/${articleId}`);
      setComments(data.data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!user && (!guestName.trim() || !guestEmail.trim())) {
      setMessage({ type: 'error', text: 'Nama dan email wajib diisi' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await api.post(`/comments/article/${articleId}`, {
        content,
        authorName: guestName,
        authorEmail: guestEmail
      });
      
      setContent('');
      setGuestName('');
      setGuestEmail('');
      setMessage({ 
        type: 'success', 
        text: 'Komentar Anda telah dikirim dan menunggu moderasi redaksi.' 
      });
      
      // Refresh list (though new comment might be pending)
      fetchComments();
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal mengirim komentar. Silakan coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-20 pt-20 border-t border-gray-100 dark:border-white/5">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-red flex items-center justify-center text-white shadow-lg shadow-brand-red/20">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-brand-black dark:text-white uppercase tracking-tight">Komentar</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              {isLoading ? 'Memuat...' : `${comments.length} Pendapat Terverifikasi`}
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="mb-12 bg-gray-50 dark:bg-white/[0.02] p-8 rounded-2xl border border-gray-100 dark:border-white/5">
        <form onSubmit={handleSubmit} className="space-y-6">
          {!user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Nama Lengkap</label>
                <input 
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-red transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Email (Privat)</label>
                <input 
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-red transition-all"
                />
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div className="hidden sm:flex w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 items-center justify-center text-gray-400 shrink-0">
              {user ? (
                <span className="font-black text-sm text-brand-red">{user.name[0]}</span>
              ) : (
                <User size={20} />
              )}
            </div>
            <div className="flex-1 space-y-4">
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Bagikan pendapat Anda tentang berita ini..."
                className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-xl p-4 text-sm outline-none focus:border-brand-red transition-all min-h-[120px] resize-none shadow-sm"
              />
              
              {message && (
                <div className={cn(
                  "p-4 rounded-xl flex items-center gap-3 text-xs font-bold",
                  message.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                )}>
                  {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {message.text}
                </div>
              )}

              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="flex items-center gap-2 px-8 py-3 bg-brand-red text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-xl hover:bg-brand-black disabled:opacity-50 transition-all shadow-xl shadow-brand-red/20 active:scale-95"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Komentar'} <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="space-y-10">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-brand-red/20 border-t-brand-red rounded-full animate-spin mx-auto" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Memuat Komentar...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-gray-50 dark:border-white/5 rounded-3xl">
            <MessageSquare size={40} className="mx-auto mb-4 text-gray-100 dark:text-white/5" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Belum ada komentar publik.</p>
            <p className="text-[10px] text-gray-300 uppercase tracking-widest mt-1">Jadilah yang pertama berdiskusi!</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="group relative">
              <div className="flex gap-4 md:gap-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 flex items-center justify-center text-brand-red font-serif italic text-lg shadow-sm shrink-0">
                  {c.user?.name?.[0] || c.authorName?.[0] || 'P'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-[11px] font-black text-brand-black dark:text-white uppercase tracking-widest">
                        {c.user?.name || c.authorName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={10} className="text-gray-300" />
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                          {new Date(c.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                        </span>
                      </div>
                    </div>
                    <button className="text-gray-300 hover:text-brand-red transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                  
                  <div className="bg-white dark:bg-white/[0.01] rounded-2xl p-4 md:p-5 border border-gray-50 dark:border-white/5 shadow-sm mb-4">
                    <p className="text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed font-serif antialiased">
                      {c.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 px-2">
                    <button className="flex items-center gap-2 text-[9px] font-black text-gray-400 hover:text-brand-red uppercase tracking-[0.15em] transition-all group/btn">
                      <ThumbsUp size={14} className="group-hover/btn:-translate-y-0.5 transition-transform" /> Suka
                    </button>
                    <button className="flex items-center gap-2 text-[9px] font-black text-gray-400 hover:text-brand-red uppercase tracking-[0.15em] transition-all group/btn">
                      <Reply size={14} className="group-hover/btn:-translate-y-0.5 transition-transform" /> Balas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-24 p-8 bg-brand-surface dark:bg-white/[0.02] rounded-3xl border border-gray-100 dark:border-white/5 text-center">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-relaxed">
          Komentar sepenuhnya menjadi tanggung jawab pengirim sebagaimana diatur dalam <span className="text-brand-red cursor-pointer hover:underline">UU ITE</span>.
        </p>
      </div>
    </section>
  );
}
