import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Block } from '@beritakarya/types'
import PublicSiteLayout from '@/components/layout/PublicSiteLayout'
import { SITE_MAP } from '@beritakarya/config'
import NewsCard from '@/components/ui/NewsCard'
import ReadingProgress from '@/components/ui/ReadingProgress'
import AdSpace from '@/components/ui/AdSpace'
import ShareSidebar from '@/components/ui/ShareSidebar'
import { Clock, User, Share2, Link as LinkIcon, BookOpen } from 'lucide-react'
import { Metadata } from 'next'

interface Props {
  params: { site: string; slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const siteParam = resolvedParams?.site || 'pusat';
  const slugParam = resolvedParams?.slug;
  
  const article = await getArticle(siteParam, slugParam)
  if (!article) return { title: 'Artikel Tidak Ditemukan' }

  const siteConfig = SITE_MAP[siteParam] || SITE_MAP['pusat']
  const excerpt = article.blocks.find((b: any) => b.type === 'paragraph')?.content || ''
  const coverImage = article.blocks.find((b: any) => b.type === 'image')?.url || '/logo.png'

  const title = article.metaTitle || `${article.title} - ${siteConfig.name}`
  const description = article.metaDescription || excerpt.substring(0, 160)

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${process.env.NEXT_PUBLIC_URL}/${siteParam}/artikel/${slugParam}`,
      images: [{ url: coverImage }],
      publishedTime: article.publishedAt,
      authors: [article.author?.name || 'Redaksi'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [coverImage],
    }
  }
}

async function getArticle(site: string, slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/articles/slug/${slug}?site=${site}`,
    { next: { revalidate: 60 } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.data
}

async function getRelatedArticles(site: string, currentSlug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/articles?site=${site}&status=published&limit=5`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return []
    const json = await res.json()
    const articles = json.data?.articles || []
    return articles.filter((a: any) => a.slug !== currentSlug).slice(0, 3)
  } catch {
    return []
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
    return null;
  }
}

export default async function ArticlePage({ params }: Props) {
  const resolvedParams = await params;
  const siteParam = resolvedParams?.site || 'pusat';
  const slugParam = resolvedParams?.slug;

  const siteSettings = await getSiteSettings(siteParam)
  
  if (!siteSettings && siteParam !== 'pusat') {
    notFound()
  }

  const siteConfig = {
    id: siteParam,
    name: siteSettings?.name || SITE_MAP[siteParam]?.name || (siteParam.charAt(0).toUpperCase() + siteParam.slice(1)),
    domain: siteSettings?.domain || SITE_MAP[siteParam]?.domain || `${siteParam}.beritakarya.com`,
    devDomain: SITE_MAP[siteParam]?.devDomain || `${siteParam}.localhost:3000`
  }

  const article = await getArticle(siteParam, slugParam)
  if (!article || article.status !== 'published') notFound()

  const relatedArticles = await getRelatedArticles(siteParam, slugParam)
  const coverImage = article.blocks.find((b: any) => b.type === 'image')?.url || '/placeholder.jpg'
  const excerpt = article.blocks.find((b: any) => b.type === 'paragraph')?.content || ''

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [coverImage],
    "datePublished": article.publishedAt,
    "dateModified": article.updatedAt || article.publishedAt,
    "author": [{
      "@type": "Person",
      "name": article.author?.name || 'Redaksi',
      "url": `${process.env.NEXT_PUBLIC_URL}/${params.site}`
    }],
    "publisher": {
      "@type": "Organization",
      "name": siteConfig.name || "BeritaKarya",
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_URL}/logo.png`
      }
    },
    "description": excerpt
  }

  return (
    <PublicSiteLayout siteConfig={siteConfig}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress />
      <ShareSidebar title={article.title} />
      <article className="min-h-screen bg-white">
        {/* --- HEADER SECTION --- */}
        <div className="w-full bg-brand-surface py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <AdSpace type="leaderboard" className="mb-12" />
            <div className="flex items-center gap-3 mb-8">
              <span className="px-3 py-1 bg-brand-red text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-sm">
                {article.category?.name || 'NASIONAL'}
              </span>
              <div className="w-10 h-px bg-gray-200" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">
                {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </div>

            <h1 className="text-4xl md:text-7xl font-serif font-black text-brand-black leading-[1.1] tracking-tight mb-10">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-black flex items-center justify-center text-white text-lg font-serif italic">
                  {article.author?.name?.[0] || 'R'}
                </div>
                <div>
                  <div className="text-[11px] font-black text-brand-black uppercase tracking-widest">{article.author?.name || 'Redaksi'}</div>
                  <div className="text-[10px] text-brand-text-muted font-bold uppercase tracking-wider">Jurnalis BeritaKarya</div>
                </div>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div className="flex items-center gap-1.5 text-brand-text-muted uppercase text-[10px] font-bold tracking-widest">
                <BookOpen size={14} />
                2 MIN READ
              </div>
            </div>
          </div>
        </div>

        {/* --- HERO IMAGE --- */}
        <div className="max-w-7xl mx-auto px-4 -mt-10 md:-mt-20 mb-20">
          <div className="aspect-video md:aspect-[21/9] w-full relative overflow-hidden shadow-2xl rounded-sm">
            <Image 
              src={coverImage} 
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          <p className="mt-4 text-[10px] text-brand-text-muted font-medium uppercase tracking-[0.2em] italic">
            Visual Utama • Liputan Terverifikasi BeritaKarya
          </p>
        </div>

        {/* --- CONTENT SECTION --- */}
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16 md:gap-24 mb-32">
          {/* Main Content */}
          <div className="max-w-[720px] mx-auto lg:mx-0">
            {/* Lead Paragraph */}
            <div className="mb-16">
              <p className="text-2xl md:text-3xl font-serif italic text-gray-500 leading-relaxed relative pl-12">
                <span className="absolute left-0 top-0 text-7xl text-brand-red/20 leading-none">“</span>
                {excerpt}
              </p>
            </div>

            <div className="article-content space-y-10">
              {(article.blocks as Block[]).map((block) => (
                <PublicBlock key={block.id} block={block} />
              ))}
            </div>

            {/* Tags */}
            <div className="mt-24 pt-12 border-t border-gray-100 flex flex-wrap gap-3">
              {['Investigasi', 'KaryaNyata', 'Nusantara', 'Politik'].map(tag => (
                <span key={tag} className="px-5 py-2 bg-brand-surface border border-gray-100 text-[10px] font-black text-brand-text-muted uppercase tracking-[0.2em] hover:bg-brand-red hover:text-white transition-all cursor-pointer rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-40 space-y-16">
              <div className="bg-brand-surface p-8 border border-gray-100">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red mb-6 border-b border-brand-red/10 pb-2">Bagikan</h4>
                <div className="flex flex-col gap-4">
                  <button className="flex items-center gap-3 p-3 bg-white border border-gray-100 hover:text-[#1877F2] transition-all">
                    <Share2 size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Facebook</span>
                  </button>
                  <button className="flex items-center gap-3 p-3 bg-white border border-gray-100 hover:text-[#1DA1F2] transition-all">
                    <Share2 size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Twitter</span>
                  </button>
                  <button className="flex items-center gap-3 p-3 bg-white border border-gray-100 hover:text-brand-red transition-all">
                    <LinkIcon size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Salin Tautan</span>
                  </button>
                </div>
              </div>

              {/* Recommended Widget */}
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red mb-6 border-b border-brand-red/10 pb-2">Rekomendasi</h4>
                <div className="space-y-8">
                  {relatedArticles.map((rel: any) => (
                    <NewsCard key={rel.id} article={rel} variant="minimal" site={params.site} />
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </article>
    </PublicSiteLayout>
  )
}

function PublicBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'paragraph':
      return <p className="font-serif text-xl md:text-2xl leading-[1.8] text-brand-black">{block.content}</p>
    case 'heading':
      const Tag = `h${block.level}` as any
      return (
        <Tag className="font-serif font-black text-2xl md:text-3xl mt-16 mb-8 border-b-2 border-brand-red/10 pb-4">
          {block.content}
        </Tag>
      )
    case 'quote':
      return (
        <div className="relative my-12 py-10 px-12 border-y-2 border-brand-red/10 bg-brand-red/[0.02]">
          <span className="absolute -top-4 left-6 text-8xl font-serif text-brand-red opacity-10 leading-none">“</span>
          <blockquote className="italic font-serif text-xl md:text-2xl text-brand-black leading-tight">
            {block.content}
            {block.attribution && (
              <footer className="text-xs font-bold uppercase tracking-widest text-brand-red mt-4">— {block.attribution}</footer>
            )}
          </blockquote>
        </div>
      )
    case 'image':
      return (
        <figure className="my-12">
          <div className="relative aspect-video rounded-sm overflow-hidden">
            <Image 
              src={block.url} 
              alt={block.alt || 'Article image'}
              fill
              className="object-cover"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-4 flex justify-between items-start border-b border-gray-100 pb-4">
              <span className="text-sm text-brand-text-muted italic leading-relaxed">{block.caption}</span>
              <span className="text-[10px] text-brand-text-muted uppercase tracking-widest font-black shrink-0">Foto / BeritaKarya</span>
            </figcaption>
          )}
        </figure>
      )
    default:
      return null
  }
}