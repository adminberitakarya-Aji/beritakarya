'use client'
import { useState } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import type { EmbedBlock as TEmbedBlock } from '@beritakarya/types'

function detectEmbedType(url: string): TEmbedBlock['embedType'] {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter'
  if (url.includes('instagram.com')) return 'instagram'
  return 'other'
}

function getYouTubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/)
  return match?.[1]
}

export function EmbedBlock({ block }: { block: TEmbedBlock }) {
  const { updateBlock } = useEditorStore()
  const [input, setInput] = useState(block.url)

  const handleConfirm = () => {
    const embedType = detectEmbedType(input)
    updateBlock(block.id, { url: input, embedType })
  }

  if (!block.url) {
    return (
      <div className="border rounded-xl p-4 bg-gray-50">
        <p className="text-xs text-gray-500 mb-2">Paste URL YouTube, Twitter, atau Instagram</p>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            placeholder="https://..."
            className="flex-1 text-sm border rounded-lg px-3 py-1.5 outline-none focus:border-blue-400"
          />
          <button
            onClick={handleConfirm}
            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >Embed</button>
        </div>
      </div>
    )
  }

  if (block.embedType === 'youtube') {
    const videoId = getYouTubeId(block.url)
    if (videoId) {
      return (
        <div className="relative group">
          <div className="aspect-video rounded-xl overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
          <button
            onClick={() => updateBlock(block.id, { url: '', embedType: 'other' })}
            className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
          >Ganti</button>
        </div>
      )
    }
  }

  if (block.embedType === 'twitter') {
    return (
      <div className="relative group">
        <div className="border rounded-xl overflow-hidden bg-white">
          <blockquote className="twitter-tweet" data-theme="light">
            <a href={block.url}>{block.url}</a>
          </blockquote>
        </div>
        <button
          onClick={() => updateBlock(block.id, { url: '', embedType: 'other' })}
          className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
        >Ganti</button>
        <script async src="https://platform.twitter.com/widgets.js" />
      </div>
    )
  }

  if (block.embedType === 'instagram') {
    return (
      <div className="relative group">
        <div className="border rounded-xl overflow-hidden bg-white">
          <blockquote className="instagram-media" data-instgrm-captioned data-instgrm-permalink={block.url}>
            <a href={block.url}>{block.url}</a>
          </blockquote>
        </div>
        <button
          onClick={() => updateBlock(block.id, { url: '', embedType: 'other' })}
          className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100"
        >Ganti</button>
        <script async src="https://www.instagram.com/embed.js" />
      </div>
    )
  }

  return (
    <div className="border rounded-xl p-3 bg-gray-50 flex items-center gap-3">
      <div className="text-xs text-gray-500 flex-1 truncate">{block.url}</div>
      <button
        onClick={() => updateBlock(block.id, { url: '' })}
        className="text-xs text-red-400 hover:text-red-600"
      >Hapus</button>
    </div>
  )
}
