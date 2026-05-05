'use client';

import { motion } from 'framer-motion';
import { 
  FileText, 
  Eye, 
  Image as ImageIcon, 
  BarChart3, 
  ChevronRight, 
  TrendingUp,
  Plus
} from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Skeleton from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

export default function DashboardOverview() {
  const { site } = useParams() as { site: string };
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/articles', { params: { site } });
        setArticles(data.data.articles || data.data.items || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [site]);

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <div className="bg-white p-6 border border-gray-100 rounded-sm shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-sm", color || "bg-gray-50 text-gray-400")}>
          <Icon size={20} />
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-green-500 bg-green-500/5 px-2 py-1 flex items-center gap-1">
            <TrendingUp size={10} /> {trend}
          </span>
        )}
      </div>
      <h3 className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 mb-1">{title}</h3>
      <p className="text-3xl font-serif font-black text-brand-black">{value}</p>
    </div>
  );

  if (loading) return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-8 w-64" />
          <Skeleton variant="text" className="h-4 w-96" />
        </div>
        <Skeleton variant="text" className="h-12 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="text" className="h-32 w-full" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton variant="text" className="h-64 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton variant="text" className="h-64 w-full" />
        </div>
      </div>
    </div>
  );


  const totalArticles = articles.length;
  const publishedArticles = articles.filter(a => a?.status === 'published').length;
  const draftArticles = articles.filter(a => a?.status === 'draft').length;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header with Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-black text-brand-black uppercase tracking-tight">Ringkasan Redaksi</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Selamat datang kembali di pusat kendali berita.</p>
        </div>
        <Link 
          href={`/${site}/dashboard/articles/new`}
          className="flex items-center gap-2 px-6 py-3 bg-brand-black text-white text-xs font-black uppercase tracking-widest hover:bg-brand-red transition-all shadow-lg shadow-black/10"
        >
          <Plus size={16} /> Tulis Artikel Baru
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Artikel" value={totalArticles} icon={FileText} trend="+12%" color="bg-blue-50 text-blue-500" />
        <StatCard title="Sudah Terbit" value={publishedArticles} icon={Eye} color="bg-green-50 text-green-500" />
        <StatCard title="Draft / Review" value={draftArticles} icon={FileText} color="bg-yellow-50 text-yellow-500" />
        <StatCard title="Estimasi Pembaca" value="12.4K" icon={BarChart3} trend="+5.4%" color="bg-purple-50 text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-gray-100 p-8 rounded-sm shadow-sm">
          <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-4">
            <h3 className="font-serif font-black uppercase tracking-[0.2em] text-xs text-brand-black">Aktivitas Terakhir</h3>
            <Link href={`/${site}/dashboard/articles`} className="text-[10px] font-black uppercase tracking-widest text-brand-red hover:underline">
              Lihat Semua
            </Link>
          </div>
          <div className="space-y-6">
            {articles.slice(0, 5).filter(a => a && a.id).map((article: any) => (
              <Link 
                key={article.id} 
                href={`/${site}/dashboard/articles/edit/${article.id}`}
                className="flex items-center gap-4 group cursor-pointer border-b border-gray-50 pb-4 last:border-0 last:pb-0"
              >
                <div className="w-12 h-12 bg-brand-surface flex items-center justify-center font-serif font-bold text-brand-red border border-gray-100 group-hover:bg-brand-red group-hover:text-white transition-all">
                  {article.category?.name?.[0] || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-brand-black line-clamp-1 group-hover:text-brand-red transition-colors uppercase tracking-tight">
                    {article.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm",
                      article.status === 'published' ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                    )}>
                      {article.status}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest tracking-tighter">
                      {article.author?.name} • {new Date(article.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-200 group-hover:text-brand-red transition-all group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>

        {/* Categories / Right Sidebar */}
        <div className="space-y-8">
          <div className="bg-brand-black p-8 rounded-sm shadow-xl text-white">
            <h3 className="font-serif font-black uppercase tracking-[0.2em] text-xs mb-8 border-b border-white/10 pb-4">Performa Kategori</h3>
            <div className="space-y-6">
              {['Nasional', 'Daerah', 'Ekonomi'].map((cat, i) => (
                <div key={cat} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
                    <span className="text-gray-400">{cat}</span>
                    <span className="text-brand-red">{85 - i * 15}%</span>
                  </div>
                  <div className="h-1 bg-white/10 overflow-hidden rounded-full">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${85 - i * 15}%` }}
                      className="h-full bg-brand-red"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-8 rounded-sm shadow-sm">
            <h3 className="font-serif font-black uppercase tracking-[0.2em] text-xs mb-6 text-brand-black">Bantuan Redaksi</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-light mb-6">
              Butuh bantuan mengelola konten atau ada kendala teknis? Hubungi tim support kami.
            </p>
            <button className="w-full py-3 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-brand-black hover:bg-brand-red hover:text-white transition-all border border-gray-100">
              Hubungi Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
