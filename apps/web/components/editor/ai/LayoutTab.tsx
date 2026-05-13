'use client'
import { useLayout } from '../../../hooks/useAI'
import { useEditorStore } from '../../../store/editorStore'
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts'

interface Props {
  model?: string
}

export function LayoutTab({ model = 'gpt-4o' }: Props) {
  const { blocks } = useEditorStore()
  const [layoutState, analyzeLayout] = useLayout(model)

  const handleAnalyze = async () => {
    await analyzeLayout({ blocks })
  }

  // Keyboard shortcut
  useKeyboardShortcuts([
    {
      key: 'l',
      shift: true,
      ctrl: true,
      alt: false,
      action: () => {
        if (blocks.length > 0 && !layoutState.loading) handleAnalyze()
      }
    }
  ], true)

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">Analisis Layout</span>
          <button
            onClick={handleAnalyze}
            disabled={layoutState.loading || blocks.length === 0}
            className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {layoutState.loading ? 'Menganalisis...' : 'Analisis Artikel'}
          </button>
        </div>
        {blocks.length === 0 && (
          <p className="text-xs text-gray-400 mb-2">Tambahkan beberapa blok konten terlebih dahulu</p>
        )}
      </div>

      {layoutState.result && (
        <div className="space-y-3">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Ringkasan</p>
            <p className="text-xs text-gray-600">{layoutState.result.summary}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Saran:</p>
            {layoutState.result.suggestions.map((suggestion, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-2">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 text-sm">•</span>
                  <div>
                    <p className="text-xs text-gray-700">{suggestion.issue || suggestion}</p>
                    {suggestion.recommendation && (
                      <p className="text-xs text-green-600 mt-1">
                        ✅ {suggestion.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {layoutState.error && (
        <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{layoutState.error}</p>
      )}
    </div>
  )
}