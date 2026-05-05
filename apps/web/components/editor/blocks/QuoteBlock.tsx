'use client'
import { useEditorStore } from '../../../store/editorStore'
import type { QuoteBlock as TQuoteBlock } from '@beritakarya/types'

export function QuoteBlock({ block }: { block: TQuoteBlock }) {
  const { updateBlock } = useEditorStore()
  return (
    <div className="border-l-4 border-blue-400 pl-4 py-1">
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={e => updateBlock(block.id, { content: e.currentTarget.innerText })}
        data-placeholder="Tulis kutipan..."
        className="text-lg italic text-gray-700 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 empty:before:not-italic"
        dangerouslySetInnerHTML={{ __html: block.content }}
      />
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={e => updateBlock(block.id, { attribution: e.currentTarget.innerText })}
        data-placeholder="— Nama narasumber"
        className="text-sm text-gray-400 mt-1 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300"
        dangerouslySetInnerHTML={{ __html: block.attribution || '' }}
      />
    </div>
  )
}