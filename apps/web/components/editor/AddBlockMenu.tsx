'use client'
import { useState } from 'react'
import { useEditorStore } from '../../store/editorStore'
import type { Block } from '@beritakarya/types'

const BLOCK_TYPES: { type: Block['type']; label: string; desc: string }[] = [
  { type: 'paragraph', label: 'Paragraf', desc: 'Teks biasa' },
  { type: 'heading', label: 'Judul', desc: 'H2, H3, H4...' },
  { type: 'list', label: 'Daftar', desc: 'Poin-poin fakta' },
  { type: 'quote', label: 'Kutipan', desc: 'Blockquote' },
  { type: 'callout', label: 'Highlight', desc: 'Kotak info penting' },
  { type: 'image', label: 'Gambar', desc: 'Upload foto' },
  { type: 'imageGrid', label: 'Grid Gambar', desc: '2 atau 3 kolom' },
  { type: 'gallery', label: 'Galeri', desc: 'Slideshow' },
  { type: 'embed', label: 'Embed', desc: 'YouTube, Twitter' },
]

interface Props {
  afterId?: string
  compact?: boolean
}

export function AddBlockMenu({ afterId, compact }: Props) {
  const [open, setOpen] = useState(false)
  const { addBlock } = useEditorStore()

  const handleAdd = (type: Block['type']) => {
    addBlock(type, afterId)
    setOpen(false)
  }

  if (compact && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-300 hover:text-blue-500 px-2 py-0.5 transition-colors"
      >
        + Tambah blok
      </button>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 border border-dashed border-gray-200 hover:border-blue-300 rounded-lg px-4 py-2 w-full transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        <span>Tambah blok baru</span>
      </button>
    )
  }

  return (
    <div className="border rounded-xl p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">Pilih tipe blok</span>
        <button onClick={() => setOpen(false)} className="text-gray-300 hover:text-gray-600 text-sm">×</button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {BLOCK_TYPES.map(({ type, label, desc }) => (
          <button
            key={type}
            onClick={() => handleAdd(type)}
            className="text-left px-2 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <div className="text-xs font-medium">{label}</div>
            <div className="text-xs text-gray-400">{desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}