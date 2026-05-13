'use client';

import { useEditorStore } from '../../store/editorStore';
import { useAuthStore } from '../../store/authStore';
import { 
  Save, 
  Send, 
  Eye, 
  Settings, 
  CheckCircle2, 
  Clock, 
  History,
  MoreHorizontal,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useParams, useRouter } from 'next/navigation';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Dikirim',
  review: 'Review',
  revision: 'Revisi',
  approved: 'Disetujui',
  published: 'Terbit'
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500 border-gray-200',
  submitted: 'bg-blue-50 text-blue-600 border-blue-200',
  review: 'bg-violet-50 text-violet-600 border-violet-200',
  revision: 'bg-orange-50 text-orange-600 border-orange-200',
  approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  published: 'bg-green-50 text-green-600 border-green-200'
};

export function EditorToolbar() {
  const { status, saving, saveArticle, publishArticle, submitForReview, lastSaved, toggleSidebar, isFocusMode, toggleFocusMode } = useEditorStore();
  const { user } = useAuthStore();
  const { site } = useParams<{ site: string }>();
  const router = useRouter();

  const isEditor = user?.role === 'superadmin' || user?.role === 'wapimred';

  const handlePublish = async () => {
    if (isEditor) {
      if (!confirm('Apakah bapak yakin ingin mempublikasikan post ini?')) return;
      await publishArticle();
    } else {
      if (!confirm('Kirim post ini untuk di-review oleh redaksi?')) return;
      await submitForReview();
      router.push(`/${site}/dashboard/articles`);
    }
  };

  return (
    <div className={cn(
      "fixed top-0 right-0 h-16 bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 z-50 flex items-center justify-between px-8 shadow-sm transition-all duration-500",
      isFocusMode ? "left-0" : "left-0 md:left-64"
    )}>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg text-gray-400 hover:text-brand-black dark:hover:text-white transition-colors"
        >
          <History size={18} />
        </button>
        <div className="h-6 w-px bg-gray-100 dark:bg-white/5" />
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-white">Editorial Desk</span>
          <div className={cn(
            "px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border",
            STATUS_COLORS[status] || STATUS_COLORS.draft
          )}>
            {STATUS_LABELS[status] || status}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {saving ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-brand-red rounded-full animate-pulse" />
              Auto-Saving...
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-green-500" />
              {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Not Saved'}
            </div>
          )}
        </div>

        {!isFocusMode && <div className="h-6 w-px bg-gray-100 dark:bg-white/5 hidden md:block" />}

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFocusMode()}
            className={cn(
              "p-2 rounded-lg transition-all border border-transparent",
              isFocusMode 
                ? "bg-brand-red text-white shadow-lg shadow-brand-red/20" 
                : "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-brand-red hover:border-brand-red/20"
            )}
            title={isFocusMode ? "Keluar Focus Mode" : "Focus Mode"}
          >
            {isFocusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {!isFocusMode && (
            <button
              onClick={() => saveArticle()}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-brand-black dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all border border-gray-200 dark:border-white/10 rounded-lg disabled:opacity-50"
            >
              <Save size={14} /> Simpan
            </button>
          )}

          {!isFocusMode && (
            <button
              onClick={() => toggleSidebar()}
              className="p-2 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-brand-red rounded-lg transition-all border border-transparent hover:border-brand-red/20"
              title="Pengaturan Post"
            >
              <Settings size={18} />
            </button>
          )}
          
          {status !== 'published' ? (
            <button
              onClick={handlePublish}
              className={cn(
                "flex items-center gap-2 px-6 py-2 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-brand-red/10 rounded-lg",
                isFocusMode && "px-4"
              )}
            >
              <Send size={14} /> {isFocusMode ? '' : (isEditor ? 'Terbitkan' : 'Kirim Review')}
            </button>
          ) : (
            <button
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10 rounded-lg"
            >
              <CheckCircle2 size={14} /> Live
            </button>
          )}

          <div className="h-8 w-px bg-gray-100 dark:bg-white/5" />

          <button className="p-2 text-gray-400 hover:text-brand-black dark:hover:text-white transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}