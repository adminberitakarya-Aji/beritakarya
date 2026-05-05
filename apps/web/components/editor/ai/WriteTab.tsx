'use client'
import { useState } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { useRewrite, useExpand } from '../../../hooks/useAI'
import { AIResultCard } from './AIResultCard'

type Tone = 'formal' | 'santai' | 'berita'
type Length = 'lebih_pendek' | 'sama' | 'lebih_panjang'

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'berita', label: 'Gaya Berita' },
  { value: 'formal', label: 'Formal' },
  { value: 'santai', label: 'Santai' }
]
const LENGTH_OPTIONS: { value: Length; label: string }[] = [
  { value: 'lebih_pendek', label: 'Lebih Pendek' },
  { value: 'sama', label: 'Sama' },
  { value: 'lebih_panjang', label: 'Lebih Panjang' }
]

export function WriteTab() {
  const { blocks, updateBlock } = useEditorStore()
  const [selectedId, setSelectedId] = useState('')
  const [tone, setTone] = useState<Tone>('berita')
  const [length, setLength] = useState<Length>('sama')
  const [rewriteState, doRewrite] = useRewrite()
  const [expandState, doExpand] = useExpand()

  const paragraphBlocks = blocks.filter(b => b.type === 'paragraph' || b.type === 'quote')
  const selected = blocks.find(b => b.id === selectedId)
  const content = (selected as any)?.content || ''
  const selectedIdx = blocks.findIndex(b => b.id === selectedId)

  const handleRewrite = async () => {
    if (!content) return
    const prev = (blocks[selectedIdx - 1] as any)?.content
    const next = (blocks[selectedIdx + 1] as any)?.content
    await doRewrite({ content, tone, length, prevContent: prev, nextContent: next })
  }

  const handleExpand = async () => {
    if (!content) return
    const prev = (blocks[selectedIdx - 1] as any)?.content
    await doExpand({ content, prevContent: prev })
  }

  const applyRewrite = (result: string) => {
    if (selectedId) updateBlock(selectedId, { content: result })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Pilih Paragraf</label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-full text-xs border rounded-lg px-2.5 py-2 outline-none focus:border-amber-400"
        >
          <option value="">-- pilih blok --</option>
          {paragraphBlocks.map((b, i) => (
            <option key={b.id} value={b.id}>
              Paragraf {i + 1}: {(b as any).content?.slice(0, 40)}...
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-600 max-h-20 overflow-auto">
          {content.slice(0, 150)}{content.length > 150 ? '...' : ''}
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Tone</label>
        <div className="flex gap-1.5">
          {TONE_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setTone(o.value)}
              className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${tone === o.value ? 'bg-amber-100 border-amber-400 text-amber-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">Panjang</label>
        <div className="flex gap-1.5">
          {LENGTH_OPTIONS.map(o => (
            <button key={o.value} onClick={() => setLength(o.value)}
              className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${length === o.value ? 'bg-amber-100 border-amber-400 text-amber-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleRewrite} disabled={!selectedId || rewriteState.loading}
          className="flex-1 text-xs py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
          {rewriteState.loading ? 'Menulis ulang...' : 'Tulis Ulang'}
        </button>
        <button onClick={handleExpand} disabled={!selectedId || expandState.loading}
          className="flex-1 text-xs py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50">
          {expandState.loading ? 'Mengembangkan...' : 'Kembangkan'}
        </button>
      </div>

      {rewriteState.result && (
        <AIResultCard
          label="Hasil Tulis Ulang"
          content={rewriteState.result}
          onApply={() => applyRewrite(rewriteState.result!)}
        />
      )}
      {expandState.result && (
        <AIResultCard
          label="Hasil Pengembangan"
          content={expandState.result}
          onApply={() => applyRewrite(expandState.result!)}
        />
      )}
      {(rewriteState.error || expandState.error) && (
        <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">
          {rewriteState.error || expandState.error}
        </p>
      )}
    </div>
  )
}