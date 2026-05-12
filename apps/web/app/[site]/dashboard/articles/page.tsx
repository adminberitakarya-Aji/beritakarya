'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Eye, Edit3, Trash2, Calendar,
  FileText, Loader2, Send
} from 'lucide-react';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EditorialBadge from '../../../../components/ui/EditorialBadge';
import KanbanBoard from '../../../../components/dashboard/KanbanBoard';
import { cn } from '../../../../lib/utils';
import { LayoutGrid, List } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  '': 'Semua',
  draft: 'Draft',
  submitted: 'Dikirim',
  review: 'Review',
  revision: 'Revisi',
  approved: 'Disetujui',
  scheduled: 'Terjadwal',
  published: 'Terbit',
  archived: 'Arsip',
};

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  category?: { name: string };
  author?: { name: string };
  createdAt: string;
  publishedAt?: string;
  viewCount?: number;
  wordCount?: number;
  isBreaking?: boolean;
  isExclusive?: boolean;
  isFeatured?: boolean;
}

export default function ArticlesPage() {
  const router = useRouter();
  const { site } = useParams<{ site: string }>();
  const { user } = useAuthStore();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isCreating, setIsCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { 
        site,
        search: searchQuery // Tambahkan parameter search ke API
      };
      if (filter) params.status = filter;
      const { data } = await api.get('/articles', { params });
      setArticles(data.data.articles || data.data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search agar tidak hit API setiap ketikan huruf
  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 500);
    return () => clearTimeout(timer);
  }, [site, filter, searchQuery]);

  const handleNew = async () => {
    setIsCreating(true);
    try {
      // Redirect ke halaman artikel baru tanpa membuat draft di database
      // Draft akan dibuat hanya saat user benar-benar menyimpan (save/auto-save)
      router.push(`/${site}/dashboard/articles/new`);
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Gagal membuat artikel baru');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmitToReview = async (articleId: string) => {
    setActionLoading(articleId);
    try {
      await api.patch(`/articles/${articleId}`, { status: 'submitted' });
      await load();
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Gagal mengirim ke editor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (articleId: string) => {
    if (!confirm('Yakin ingin menghapus artikel ini? Tindakan ini tidak dapat dibatalkan.')) return;
    setActionLoading(articleId + 'del');
    try {
      await api.delete(`/articles/${articleId}`);
      await load();
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Gagal menghapus artikel');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = articles; // Sekarang data sudah difilter di sisi Server

  // Count per status for tab badges
  const countByStatus = (s: string) => articles.filter(a => a.status === s).length;

  // Tabs to show based on role
  const visibleStatuses = user?.role === 'journalist'
    ? ['', 'draft', 'submitted', 'revision', 'published']
    : ['', 'draft', 'submitted', 'review', 'revision', 'approved', 'scheduled', 'published'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight">Kelola Post</h1>
          <p className="text-xs text-gray-400 mt-1">
            Portal <strong className="text-brand-red uppercase">{site}</strong> — {articles.length} post total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-xl flex items-center gap-1">
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white dark:bg-white/10 text-brand-red shadow-sm" : "text-gray-400 hover:text-brand-black")}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'kanban' ? "bg-white dark:bg-white/10 text-brand-red shadow-sm" : "text-gray-400 hover:text-brand-black")}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button 
            onClick={handleNew}
            disabled={isCreating}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-brand-red/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
            {isCreating ? 'Membuat...' : 'Post Berita'}
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="dash-card p-4 space-y-4">
        {/* Search */}
        <div className="relative group">
          <Search size={15} className={cn(
            "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors",
            loading ? "text-brand-red animate-pulse" : "text-gray-300 group-focus-within:text-brand-red"
          )} />
          <input 
            type="text"
            placeholder="Cari judul post di seluruh database..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-red/30 focus:bg-white dark:focus:bg-white/[0.08] rounded-xl text-sm outline-none transition-all text-brand-black dark:text-white placeholder:text-gray-300 shadow-sm"
          />
          {loading && searchQuery && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 size={14} className="animate-spin text-brand-red opacity-50" />
            </div>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {visibleStatuses.map(s => {
            const count = s === '' ? articles.length : countByStatus(s);
            return (
              <button 
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap',
                  filter === s
                    ? 'bg-brand-black dark:bg-white text-white dark:text-slate-900 border-brand-black dark:border-white'
                    : 'bg-transparent text-gray-400 border-gray-200 dark:border-white/10 hover:border-brand-red hover:text-brand-red'
                )}
              >
                {STATUS_LABELS[s]}
                {count > 0 && (
                  <span className={cn(
                    'text-[8px] font-black px-1.5 py-0.5 rounded-full',
                    filter === s ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content View (Table or Kanban) */}
      {loading ? (
        <div className="dash-card p-16 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Memuat data...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="animate-fade-in">
          <KanbanBoard articles={filtered} site={site} />
        </div>
      ) : (
        <div className="dash-card overflow-hidden animate-fade-in">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-3.5 dash-label">Post</th>
                <th className="px-4 py-3.5 dash-label hidden md:table-cell">Penulis</th>
                <th className="px-4 py-3.5 dash-label hidden lg:table-cell">Tanggal</th>
                <th className="px-4 py-3.5 dash-label">Status</th>
                <th className="px-4 py-3.5 dash-label text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
              {filtered.filter(a => a?.id).map((article, idx) => (
                <motion.tr
                  key={article.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Title */}
                  <td className="px-6 py-4 max-w-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {article.category?.name && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-brand-red">
                            {article.category.name}
                          </span>
                        )}
                        {article.isBreaking && <EditorialBadge variant="breaking" />}
                        {article.isExclusive && <EditorialBadge variant="exclusive" />}
                        {article.isFeatured && <EditorialBadge variant="featured" />}
                      </div>
                      <Link
                        href={`/${site}/dashboard/articles/${article.id}`}
                        className="text-sm font-bold text-brand-black dark:text-white group-hover:text-brand-red transition-colors line-clamp-1 leading-snug"
                      >
                        {article.title}
                      </Link>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        {article.viewCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Eye size={10} /> {(article.viewCount || 0).toLocaleString()}
                          </span>
                        )}
                        {article.wordCount && (
                          <span className="flex items-center gap-1">
                            <FileText size={10} /> {article.wordCount.toLocaleString()} kata
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Author */}
                  <td className="px-4 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-500 dark:text-gray-400">
                        {article.author?.name?.[0] || 'R'}
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
                        {article.author?.name || 'Redaksi'}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Calendar size={11} />
                      {new Date(article.publishedAt || article.createdAt).toLocaleDateString('id-ID', {
                        day:'numeric', month:'short', year:'numeric'
                      })}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <StatusBadge status={article.status} />
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Journalist: kirim ke editor jika masih draft */}
                      {article.status === 'draft' && (user?.role === 'journalist' || user?.role === 'pimred' || user?.role === 'superadmin') && (
                        <button
                          onClick={() => handleSubmitToReview(article.id)}
                          disabled={actionLoading === article.id}
                          title="Kirim ke Editor"
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-md hover:bg-blue-100 transition-all disabled:opacity-50"
                        >
                          {actionLoading === article.id
                            ? <Loader2 size={10} className="animate-spin" />
                            : <Send size={10} />
                          }
                          Kirim
                        </button>
                      )}
                      <Link
                        href={`/${site}/dashboard/articles/${article.id}`}
                        className="p-2 text-gray-400 hover:text-brand-red hover:bg-brand-red/5 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit3 size={15} />
                      </Link>
                      {article.status === 'published' && (
                        <Link
                          href={`/${site}/artikel/${article.slug}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-brand-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all"
                          title="Lihat artikel"
                        >
                          <Eye size={15} />
                        </Link>
                      )}
                      {(user?.role === 'superadmin' || user?.role === 'pimred') && (
                        <button 
                          onClick={() => handleDelete(article.id)}
                          disabled={actionLoading === article.id + 'del'}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all disabled:opacity-50"
                          title="Hapus"
                        >
                          {actionLoading === article.id + 'del'
                            ? <Loader2 size={15} className="animate-spin" />
                            : <Trash2 size={15} />
                          }
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-300 dark:text-white/10">
                      <FileText size={48} strokeWidth={1} />
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Tidak ada post'}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={handleNew}
                          className="mt-2 flex items-center gap-2 px-4 py-2 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all"
                        >
                          <Plus size={12} /> Tulis Post Pertama
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}