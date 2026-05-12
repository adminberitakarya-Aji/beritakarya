'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { useParams } from 'next/navigation';
import { 
  Layout, 
  Image as ImageIcon, 
  Code as CodeIcon, 
  Save, 
  AlertCircle, 
  ExternalLink,
  Upload,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface Ad {
  id: string;
  slot: string;
  code: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
}

const SLOTS = [
  { id: 'leaderboard', name: 'Top Billboard / Leaderboard', size: '970x250', desc: 'Muncul di bagian paling atas halaman utama dan setiap artikel.' },
  { id: 'in_feed', name: 'In-Feed Banner', size: '300x250', desc: 'Disisipkan secara otomatis setelah paragraf ke-3 di dalam teks artikel.' }
];

export default function AdsDashboard() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();

  const fetchAds = async () => {
    try {
      const { data } = await api.get(`/ads`);
      setAds(data.data);
    } catch (error) {
      console.error('Failed to fetch ads', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [site]);

  const handleSave = async (slotId: string, payload: Partial<Ad>) => {
    setSavingId(slotId);
    try {
      await api.post(`/ads`, { slot: slotId, ...payload });
      await fetchAds();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Gagal menyimpan iklan');
    } finally {
      setSavingId(null);
    }
  };

  if (user?.role !== 'superadmin' && user?.role !== 'pimred') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Akses Terbatas</h2>
        <p className="text-xs text-gray-400 mt-2">Halaman manajemen iklan hanya dapat diakses oleh Wapimred dan Superadmin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-red text-white flex items-center justify-center shadow-lg shadow-brand-red/20">
            <Layout size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight">Manajemen Iklan & Banner</h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Kelola pendapatan & sponsorship di <strong className="text-brand-red">{site}</strong></p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <RefreshCw size={24} className="animate-spin text-brand-red" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {SLOTS.map(slot => (
            <AdSlotCard 
              key={slot.id} 
              slot={slot} 
              data={ads.find(a => a.slot === slot.id)} 
              onSave={(p) => handleSave(slot.id, p)}
              isSaving={savingId === slot.id}
            />
          ))}
        </div>
      )}

      {/* Guidelines */}
      <div className="dash-card p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest mb-1">Panduan Iklan BeritaKarya</h4>
            <ul className="text-[10px] text-blue-700/70 dark:text-blue-400/70 space-y-1.5 list-disc pl-4">
              <li>Mode **Banner Gambar** sangat disarankan untuk iklan klien lokal (Wapimred) agar performa website tetap ringan.</li>
              <li>Mode **Script Iklan** digunakan untuk kode pihak ketiga seperti Google AdSense atau MGID.</li>
              <li>Selalu pastikan gambar iklan sudah dalam format **WebP** atau **JPG** terkompresi sebelum di-upload.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdSlotCard({ slot, data, onSave, isSaving }: { slot: any, data: Ad | undefined, onSave: (p: Partial<Ad>) => void, isSaving: boolean }) {
  const [mode, setMode] = useState<'image' | 'script'>(data?.imageUrl ? 'image' : 'script');
  const [imageUrl, setImageUrl] = useState(data?.imageUrl || '');
  const [linkUrl, setLinkUrl] = useState(data?.linkUrl || '');
  const [code, setCode] = useState(data?.code || '');
  const [isActive, setIsActive] = useState(data ? data.isActive : true);

  const hasChanges = 
    imageUrl !== (data?.imageUrl || '') || 
    linkUrl !== (data?.linkUrl || '') || 
    code !== (data?.code || '') || 
    isActive !== (data ? data.isActive : true);

  const handleSave = () => {
    if (mode === 'image') {
      onSave({ imageUrl, linkUrl, code: null, isActive });
    } else {
      onSave({ code, imageUrl: null, linkUrl: null, isActive });
    }
  };

  return (
    <div className="dash-card overflow-hidden group">
      {/* Card Header with Status Toggle */}
      <div className="p-6 border-b border-gray-50 dark:border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">{slot.name}</h3>
            <span className="text-[9px] font-black px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-400 rounded-full">{slot.size}</span>
          </div>
          <p className="text-[10px] text-gray-400">{slot.desc}</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-gray-100 dark:border-white/5">
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest",
            isActive ? "text-emerald-500" : "text-gray-400"
          )}>
            {isActive ? 'Aktif' : 'Nonaktif'}
          </span>
          <button 
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "w-10 h-5 rounded-full transition-all relative",
              isActive ? "bg-emerald-500" : "bg-gray-200 dark:bg-white/10"
            )}
          >
            <div className={cn(
              "w-3 h-3 bg-white rounded-full absolute top-1 transition-all shadow-sm",
              isActive ? "left-6" : "left-1"
            )} />
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-gray-50/50 dark:bg-black/10 p-1 m-4 rounded-xl border border-gray-100 dark:border-white/5">
        <button 
          onClick={() => setMode('image')}
          className={cn(
            "flex-1 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
            mode === 'image' ? "bg-white dark:bg-slate-800 text-brand-red shadow-sm" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <ImageIcon size={14} /> Banner Gambar
        </button>
        <button 
          onClick={() => setMode('script')}
          className={cn(
            "flex-1 py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all",
            mode === 'script' ? "bg-white dark:bg-slate-800 text-brand-red shadow-sm" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <CodeIcon size={14} /> Script Iklan (Advanced)
        </button>
      </div>

      <div className="p-6 pt-2">
        {mode === 'image' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="dash-label mb-2 block">Upload Banner / URL Gambar</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://... (PNG/JPG/WebP)"
                      className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                    />
                    <button className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl text-gray-500 hover:text-brand-red transition-all">
                      <Upload size={18} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="dash-label mb-2 block">Link Tujuan (Saat Diklik)</label>
                  <div className="relative">
                    <ExternalLink size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://website-klien.com"
                      className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Preview Area */}
              <div className="space-y-2">
                <label className="dash-label">Live Preview</label>
                <div className="aspect-[4/1] bg-gray-50 dark:bg-black/20 rounded-xl border-2 border-dashed border-gray-100 dark:border-white/5 flex items-center justify-center overflow-hidden relative group">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Ad Preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <ImageIcon size={24} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Preview Banner</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="dash-label flex items-center gap-2">
              <CodeIcon size={12} className="text-brand-red" /> Kode Script (AdSense / Script Pihak Ke-3)
            </label>
            <textarea 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={6}
              placeholder="<!-- Tempel kode script iklan di sini -->"
              className="w-full p-6 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl outline-none border border-slate-800 focus:border-brand-red transition-all shadow-inner"
            />
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/10 rounded-xl flex items-start gap-3">
              <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[9px] text-amber-700 dark:text-amber-400 leading-relaxed font-bold uppercase tracking-wider">
                Perhatian: Kesalahan penulisan kode script dapat menyebabkan tampilan website berantakan. Pastikan Anda hanya menyalin kode dari sumber resmi.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 flex justify-end items-center gap-4 border-t border-gray-50 dark:border-white/5 pt-6">
          {hasChanges && !isSaving && (
            <span className="text-[10px] font-bold text-brand-red animate-pulse italic">Ada perubahan belum disimpan...</span>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={cn(
              "px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3",
              hasChanges 
                ? "bg-brand-black dark:bg-white text-white dark:text-brand-black shadow-xl hover:opacity-90" 
                : "bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed"
            )}
          >
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </div>
  );
}