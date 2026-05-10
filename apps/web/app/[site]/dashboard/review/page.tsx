'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, CheckCircle, XCircle, Clock, ChevronRight,
  FileText, User as UserIcon, Calendar, MessageSquare, Eye,
  Loader2, RefreshCw
} from 'lucide-react';
import StatusBadge from '../../../../components/ui/StatusBadge';
import { cn } from '../../../../lib/utils';

interface Article {
  id: string;
  title: string;
  status: string;
  category?: { name: string };
  author?: { name: string; role?: string };
  createdAt: string;
  updatedAt: string;
  wordCount?: number;
  readingTimeMin?: number;
  reviewNotes?: string;
  blocks?: any[];
}

const EMPTY_STATES: Record<string, { icon: React.ElementType; msg: string }> = {
  submitted: { icon: CheckCircle, msg: 'Tidak ada artikel yang dikirim untuk review' },
  review:    { icon: AlertCircle, msg: 'Tidak ada artikel dalam proses review' },
  revision:  { icon: XCircle, msg: 'Tidak ada artikel yang perlu direvisi' },
  approved:  { icon: CheckCircle, msg: 'Tidak ada artikel yang sudah disetujui' },
};

export default function ReviewQueuePage() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'submitted' | 'review' | 'revision' | 'approved'>('submitted');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<Article | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/articles', { params: { site, limit: 100 } });
      setArticles(data.data.articles || data.data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [site]);

  const tabArticles = articles.filter(a => a.status === activeTab);

  const tabs = [
    { key: 'submitted', label: 'Menunggu Review', color: 'text-blue-500' },
    { key: 'review',    label: 'Sedang Direview', color: 'text-violet-500' },
    { key: 'revision',  label: 'Perlu Revisi',    color: 'text-orange-500' },
    { key: 'approved',  label: 'Disetujui',        color: 'text-emerald-500' },
  ] as const;

  const handleAction = async (articleId: string, action: 'approve' | 'reject' | 'request_revision' | 'publish') => {
    setActionLoading(articleId + action);
    try {
      if (action === 'publish') {
        await api.post(`/articles/${articleId}/publish`);
      } else {
        const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'archived' : 'revision';
        await api.patch(`/articles/${articleId}`, {
          status: newStatus,
          reviewNotes: reviewNotes || undefined,
          reviewedBy: user?.id,
        });
      }
      setReviewModal(null);
      setReviewNotes('');
      await load();
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Gagal memproses artikel');
    } finally {
      setActionLoading(null);
    }
  };

  const wordCount = (a: Article) => a.wordCount || (Array.isArray(a.blocks) ? a.blocks.length * 80 : 0);

  if (!user || !['superadmin', 'pimred'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <AlertCircle size={40} className="text-red-400 mx-auto" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Akses Terbatas</p>
          <p className="text-xs text-gray-300">Halaman ini hanya untuk Pimpinan Redaksi dan Superadmin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-violet-500" />
            <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Meja Editor</span>
          </div>
          <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight">Antrian Review</h1>
          <p className="text-xs text-gray-400 mt-1">
            Kelola alur persetujuan artikel dari wartawan ke publikasi.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Workflow Flow */}
      <div className="dash-card p-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { label: 'Draft', color: 'bg-amber-100 text-amber-700', count: articles.filter(a=>a.status==='draft').length },
            { label: '→', color: 'text-gray-300', count: null },
            { label: 'Dikirim', color: 'bg-blue-100 text-blue-700', count: articles.filter(a=>a.status==='submitted').length },
            { label: '→', color: 'text-gray-300', count: null },
            { label: 'Review', color: 'bg-violet-100 text-violet-700', count: articles.filter(a=>a.status==='review').length },
            { label: '→', color: 'text-gray-300', count: null },
            { label: 'Revisi', color: 'bg-orange-100 text-orange-700', count: articles.filter(a=>a.status==='revision').length },
            { label: '→', color: 'text-gray-300', count: null },
            { label: 'Disetujui', color: 'bg-emerald-100 text-emerald-700', count: articles.filter(a=>a.status==='approved').length },
            { label: '→', color: 'text-gray-300', count: null },
            { label: 'Terbit', color: 'bg-green-100 text-green-700', count: articles.filter(a=>a.status==='published').length },
          ].map((step, i) => (
            step.label === '→'
              ? <ChevronRight key={i} size={16} className="text-gray-300 flex-shrink-0" />
              : (
                <div key={i} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0', step.color)}>
                  <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                  {step.count !== null && (
                    <span className="text-[9px] font-black opacity-70">({step.count})</span>
                  )}
                </div>
              )
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 dark:border-white/5">
        <div className="flex gap-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const count = articles.filter(a => a.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.key
                    ? `border-brand-red ${tab.color}`
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[9px] font-black px-1.5 py-0.5 rounded-full',
                    activeTab === tab.key ? 'bg-brand-red text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Article List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-brand-red" />
        </div>
      ) : tabArticles.length === 0 ? (
        <div className="dash-card p-16 flex flex-col items-center gap-4 text-gray-300 dark:text-white/10">
          {(() => { const E = EMPTY_STATES[activeTab]; return <E.icon size={44} strokeWidth={1} />; })()}
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{EMPTY_STATES[activeTab].msg}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {tabArticles.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ delay: i * 0.05 }}
                className="dash-card p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <StatusBadge status={article.status} />
                      {article.category?.name && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-red px-2 py-0.5 bg-brand-red/5 rounded">
                          {article.category.name}
                        </span>
                      )}
                      {wordCount(article) > 0 && (
                        <span className="text-[9px] text-gray-400 font-medium">
                          ≈ {wordCount(article).toLocaleString()} kata
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-brand-black dark:text-white leading-snug mb-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <UserIcon size={11} /> {article.author?.name || 'Redaksi'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(article.updatedAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                    {article.reviewNotes && (
                      <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-500/10 rounded-lg">
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Catatan Editor:</p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">{article.reviewNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                    <Link
                      href={`/${site}/dashboard/articles/${article.id}`}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-gray-600 dark:text-gray-300"
                    >
                      <Eye size={12} /> Baca
                    </Link>
                    {(activeTab === 'submitted' || activeTab === 'review') && (
                      <>
                        <button
                          onClick={() => handleAction(article.id, 'request_revision')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-100 transition-all disabled:opacity-50"
                        >
                          {actionLoading === article.id + 'request_revision'
                            ? <Loader2 size={12} className="animate-spin" />
                            : <MessageSquare size={12} />
                          }
                          Revisi
                        </button>
                        <button
                          onClick={() => { setReviewModal(article); setReviewNotes(''); }}
                          disabled={!!actionLoading}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm"
                        >
                          <CheckCircle size={12} /> Setujui
                        </button>
                      </>
                    )}
                    {activeTab === 'approved' && (
                      <button
                        onClick={() => handleAction(article.id, 'publish')}
                        disabled={!!actionLoading}
                        className="flex items-center gap-1.5 px-3 py-2 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                      >
                        {actionLoading === article.id + 'publish' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Terbitkan
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Approve Modal */}
      <AnimatePresence>
        {reviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setReviewModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Setujui Artikel</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Artikel akan masuk ke status Disetujui</p>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 border-l-2 border-emerald-500 pl-3">
                {reviewModal.title}
              </p>
              <div className="mb-5">
                <label className="dash-label block mb-2">Catatan untuk wartawan (opsional)</label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Tambah catatan jika diperlukan..."
                  className="w-full px-3 py-2.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-brand-black dark:text-white outline-none focus:border-emerald-400 resize-none transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setReviewModal(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleAction(reviewModal.id, 'approve')}
                  disabled={!!actionLoading}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  Setujui
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
