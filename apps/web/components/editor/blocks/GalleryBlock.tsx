'use client'
import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { useEditorStore } from '../../../store/editorStore'
import { api } from '../../../lib/api'
import type { GalleryBlock as TGalleryBlock } from '@beritakarya/types'

export function GalleryBlock({ block }: { block: TGalleryBlock }) {
  const { updateBlock } = useEditorStore()
  const [lightbox, setLightbox] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (files: FileList) => {
    setUploading(true)
    const newItems = []
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      try {
        const { data } = await api.post('/media/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        newItems.push({ url: data.data.url, alt: file.name.replace(/.[^/.]+$/, '') })
      } catch {}
    }
    updateBlock(block.id, { images: [...block.images, ...newItems] })
    setUploading(false)
  }

  const handleRemove = (idx: number) => {
    updateBlock(block.id, { images: block.images.filter((_, i) => i !== idx) })
    if (lightbox === idx) setLightbox(null)
  }

  const handleCaptionChange = (idx: number, caption: string) => {
    const images = block.images.map((img, i) => i === idx ? { ...img, caption } : img)
    updateBlock(block.id, { images })
  }

  // Keyboard nav in lightbox
  useEffect(() => {
    if (lightbox === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setLightbox(i => Math.min((i ?? 0) + 1, block.images.length - 1))
      if (e.key === 'ArrowLeft')  setLightbox(i => Math.max((i ?? 0) - 1, 0))
      if (e.key === 'Escape')     setLightbox(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, block.images.length])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-medium">Galeri ({block.images.length} foto)</span>
        <button onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs px-2.5 py-1 border border-gray-200 rounded-lg hover:border-blue-300 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50">
          {uploading ? 'Uploading...' : '+ Tambah Foto'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { if(e.target.files) handleUpload(e.target.files) }} />
      </div>

      {block.images.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300"
        >
          <p className="text-gray-300 text-sm">Klik atau drag foto untuk galeri</p>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {block.images.map((img, idx) => (
            <div key={idx} className="relative group shrink-0 w-24 h-24">
              <Image
                src={img.url} alt={img.alt}
                width={96}
                height={96}
                onClick={() => setLightbox(idx)}
                className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              />
              <button
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <Image
            src={block.images[lightbox]?.url}
            alt={block.images[lightbox]?.alt}
            width={1600}
            height={1200}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
          {block.images[lightbox]?.caption && (
            <p className="text-white text-sm mt-3 opacity-70">{block.images[lightbox].caption}</p>
          )}
          <div className="flex items-center gap-6 mt-4">
            <button
              onClick={e => { e.stopPropagation(); setLightbox(i => Math.max((i ?? 0) - 1, 0)) }}
              disabled={lightbox === 0}
              className="text-white text-2xl opacity-70 hover:opacity-100 disabled:opacity-20"
            >←</button>
            <span className="text-white text-xs opacity-50">{lightbox + 1} / {block.images.length}</span>
            <button
              onClick={e => { e.stopPropagation(); setLightbox(i => Math.min((i ?? 0) + 1, block.images.length - 1)) }}
              disabled={lightbox === block.images.length - 1}
              className="text-white text-2xl opacity-70 hover:opacity-100 disabled:opacity-20"
            >→</button>
          </div>

          <div className="flex gap-1.5 mt-4 overflow-x-auto max-w-xs">
            {block.images.map((img, idx) => (
              <Image
                key={idx}
                src={img.url}
                alt={img.alt || `Thumbnail ${idx + 1}`}
                width={40}
                height={40}
                onClick={e => { e.stopPropagation(); setLightbox(idx) }}
                className={`w-10 h-10 object-cover rounded cursor-pointer transition-opacity ${idx === lightbox ? 'opacity-100 ring-2 ring-white' : 'opacity-50 hover:opacity-80'}`}
              />
            ))}
          </div>

          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-2xl opacity-70 hover:opacity-100">×</button>
        </div>
      )}
    </div>
  )
}