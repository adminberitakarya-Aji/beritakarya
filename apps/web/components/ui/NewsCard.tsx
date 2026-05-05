'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, BookOpen, Bookmark } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface NewsCardProps {
  article: any;
  variant?: 'large' | 'medium' | 'minimal';
  site?: string;
}

export default function NewsCard({ article, variant = 'medium', site = 'pusat' }: NewsCardProps) {
  const imageUrl = article.blocks?.find((b: any) => b.type === 'image')?.url || '/placeholder.jpg';
  const excerpt = article.blocks?.find((b: any) => b.type === 'paragraph')?.content || '';
  const date = new Date(article.publishedAt || Date.now()).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const readTime = "2 min read"; // Placeholder

  if (variant === 'large') {
    return (
      <Link href={`/${site}/article/${article.slug}`}>
        <motion.article 
          whileHover={{ y: -4 }}
          className="relative min-h-[400px] h-[500px] lg:h-[600px] group overflow-hidden rounded-sm cursor-pointer w-full bg-brand-black"
        >
          <Image 
            src={imageUrl} 
            alt={article.title} 
            fill
            className="object-cover object-center opacity-70 group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent" />
          
          <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full max-w-4xl">
            <span className="inline-block px-3 py-1 bg-brand-red text-white text-[10px] uppercase font-bold tracking-[0.2em] mb-4">
              {article.category?.name || 'UMUM'}
            </span>
            <h2 className="text-3xl md:text-6xl text-white font-serif font-bold leading-[1.1] mb-6 tracking-tight">
              {article.title}
            </h2>
            <p className="text-gray-300 text-base md:text-xl font-light mb-8 line-clamp-3 max-w-2xl leading-relaxed">
              {excerpt}
            </p>
            <div className="flex items-center gap-x-3 text-white/60 text-[10px] font-semibold uppercase tracking-widest">
              <span>By {article.author?.name || 'Redaksi'}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock size={12}/> {date}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><BookOpen size={12}/> {readTime}</span>
            </div>
          </div>
        </motion.article>
      </Link>
    );
  }

  if (variant === 'minimal') {
    return (
      <Link href={`/${site}/article/${article.slug}`}>
        <div className="py-4 border-b border-gray-100 last:border-0 group cursor-pointer flex justify-between items-start gap-4">
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-red mb-2 block">
              {article.category?.name || 'UMUM'}
            </span>
            <h3 className="font-serif text-lg font-bold leading-tight text-brand-black group-hover:text-brand-red transition-colors">
              {article.title}
            </h3>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-brand-text-muted font-semibold uppercase tracking-widest">
                {date}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/${site}/article/${article.slug}`}>
      <motion.article 
        whileHover={{ y: -8 }}
        className="flex flex-col gap-4 group cursor-pointer relative"
      >
        <div className="relative aspect-video overflow-hidden bg-gray-100 rounded-sm">
          <Image 
            src={imageUrl} 
            alt={article.title} 
            fill
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-red">
              {article.category?.name || 'UMUM'}
            </span>
            <ArrowUpRight size={14} className="text-gray-300 group-hover:text-brand-red transition-colors"/>
          </div>
          <h3 className="font-serif text-xl md:text-2xl font-bold leading-tight text-brand-black group-hover:underline decoration-brand-red underline-offset-4 decoration-2">
            {article.title}
          </h3>
          <p className="text-brand-text-muted text-sm line-clamp-2 leading-relaxed font-light">
            {excerpt}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">
             <span>{article.author?.name || 'Redaksi'}</span>
             <span>•</span>
             <span>{date}</span>
             <span>•</span>
             <span className="flex items-center gap-1"><BookOpen size={12}/> {readTime}</span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
