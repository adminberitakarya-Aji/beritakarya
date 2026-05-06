'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface BreakingNewsTickerProps {
  news?: string[];
}

export default function BreakingNewsTicker({ 
  news = [
    "Sri Mulyani Paparkan Strategi Fiskal 2026 di Hadapan DPR",
    "Rupiah Menguat ke Level Rp 15.200 per Dolar AS Pagi Ini",
    "Timnas Indonesia Siap Hadapi Laga Krusial di Kualifikasi Piala Dunia",
    "Pemerintah Resmi Luncurkan Program Insentif Kendaraan Listrik Tahap II"
  ] 
}: BreakingNewsTickerProps) {
  return (
    <div className="bg-brand-black text-white dark:text-slate-900 h-10 flex items-center overflow-hidden border-y border-white/5 dark:border-black/5">
      <div className="bg-brand-red h-full px-4 flex items-center gap-2 z-10 shrink-0">
        <Zap size={14} className="fill-white" />
        <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Breaking News</span>
      </div>
      <div className="flex-1 overflow-hidden relative group">
        {/* Left Gradient Fade */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-brand-black dark:from-slate-900 to-transparent z-10 pointer-events-none" />
        
        {/* Right Gradient Fade */}
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-brand-black dark:from-slate-900 to-transparent z-10 pointer-events-none" />

        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            duration: 40, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="flex items-center gap-12 whitespace-nowrap px-6 w-max"
        >
          {news.map((item, i) => (
            <div key={i} className="flex items-center gap-12">
              <span className="text-xs font-bold tracking-tight hover:text-brand-red cursor-pointer transition-colors">
                {item}
              </span>
              <span className="w-1.5 h-1.5 bg-brand-red rounded-full" />
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {news.map((item, i) => (
            <div key={`dup-${i}`} className="flex items-center gap-12">
              <span className="text-xs font-bold tracking-tight hover:text-brand-red cursor-pointer transition-colors">
                {item}
              </span>
              <span className="w-1.5 h-1.5 bg-brand-red rounded-full" />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
