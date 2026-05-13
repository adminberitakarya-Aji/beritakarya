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

interface Props {
  model?: string
}

export function WriteTab({ model = 'gpt-4o' }: Props) {
  const { blocks, updateBlock } = useEditorStore()
  const [selectedId, setSelectedId] = useState('')
  const [tone, setTone] = useState<Tone>('berita')
  const [length, setLength] = useState<Length>('sama')
  const [rewriteState, doRewrite] = useRewrite(model)
  const [expandState, doExpand] = useExpand(model)
  
  const paragraphBlocks = blocks.filter(b => b.type === 'paragraph' || b.type === 'quote')
  const selected = blocks.find(b => b.id === selectedId)
  const content = (selected as any)?.content || ''
  const selectedIdx = blocks.findIndex(b => b.id === selectedId)
  
  // Calculate estimated cost (approximate)
  const estimateCost = (inputChars: number, outputChars: number): string => {
    const inputTokens = Math.ceil(inputChars / 4)
    const outputTokens = Math.ceil(outputChars / 4)
    // GPT-4o pricing: $5/1M input, $15/1M output
    const cost = (inputTokens / 1_000_000 * 5) + (outputTokens / 1_000_000 * 15)
    if (cost < 0.001) return '~$0.00'
    return `~$${cost.toFixed(3)}`
  }
  
  const rewriteCost = rewriteState.result ? estimateCost(content.length, rewriteState.result.length) : '~$0.015'
  const expandCost = expandState.result ? estimateCost(content.length, expandState.result.length) : '~$0.012'

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
        <div className="space-y-2">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">Paragraf Terpilih ({content.length} kar)</label>
              <span className="text-xs text-gray-400">Blok #{selectedIdx + 1}</span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{content}</p>
          </div>
          
          {/* Context: Previous Paragraph */}
          {selectedIdx > 0 && (blocks[selectedIdx - 1] as any)?.content && (
            <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
              <p className="text-[10px] font-medium text-blue-600 mb-1">Sebelumnya:</p>
              <p className="text-xs text-blue-800 leading-relaxed">
                {(blocks[selectedIdx - 1] as any).content?.slice(0, 300)}
                {(blocks[selectedIdx - 1] as any).content?.length > 300 ? '...' : ''}
              </p>
            </div>
          )}
          
          {/* Context: Next Paragraph */}
          {selectedIdx < blocks.length - 1 && (blocks[selectedIdx + 1] as any)?.content && (
            <div className="bg-green-50 rounded-lg p-2.5 border border-green-100">
              <p className="text-[10px] font-medium text-green-600 mb-1">Setelahnya:</p>
              <p className="text-xs text-green-800 leading-relaxed">
                {(blocks[selectedIdx + 1] as any).content?.slice(0, 300)}
                {(blocks[selectedIdx + 1] as any).content?.length > 300 ? '' : ''}
              </p>
            </div>
          )}
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

      <div className="space-y-2">
        <button onClick={handleRewrite} disabled={!selectedId || rewriteState.loading}
          className="w-full text-xs py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium flex items-center justify-between px-3">
          <span>{rewriteState.loading ? 'Menulis ulang...' : '✏️ Tulis Ulang'}</span>
          <span className="text-[10px] opacity-80">{rewriteCost}</span>
        </button>
        <button onClick={handleExpand} disabled={!selectedId || expandState.loading}
          className="w-full text-xs py-2.5 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 disabled:opacity-50 font-medium flex items-center justify-between px-3">
          <span>{expandState.loading ? 'Mengembangkan...' : '🚀 Kembangkan'}</span>
          <span className="text-[10px] opacity-70">{expandCost}</span>
        </button>
      </div>

      {rewriteState.result && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700 flex items-center justify-between">
            <span>✅ Hasil Tulis Ulang</span>
            <span className="text-gray-400">{rewriteState.result.length} karakter</span>
          </div>
          <AIResultCard
            label=""
            content={rewriteState.result}
            onApply={() => applyRewrite(rewriteState.result!)}
            showCompare={true}
            originalContent={content}
            model={model}
          />
        </div>
      )}
      {expandState.result && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700 flex items-center justify-between">
            <span>✅ Hasil Pengembangan</span>
            <span className="text-gray-400">{expandState.result.length} karakter (+{Math.round((expandState.result.length - content.length) / content.length * 100)}%)</span>
          </div>
          <AIResultCard
            label=""
            content={expandState.result}
            onApply={() => applyRewrite(expandState.result!)}
            showCompare={true}
            originalContent={content}
            model={model}
          />
        </div>
      )}
      {(rewriteState.error || expandState.error) && (
        <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">
          {rewriteState.error || expandState.error}
        </p>
      )}
    </div>
  )
}