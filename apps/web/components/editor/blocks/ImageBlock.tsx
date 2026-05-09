'use client'
import { useRef, useState } from 'react'
import Image from 'next/image'
import { useEditorStore } from '../../../store/editorStore'
import { api } from '../../../lib/api'
import type { ImageBlock as TImageBlock } from '@beritakarya/types'
import { useCaption } from '../../../hooks/useAI'; // Import AI caption hook

export function ImageBlock({ block }: { block: TImageBlock }) {
  const { updateBlock } = useEditorStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [captionState, doCaption] = useCaption();

  const handleUpload = async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    setUploading(true)
    setProgress(10)
    try {
      const { data } = await api.post('/media/upload', form, {
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 90))
        }
      })
      setProgress(100)
      updateBlock(block.id, {
        url: data.data.url,
        alt: file.name.replace(/.[^/.]+$/, ''),
        width: data.data.width,
        height: data.data.height
      })
    } catch {
      alert('Upload gagal, coba lagi')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleGenerateCaption = async () => {
    if (!block.url) return;
    const result = await doCaption({ imageUrl: block.url });
    if (result) {
      updateBlock(block.id, { caption: result.caption, alt: result.altText });
    }
  };

  if (!block.url) {
    return (
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if(f) handleUpload(f) }}
        onDragOver={e => e.preventDefault()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
      >
        <p className="text-gray-400 text-sm">Klik atau drag & drop gambar di sini</p>
        <p className="text-gray-300 text-xs mt-1">JPG, PNG, WebP — maks 10MB</p>
        {uploading && (
          <div className="mt-3 bg-gray-200 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if(f) handleUpload(f) }} />
      </div>
    )
  }

  return (
    <div className="relative group">
      <Image
        src={block.url}
        alt={block.alt || 'Article image'}
        width={1600}
        height={900}
        className="w-full rounded-xl object-cover max-h-96 h-auto"
      />
      <button
        onClick={() => updateBlock(block.id, { url: '', alt: '' })}
        className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >Ganti</button>

      <div className="flex items-center gap-2 mt-1.5">
        <input
          value={block.caption || ''}
          onChange={e => updateBlock(block.id, { caption: e.target.value })}
          placeholder="Tambah caption gambar..."
          className="flex-1 text-xs text-gray-400 text-center outline-none bg-transparent placeholder-gray-300"
        />
        <button
          onClick={handleGenerateCaption}
          disabled={captionState.loading}
          className="text-xs px-2 py-0.5 border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50 shrink-0 disabled:opacity-50 transition-colors"
        >
          {captionState.loading ? '...' : '✦ AI Caption'}
        </button>
      </div>

      {captionState.error && (
        <p className="text-xs text-red-400 text-center mt-1">{captionState.error}</p>
      )}
    </div>
  )
}