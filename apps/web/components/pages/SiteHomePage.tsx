import { SITE_MAP } from '@beritakarya/config'
import NewsCard from '../ui/NewsCard'
import PublicSiteLayout from '../layout/PublicSiteLayout'
import AdSpace from '../ui/AdSpace'
import Link from 'next/link'
import { ArrowRight, Share2, PlayCircle, Camera, MessageCircle, TrendingUp, Zap, Star, Send } from 'lucide-react'
import LoadMoreArticles from '../ui/LoadMoreArticles'
import VideoWidget from '../ui/VideoWidget'
import NewsletterForm from '../ui/NewsletterForm'
import { notFound } from 'next/navigation'

type SearchParams = {
  cat?: string
  q?: string
}

type SiteHomePageProps = {
  siteParam: string
  searchParams: SearchParams
}

async function getArticles(siteId: string, category?: string, search?: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    let url = `${apiUrl}/api/v1/articles/public?site=${siteId}&limit=25`

    if (category && category !== 'Terbaru' && category !== 'Saved') {
      url += `&category=${encodeURIComponent(category)}`
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const json = await res.json()
    return json?.data?.articles || json?.data?.items || []
  } catch (e) {
    console.error('Error fetching articles:', e)
    return []
  }
}

async function getSiteSettings(siteId: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(`${apiUrl}/api/v1/sites/settings?site=${siteId}`, { cache: 'no-store' })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || null
  } catch (e) {
    console.error('Error fetching site settings:', e)
    return null
  }
}

