'use client';

import { Share2, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareSidebarProps {
  title: string;
  url?: string;
}

export default function ShareSidebar({ title, url }: ShareSidebarProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) setShow(true);
      else setShow(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const shareLinks = [
    { 
      name: 'Facebook', 
      icon: Share2, 
      color: 'hover:text-[#1877F2]',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    { 
      name: 'Twitter', 
      icon: Share2, 
      color: 'hover:text-[#1DA1F2]',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`
    },
    { 
      name: 'WhatsApp', 
      icon: MessageCircle, 
      color: 'hover:text-[#25D366]',
      href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}`
    }
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="fixed left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-4 z-40 bg-white p-3 border border-gray-100 shadow-sm rounded-full"
        >
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 -rotate-90 mb-4 h-12 flex items-center">Share</span>
          {shareLinks.map((link) => (
            <a 
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("p-3 text-gray-400 transition-colors rounded-full hover:bg-gray-50", link.color)}
              title={link.name}
            >
              <link.icon size={20} strokeWidth={1.5} />
            </a>
          ))}
          <button 
            onClick={copyToClipboard}
            className={cn(
              "p-3 transition-colors rounded-full",
              isCopied ? "bg-green-500 text-white" : "text-gray-400 hover:text-brand-red hover:bg-gray-50"
            )}
            title="Salin Tautan"
          >
            <LinkIcon size={20} strokeWidth={1.5} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
