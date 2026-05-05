'use client';

import Link from 'next/link';
import { Mail, MessageCircle, MapPin, Share2, Camera, PlayCircle } from 'lucide-react';

interface SiteFooterProps {
  siteConfig: any;
  categories: string[];
}

export default function SiteFooter({ siteConfig, categories }: SiteFooterProps) {
  return (
    <footer className="bg-slate-900 dark:bg-black/20 text-white mt-32 pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-1">
            <Link href="/" className="flex flex-col mb-6">
              <span className="font-serif text-3xl font-black tracking-tighter">
                <span className="text-brand-red">BERITA</span>
                <span className="text-white">KARYA</span>
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed font-light mb-8 max-w-xs">
              Portal berita independen yang berfokus pada kedalaman investigasi dan kejernihan melihat realitas Nusantara.
            </p>
            <div className="mb-6 space-y-3">
              <p className="text-gray-400 text-xs flex items-start gap-2 leading-relaxed">
                <MapPin size={14} className="shrink-0 mt-0.5 text-brand-red" />
                <span>Jl. Merdeka No. 123, Jakarta Pusat, Indonesia</span>
              </p>
              <p className="text-gray-400 text-xs flex items-center gap-2">
                <Mail size={14} className="text-gray-500" /> support.beritakarya@gmail.com
              </p>
            </div>
            <div className="flex gap-3">
              {[Share2, MessageCircle, Camera, PlayCircle].map((Icon, i) => (
                <button key={i} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-brand-red transition-colors rounded-sm group">
                  <Icon size={16} className="text-gray-500 group-hover:text-white" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-brand-red">Kategori</h5>
            <ul className="text-gray-400 text-sm space-y-4 font-light">
              {categories.filter(c => c !== 'Terbaru').map((cat) => (
                <li key={cat}>
                  <Link href={`#${cat.toLowerCase()}`} className="hover:text-white transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-brand-red">Informasi</h5>
            <ul className="text-gray-400 text-sm space-y-4 font-light">
              {['Tentang Kami', 'Kode Etik', 'Redaksi', 'Iklan'].map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-[0.2em] mb-8 text-brand-red">Dukungan</h5>
            <div className="flex flex-col gap-4">
              <p className="text-gray-400 text-sm leading-relaxed font-light">
                Bantu kami menjaga independensi jurnalisme dengan menjadi anggota.
              </p>
              <button className="bg-brand-red text-white py-3 px-6 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-brand-black transition-all">
                Dukung Kami
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <span suppressHydrationWarning className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-500">
            © {new Date().getFullYear()} BERITA KARYA. ALL RIGHTS RESERVED.
          </span>
          <div className="flex gap-8 text-[10px] uppercase font-bold tracking-widest text-gray-500">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Use</Link>
            <Link href="/cookies" className="hover:text-white">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
