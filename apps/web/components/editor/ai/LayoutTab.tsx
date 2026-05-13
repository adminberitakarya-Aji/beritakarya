'use client'
import { useEditorStore } from '../../../store/editorStore'
import { useLayoutStore } from '../../../store/layoutStore'

const TYPE_LABELS: Record<string, string> = {
  split_paragraph:  'Pecah Paragraf',
  insert_image_after: 'Sisipkan Gambar',
  add_heading:      'Tambah Judul',
  reorder:          'Susun Ulang'
}
const TYPE_ICONS: Record<string, string> = {
  split_paragraph:  '✂',
  insert_image_after: '🖼',
  add_heading:      '📝',
  reorder:          '↕'
}

export function LayoutTab() {
  const { blocks } = useEditorStore()
  const {
    suggestions, selected, loading, error, summary,
    analyze, toggleSelect, selectAll, clearAll, applySelected, dismiss
  } = useLayoutStore()

  const hasResult  = suggestions.length > 0
  const hasSelected = selected.size > 0

  return (
    <div className="space-y-4">
      <div className="bg-coral-50 border border-orange-100 rounded-xl p-3">
        <p className="text-xs text-gray-600 leading-relaxed">
          AI akan menganalisis struktur post dan menyarankan perbaikan layout.
          Anda bisa pilih saran mana yang ingin diterapkan.
        </p>
      </div>

      <button
        onClick={() => analyze(blocks)}
        disabled={loading || blocks.length < 2}
        className="w-full py-2.5 bg-orange-600 text-white text-xs font-medium rounded-xl hover:bg-orange-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Menganalisis struktur...' : '✦ Analisis Layout Post'}
      </button>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-xl">{error}</p>
      )}

      {hasResult && (
        <div className="space-y-3">
          {summary && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <p className="text-xs text-orange-800">{summary}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              {suggestions.length} saran ditemukan
            </span>
            <div className="flex gap-2">
              <button onClick={selectAll}
                className="text-xs text-orange-600 hover:text-orange-800">Pilih Semua</button>
              <span className="text-gray-300">|</span>
              <button onClick={clearAll}
                className="text-xs text-gray-400 hover:text-gray-600">Batal Pilih</button>
            </div>
          </div>

          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => toggleSelect(i)}
                className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selected.has(i)
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                  selected.has(i) ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                }`}>
                  {selected.has(i) && <span className="text-white text-xs leading-none">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm">{TYPE_ICONS[s.type]}</span>
                    <span className="text-xs font-medium text-gray-700">
                      {TYPE_LABELS[s.type] || s.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.reason}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={dismiss}
              className="flex-1 py-2 text-xs border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50"
            >
              Abaikan Semua
            </button>
            <button
              onClick={applySelected}
              disabled={!hasSelected}
              className="flex-1 py-2 text-xs bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 font-medium"
            >
              Terapkan ({selected.size})
            </button>
          </div>
        </div>
      )}

      {!hasResult && !loading && (
        <p className="text-xs text-center text-gray-300 py-4">
          Klik tombol di atas untuk menganalisis layout post
        </p>
      )}
    </div>
  )
}