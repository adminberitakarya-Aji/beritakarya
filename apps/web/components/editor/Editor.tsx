'use client'
import { useEffect, useCallback } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { BlockList } from './BlockList'
import { EditorToolbar } from './EditorToolbar'
import { AddBlockMenu } from './AddBlockMenu'
import { AISidebar } from './AISidebar'
import { EditorialSidebar } from './EditorialSidebar'
import { cn } from '../../lib/utils'
import { motion } from 'framer-motion'

interface EditorProps {
  articleId: string
  siteId: string
}

export function Editor({ articleId, siteId }: EditorProps) {
  const { loadArticle, saveArticle, undo, saving, lastSaved, isDirty, isFocusMode } = useEditorStore()

  useEffect(() => {
    loadArticle(articleId, siteId)
  }, [articleId, siteId, loadArticle])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
      undo()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      saveArticle()
    }
  }, [undo, saveArticle])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className={cn(
      "min-h-screen transition-all duration-500",
      isFocusMode ? "bg-white dark:bg-slate-950" : "bg-gray-50/30 dark:bg-slate-950"
    )}>
      <EditorToolbar />

      <main className={cn(
        "max-w-4xl mx-auto px-6 pb-40 transition-all duration-700 ease-in-out",
        isFocusMode ? "pt-24 opacity-100 scale-100" : "pt-32 opacity-90"
      )}>
        {/* Newsroom Editorial Header */}
        {!isFocusMode && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 border-b border-gray-50 dark:border-white/5 pb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-brand-red text-white flex items-center justify-center font-serif italic text-sm shadow-lg shadow-brand-red/20">B</div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Editorial Desk</span>
                <span className="text-[9px] font-bold text-brand-red uppercase tracking-widest mt-0.5">Konten Investigasi & Analisis</span>
              </div>
            </div>
            <TitleInput />
          </motion.div>
        )}

        {isFocusMode && (
          <div className="mb-16">
            <TitleInput />
          </div>
        )}

        <div className={cn(
          "relative article-content", // article-content triggers our global editorial styles
          isFocusMode ? "prose-premium" : ""
        )}>
          <BlockList />
          
          {!isFocusMode && (
            <div className="mt-16 flex justify-center border-t border-gray-50 dark:border-white/5 pt-12">
              <AddBlockMenu afterId={undefined} />
            </div>
          )}
        </div>
      </main>

      {!isFocusMode && (
        <>
          <AISidebar />
          <EditorialSidebar />
        </>
      )}
    </div>
  )
}

function TitleInput() {
  const { title, setTitle } = useEditorStore()
  return (
    <textarea
      value={title}
      onChange={e => setTitle(e.target.value)}
      placeholder="Tulis Judul Berita yang Memikat..."
      rows={2}
      className="w-full text-4xl md:text-6xl font-serif font-black border-none outline-none resize-none bg-transparent placeholder-gray-100 dark:placeholder-white/5 leading-[1.1] tracking-tight text-brand-black dark:text-white"
    />
  )
}