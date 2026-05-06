import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Block } from '@beritakarya/types'
import PublicSiteLayout from '../../../../components/layout/PublicSiteLayout'
import { SITE_MAP } from '@beritakarya/config'
import NewsCard from '../../../../components/ui/NewsCard'
import ReadingProgress from '../../../../components/ui/ReadingProgress'
import AdSpace from '../../../../components/ui/AdSpace'
import ShareSidebar from '../../../../components/ui/ShareSidebar'
import AuthorCard from '../../../../components/ui/AuthorCard'
import EditorialBadge, { resolveArticleBadge } from '../../../../components/ui/EditorialBadge'
import { Clock, User, Share2, Link as LinkIcon, BookOpen, Calendar, Printer, MessageCircle, MessageSquare, X as XIcon } from 'lucide-react'
import { Metadata } from 'next'
import { cn } from '../../../../lib/utils'
import CommentSection from '../../../../components/ui/CommentSection'
import FontSizeControl from '../../../../components/ui/FontSizeControl'

interface Props {
  params: { site: string; slug: string }
}

import { constructMetadata } from '../../../../lib/metadata'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const siteParam = resolvedParams?.site || 'pusat';
  const slugParam = resolvedParams?.slug;
  
  const article = await getArticle(siteParam, slugParam)
  if (!article) return { title: 'Artikel Tidak Ditemukan' }

  const siteConfig = SITE_MAP[siteParam] || SITE_MAP['pusat']
  const siteName = siteConfig?.name || (siteParam.charAt(0).toUpperCase() + siteParam.slice(1));
  
  const excerpt = article.blocks.find((b: any) => b.type === 'paragraph')?.content || ''
  const coverImage = article.featuredImage || article.blocks.find((b: any) => b.type === 'image')?.url || '/logo.png'

  return constructMetadata({
    title: article.metaTitle || `${article.title} - ${siteName}`,
    description: article.metaDescription || excerpt.substring(0, 160),
    image: coverImage,
    siteParam,
    slug: slugParam
  })
}

