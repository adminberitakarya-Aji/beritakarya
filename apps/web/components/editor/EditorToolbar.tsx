'use client';

import { useEditorStore } from '../../store/editorStore';
import { 
  Save, 
  Send, 
  Eye, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  History 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  review: 'Review',
  published: 'Terbit'
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500 border-gray-200',
  review: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  published: 'bg-green-50 text-green-600 border-green-200'
};

export function EditorToolbar() {
  const { status, saving, saveArticle, publishArticle, lastSaved } = useEditorStore();
  const { site } = useParams<{ site: string }>();
  const router = useRouter();

  const handlePublish = async () => {
    if (!confirm('Apakah bapak yakin ingin mempublikasikan artikel ini?')) return;
    await publishArticle();
  };

  return (
    <div className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-white border-b border-gray-100 z-50 flex items-center justify-between px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-50 rounded-sm text-gray-400 hover:text-brand-black transition-colors"
        >
          <History size={18} />
        </button>
        <div className="h-6 w-px bg-gray-100" />
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-widest text-brand-black">Penulisan Artikel</span>
          <div className={cn(
            "px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border",
            STATUS_COLORS[status]
          )}>
            {STATUS_LABELS[status]}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {saving ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-brand-red rounded-full animate-pulse" />
              Menyimpan Otomatis...
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-green-500" />
              {lastSaved ? `Tersimpan ${lastSaved.toLocaleTimeString()}` : 'Belum Tersimpan'}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-gray-100 hidden md:block" />

        <div className="flex items-center gap-2">
          <button
            onClick={() => saveArticle()}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-brand-black hover:bg-gray-50 transition-all border border-gray-200 rounded-sm disabled:opacity-50"
          >
            <Save size={14} /> Simpan
          </button>
          
          {status !== 'published' ? (
            <button
              onClick={handlePublish}
              className="flex items-center gap-2 px-6 py-2 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-black transition-all shadow-lg shadow-brand-red/10 rounded-sm"
            >
              <Send size={14} /> Terbitkan
            </button>
          ) : (
            <button
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-600/10 rounded-sm"
            >
              <CheckCircle2 size={14} /> Sudah Terbit
            </button>
          )}

          <div className="h-8 w-px bg-gray-100" />

          <button className="p-2 text-gray-400 hover:text-brand-black transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}