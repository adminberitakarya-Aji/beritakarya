'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { useEditorStore } from '../../../store/editorStore'
import { api } from '../../../lib/api'
import type { ImageGridBlock as TImageGridBlock, ImageItem } from '@beritakarya/types'

interface Props { block: TImageGridBlock }

export function ImageGridBlock({ block }: Props) {
  const { updateBlock } = useEditorStore()
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const setColumns = (columns: 2 | 3) => updateBlock(block.id, { columns })

  const uploadImage = async (file: File): Promise<ImageItem | null> => {
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post('/media/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return { url: data.data.url, alt: file.name.replace(/.[^/.]+$/, '') }
    } catch { return null }
  }

  const handleAddImage = async (file: File) => {
    const item = await uploadImage(file)
    if (!item) return
    updateBlock(block.id, { images: [...block.images, item] })
  }

  const handleRemove = (idx: number) => {
    updateBlock(block.id, {
      images: block.images.filter((_, i) => i !== idx)
    })
  }

  const handleCaptionChange = (idx: number, caption: string) => {
    const images = block.images.map((img, i) => i === idx ? { ...img, caption } : img)
    updateBlock(block.id, { images })
  }

  const handleDragStart = (idx: number) => setDragIdx(idx)

  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return
    const imgs = [...block.images]
    const [moved] = imgs.splice(dragIdx, 1)
    imgs.splice(targetIdx, 0, moved)
    updateBlock(block.id, { images: imgs })
    setDragIdx(null)
  }

  const gridCols = block.columns === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-medium">Grid Gambar</span>
        <div className="flex gap-1">
          {([2, 3] as const).map(c => (
            <button key={c} onClick={() => setColumns(c)}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                block.columns === c
                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                  : 'border-gray-200 text-gray-400 hover:border-gray-300'
              }`}>
              {c} Kolom
            </button>
          ))}
        </div>
      </div>

      <div className={`grid ${gridCols} gap-2`}>
        {block.images.map((img, idx) => (
          <div
            key={idx}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => handleDrop(idx)}
            className="group relative cursor-grab active:cursor-grabbing"
          >
            <Image
              src={img.url}
              alt={img.alt || `Grid image ${idx + 1}`}
              width={800}
              height={800}
              className="w-full aspect-square object-cover rounded-lg"
            />
            <button
              onClick={() => handleRemove(idx)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >×</button>
            <input
              value={img.caption || ''}
              onChange={e => handleCaptionChange(idx, e.target.value)}
              placeholder="Caption..."
              className="w-full mt-1 text-xs text-gray-400 text-center outline-none bg-transparent placeholder-gray-300"
            />
          </div>
        ))}

        {/* Add slot */}
        <UploadSlot onFile={handleAddImage} />
      </div>
    </div>
  )
}

function UploadSlot({ onFile }: { onFile: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handle = async (file: File) => {
    setUploading(true)
    await onFile(file)
    setUploading(false)
  }

  return (
    <div
      onClick={() => ref.current?.click()}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) handle(f) }}
      onDragOver={e => e.preventDefault()}
      className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
    >
      {uploading
        ? <span className="text-xs text-gray-400">Uploading...</span>
        : <>
            <span className="text-xl text-gray-300">+</span>
            <span className="text-xs text-gray-300 mt-1">Tambah</span>
          </>
      }
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if(f) handle(f) }} />
    </div>
  )
}