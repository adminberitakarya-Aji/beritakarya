'use client'
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
  const { blocks } = useEditorStore()
  const [grammarState, doGrammar] = useGrammar()
  const [readState, doRead] = useReadability()
  const allText = getAllText(blocks)

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
                <p className="text-xs text-gray-500">{grammarState.result.totalIssues} masalah ditemukan</p>
                {grammarState.result.corrections.map((c, i) => (
                  <div key={i} className="bg-gray-50 border rounded-lg p-2.5 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-red-400 line-through shrink-0">{c.original}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-600 font-medium">{c.suggestion}</span>
                    </div>
                    <p className="text-gray-400 mt-1">{c.reason}</p>
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