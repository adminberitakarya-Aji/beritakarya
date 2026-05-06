'use client';

import { useState, useEffect } from 'react';
import { Type, Minus, Plus, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function FontSizeControl() {
  const [fontSize, setFontSize] = useState(1); // 1 = normal, 0.8 = small, 1.2 = large, etc.
  
  const sizes = [
    { label: 'A-', value: 0.85 },
    { label: 'Normal', value: 1 },
    { label: 'A+', value: 1.15 },
    { label: 'A++', value: 1.3 }
  ];

  useEffect(() => {
    // Apply font size to the article content class
    const content = document.querySelector('.article-content');
    if (content) {
      (content as HTMLElement).style.fontSize = `${fontSize * 100}%`;
    }
  }, [fontSize]);

  return (
    <div className="flex items-center gap-1.5 p-1 bg-gray-100/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
      <div className="w-8 h-8 flex items-center justify-center text-gray-400">
        <Type size={14} />
      </div>
      <div className="flex gap-1">
        {sizes.map((s) => (
          <button
            key={s.value}
            onClick={() => setFontSize(s.value)}
            className={cn(
              "px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
              fontSize === s.value 
                ? "bg-white dark:bg-slate-800 text-brand-red shadow-sm" 
                : "text-gray-400 hover:text-brand-black dark:hover:text-white"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
