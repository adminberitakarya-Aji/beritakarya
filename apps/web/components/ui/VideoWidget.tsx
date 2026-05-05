'use client';

import { Play, Tv, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface VideoWidgetProps {
  title: string;
  thumbnail: string;
  duration?: string;
  isLive?: boolean;
}

export default function VideoWidget({ 
  title = "Laporan Eksklusif: Dinamika Politik Nasional Menuju 2029", 
  thumbnail = "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=800",
  duration = "05:24",
  isLive = false 
}: VideoWidgetProps) {
  return (
    <div className="group cursor-pointer">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-black flex items-center gap-2">
          <Tv size={14} className="text-brand-red" />
          BeritaKarya TV
        </h4>
        <ExternalLink size={12} className="text-gray-300 group-hover:text-brand-red transition-colors" />
      </div>

      <div className="relative aspect-video overflow-hidden rounded-sm bg-brand-black">
        <Image 
          src={thumbnail} 
          alt={title} 
          fill
          className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-60 transition-all duration-700"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 bg-brand-red rounded-full flex items-center justify-center shadow-2xl shadow-brand-red/40 relative z-10"
          >
            <Play size={20} className="text-white fill-white ml-1" />
          </motion.div>
        </div>

        {/* Live / Duration Tag */}
        <div className="absolute bottom-3 left-3 flex gap-2">
          {isLive ? (
            <span className="bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 flex items-center gap-1">
              <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
              Live
            </span>
          ) : (
            <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-bold px-2 py-0.5 rounded-sm">
              {duration}
            </span>
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
      </div>

      <h5 className="mt-4 font-serif text-base font-bold leading-snug text-brand-black group-hover:text-brand-red transition-colors line-clamp-2">
        {title}
      </h5>
      
      <div className="mt-3 flex items-center gap-2">
        <div className="w-6 h-0.5 bg-brand-red" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-brand-text-muted">Tonton Sekarang</span>
      </div>
    </div>
  );
}