async function getArticle(site: string, slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const res = await fetch(
    `${apiUrl}/api/v1/articles/slug/${slug}?site=${site}`,
    { next: { revalidate: 60 } }
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.data
}

async function getRelatedArticles(site: string, currentSlug: string, category?: string) {
  try {
    const params = new URLSearchParams({
      site,
      status: 'published',
      limit: '6',
      ...(category && { category })
    })
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const res = await fetch(
      `${apiUrl}/api/v1/articles?${params.toString()}`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return []
    const json = await res.json()
    const articles = json.data?.articles || json.data?.items || []
    return articles.filter((a: any) => a.slug !== currentSlug).slice(0, 3)
  } catch {
    return []
  }
}

async function getSiteSettings(siteId: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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
    domain: siteSettings?.domain || SITE_MAP[siteParam]?.domain || `${siteParam}.beritakarya.co`,
    devDomain: SITE_MAP[siteParam]?.devDomain || `${siteParam}.localhost:3000`
  }

  const article = await getArticle(siteParam, slugParam)
  if (!article || article.status !== 'published') notFound()

  const relatedArticles = await getRelatedArticles(siteParam, slugParam, article.category?.name)
  const coverImage = article.featuredImage || article.blocks.find((b: any) => b.type === 'image')?.url || '/placeholder.jpg'
  const excerpt = article.blocks.find((b: any) => b.type === 'paragraph')?.content || ''
  const articleUrl = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/${siteParam}/artikel/${slugParam}`

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
      "url": `${process.env.NEXT_PUBLIC_URL}/${siteParam}`
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

  const badgeVariant = resolveArticleBadge(article);
  const readingTime = article.readingTimeMin || Math.max(1, Math.ceil((article.wordCount || 0) / 200)) || 3;

  return (
    <PublicSiteLayout siteConfig={siteConfig}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress />
      <ShareSidebar title={article.title} />
      
      <article className="min-h-screen bg-white dark:bg-slate-950">
        {/* --- HEADER SECTION --- */}
        <header className="w-full bg-brand-surface dark:bg-white/[0.02] py-16 md:py-32 border-b border-gray-100 dark:border-white/5">
          <div className="max-w-4xl mx-auto px-4 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
              {badgeVariant && <EditorialBadge variant={badgeVariant} size="md" />}
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-brand-red text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-sm">
                  {article.category?.name || 'NASIONAL'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-muted">
                  {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            <h1 className="text-4xl md:text-7xl font-serif font-black text-brand-black dark:text-white leading-[1.05] tracking-tighter mb-12 text-balance">
              {article.title}
            </h1>

            <a 
              href={`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + articleUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm mr-2"
            >
              <MessageSquare size={18} />
            </a>
            <a 
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-10 h-10 rounded-full bg-sky-50 text-sky-600 items-center justify-center hover:bg-sky-600 hover:text-white transition-all shadow-sm"
            >
              <XIcon size={18} />
            </a>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-6 gap-x-8 border-t border-gray-100 dark:border-white/10 pt-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-red flex items-center justify-center text-white text-lg font-serif italic shadow-lg shadow-brand-red/20">
                  {article.author?.name?.[0] || 'R'}
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-black text-brand-black dark:text-white uppercase tracking-widest">{article.author?.name || 'Redaksi'}</div>
                  <div className="text-[9px] text-brand-text-muted font-bold uppercase tracking-widest mt-0.5">Staf Redaksi BeritaKarya</div>
                </div>
              </div>
              
              <div className="hidden sm:block h-8 w-px bg-gray-200 dark:bg-white/10" />
              
              <div className="flex items-center gap-6 text-brand-text-muted dark:text-gray-400 uppercase text-[10px] font-bold tracking-widest">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-brand-red" />
                  {readingTime} MENIT BACA
                </div>
                <div className="flex items-center gap-2">
                  <Printer size={14} className="text-brand-red" />
                  {article.wordCount || 0} KATA
                </div>
              </div>

              <div className="ml-auto hidden lg:flex items-center gap-4">
                 <FontSizeControl />
                 <div className="w-px h-6 bg-gray-100 dark:bg-white/10 mx-2" />
                 <button 
                   onClick={() => typeof window !== 'undefined' && window.print()}
                   className="p-2 text-gray-400 hover:text-brand-red transition-all"
                 >
                   <Printer size={18} />
                 </button>
                 <button className="p-2 text-gray-400 hover:text-brand-red transition-all"><MessageCircle size={18} /></button>
              </div>
            </div>
          </div>
        </header>

        {/* --- HERO IMAGE --- */}
        <div className="max-w-7xl mx-auto px-4 -mt-10 md:-mt-20 mb-20">
          <div className="aspect-video md:aspect-[21/9] w-full relative overflow-hidden shadow-2xl rounded-xl">
            <Image 
              src={coverImage} 
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
            {/* Image Credit Overlay */}
            <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 text-[9px] text-white font-black uppercase tracking-[0.2em] rounded-sm">
               Foto / Dokumentasi Redaksi
            </div>
          </div>
        </div>

        {/* --- CONTENT SECTION --- */}
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-16 md:gap-32 mb-32">
          {/* Main Content */}
          <div className="max-w-[760px] mx-auto lg:mx-0">
            {/* Lead Paragraph */}
            <div className="mb-20">
              <p className="text-2xl md:text-3xl font-serif italic text-gray-500 dark:text-gray-400 leading-relaxed relative pl-16">
                <span className="absolute left-0 top-0 text-8xl text-brand-red/20 font-serif leading-none select-none">“</span>
                {excerpt}
              </p>
            </div>

            <div className="space-y-12">
              <div className="article-content space-y-12 transition-all duration-300">
                {(article.blocks as Block[]).map((block: Block, i: number) => (
                  <PublicBlock key={i} block={block} />
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="mt-24 pt-16 border-t border-gray-100 dark:border-white/5 flex flex-wrap gap-3">
              {(article.tags || ['Investigasi', 'KaryaNyata', 'Nusantara', 'Politik']).map((tag: string) => (
                <Link 
                  key={tag} 
                  href={`/${siteParam}?q=${encodeURIComponent(tag)}`}
                  className="px-5 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-[10px] font-black text-brand-text-muted dark:text-gray-400 uppercase tracking-[0.2em] hover:bg-brand-red hover:text-white hover:border-brand-red transition-all rounded-full"
                >
                  #{tag}
                </Link>
              ))}
            </div>

            {/* Author Bio */}
            <div className="mt-20">
              <AuthorCard author={article.author} site={siteParam} />
            </div>

            {/* Comment Section */}
            <CommentSection articleId={article.id} />
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-40 space-y-20">
              {/* Share Box */}
              <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-red/20 blur-3xl rounded-full" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red mb-8 border-b border-white/5 pb-2">Bagikan Artikel</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Facebook', icon: Share2, color: 'bg-white/5 hover:bg-[#1877F2]' },
                    { label: 'Twitter', icon: Share2, color: 'bg-white/5 hover:bg-[#1DA1F2]' },
                    { label: 'WhatsApp', icon: MessageCircle, color: 'bg-white/5 hover:bg-[#25D366]' },
                    { label: 'Copy', icon: LinkIcon, color: 'bg-white/5 hover:bg-brand-red' }
                  ].map(btn => (
                    <button key={btn.label} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl transition-all group", btn.color)}>
                      <btn.icon size={18} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommended Widget */}
              <div>
                <div className="flex items-center gap-3 mb-10">
                   <div className="w-1 h-8 bg-brand-red" />
                   <h4 className="text-xs font-black uppercase tracking-[0.3em] text-brand-black dark:text-white">Rekomendasi</h4>
                </div>
                <div className="space-y-10">
                  {relatedArticles.length > 0 ? (
                    relatedArticles.map((rel: any) => (
                      <NewsCard key={rel.id} article={rel} variant="minimal" site={params.site} />
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">Memuat artikel terkait...</p>
                  )}
                </div>
              </div>

              {/* Sidebar Ad */}
              <div className="pt-10">
                <AdSpace type="rectangle" />
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
      return <p className="font-serif text-xl md:text-2xl antialiased">{block.content}</p>
    case 'heading':
      const Tag = `h${block.level}` as any
      return (
        <Tag className="font-serif font-black text-3xl md:text-5xl mt-20 mb-10 text-brand-black dark:text-white tracking-tight text-balance">
          {block.content}
        </Tag>
      )
    case 'quote':
      return (
        <div className="relative my-16 py-12 px-16 border-l-4 border-brand-red bg-gray-50 dark:bg-white/[0.03] rounded-r-2xl">
          <span className="absolute top-6 left-8 text-8xl font-serif text-brand-red opacity-10 leading-none select-none">“</span>
          <blockquote className="italic font-serif text-2xl md:text-3xl text-brand-black dark:text-white leading-[1.3] relative z-10">
            {block.content}
            {block.attribution && (
              <footer className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-red mt-6">— {block.attribution}</footer>
            )}
          </blockquote>
        </div>
      )
    case 'image':
      return (
        <figure className="my-16">
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-white/5">
            <Image 
              src={block.url} 
              alt={block.alt || 'Article image'}
              fill
              className="object-cover"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-6 flex justify-between items-start border-b border-gray-100 dark:border-white/5 pb-6">
              <span className="text-sm text-brand-text-muted dark:text-gray-400 italic leading-relaxed max-w-[80%]">{block.caption}</span>
              <span className="text-[9px] text-brand-text-muted dark:text-gray-500 uppercase tracking-widest font-black shrink-0">Foto / BeritaKarya</span>
            </figcaption>
          )}
        </figure>
      )
    default:
      return null
  }
}