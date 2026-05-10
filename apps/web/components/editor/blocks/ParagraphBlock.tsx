'use client'
import { useRef, useState } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { cn } from '../../../lib/utils'
import type { ParagraphBlock as TParagraphBlock, Block } from '@beritakarya/types'

const BLOCK_TYPES: { type: Block['type']; label: string; desc: string }[] = [
  { type: 'heading', label: 'Judul', desc: 'H2, H3, H4...' },
  { type: 'list', label: 'Daftar', desc: 'Poin-poin fakta' },
  { type: 'quote', label: 'Kutipan', desc: 'Blockquote' },
  { type: 'callout', label: 'Highlight', desc: 'Kotak info penting' },
  { type: 'image', label: 'Gambar', desc: 'Upload foto' },
  { type: 'imageGrid', label: 'Grid Gambar', desc: '2 atau 3 kolom' },
  { type: 'gallery', label: 'Galeri', desc: 'Slideshow' },
  { type: 'embed', label: 'Embed', desc: 'YouTube, Twitter' },
]

export function ParagraphBlock({ block }: { block: TParagraphBlock }) {
  const { updateBlock } = useEditorStore()
  const ref = useRef<HTMLDivElement>(null)
  const [showMenu, setShowMenu] = useState(false)

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.innerText
    if (text === '/') {
      setShowMenu(true)
    } else {
      setShowMenu(false)
    }
  }

  const handleSelect = (type: Block['type']) => {
    updateBlock(block.id, { type, content: '' })
    setShowMenu(false)
  }

  const toggleDropCap = () => {
    updateBlock(block.id, { dropCap: !block.dropCap })
  }

  return (
    <div className="relative group/p">
      {/* DropCap Toggle */}
      <div className="absolute -left-12 top-0 opacity-0 group-hover/p:opacity-100 transition-opacity hidden md:block">
        <button 
          onClick={toggleDropCap}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border transition-all",
            block.dropCap 
              ? "bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/20" 
              : "bg-white dark:bg-white/5 text-gray-400 border-gray-100 dark:border-white/5 hover:border-brand-red hover:text-brand-red"
          )}
          title="Toggle Drop Cap"
        >
          DC
        </button>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={(e) => {
          updateBlock(block.id, { content: e.currentTarget.innerText })
          setTimeout(() => setShowMenu(false), 200)
        }}
        data-placeholder="Tulis paragraf... (ketik '/' untuk opsi)"
        className={cn(
          "min-h-[1.5em] outline-none text-base leading-relaxed text-brand-black dark:text-gray-200 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 dark:empty:before:text-white/20 empty:before:pointer-events-none",
          block.dropCap && "first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:text-brand-red font-serif"
        )}
        dangerouslySetInnerHTML={{ __html: block.content }}
      />
      
      {showMenu && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-xl shadow-2xl z-50 p-2 overflow-hidden animate-fade-in">
          <div className="px-2 py-1.5 mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400">Pilih Tipe Blok</div>
          <div className="flex flex-col gap-0.5">
            {BLOCK_TYPES.map(t => (
              <button
                key={t.type}
                onClick={() => handleSelect(t.type)}
                className="flex flex-col text-left px-3 py-2 rounded-lg hover:bg-brand-red/5 hover:text-brand-red dark:hover:bg-white/5 transition-colors group"
              >
                <span className="text-sm font-bold text-brand-black dark:text-white group-hover:text-brand-red transition-colors">{t.label}</span>
                <span className="text-[10px] text-gray-400">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}