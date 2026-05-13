'use client'
import { useState } from 'react'
import { useHeadlines, useSEO } from '../../../hooks/useAI'
import { useEditorStore } from '../../../store/editorStore'
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts'

interface Props {
  model?: string
}

export function OptimizeTab({ model = 'gpt-4o' }: Props) {
  const { blocks } = useEditorStore()
  const [headlineState, generateHeadlines] = useHeadlines(model)
  const [seoState, generateSEO] = useSEO(model)
  
  // Get title and first paragraph for SEO/headline context
  const title = blocks.find(b => b.type === 'heading')?.content || ''
  const firstParagraph = blocks.find(b => b.type === 'paragraph')?.content || ''
  const excerpt = firstParagraph.slice(0, 200)

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'h',
      shift: true,
      ctrl: true,
      alt: false,
      action: () => {
        if (title && !headlineState.loading) generateHeadlines({ title, contentExcerpt: excerpt })
      }
    },
    {
      key: 's',
      shift: true,
      ctrl: true,
      alt: false,
      action: () => {
        if (title && !seoState.loading) generateSEO({ title, contentExcerpt: excerpt })
      }
    }
  ], true)

  return (
    <div className="space-y-6">
      {/* Headline Generator */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">Headline Generator</span>
          <button
            onClick={() => generateHeadlines({ title: title || 'Untitled', contentExcerpt: excerpt })}
            disabled={headlineState.loading || !title}
            className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {headlineState.loading ? 'Generating...' : 'Generate 5 Headlines'}
          </button>
        </div>
        {!title && (
          <p className="text-xs text-gray-400 mb-2">Add a title first to generate headlines</p>
        )}
        {headlineState.result && (
          <div className="space-y-2">
            {headlineState.result.headlines.map((h, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs">
                <p className="text-gray-800">{h}</p>
              </div>
            ))}
          </div>
        )}
        {headlineState.error && (
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{headlineState.error}</p>
        )}
      </div>

      {/* SEO Generator */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">SEO Meta Generator</span>
          <button
            onClick={() => generateSEO({ title: title || 'Untitled', contentExcerpt: excerpt })}
            disabled={seoState.loading || !title}
            className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {seoState.loading ? 'Generating...' : 'Generate SEO'}
          </button>
        </div>
        {!title && (
          <p className="text-xs text-gray-400 mb-2">Add a title first to generate SEO meta</p>
        )}
        {seoState.result && (
          <div className="space-y-3">
            {/* SERP Preview */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-[10px] font-medium text-gray-500 mb-2">Google SERP Preview</p>
              <div className="bg-white border border-gray-200 rounded p-3 text-sm leading-relaxed">
                <p className="text-blue-700 text-base hover:text-blue-800 cursor-pointer truncate">
                  {seoState.result.metaTitle || title}
                </p>
                <p className="text-green-600 text-xs truncate">
                  https://beritakarya.co/artikel-{title.toLowerCase().replace(/\s+/g, '-')}
                </p>
                <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                  {seoState.result.metaDescription}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Preview: Google search result appearance
              </p>
            </div>

            <div>
              <label className="text-[10px] font-medium text-gray-500 block mb-1">Meta Title (50-60 chars)</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs">
                <p className="text-blue-700">{seoState.result.metaTitle}</p>
                <p className="text-gray-400 text-[10px] mt-1">{seoState.result.metaTitle.length} characters</p>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-500 block mb-1">Meta Description (150-160 chars)</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs">
                <p className="text-gray-700">{seoState.result.metaDescription}</p>
                <p className="text-gray-400 text-[10px] mt-1">{seoState.result.metaDescription.length} characters</p>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-500 block mb-1">Keywords</label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {seoState.result.keywords.map((keyword, i) => (
                    <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
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