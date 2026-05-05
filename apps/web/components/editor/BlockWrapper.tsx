'use client'
import { useState, type ReactNode } from 'react'
import { useEditorStore } from '../../store/editorStore'
import { AddBlockMenu } from './AddBlockMenu'
import type { Block } from '@beritakarya/types'

interface Props {
  block: Block
  index: number
  children: ReactNode
}

export function BlockWrapper({ block, index, children }: Props) {
  const [hovered, setHovered] = useState(false)
  const { moveBlock, removeBlock, blocks } = useEditorStore()

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <div className="absolute -left-24 top-1 flex flex-col gap-1 z-10">
          <button
            onClick={() => moveBlock(block.id, 'up')}
            disabled={index === 0}
            className="p-1 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
            title="Naik"
          >↑</button>
          <button
            onClick={() => moveBlock(block.id, 'down')}
            disabled={index === blocks.length - 1}
            className="p-1 text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30"
            title="Turun"
          >↓</button>
          <button
            onClick={() => removeBlock(block.id)}
            className="p-1 text-xs text-red-300 hover:text-red-600"
            title="Hapus blok"
          >×</button>
        </div>
      )}

      <div className="rounded-lg transition-colors hover:bg-gray-50/50 px-2 py-1">
        {children}
      </div>

      {hovered && (
        <div className="mt-1">
          <AddBlockMenu afterId={block.id} compact />
        </div>
      )}
    </div>
  )
}