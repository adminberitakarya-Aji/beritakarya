import { SITE_MAP } from '@beritakarya/config'
import NewsCard from '@/components/ui/NewsCard'
import PublicSiteLayout from '@/components/layout/PublicSiteLayout'
import AdSpace from '@/components/ui/AdSpace'
import Link from 'next/link'
import { ArrowRight, Share2, PlayCircle, Camera, MessageCircle } from 'lucide-react'
import LoadMoreArticles from '@/components/ui/LoadMoreArticles'
import VideoWidget from '@/components/ui/VideoWidget'

async function getArticles(siteId: string, category?: string, search?: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    let url = `${apiUrl}/api/v1/articles/public?site=${siteId}&limit=11`;
    
    if (category && category !== 'Terbaru' && category !== 'Saved') {
      url += `&category=${encodeURIComponent(category)}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.articles || json?.data?.items || [];
  } catch (e) {
    console.error("Error fetching articles:", e);
    return [];
  }
}

export default async function SiteHomePage({ 
  params,
  searchParams 
}: { 
  params: { site: string },
  searchParams: { cat?: string; q?: string }
}) {
  const resolvedParams = await params;
  const siteParam = resolvedParams?.site || 'pusat';
  
  const resolvedSearchParams = await searchParams;
  const categoryFilter = resolvedSearchParams?.cat || 'Terbaru';
  const searchQuery = resolvedSearchParams?.q || '';

  console.log("DEBUG: Processing site:", siteParam, "Category:", categoryFilter, "Search:", searchQuery);
  
  let siteConfig = SITE_MAP[siteParam] || SITE_MAP['pusat'];
  
  // Hard fallback
  if (!siteConfig) {
    siteConfig = { id: 'pusat', name: 'BeritaKarya Pusat', domain: 'beritakarya.co', devDomain: 'localhost:3000' };
  }

  const articles = await getArticles(siteConfig.id, categoryFilter, searchQuery)
  const articlesList = Array.isArray(articles) ? articles : []
  
  const leadArticle = articlesList[0]
  const otherArticles = articlesList.slice(1, 11).filter(a => a && typeof a === 'object')
  const popular = articlesList.slice(0, 4).filter(a => a && typeof a === 'object')
  const tags = ['Galian C', 'Reformasi Hukum', 'Ketahanan Keluarga', 'IKN', 'Gresik Hari Ini', 'Pilpres 2029']

  return (
    <PublicSiteLayout siteConfig={siteConfig} initialCategory={categoryFilter}>
      <main id="main-content" className="max-w-7xl mx-auto px-4 py-8">
        {/* --- AD SLOT --- */}
        <AdSpace type="leaderboard" className="mb-12" />

        {/* --- LEAD STORY --- */}
        {leadArticle && (
          <section className="mb-16">
            <NewsCard 
              article={leadArticle} 
              variant="large" 
              site={siteParam}
            />
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* --- MAIN FEED --- */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-10 border-b border-gray-100 pb-4">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-brand-black flex items-center gap-2">
                <span className="w-2 h-2 bg-brand-red"></span>
                {searchQuery ? `Hasil Pencarian: ${searchQuery}` : `Berita ${categoryFilter}`}
              </h3>
              <Link href="#" className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted hover:text-brand-red transition-colors flex items-center gap-1">
                Urutan Terbaru <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 mb-12">
              {otherArticles.slice(0, 4).map((article: any) => (
                <NewsCard 
                  key={article.id} 
                  article={article} 
                  site={siteParam}
                />
              ))}
            </div>

            {/* --- IN-FEED AD --- */}
            <AdSpace type="in-feed" className="mb-12" label="Advertorial" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 mb-16">
              {otherArticles.slice(4).map((article: any) => (
                <NewsCard 
                  key={article.id} 
                  article={article} 
                  site={siteParam}
                />
              ))}
            </div>

            {/* Load More Section */}
            <LoadMoreArticles 
              siteId={siteConfig.id} 
              category={categoryFilter}
              search={searchQuery}
              initialPage={1}
            />
          </div>

          {/* --- SIDEBAR --- */}
          <aside className="lg:col-span-4 flex flex-col gap-12">
            {/* Trending Topics */}
            <div className="p-6 bg-brand-surface border border-gray-100 rounded-sm">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red mb-6 border-b border-brand-red/10 pb-2">Topik Hangat</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Link 
                    key={tag} 
                    href={`/${siteParam}?q=${encodeURIComponent(tag)}`}
                    className="px-3 py-1.5 bg-[var(--bg-main)] border border-gray-100 text-[9px] font-bold uppercase tracking-widest text-brand-text-muted hover:bg-brand-red hover:text-white hover:border-brand-red transition-all"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* --- SIDEBAR RECTANGLE AD --- */}
            <AdSpace type="rectangle" label="Sponsorship" />

            {/* Popular News */}
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-black mb-6 border-b border-brand-black/5 pb-2">Paling Populer</h4>
              <div className="flex flex-col gap-6">
                {popular.map((article: any, index: number) => (
                  <div key={article.id} className="flex gap-4 group">
                    <span className="text-3xl font-serif font-black text-gray-100 group-hover:text-brand-red transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <NewsCard 
                      article={article} 
                      variant="minimal" 
                      site={siteParam}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Video TV Widget */}
            <VideoWidget 
              title="Analisis Tajam: Mengapa Ekonomi Indonesia Tetap Tangguh di Tengah Krisis Global?"
              thumbnail="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800"
              duration="12:45"
            />

            {/* Newsletter */}
            <div className="sticky top-40 bg-slate-900 dark:bg-black/40 border border-transparent dark:border-white/5 p-8 rounded-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-red/10 rounded-full -mr-12 -mt-12 blur-3xl" />
              <h4 className="text-white font-serif text-2xl font-bold mb-4 relative z-10">Dapatkan Berita Pilihan</h4>
              <p className="text-gray-400 text-xs mb-6 font-light leading-relaxed relative z-10">
                Laporan investigasi dan analisis tajam langsung di email Anda setiap pagi.
              </p>
              <div className="flex flex-col gap-3 relative z-10">
                <input 
                  type="email" 
                  placeholder="Alamat Email Anda" 
                  className="bg-white/5 border border-white/10 px-4 py-3 text-xs text-white outline-none focus:border-brand-red transition-colors rounded-sm"
                />
                <button className="bg-brand-red text-white py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-brand-black transition-all rounded-sm">
                  Berlangganan
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </PublicSiteLayout>
  )
}
