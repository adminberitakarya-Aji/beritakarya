'use client'
import { useEditorStore } from '../../../store/editorStore'
import type { HeadingBlock as THeadingBlock } from '@beritakarya/types'

const SIZE: Record<number, string> = {
  1: 'text-3xl font-bold',
  2: 'text-2xl font-bold',
  3: 'text-xl font-semibold',
  4: 'text-lg font-semibold',
  5: 'text-base font-semibold',
  6: 'text-sm font-semibold'
}

export function HeadingBlock({ block }: { block: THeadingBlock }) {
  const { updateBlock } = useEditorStore()

  return (
    <div className="flex items-start gap-2">
      <select
        value={block.level}
        onChange={e => updateBlock(block.id, { level: Number(e.target.value) as any })}
        className="mt-1 text-xs border rounded px-1 py-0.5 text-gray-400 bg-transparent shrink-0"
      >
        {[1,2,3,4,5,6].map(l => <option key={l} value={l}>H{l}</option>)}
      </select>
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={e => updateBlock(block.id, { content: e.currentTarget.innerText })}
        data-placeholder={`Heading ${block.level}...`}
        className={`flex-1 outline-none leading-tight ${SIZE[block.level]} empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 empty:before:font-normal`}
        dangerouslySetInnerHTML={{ __html: block.content }}
      />
    </div>
  )
}