export async function SiteHomePage({ siteParam, searchParams }: SiteHomePageProps) {
  const resolvedSearchParams = await searchParams
  const categoryFilter = resolvedSearchParams?.cat || 'Terbaru'
  const searchQuery = resolvedSearchParams?.q || ''

  const siteSettings = await getSiteSettings(siteParam)

  if (!siteSettings && siteParam !== 'pusat') {
    notFound()
  }

  const siteConfig = {
    id: siteParam,
    name:
      siteSettings?.name || SITE_MAP[siteParam]?.name ||
      (siteParam.charAt(0).toUpperCase() + siteParam.slice(1)),
    domain:
      siteSettings?.domain || SITE_MAP[siteParam]?.domain ||
      `${siteParam}.beritakarya.com`,
    devDomain: SITE_MAP[siteParam]?.devDomain || `${siteParam}.localhost:3000`
  }

  const articlesList = await getArticles(siteConfig.id, categoryFilter, searchQuery)
  const leadArticle = articlesList[0]
  const secondaryStories = articlesList.slice(1, 4)
  const mainFeed = articlesList.slice(4, 12)
  const popular = articlesList.slice(0, 5)

  const defaultTags = ['Politik', 'Ekonomi', 'Investigasi', 'Teknologi', 'Gaya Hidup', 'Hiburan']
  const tags = (siteSettings?.trendingTopics as string[])?.length > 0
    ? (siteSettings.trendingTopics as string[])
    : defaultTags

  return (
    <PublicSiteLayout siteConfig={siteConfig} initialCategory={categoryFilter}>
      <main id="main-content" className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-center mb-12">
          <AdSpace type="leaderboard" />
        </div>

        {!searchQuery && categoryFilter === 'Terbaru' && (
          <section className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                {leadArticle && (
                  <NewsCard article={leadArticle} variant="large" site={siteParam} />
                )}
              </div>
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-100 dark:border-white/5 pb-2">
                  <Zap size={16} className="text-brand-red" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-white">Highlights</h3>
                </div>
                {secondaryStories.map((article: any) => (
                  <NewsCard key={article.id} article={article} variant="horizontal" site={siteParam} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mb-16 py-6 border-y border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0 bg-brand-red text-white px-4 py-1.5 rounded-sm">
              <TrendingUp size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Trending</span>
            </div>
            {tags.map(tag => (
              <Link
                key={tag}
                href={`/${siteParam}?q=${encodeURIComponent(tag)}`}
                className="shrink-0 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted hover:text-brand-red transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-12 border-b-4 border-brand-black dark:border-white pb-4">
              <h3 className="text-lg font-serif font-black uppercase tracking-tight text-brand-black dark:text-white flex items-center gap-3">
                <span className="w-4 h-4 bg-brand-red"></span>
                {searchQuery ? `Hasil Pencarian: ${searchQuery}` : `Berita ${categoryFilter}`}
              </h3>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-brand-text-muted">
                <span className="text-brand-red cursor-pointer">Terbaru</span>
                <span className="cursor-pointer hover:text-brand-black transition-colors">Populer</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 mb-16">
              {mainFeed.slice(0, 4).map((article: any) => (
                <NewsCard key={article.id} article={article} site={siteParam} />
              ))}
            </div>

            <div className="mb-16 p-8 bg-brand-grey dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Sponsorship</span>
                <span className="text-[9px] font-bold text-gray-300">ADVERTISEMENT</span>
              </div>
              <AdSpace type="in-feed" className="mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 mb-16">
              {mainFeed.slice(4).map((article: any) => (
                <NewsCard key={article.id} article={article} site={siteParam} />
              ))}
            </div>

            <div className="pt-12 border-t border-gray-100 dark:border-white/5">
              <LoadMoreArticles siteId={siteConfig.id} category={categoryFilter} search={searchQuery} initialPage={1} />
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-16">
            <div className="p-8 bg-slate-900 rounded-2xl text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Send size={80} />
              </div>
              <h4 className="text-2xl font-serif font-black leading-tight mb-4 relative z-10">Dapatkan Berita Eksklusif di Inbox Anda</h4>
              <p className="text-sm text-gray-400 mb-8 font-light relative z-10">Bergabunglah dengan 50,000+ pembaca setia BeritaKarya.</p>
              <NewsletterForm />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-8">
                <Star size={18} className="text-brand-red fill-brand-red" />
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-brand-black dark:text-white">Paling Populer</h4>
              </div>
              <div className="flex flex-col gap-8">
                {popular.map((article: any, index: number) => (
                  <div key={article.id} className="flex gap-5 group items-start">
                    <span className="text-4xl font-serif font-black text-gray-100 dark:text-white/5 group-hover:text-brand-red transition-colors tabular-nums">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <NewsCard article={article} variant="minimal" site={siteParam} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {siteSettings?.featuredVideo && (
              <div className="sticky top-28">
                <VideoWidget
                  title={siteSettings.featuredVideo.title}
                  thumbnail={siteSettings.featuredVideo.thumbnail}
                  duration={siteSettings.featuredVideo.duration}
                />
                <div className="mt-8">
                  <AdSpace type="rectangle" />
                </div>
              </div>
            )}
            {!siteSettings?.featuredVideo && (
              <div className="sticky top-28">
                <AdSpace type="rectangle" />
              </div>
            )}
          </aside>
        </div>
      </main>

      <section className="bg-brand-black dark:bg-black py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
            © 2026 BeritaKarya Global Media. <br />Jernih Melihat Nusantara.
          </div>
          <div className="flex justify-center gap-6">
            <Link href="#" className="text-white/60 hover:text-white transition-colors"><Share2 size={20} /></Link>
            <Link href="#" className="text-white/60 hover:text-white transition-colors"><PlayCircle size={20} /></Link>
            <Link href="#" className="text-white/60 hover:text-white transition-colors"><Camera size={20} /></Link>
            <Link href="#" className="text-white/60 hover:text-white transition-colors"><MessageCircle size={20} /></Link>
          </div>
          <div className="flex justify-end gap-6 text-white/40 text-[10px] font-bold uppercase tracking-widest">
            <Link href="#" className="hover:text-white transition-colors">Privasi</Link>
            <Link href="#" className="hover:text-white transition-colors">Syarat</Link>
            <Link href="#" className="hover:text-white transition-colors">Redaksi</Link>
          </div>
        </div>
      </section>
    </PublicSiteLayout>
  )
}
