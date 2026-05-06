'use client';

import { ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import Image from 'next/image';

interface AdSpaceProps {
  type: 'leaderboard' | 'rectangle' | 'in-feed';
  label?: string;
  className?: string;
  adData?: {
    image?: string;
    link?: string;
  };
}

export default function AdSpace({ 
  type, 
  label = "Advertisement", 
  className = "",
  adData 
}: AdSpaceProps) {
  
  const styles = {
    leaderboard: "w-full h-32 md:h-40 mb-8",
    rectangle: "w-full h-[250px] mb-8",
    'in-feed': "w-full h-40 mb-12"
  };

  if (adData?.image) {
    return (
      <a 
        href={adData.link || '#'} 
        target="_blank" 
        rel="noopener noreferrer"
        className={cn(
          "block relative overflow-hidden group border border-gray-100 dark:border-white/10 bg-white dark:bg-black",
          styles[type],
          className
        )}
      >
        <span className="absolute top-2 left-3 z-10 text-[8px] font-bold uppercase tracking-[0.2em] text-white bg-black/40 px-1.5 py-0.5 backdrop-blur-sm">
          {label}
        </span>
        <Image 
          src={adData.image} 
          alt={label} 
          fill
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </a>
    );
  }

  return (
    <div className={cn(
      "bg-brand-surface border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group",
      styles[type],
      className
    )}>
      <span className="absolute top-2 left-3 text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400">
        {label}
      </span>
      
      <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-60 transition-opacity">
        <div className="w-10 h-10 border-2 border-dashed border-gray-200 flex items-center justify-center">
          <ExternalLink size={16} className="text-gray-300" />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Premium Slot
        </span>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-gray-200" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-gray-200" />
    </div>
  );
}
