'use client'
import { useHeadlines, useSEO } from '../../../hooks/useAI'
import { useEditorStore } from '../../../store/editorStore'

function getExcerpt(blocks: any[]): string {
  return blocks
    .filter(b => b.type === 'paragraph')
    .map(b => b.content)
    .join(' ')
    .slice(0, 800)
}

export function OptimizeTab() {
  const { title, blocks, setTitle } = useEditorStore()
  const [headlineState, doHeadline] = useHeadlines()
  const [seoState, doSEO] = useSEO()
  const excerpt = getExcerpt(blocks)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-5">
      {/* Headline */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">Generator Judul</span>
          <button
            onClick={() => doHeadline({ title, contentExcerpt: excerpt })}
            disabled={headlineState.loading || !title}
            className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {headlineState.loading ? 'Generating...' : 'Generate 5 Judul'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-2">Klik judul untuk langsung terapkan</p>

        {headlineState.result?.headlines.map((h, i) => (
          <button
            key={i}
            onClick={() => setTitle(h)}
            className="w-full text-left text-xs p-2.5 mb-1.5 border rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-colors text-gray-700"
          >
            <span className="text-amber-500 font-medium mr-1">{i + 1}.</span> {h}
          </button>
        ))}

        {headlineState.error && (
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{headlineState.error}</p>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">Generator SEO</span>
          <button
            onClick={() => doSEO({ title, contentExcerpt: excerpt })}
            disabled={seoState.loading || !title}
            className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {seoState.loading ? 'Generating...' : 'Generate SEO'}
          </button>
        </div>

        {seoState.result && (
          <div className="space-y-2.5">
            <SEOField label="Meta Title" value={seoState.result.metaTitle} onCopy={copyToClipboard} maxLen={60} />
            <SEOField label="Meta Description" value={seoState.result.metaDescription} onCopy={copyToClipboard} maxLen={155} />
            <div>
              <p className="text-xs text-gray-500 mb-1">Keywords</p>
              <div className="flex flex-wrap gap-1">
                {seoState.result.keywords.map((k, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{k}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {seoState.error && (
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{seoState.error}</p>
        )}
      </div>
    </div>
  )
}

function SEOField({ label, value, onCopy, maxLen }: { label: string; value: string; onCopy: (v: string) => void; maxLen: number }) {
  const over = value.length > maxLen
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-gray-500">{label}</p>
        <span className={`text-xs ${over ? 'text-red-500' : 'text-gray-400'}`}>{value.length}/{maxLen}</span>
      </div>
      <div className="flex gap-1.5">
        <p className={`flex-1 text-xs p-2 rounded-lg border ${over ? 'border-red-200 bg-red-50' : 'bg-gray-50'}`}>{value}</p>
        <button onClick={() => onCopy(value)} className="text-xs px-2 py-1 border rounded-lg hover:bg-gray-100 text-gray-500 self-start">Copy</button>
      </div>
    </div>
  )
}