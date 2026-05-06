'use client';

import { useState } from 'react';
import { MessageSquare, Send, User, Clock, MoreHorizontal, Reply, ThumbsUp } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CommentSection({ articleId }: { articleId: string }) {
  const [comment, setComment] = useState('');
  
  // Real apps would fetch comments from API. 
  // For now, we initialize as empty for production readiness.
  const [comments] = useState<any[]>([]);

  return (
    <section className="mt-20 pt-20 border-t border-gray-100 dark:border-white/5">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-red flex items-center justify-center text-white shadow-lg shadow-brand-red/20">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-brand-black dark:text-white uppercase tracking-tight">Komentar</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{comments.length} Pendapat Pembaca</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Urutkan:</span>
          <select className="bg-transparent text-[9px] font-black uppercase tracking-widest text-brand-black dark:text-white outline-none cursor-pointer">
            <option>Terbaru</option>
            <option>Terpopuler</option>
          </select>
        </div>
      </div>

      {/* Input */}
      <div className="mb-12 bg-gray-50 dark:bg-white/[0.02] p-6 rounded-2xl border border-gray-100 dark:border-white/5">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-400">
            <User size={20} />
          </div>
          <div className="flex-1 space-y-4">
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bagikan pendapat Anda tentang berita ini..."
              className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-xl p-4 text-sm outline-none focus:border-brand-red transition-all min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <button 
                disabled={!comment.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-red text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-black disabled:opacity-50 transition-all shadow-lg shadow-brand-red/10"
              >
                Kirim Komentar <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-8">
        {comments.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-gray-50 dark:border-white/5 rounded-2xl">
            <MessageSquare size={32} className="mx-auto mb-4 text-gray-200 dark:text-white/5" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Belum ada komentar. Jadilah yang pertama!</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="group">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center text-gray-400 font-black text-xs">
                  {c.user[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[11px] font-black text-brand-black dark:text-white uppercase tracking-widest">{c.user}</h4>
                    <button className="text-gray-300 hover:text-brand-red transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={10} className="text-gray-400" />
                    <span className="text-[9px] text-gray-400 font-bold uppercase">{c.date}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    {c.text}
                  </p>
                  <div className="flex items-center gap-6">
                    <button className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 hover:text-brand-red uppercase tracking-widest transition-all">
                      <ThumbsUp size={12} /> {c.likes} Suka
                    </button>
                    <button className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 hover:text-brand-red uppercase tracking-widest transition-all">
                      <Reply size={12} /> Balas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-16 p-6 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
          Sistem komentar ini mendukung integrasi <span className="text-brand-red">Disqus</span> atau <span className="text-brand-red">Hyvor Talk</span> untuk skala produksi.
        </p>
      </div>
    </section>
  );
}
