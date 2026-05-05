'use client';

import { useState } from 'react';
import Navbar from './Navbar';
import SiteFooter from './SiteFooter';
import BreakingNewsTicker from '../ui/BreakingNewsTicker';
import AISummary from '../ui/AISummary';

interface PublicSiteLayoutProps {
  children: React.ReactNode;
  siteConfig: any;
  initialCategory?: string;
}

export default function PublicSiteLayout({ children, siteConfig, initialCategory = 'Terbaru' }: PublicSiteLayoutProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const categories = ['Terbaru', 'Nasional', 'Daerah', 'Politik', 'Ekonomi', 'Teknologi', 'Hukum', 'Saved'];

  return (
    <div className="min-h-screen transition-colors duration-500">
      <Navbar 
        siteConfig={siteConfig}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
      
      {/* Container for Breaking News to keep it aligned */}
      <div className="border-b border-gray-100 dark:border-white/5 bg-white dark:bg-black/20">
        <div className="max-w-7xl mx-auto">
          <BreakingNewsTicker />
        </div>
      </div>
      
      {children}

      <SiteFooter 
        siteConfig={siteConfig}
        categories={categories}
      />

      {/* AI Summary is hidden by default in its component logic */}
      <AISummary title="Ringkasan AI" content="Konten ringkasan otomatis akan muncul di sini." />
    </div>
  );
}
