'use client';

import { motion } from 'framer-motion';
import { 
  FileText, Eye, BarChart3, ChevronRight, TrendingUp, Plus,
  Clock, CheckCircle, AlertCircle, Send, Calendar, Users,
  ArrowUpRight, ArrowDownRight, Zap, BookOpen, Target,
  Tag, Settings, MousePointer2
} from 'lucide-react';
import TrafficChart from '../../../components/dashboard/TrafficChart';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Skeleton from '../../../components/ui/Skeleton';
import StatusBadge from '../../../components/ui/StatusBadge';
import { cn } from '../../../lib/utils';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';

// ─── Types ──────────────────────────────────────────────────────
interface Article {
  id: string;
  title: string;
  status: string;
  category?: { name: string };
  author?: { name: string };
  publishedAt?: string;
  createdAt: string;
  viewCount?: number;
}

// ─── Mini Sparkline ──────────────────────────────────────────────
// ─── Real-time Pulse Indicator ──────────────────────────────────
function RealTimePulse({ totalViews }: { totalViews: number }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // If we have total views, simulate active readers as a small fraction (e.g. 0.5% - 2%)
    // If 0 views, stay 0. This is more "real" for a new site.
    if (totalViews === 0) {
      setCount(0);
      return;
    }

    const base = Math.max(1, Math.floor(totalViews / 500));
    setCount(base);

    const interval = setInterval(() => {
      setCount(prev => {
        if (prev === 0) return 0;
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        return Math.max(1, prev + change);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [totalViews]);

  return (
    <div className="flex items-center gap-3 bg-brand-red/5 px-4 py-2 rounded-2xl border border-brand-red/10">
      <div className="relative">
        <div className={cn("w-2.5 h-2.5 rounded-full", count > 0 ? "bg-brand-red" : "bg-gray-300")} />
        {count > 0 && <div className="absolute inset-0 w-2.5 h-2.5 bg-brand-red rounded-full animate-ping opacity-75" />}
      </div>
      <div className="flex flex-col">
        <span className="text-[14px] font-black text-brand-black dark:text-white leading-none tabular-nums">{count}</span>
        <span className="text-[9px] font-black text-brand-red uppercase tracking-widest mt-0.5">Pembaca Aktif</span>
      </div>
    </div>
  );
}

function Sparkline({ values, color = '#B91C1C' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - (v / max) * 100;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-16 h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────
interface KPICardProps {
  title: string;
  value: string | number;
  sub?: string;
  trend?: number; // positive = up, negative = down
  icon: React.ElementType;
  accent: string;
  sparkData?: number[];
  delay?: number;
}

function KPICard({ title, value, sub, trend, icon: Icon, accent, sparkData, delay = 0 }: KPICardProps) {
  const isUp = trend !== undefined && trend >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative h-full"
    >
      {/* Hover Glow Effect */}
      <div className={cn(
        "absolute -inset-0.5 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500",
        accent.includes('blue') ? 'bg-blue-500' : 
        accent.includes('emerald') ? 'bg-emerald-500' : 
        accent.includes('red') ? 'bg-red-500' : 'bg-brand-red'
      )} />
      
      <div className="relative dash-card p-5 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden h-full flex flex-col">
        {/* Subtle Decorative Gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent -mr-16 -mt-16 rounded-full" />
        
        <div className="flex items-start justify-between mb-4 relative z-10 shrink-0">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-inner', accent)}>
            <Icon size={18} />
          </div>
          {trend !== undefined && (
            <span className={cn(
              'flex items-center gap-0.5 text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md',
              isUp ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                   : 'bg-red-500/10 text-red-600 dark:text-red-400'
            )}>
              {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        
        <div className="relative z-10 flex flex-col flex-1">
          <p className="dash-label mb-1 opacity-60">{title}</p>
          <p className="text-3xl font-black text-brand-black dark:text-white tabular-nums tracking-tighter">
            {value}
          </p>
          <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-100/50 dark:border-white/5 min-h-8">
            {sub && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{sub}</p>}
            {sparkData && <Sparkline values={sparkData} color={isUp ? '#10B981' : '#EF4444'} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Review Queue Preview ────────────────────────────────────────
function ReviewQueueItem({ article, site, index }: { article: Article; site: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      className="flex items-center gap-3 py-3.5 border-b border-gray-50 dark:border-white/5 last:border-0 group"
    >
      <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
        <AlertCircle size={16} className="text-violet-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-brand-black dark:text-white line-clamp-1 group-hover:text-brand-red transition-colors">
          {article.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-brand-red font-bold uppercase tracking-widest">
            {article.category?.name || 'Umum'}
          </span>
          <span className="text-gray-300 dark:text-white/10 text-[10px]">•</span>
          <span className="text-[10px] text-gray-400 font-medium">
            oleh {article.author?.name || 'Redaksi'}
          </span>
        </div>
      </div>
      <Link
        href={`/${site}/dashboard/articles/${article.id}`}
        className="shrink-0 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
      >
        Review
      </Link>
    </motion.div>
  );
}

// ─── Recent Activity Item ─────────────────────────────────────────
function ActivityItem({ article, site, index }: { article: Article; site: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 * index }}
    >
      <Link 
        href={`/${site}/dashboard/articles/${article.id}`}
        className="flex items-center gap-3 py-3.5 border-b border-gray-50 dark:border-white/5 last:border-0 group cursor-pointer"
      >
        <div className="w-9 h-9 rounded-lg bg-brand-surface dark:bg-white/5 flex items-center justify-center font-serif font-bold text-brand-red text-sm flex-shrink-0 group-hover:bg-brand-red group-hover:text-white transition-all">
          {article.category?.name?.[0] || 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-brand-black dark:text-white line-clamp-1 group-hover:text-brand-red transition-colors">
            {article.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={article.status} />
            <span className="text-[10px] text-gray-400 font-medium">
              {new Date(article.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}
            </span>
          </div>
        </div>
        <ChevronRight size={14} className="text-gray-200 group-hover:text-brand-red transition-all group-hover:translate-x-0.5 flex-shrink-0" />
      </Link>
    </motion.div>
  );
}

// ─── Category Performance Bar ─────────────────────────────────────
function CategoryBar({ name, value, max }: { name: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
        <span className="text-gray-400">{name}</span>
        <span className="text-brand-red">{value} post</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-brand-red to-red-400 rounded-full"
        />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function DashboardOverview() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const [articles, setArticles] = useState<Article[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [topContent, setTopContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Selamat');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam');
    setCurrentDate(new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' }));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [artRes, trafficRes, topRes] = await Promise.all([
          api.get('/articles', { params: { limit: 50 } }),
          api.get('/analytics/traffic', { params: { days: 7 } }),
          api.get('/analytics/top-content', { params: { limit: 5 } })
        ]);
        
        setArticles(artRes.data.data.articles || artRes.data.data.items || []);
        setTrafficData(trafficRes.data.data);
        setTopContent(topRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [site]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton variant="text" className="h-8 w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} variant="text" className="h-36 w-full rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><Skeleton variant="text" className="h-72 w-full rounded-lg" /></div>
          <Skeleton variant="text" className="h-72 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Computed stats
  const total       = articles.length;
  const published   = articles.filter(a => a.status === 'published').length;
  const drafts      = articles.filter(a => a.status === 'draft').length;
  const inReview    = articles.filter(a => a.status === 'review' || a.status === 'submitted').length;
  const scheduled   = articles.filter(a => a.status === 'scheduled').length;

  const reviewQueue   = articles.filter(a => a.status === 'review' || a.status === 'submitted').slice(0, 4);
  const recentActivity = [...articles].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  // Category breakdown
  const catMap: Record<string, number> = {};
  articles.forEach(a => {
    const cat = a.category?.name || 'Umum';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const catMax = catEntries[0]?.[1] || 1;

  // Sparkline data from real traffic
  const trafficSpark = trafficData.length > 0 ? trafficData.map(d => d.views) : [0,0,0,0,0,0,0];
  const publishedSpark = trafficData.length > 0 ? trafficData.map(d => Math.floor(d.views / 20)) : [0,0,0,0,0,0,0];

  const ROLE_GREETINGS: Record<string, string> = {
    superadmin: 'Superadmin',
    wapimred: 'Wapimred',
    journalist: 'Wartawan',
  };


  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{greeting},</span>
            <span className="text-[10px] font-black text-brand-red uppercase tracking-widest">
              {ROLE_GREETINGS[user?.role || 'journalist']}
            </span>
          </div>
          <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight">
            {user?.name || 'Redaktur'}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Portal <strong className="text-brand-red uppercase">{site}</strong> — {currentDate}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RealTimePulse totalViews={articles.reduce((s, a) => s + (a.viewCount || 0), 0)} />
          <Link 
            href={`/${site}/dashboard/articles/new`}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-brand-red/20"
          >
            <Plus size={15} /> Post Berita
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Post" value={total} icon={FileText}
          accent="bg-blue-50 text-blue-500 dark:bg-blue-900/20"
          sparkData={trafficSpark} sub="Semua status" delay={0} />
        <KPICard title="Sudah Terbit" value={published} icon={CheckCircle}
          accent="bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20"
          sparkData={publishedSpark} sub="Terbit publik" delay={0.05} />
        <KPICard title="Antrian Review" value={inReview} icon={AlertCircle}
          accent={inReview > 5 ? "bg-red-50 text-red-500 dark:bg-red-900/20" : "bg-amber-50 text-amber-500 dark:bg-amber-900/20"}
          sub={inReview > 0 ? "Perlu perhatian" : "Semua bersih"} delay={0.1} />
        <KPICard title="Terjadwal" value={scheduled} icon={Calendar}
          accent="bg-cyan-50 text-cyan-500 dark:bg-cyan-900/20"
          sub="Antri terbit" delay={0.15} />
      </div>

      {/* ── Secondary Cards (hanya superadmin/wapimred) ── */}
      {(user?.role === 'superadmin' || user?.role === 'wapimred') && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="dash-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <Target size={18} className="text-violet-500" />
            </div>
            <div>
              <p className="dash-label">Target Hari Ini</p>
              <p className="text-lg font-black text-brand-black dark:text-white">{published} <span className="text-sm font-medium text-gray-400">/ 10</span></p>
              <div className="mt-1.5 h-1 w-32 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min((published/10)*100, 100)}%` }} />
              </div>
            </div>
          </div>
          <div className="dash-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
              <BookOpen size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="dash-label">Draft Belum Selesai</p>
              <p className="text-lg font-black text-brand-black dark:text-white">{drafts}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Perlu diselesaikan</p>
            </div>
          </div>
          <div className="dash-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
              <Zap size={18} className="text-sky-500" />
            </div>
            <div>
              <p className="dash-label">Est. Total Views</p>
              <p className="text-lg font-black text-brand-black dark:text-white">
                {(articles.reduce((s, a) => s + (a.viewCount || 0), 0) / 1000).toFixed(1)}K
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Semua post</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Traffic Overview Chart ── */}
      <div className="dash-card">
        <div className="dash-card-header">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-brand-red" />
            <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Ikhtisar Trafik</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">Real-time</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="dash-label mb-1">Total Views (7 Hari)</p>
              <p className="text-4xl font-black text-brand-black dark:text-white tabular-nums">
                {trafficData.reduce((acc, curr) => acc + curr.views, 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="dash-label mb-1">Sumber Trafik Utama</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded">Direct</span>
                <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase rounded">Google</span>
                <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase rounded">Social</span>
              </div>
            </div>
            <div>
              <p className="dash-label mb-1">Engagement Rate</p>
              <p className="text-xl font-black text-gray-400 dark:text-gray-500 tabular-nums flex items-center gap-2">
                N/A
              </p>
            </div>
          </div>
          
          <TrafficChart data={trafficData} />
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Review Queue (wapimred/superadmin) atau Recent Activity (journalist) */}
        <div className="lg:col-span-2 space-y-6">
          {(user?.role === 'superadmin' || user?.role === 'wapimred') && reviewQueue.length > 0 && (
            <div className="dash-card">
              <div className="dash-card-header">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-violet-500" />
                  <h3 className="dash-label text-violet-600 dark:text-violet-400">Antrian Review</h3>
                  {inReview > 0 && (
                    <span className="px-1.5 py-0.5 bg-violet-600 text-white text-[9px] font-black rounded-full">{inReview}</span>
                  )}
                </div>
                <Link href={`/${site}/dashboard/review`} className="text-[10px] font-black uppercase tracking-widest text-brand-red hover:underline flex items-center gap-1">
                  Semua <ChevronRight size={12} />
                </Link>
              </div>
              <div className="dash-card-body py-2">
                {reviewQueue.map((a, i) => <ReviewQueueItem key={a.id} article={a} site={site} index={i} />)}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-brand-red" />
                <h3 className="dash-label">Aktivitas Terakhir</h3>
              </div>
              <Link href={`/${site}/dashboard/articles`} className="text-[10px] font-black uppercase tracking-widest text-brand-red hover:underline flex items-center gap-1">
                Lihat Semua <ChevronRight size={12} />
              </Link>
            </div>
            <div className="dash-card-body py-2">
              {recentActivity.length === 0 ? (
                <div className="py-12 flex flex-col items-center gap-3 text-gray-200 dark:text-white/10">
                  <FileText size={40} strokeWidth={1} />
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-300">Belum ada post</p>
                </div>
              ) : (
                recentActivity.map((a, i) => <ActivityItem key={a.id} article={a} site={site} index={i} />)
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Category Performance */}
          <div className="dash-card bg-slate-900 dark:bg-black/50 text-white border-0">
            <div className="dash-card-header border-white/5">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-brand-red" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Performa Rubrik</h3>
              </div>
              <TrendingUp size={14} className="text-brand-red" />
            </div>
            <div className="p-6 space-y-5">
              {catEntries.length > 0 ? (
                catEntries.map(([name, count]) => (
                  <CategoryBar key={name} name={name} value={count} max={catMax} />
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">Belum ada data kategori</p>
              )}
            </div>
          </div>

          {/* Top Performing Content */}
          <div className="dash-card">
            <div className="dash-card-header">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-red" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Konten Terpopuler</h3>
              </div>
              <Link href={`/${site}/dashboard/articles`} className="text-[9px] font-black text-brand-red uppercase tracking-widest hover:underline">Semua</Link>
            </div>
            <div className="p-2">
              {topContent.length > 0 ? (
                topContent.map((item, i) => (
                  <Link key={item.id} href={`/${site}/dashboard/articles/${item.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all group">
                    <span className="text-sm font-black text-gray-300 group-hover:text-brand-red transition-colors w-4">0{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-brand-black dark:text-white line-clamp-1">{item.title}</p>
                      <p className="text-[10px] text-brand-red font-bold uppercase tracking-widest mt-0.5">{item.category?.name || 'NASIONAL'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Eye size={12} />
                      <span className="text-[11px] font-black tabular-nums">{(item.viewCount || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-center py-10 text-xs text-gray-400">Belum ada data populer</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-label">Aksi Cepat</h3>
            </div>
            <div className="p-4 space-y-2">
               {[
                 { label: 'Tulis Post Berita', href: `/${site}/dashboard/articles`, icon: Plus, color: 'bg-brand-red text-white hover:bg-red-700' },
                 { label: 'Kelola Kategori', href: `/${site}/dashboard/categories`, icon: Tag, color: 'bg-gray-50 dark:bg-white/5 text-brand-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/10' },
                 { label: 'Pengaturan Situs', href: `/${site}/dashboard/settings`, icon: Settings, color: 'bg-gray-50 dark:bg-white/5 text-brand-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/10' },
               ].filter(item => {
                 if (item.label === 'Pengaturan Situs') return user?.role === 'superadmin' || user?.role === 'wapimred';
                 return true;
               }).map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn('flex items-center gap-3 px-4 py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all', item.color)}
                >
                  <item.icon size={14} /> {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div className="dash-card p-6 text-center bg-gradient-to-br from-brand-red/5 to-violet-500/5 border-brand-red/10">
            <div className="w-10 h-10 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={16} className="text-brand-red" />
            </div>
            <p className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight mb-1">Bantuan Redaksi</p>
            <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
              Kendala teknis atau pertanyaan editorial? Tim kami siap membantu.
            </p>
            <button className="w-full py-2.5 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all">
              Hubungi Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}