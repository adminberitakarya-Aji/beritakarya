'use client'
import { useEffect, useCallback } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { BlockList } from './BlockList'
import { EditorToolbar } from './EditorToolbar'
import { AddBlockMenu } from './AddBlockMenu'
import { AISidebar } from './AISidebar'  // ← TAMBAHKAN INI

interface EditorProps {
  articleId: string
  siteId: string
}

export function Editor({ articleId, siteId }: EditorProps) {
  const { loadArticle, saveArticle, undo, saving, lastSaved, isDirty } = useEditorStore()

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
    <div className="min-h-screen bg-white">
      <EditorToolbar />

      <div className="max-w-4xl mx-auto px-4 pt-32 pb-40">
        {/* Newsroom Editorial Header */}
        <div className="mb-12 border-b border-gray-50 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center font-serif italic text-sm">B</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Editorial Desk • Konten Investigasi</span>
          </div>
          <TitleInput />
        </div>

        <div className="relative">
          <BlockList />
          <div className="mt-12 flex justify-center border-t border-gray-50 pt-12">
            <AddBlockMenu afterId={undefined} />
          </div>
        </div>
      </div>

      <AISidebar />
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
      className="w-full text-4xl md:text-6xl font-serif font-black border-none outline-none resize-none bg-transparent placeholder-gray-100 leading-[1.1] tracking-tight text-brand-black"
    />
  )
}