import { SITE_MAP } from '@beritakarya/config'
import NewsCard from '@/components/ui/NewsCard'
import PublicSiteLayout from '@/components/layout/PublicSiteLayout'
import AdSpace from '@/components/ui/AdSpace'
import Link from 'next/link'
import { ArrowRight, Share2, PlayCircle, Camera, MessageCircle } from 'lucide-react'
import LoadMoreArticles from '@/components/ui/LoadMoreArticles'
import VideoWidget from '@/components/ui/VideoWidget'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import NewsletterForm from '@/components/ui/NewsletterForm'

export async function generateMetadata({ params }: { params: { site: string } }): Promise<Metadata> {
  const resolvedParams = await params;
  const siteParam = resolvedParams?.site || 'pusat';
  const siteConfig = SITE_MAP[siteParam] || SITE_MAP['pusat'];
  
  return {
    title: `${siteConfig.name} - Berita Terkini & Terpercaya`,
    description: `Portal berita resmi ${siteConfig.name}. Menyajikan informasi terbaru, investigasi, dan analisis tajam dari seluruh Nusantara.`,
  }
}

import { notFound } from 'next/navigation'

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

async function getSiteSettings(siteId: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const res = await fetch(`${apiUrl}/api/v1/sites/settings?site=${siteId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch (e) {
    console.error("Error fetching site settings:", e);
    return null;
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
  
  const siteSettings = await getSiteSettings(siteParam)
  
  // If site not in DB and not 'pusat' -> 404 to prevent ghost tenants
  if (!siteSettings && siteParam !== 'pusat') {
    notFound()
  }

  // Build siteConfig dynamically from DB settings with static fallback
  const siteConfig = {
    id: siteParam,
    name: siteSettings?.name || SITE_MAP[siteParam]?.name || (siteParam.charAt(0).toUpperCase() + siteParam.slice(1)),
    domain: siteSettings?.domain || SITE_MAP[siteParam]?.domain || `${siteParam}.beritakarya.com`,
    devDomain: SITE_MAP[siteParam]?.devDomain || `${siteParam}.localhost:3000`
  }

  const articles = await getArticles(siteConfig.id, categoryFilter, searchQuery)
  
  const articlesList = Array.isArray(articles) ? articles : []
  
  const leadArticle = articlesList[0]
  const otherArticles = articlesList.slice(1, 11).filter(a => a && typeof a === 'object')
  const popular = articlesList.slice(0, 4).filter(a => a && typeof a === 'object')

  // Dynamic tags from DB, fallback to default if empty
  const defaultTags = ['Galian C', 'Reformasi Hukum', 'Ketahanan Keluarga', 'IKN', 'Gresik Hari Ini', 'Pilpres 2029']
  const tags = (siteSettings?.trendingTopics as string[])?.length > 0 
    ? (siteSettings.trendingTopics as string[]) 
    : defaultTags

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

            <NewsletterForm />
          </aside>
        </div>
      </main>
    </PublicSiteLayout>
  )
}
