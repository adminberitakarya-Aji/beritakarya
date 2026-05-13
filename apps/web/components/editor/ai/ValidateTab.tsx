'use client'
import { useState } from 'react'
import { useGrammar, useReadability } from '../../../hooks/useAI'
import { useEditorStore } from '../../../store/editorStore'

function getAllText(blocks: any[]): string {
  return blocks
    .filter(b => ['paragraph','heading','quote'].includes(b.type))
    .map(b => b.content)
    .filter(Boolean)
    .join('\n\n')
}

const SCORE_COLOR = (s: number) =>
  s >= 70 ? 'text-green-600' : s >= 40 ? 'text-yellow-600' : 'text-red-500'

export function ValidateTab() {
  const { blocks, updateBlock } = useEditorStore()
  const [grammarState, doGrammar] = useGrammar()
  const [readState, doRead] = useReadability()
  const allText = getAllText(blocks)
  const [selectedCorrections, setSelectedCorrections] = useState<Set<number>>(new Set())

  const toggleCorrectionSelection = (index: number) => {
    const newSet = new Set(selectedCorrections)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setSelectedCorrections(newSet)
  }

  const toggleAllCorrections = () => {
    if (selectedCorrections.size === grammarState.result!.corrections.length) {
      setSelectedCorrections(new Set())
    } else {
      setSelectedCorrections(new Set(grammarState.result!.corrections.map((_, i) => i)))
    }
  }

  const applySelectedCorrections = async () => {
    if (!grammarState.result) return
    
    const corrections = grammarState.result.corrections
    const selectedIndices = Array.from(selectedCorrections).sort((a, b) => b - a) // Apply from end to start to preserve indices
    
    for (const index of selectedIndices) {
      const correction = corrections[index]
      const { original, suggestion } = correction
      
      // Find and update all blocks that contain this text
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        const content = (block as any).content
        if (typeof content === 'string' && content.includes(original)) {
          const newContent = content.replace(original, suggestion)
          updateBlock(block.id, { content: newContent })
        }
      }
    }
    
    // Clear selection and re-run grammar check
    setSelectedCorrections(new Set())
    setTimeout(() => doGrammar({ text: getAllText(blocks) }), 100)
  }

  return (
    <div className="space-y-5">
      {/* Grammar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">Cek Grammar</span>
          <button
            onClick={() => doGrammar({ text: allText })}
            disabled={grammarState.loading || !allText}
            className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {grammarState.loading ? 'Memeriksa...' : 'Cek Sekarang'}
          </button>
        </div>

        {grammarState.result && (
          <div>
            {grammarState.result.totalIssues === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                ✓ Tidak ditemukan masalah grammar
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-gray-100 p-2 rounded-lg">
                  <p className="text-xs text-gray-600">{grammarState.result.totalIssues} masalah ditemukan</p>
                  <div className="flex gap-2">
                    <button
                      onClick={toggleAllCorrections}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                    >
                      {selectedCorrections.size === grammarState.result.corrections.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </button>
                    {selectedCorrections.size > 0 && (
                      <button
                        onClick={applySelectedCorrections}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                      >
                        Terapkan ({selectedCorrections.size})
                      </button>
                    )}
                  </div>
                </div>
                
                {grammarState.result.corrections.map((c, i) => (
                  <div key={i} className={`bg-gray-50 border rounded-lg p-2.5 text-xs transition-all ${selectedCorrections.has(i) ? 'border-amber-300 bg-amber-50' : ''}`}>
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedCorrections.has(i)}
                        onChange={() => toggleCorrectionSelection(i)}
                        className="mt-0.5 h-3 w-3 text-amber-600 focus:ring-amber-500 border-gray-300 rounded shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <span className="text-red-400 line-through shrink-0">{c.original}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-600 font-medium">{c.suggestion}</span>
                        </div>
                        <p className="text-gray-400 mt-1">{c.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {grammarState.error && (
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{grammarState.error}</p>
        )}
      </div>

      {/* Readability */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">Keterbacaan</span>
          <button
            onClick={() => doRead({ text: allText })}
            disabled={readState.loading || !allText}
            className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {readState.loading ? 'Menganalisis...' : 'Analisis'}
          </button>
        </div>

        {readState.result && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className={`text-3xl font-bold ${SCORE_COLOR(readState.result.score)}`}>
                  {readState.result.score}
                </p>
                <p className="text-xs text-gray-400">Skor</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{readState.result.level}</p>
                <p className="text-xs text-gray-500 mt-0.5">{readState.result.summary}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Saran perbaikan:</p>
              {readState.result.suggestions.map((s, i) => (
                <div key={i} className="flex gap-2 text-xs text-gray-600 mb-1.5">
                  <span className="text-amber-500 shrink-0">•</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {readState.error && (
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{readState.error}</p>
        )}
      </div>
    </div>
  )
}