'use client';

import Link from 'next/link';
import { Mail, MessageCircle, MapPin, Share2, Camera, PlayCircle } from 'lucide-react';

interface SiteFooterProps {
  siteConfig: any;
  categories: string[];
}

export default function SiteFooter({ siteConfig, categories }: SiteFooterProps) {
  return (
    <footer className="bg-brand-surface text-brand-text mt-32 pt-20 pb-10 border-t border-gray-100 dark:border-white/5 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1">
            <Link href="/" className="flex flex-col mb-6">
              <span className="font-serif text-3xl font-black tracking-tighter uppercase">
                <span className="text-brand-red">BERITA</span>
                <span className="text-brand-black dark:text-white">
                  {siteConfig?.name?.split(' ')[1] || 'KARYA'}
                </span>
              </span>
            </Link>
            <p className="text-brand-text-muted text-sm leading-relaxed font-light mb-8 max-w-xs opacity-80">
              {siteConfig?.description || "Portal berita independen yang berfokus pada kedalaman investigasi dan kejernihan melihat realitas Nusantara."}
            </p>
            <div className="mb-6 space-y-3">
              <p className="text-brand-text-muted text-xs flex items-start gap-2 leading-relaxed">
                <MapPin size={14} className="shrink-0 mt-0.5 text-brand-red" />
                <span>Jl. Merdeka No. 123, Jakarta Pusat, Indonesia</span>
              </p>
              <p className="text-brand-text-muted text-xs flex items-center gap-2">
                <Mail size={14} className="text-brand-text-muted opacity-60" /> support.beritakarya@gmail.com
              </p>
            </div>
            <div className="flex gap-3">
              {siteConfig?.socialLinks?.facebook && (
                <a href={siteConfig.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-brand-red transition-colors rounded-sm group">
                  <Share2 size={16} className="text-brand-text-muted group-hover:text-white" />
                </a>
              )}
              {siteConfig?.socialLinks?.twitter && (
                <a href={siteConfig.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-brand-red transition-colors rounded-sm group">
                  <span className="text-brand-text-muted group-hover:text-white font-black text-sm italic">X</span>
                </a>
              )}
              {siteConfig?.socialLinks?.instagram && (
                <a href={siteConfig.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-brand-red transition-colors rounded-sm group">
                  <Camera size={16} className="text-brand-text-muted group-hover:text-white" />
                </a>
              )}
              {siteConfig?.socialLinks?.youtube && (
                <a href={siteConfig.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-brand-red transition-colors rounded-sm group">
                  <PlayCircle size={16} className="text-brand-text-muted group-hover:text-white" />
                </a>
              )}
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-brand-red">Kategori</h5>
            <ul className="text-brand-text-muted text-sm space-y-4 font-light">
              {categories.filter(c => c !== 'Terbaru').map((cat) => (
                <li key={cat}>
                  <Link href={`#${cat.toLowerCase()}`} className="hover:text-brand-red transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-brand-red">Informasi</h5>
            <ul className="text-brand-text-muted text-sm space-y-4 font-light">
              {['Tentang Kami', 'Kode Etik', 'Redaksi', 'Iklan'].map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-brand-red transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-brand-red">Dukungan</h5>
            <div className="flex flex-col gap-4">
              <p className="text-brand-text-muted text-sm leading-relaxed font-light">
                Bantu kami menjaga independensi jurnalisme dengan menjadi anggota.
              </p>
              <button className="bg-brand-red text-white py-3 px-6 text-xs font-bold uppercase tracking-widest hover:bg-brand-black dark:hover:bg-white dark:hover:text-brand-black transition-all">
                Dukung Kami
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <span suppressHydrationWarning className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand-text-muted opacity-60">
            {siteConfig?.footerText || `© ${new Date().getFullYear()} BERITA KARYA. ALL RIGHTS RESERVED.`}
          </span>
          <div className="flex gap-8 text-[10px] uppercase font-bold tracking-widest text-brand-text-muted opacity-60">
            <Link href="/privacy" className="hover:text-brand-red">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-brand-red">Terms of Use</Link>
            <Link href="/cookies" className="hover:text-brand-red">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
