'use client'
import { useRef } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import type { ParagraphBlock as TParagraphBlock } from '@beritakarya/types'

export function ParagraphBlock({ block }: { block: TParagraphBlock }) {
  const { updateBlock } = useEditorStore()
  const ref = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.innerText })}
      data-placeholder="Tulis paragraf..."
      className="min-h-[1.5em] outline-none text-base leading-relaxed text-gray-800 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 empty:before:pointer-events-none"
      dangerouslySetInnerHTML={{ __html: block.content }}
    />
  )
}