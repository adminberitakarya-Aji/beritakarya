'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2,
  Calendar,
  User as UserIcon,
  ChevronRight,
  FileText,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  review: 'Review',
  published: 'Terbit'
};

const STATUS_STYLING: Record<string, { bg: string, text: string, dot: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  review: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
  published: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' }
};

export default function ArticlesPage() {
  const router = useRouter();
  const { site } = useParams<{ site: string }>();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params: any = { site };
        if (filter) params.status = filter;
        const { data } = await api.get('/articles', { params });
        setArticles(data.data.articles || data.data.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [site, filter]);

  const [isCreating, setIsCreating] = useState(false);

  const handleNew = async () => {
    setIsCreating(true);
    try {
      const { data } = await api.post('/articles', { 
        title: 'Draft Artikel Baru ' + new Date().toLocaleTimeString(),
        categoryId: null,
        tags: [],
        blocks: []
      });
      router.push(`/${site}/dashboard/articles/${data.data.id}`);
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Gagal membuat artikel baru');
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-black text-brand-black uppercase tracking-tight">Kelola Artikel</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Daftar seluruh konten berita di portal {site}.</p>
        </div>
        <button 
          onClick={handleNew}
          disabled={isCreating}
          className="flex items-center gap-2 px-6 py-3 bg-brand-red text-white text-xs font-black uppercase tracking-widest hover:bg-brand-black transition-all shadow-lg shadow-brand-red/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} 
          {isCreating ? 'Membuat...' : 'Buat Artikel'}
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center rounded-sm">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Cari judul artikel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none text-sm focus:ring-1 focus:ring-brand-red outline-none rounded-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2 shrink-0">Filter:</span>
          {['', 'draft', 'review', 'published'].map(s => (
            <button 
              key={s} 
              onClick={() => setFilter(s)}
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap",
                filter === s 
                  ? "bg-brand-black text-white border-brand-black" 
                  : "bg-white text-gray-400 border-gray-200 hover:border-brand-red hover:text-brand-red"
              )}
            >
              {s === '' ? 'Semua' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
             <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Menyelaraskan Data...</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-brand-surface border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Konten Artikel</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Penulis</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredArticles.filter(a => a && a.id).map((article) => {
                const style = STATUS_STYLING[article.status] || STATUS_STYLING.draft;
                return (
                  <tr key={article.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1 max-w-md">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-brand-red">
                          {article.category?.name || 'UMUM'}
                        </span>
                        <Link 
                          href={`/${site}/dashboard/articles/${article.id}`}
                          className="text-sm font-bold text-brand-black group-hover:text-brand-red transition-colors line-clamp-1 uppercase tracking-tight"
                        >
                          {article.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                           <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(article.createdAt).toLocaleDateString()}</span>
                           <span>•</span>
                           <span className="flex items-center gap-1"><Eye size={12} /> {article.view_count || 0} Views</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-serif italic text-gray-500">
                          {article.author?.name?.[0] || 'R'}
                        </div>
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                          {article.author?.name || 'Redaksi'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest",
                        style.bg, style.text
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", style.dot)}></span>
                        {STATUS_LABELS[article.status]}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/${site}/dashboard/articles/${article.id}`}
                          className="p-2 text-gray-400 hover:text-brand-red transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </Link>
                        <Link 
                          href={`/${site}/artikel/${article.slug}`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-brand-black transition-colors"
                          title="View"
                        >
                          <Eye size={18} />
                        </Link>
                        <button 
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredArticles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-300">
                      <FileText size={48} strokeWidth={1} />
                      <p className="text-xs font-bold uppercase tracking-widest">Tidak ada artikel ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}