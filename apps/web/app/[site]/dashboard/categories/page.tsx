'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { useParams } from 'next/navigation';
import { 
  Hash, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Link as LinkIcon, 
  AlertCircle,
  Library,
  Zap,
  Check
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const DEFAULT_CATEGORIES = [
  { name: 'Politik', slug: 'politik' },
  { name: 'Ekonomi', slug: 'ekonomi' },
  { name: 'Olahraga', slug: 'olahraga' },
  { name: 'Kriminal', slug: 'kriminal' },
  { name: 'Hiburan', slug: 'hiburan' },
  { name: 'Teknologi', slug: 'teknologi' },
  { name: 'Edukasi', slug: 'edukasi' },
  { name: 'Lifestyle', slug: 'lifestyle' },
];

export default function CategoriesDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();

  const fetchCategories = async () => {
    try {
      const { data } = await api.get(`/categories?site=${site}`);
      setCategories(data.data);
    } catch (error) {
      console.error('Gagal mengambil kategori', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [site]);

  // Auto-generate slug from name
  useEffect(() => {
    const generated = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generated);
  }, [name]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post(`/categories?site=${site}`, { name, slug });
      setName('');
      setSlug('');
      fetchCategories();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Gagal membuat kategori');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDefaults = async () => {
    if (!confirm('Ingin menambahkan kategori pakem BeritaKarya (Nasional, Politik, dll) ke site ini?')) return;
    setSyncing(true);
    try {
      for (const cat of DEFAULT_CATEGORIES) {
        // Check if exists
        const exists = categories.find(c => c.slug === cat.slug);
        if (!exists) {
          await api.post(`/categories?site=${site}`, cat);
        }
      }
      await fetchCategories();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kategori ini? Menghapus kategori dapat memengaruhi artikel yang sudah ada.')) return;
    try {
      await api.delete(`/categories/${id}?site=${site}`);
      fetchCategories();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Gagal menghapus kategori');
    }
  };

  if (user?.role !== 'superadmin' && user?.role !== 'pimred') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Akses Terbatas</h2>
        <p className="text-xs text-gray-400 mt-2">Halaman manajemen kategori hanya untuk Pimred dan Superadmin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-red text-white flex items-center justify-center shadow-lg shadow-brand-red/20">
            <Library size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight">Manajemen Kategori</h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Kelola rubrikasi berita di <strong className="text-brand-red">{site}</strong></p>
          </div>
        </div>
        
        {/* Quick Sync Button */}
        <button
          onClick={handleSyncDefaults}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all shadow-sm border border-blue-100 dark:border-blue-900/30 disabled:opacity-50"
        >
          {syncing ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
          Generate Kategori Pakem
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Form Add */}
        <div className="lg:col-span-1 space-y-6">
          <div className="dash-card p-6">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <Plus size={14} className="text-brand-red" /> Tambah Kategori Baru
            </h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="dash-label mb-2 block">Nama Kategori</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Politik Lokal"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all shadow-sm"
                  required
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="dash-label flex items-center gap-2">
                    <LinkIcon size={12} /> Slug URL
                  </label>
                  <span className="text-[9px] text-gray-400 font-bold uppercase">Auto-Generated</span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">/</span>
                  <input 
                    type="text" 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="politik-lokal"
                    className="w-full pl-7 pr-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 rounded-xl text-xs outline-none font-mono text-brand-red shadow-inner"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-black dark:bg-white text-white dark:text-brand-black py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                {loading ? 'Menyimpan...' : 'Tambah Rubrik'}
              </button>
            </form>
          </div>

          <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl">
            <div className="flex items-start gap-3 text-amber-600">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold leading-relaxed">
                Hati-hati saat mengubah Slug. Perubahan slug akan memutus link berita yang sudah dibagikan di media sosial.
              </p>
            </div>
          </div>
        </div>

        {/* List Table */}
        <div className="lg:col-span-2">
          <div className="dash-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Nama Kategori</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Slug / URL Path</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-300">
                        <Hash size={40} strokeWidth={1} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Belum ada kategori rubrik</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-brand-red transition-colors">
                            <Hash size={14} />
                          </div>
                          <span className="text-xs font-bold text-brand-black dark:text-white">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">/{cat.slug}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                          title="Hapus Kategori"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex items-center justify-between px-2">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total: {categories.length} Rubrik</p>
          </div>
        </div>
      </div>
    </div>
  );
}
