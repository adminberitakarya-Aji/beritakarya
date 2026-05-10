'use client';

import { useEditorStore } from '../../store/editorStore';
import { 
  X, Tag, Layout, Image as ImageIcon, Search, 
  ShieldAlert, Award, Star, BarChart, Settings,
  Type, Globe, ChevronRight, History, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import Image from 'next/image';

export function EditorialSidebar() {
  const { 
    isSidebarOpen, toggleSidebar, activeTab, setActiveTab,
    categoryId, tags, featuredImage, isBreaking, isExclusive, isFeatured,
    metaTitle, metaDescription, updateArticleData, title
  } = useEditorStore();

  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data.data || []);
      } catch (e) { console.error(e); }
    };
    if (isSidebarOpen) loadCategories();
  }, [isSidebarOpen]);

  useEffect(() => {
    const loadVersions = async () => {
      if (!useEditorStore.getState().articleId) return;
      setLoadingVersions(true);
      try {
        const { data } = await api.get(`/articles/${useEditorStore.getState().articleId}/versions`);
        setVersions(data.data || []);
      } catch (e) { console.error(e); }
      finally { setLoadingVersions(false); }
    };
    if (activeTab === 'history') loadVersions();
  }, [activeTab, isSidebarOpen]);

  const restoreVersion = async (versionId: string) => {
    if (!confirm('Kembalikan konten ke versi ini? Perubahan saat ini yang belum disimpan akan hilang.')) return;
    try {
      const { data } = await api.post(`/articles/versions/${versionId}/restore`);
      // Update store with restored data
      updateArticleData({
        title: data.data.title,
        blocks: data.data.blocks
      });
      alert('Berhasil mengembalikan ke versi terpilih');
      setActiveTab('settings');
    } catch (e) {
      alert('Gagal mengembalikan versi');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      updateArticleData({ tags: [...tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (t: string) => {
    updateArticleData({ tags: tags.filter(tag => tag !== t) });
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Backdrop on mobile */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggleSidebar(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] lg:hidden"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-white/5 z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Pengaturan Berita</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Konfigurasi editorial & SEO</p>
              </div>
              <button 
                onClick={() => toggleSidebar(false)}
                className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-50 dark:border-white/5">
              {[
                { id: 'settings', label: 'Editorial', icon: Layout },
                { id: 'seo', label: 'SEO & Meta', icon: BarChart },
                { id: 'history', label: 'History', icon: History },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex-1 py-4 flex flex-col items-center gap-1.5 transition-all relative',
                    activeTab === tab.id 
                      ? 'text-brand-red' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  )}
                >
                  <tab.icon size={16} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-red" />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {activeTab === 'settings' && (
                <>
                  {/* Featured Image */}
                  <div className="space-y-4">
                    <label className="dash-label flex items-center gap-2">
                      <ImageIcon size={12} className="text-brand-red" /> Gambar Utama
                    </label>
                    <div className="relative aspect-video rounded-xl bg-gray-50 dark:bg-white/5 border-2 border-dashed border-gray-100 dark:border-white/10 overflow-hidden group">
                      {featuredImage ? (
                        <>
                          <Image src={featuredImage} alt="Featured" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <button 
                              onClick={() => updateArticleData({ featuredImage: '' })}
                              className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md"
                             >
                               <X size={16} />
                             </button>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                            <ImageIcon size={18} className="text-gray-300" />
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                            Upload atau Paste URL Gambar Utama
                          </p>
                          <input 
                            type="text" 
                            placeholder="https://..."
                            onBlur={(e) => updateArticleData({ featuredImage: e.target.value })}
                            className="mt-4 w-full px-3 py-2 text-[10px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg outline-none focus:border-brand-red"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-3">
                    <label className="dash-label flex items-center gap-2">
                      <Layout size={12} className="text-brand-red" /> Kategori Berita
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <select 
                        value={categoryId || ''}
                        onChange={(e) => updateArticleData({ categoryId: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-xs font-bold text-brand-black dark:text-white outline-none focus:border-brand-red transition-all appearance-none"
                      >
                        <option value="">Pilih Kategori...</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Editorial Flags */}
                  <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-white/5">
                    <label className="dash-label">Status Editorial</label>
                    <div className="space-y-3">
                      {[
                        { id: 'isBreaking', value: isBreaking, label: 'Breaking News', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
                        { id: 'isExclusive', value: isExclusive, label: 'Eksklusif', icon: Award, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/10' },
                        { id: 'isFeatured', value: isFeatured, label: 'Headline / Featured', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                      ].map(flag => (
                        <button
                          key={flag.id}
                          onClick={() => updateArticleData({ [flag.id]: !flag.value })}
                          className={cn(
                            'w-full flex items-center justify-between p-3.5 rounded-xl border transition-all',
                            flag.value
                              ? `${flag.bg} border-transparent shadow-sm ring-1 ring-inset ring-current/10`
                              : 'bg-transparent border-gray-100 dark:border-white/5 opacity-60 grayscale'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <flag.icon size={16} className={flag.value ? flag.color : 'text-gray-300'} />
                            <span className={cn('text-[11px] font-black uppercase tracking-widest', flag.value ? flag.color : 'text-gray-400')}>
                              {flag.label}
                            </span>
                          </div>
                          <div className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all',
                            flag.value ? `bg-current border-transparent` : 'border-gray-200'
                          )}>
                            {flag.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-white/5">
                    <label className="dash-label flex items-center gap-2">
                      <Tag size={12} className="text-brand-red" /> Tagar & Topik
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {tags.map(t => (
                        <span key={t} className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 text-[10px] font-bold text-gray-500 dark:text-gray-400 rounded-lg flex items-center gap-2 group">
                          #{t}
                          <button onClick={() => removeTag(t)} className="opacity-0 group-hover:opacity-100 hover:text-brand-red transition-all">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Tambah tag..."
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTag()}
                        className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red"
                      />
                      <button 
                        onClick={addTag}
                        className="p-2.5 bg-brand-red text-white rounded-xl hover:bg-brand-black transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'seo' && (
                <div className="space-y-8">
                  {/* Google Preview */}
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Globe size={10} /> Preview Google
                    </p>
                    <h4 className="text-lg text-blue-600 dark:text-blue-400 font-medium line-clamp-1">
                      {metaTitle || title || 'Judul Berita...'}
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-500/80 line-clamp-1">
                      beritakarya.co › {categoryId || 'artikel'} › ...
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {metaDescription || 'Tulis deskripsi meta untuk meningkatkan performa pencarian di mesin pencari...'}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="dash-label">Meta Title (SEO)</label>
                      <input 
                        type="text"
                        value={metaTitle}
                        onChange={e => updateArticleData({ metaTitle: e.target.value })}
                        placeholder="Kustomisasi judul untuk SEO..."
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red"
                      />
                      <p className="text-[9px] text-gray-400 text-right">{metaTitle.length} / 60</p>
                    </div>

                    <div className="space-y-2">
                      <label className="dash-label">Meta Description</label>
                      <textarea 
                        rows={4}
                        value={metaDescription}
                        onChange={e => updateArticleData({ metaDescription: e.target.value })}
                        placeholder="Deskripsi singkat artikel untuk cuplikan pencarian..."
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red resize-none"
                      />
                      <p className="text-[9px] text-gray-400 text-right">{metaDescription.length} / 160</p>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="dash-label">Riwayat Perubahan</label>
                    <button 
                      onClick={() => {
                        const id = useEditorStore.getState().articleId;
                        if (id) api.get(`/articles/${id}/versions`).then(res => setVersions(res.data.data));
                      }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
                    >
                      <RotateCcw size={14} className={loadingVersions ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {loadingVersions ? (
                    <div className="py-20 text-center text-gray-400">
                      <RotateCcw size={24} className="animate-spin mx-auto mb-4 opacity-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Memuat Riwayat...</p>
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl">
                      <History size={32} className="mx-auto mb-4 text-gray-200 dark:text-white/5" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 leading-relaxed">
                        Belum ada riwayat<br/>versi untuk artikel ini.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {versions.map((v, i) => (
                        <div 
                          key={v.id}
                          className="group relative p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-transparent hover:border-brand-red/30 transition-all cursor-default"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 bg-brand-red/10 text-brand-red text-[9px] font-black rounded uppercase">
                              v{v.version}
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                              {new Date(v.createdAt).toLocaleString('id-ID', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <h4 className="text-[11px] font-bold text-brand-black dark:text-white line-clamp-1 mb-3">
                            {v.title}
                          </h4>
                          <button 
                            onClick={() => restoreVersion(v.id)}
                            className="w-full py-2 bg-white dark:bg-slate-800 text-[9px] font-black text-brand-red uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-gray-100 dark:border-white/10 shadow-sm"
                          >
                            Pulihkan Versi Ini
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[9px] text-gray-400 italic leading-relaxed text-center px-4">
                    Versi baru disimpan otomatis saat Anda mengirim artikel untuk review atau saat mempublikasikannya.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-white/[0.02]">
              <button 
                onClick={() => toggleSidebar(false)}
                className="w-full py-4 bg-brand-black dark:bg-white text-white dark:text-brand-black text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:opacity-90 transition-all shadow-xl"
              >
                Terapkan Perubahan
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// EditorialSidebar component implementation ends here
