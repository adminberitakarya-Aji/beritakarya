'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, BookOpen, Bookmark, User, Share2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '../../lib/utils';
import EditorialBadge, { resolveArticleBadge } from './EditorialBadge';

interface NewsCardProps {
  article: any;
  variant?: 'large' | 'medium' | 'minimal' | 'horizontal';
  site?: string;
}

export default function NewsCard({ article, variant = 'medium', site = 'pusat' }: NewsCardProps) {
  const imageUrl = article.featuredImage || article.blocks?.find((b: any) => b.type === 'image')?.url || '/placeholder.jpg';
  const excerpt = article.blocks?.find((b: any) => b.type === 'paragraph')?.content || '';
  const date = new Date(article.publishedAt || article.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const readTime = article.readingTimeMin ? `${article.readingTimeMin} min read` : "3 min read";
  const badgeVariant = resolveArticleBadge(article);

  if (variant === 'large') {
    return (
      <Link href={`/${site}/article/${article.slug}`}>
        <motion.article 
          whileHover={{ y: -4 }}
          className="relative min-h-[450px] h-[550px] lg:h-[700px] group overflow-hidden rounded-lg cursor-pointer w-full bg-slate-900 shadow-2xl"
        >
          <Image 
            src={imageUrl} 
            alt={article.title} 
            fill
            className="object-cover object-center opacity-60 group-hover:scale-105 transition-transform duration-1000 ease-out"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full max-w-5xl">
            <div className="flex items-center gap-3 mb-6">
              {badgeVariant && <EditorialBadge variant={badgeVariant} size="md" />}
              <span className="inline-block px-3 py-1 bg-brand-red text-white text-[10px] uppercase font-black tracking-[0.2em]">
                {article.category?.name || 'UMUM'}
              </span>
            </div>
            <h2 className="text-4xl md:text-7xl text-white font-serif font-black leading-[1.05] mb-8 tracking-tighter text-balance">
              {article.title}
            </h2>
            <p className="text-gray-300 text-lg md:text-2xl font-light mb-10 line-clamp-2 max-w-3xl leading-relaxed opacity-90">
              {excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-y-4 gap-x-6 text-white/50 text-[11px] font-bold uppercase tracking-[0.15em] border-t border-white/10 pt-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-white text-[10px] font-black">
                  {article.author?.name?.[0] || 'R'}
                </div>
                <span>By <strong className="text-white">{article.author?.name || 'Redaksi'}</strong></span>
              </div>
              <span className="hidden sm:inline opacity-30">|</span>
              <span className="flex items-center gap-1.5"><Clock size={14}/> {date}</span>
              <span className="hidden sm:inline opacity-30">|</span>
              <span className="flex items-center gap-1.5"><BookOpen size={14}/> {readTime}</span>
              <div className="ml-auto flex items-center gap-4">
                <button className="hover:text-white transition-colors"><Share2 size={16} /></button>
                <button className="hover:text-white transition-colors"><Bookmark size={16} /></button>
              </div>
            </div>
          </div>
        </motion.article>
      </Link>
    );
  }

  if (variant === 'minimal') {
    return (
      <Link href={`/${site}/article/${article.slug}`}>
        <div className="py-5 border-b border-gray-100 dark:border-white/5 last:border-0 group cursor-pointer flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2.5">
              {badgeVariant && <EditorialBadge variant={badgeVariant} size="sm" />}
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red">
                {article.category?.name || 'UMUM'}
              </span>
            </div>
            <h3 className="font-serif text-xl font-bold leading-tight text-brand-black dark:text-white group-hover:text-brand-red transition-colors tracking-tight">
              {article.title}
            </h3>
            <div className="flex items-center gap-3 mt-3 text-[10px] text-brand-text-muted font-bold uppercase tracking-widest">
              <span>{date}</span>
              <span className="opacity-30">•</span>
              <span>{readTime}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link href={`/${site}/article/${article.slug}`}>
        <motion.article 
          whileHover={{ x: 4 }}
          className="flex gap-6 group cursor-pointer border-b border-gray-100 dark:border-white/5 pb-6 last:border-0"
        >
          <div className="relative w-32 md:w-48 aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-white/5 rounded-lg flex-shrink-0">
            <Image 
              src={imageUrl} 
              alt={article.title} 
              fill
              className="object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          </div>
          <div className="flex-1 flex flex-col justify-center gap-2">
            <div className="flex items-center gap-2">
              {badgeVariant && <EditorialBadge variant={badgeVariant} />}
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red">
                {article.category?.name || 'UMUM'}
              </span>
            </div>
            <h3 className="font-serif text-xl font-bold leading-tight text-brand-black dark:text-white group-hover:text-brand-red transition-colors tracking-tight">
              {article.title}
            </h3>
            <div className="hidden md:flex items-center gap-4 mt-1 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">
               <span className="flex items-center gap-1"><User size={10}/> {article.author?.name || 'Redaksi'}</span>
               <span>{date}</span>
            </div>
          </div>
        </motion.article>
      </Link>
    );
  }

  return (
    <Link href={`/${site}/article/${article.slug}`}>
      <motion.article 
        whileHover={{ y: -8 }}
        className="flex flex-col gap-5 group cursor-pointer relative"
      >
        <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-white/5 rounded-xl shadow-sm">
          <Image 
            src={imageUrl} 
            alt={article.title} 
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {badgeVariant && <EditorialBadge variant={badgeVariant} />}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red">
              {article.category?.name || 'UMUM'}
            </span>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-gray-400 hover:text-brand-red"><Share2 size={14}/></button>
              <button className="text-gray-400 hover:text-brand-red"><Bookmark size={14}/></button>
            </div>
          </div>
          <h3 className="font-serif text-2xl font-black leading-[1.2] text-brand-black dark:text-white group-hover:underline decoration-brand-red underline-offset-4 decoration-2 tracking-tight">
            {article.title}
          </h3>
          <p className="text-brand-text-muted dark:text-gray-400 text-sm line-clamp-2 leading-relaxed font-normal opacity-80">
            {excerpt}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">
             <div className="flex items-center gap-1.5">
               <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[8px] font-black">
                 {article.author?.name?.[0] || 'R'}
               </div>
               <span>{article.author?.name || 'Redaksi'}</span>
             </div>
             <span className="opacity-30">•</span>
             <span>{date}</span>
             <span className="opacity-30">•</span>
             <span className="flex items-center gap-1"><BookOpen size={12}/> {readTime}</span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

