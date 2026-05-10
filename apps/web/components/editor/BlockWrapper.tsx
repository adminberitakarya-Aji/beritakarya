'use client'
import { type ReactNode } from 'react'
import { useEditorStore } from '../../store/editorStore'
import type { Block } from '@beritakarya/types'
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import { cn } from '../../lib/utils'
import { AddBlockMenu } from './AddBlockMenu'
import { useState } from 'react'

interface Props {
  block: Block
  index: number
  children: ReactNode
}

export function BlockWrapper({ block, index, children }: Props) {
  const { moveBlock, removeBlock, blocks, isFocusMode } = useEditorStore()
  const [showAddMenu, setShowAddMenu] = useState(false)

  if (isFocusMode) {
    return <div className="py-1">{children}</div>
  }

  return (
    <div className="relative group mb-1">
      {/* Floating Toolbar - Centered pill design */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 pointer-events-none group-hover:pointer-events-auto group-hover:-top-6 scale-95 group-hover:scale-100">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 shadow-2xl rounded-full p-1.5 px-3">
          <button
            onClick={() => moveBlock(block.id, 'up')}
            disabled={index === 0}
            className="p-1.5 text-gray-400 hover:text-brand-black dark:hover:text-white disabled:opacity-20 transition-colors"
            title="Naik"
          >
            <ChevronUp size={14} strokeWidth={2.5} />
          </button>
          
          <button
            onClick={() => moveBlock(block.id, 'down')}
            disabled={index === blocks.length - 1}
            className="p-1.5 text-gray-400 hover:text-brand-black dark:hover:text-white disabled:opacity-20 transition-colors"
            title="Turun"
          >
            <ChevronDown size={14} strokeWidth={2.5} />
          </button>

          <div className="w-px h-4 bg-gray-100 dark:bg-white/5 mx-1" />

          <button
            onClick={() => {
              if (confirm('Hapus blok ini?')) {
                removeBlock(block.id)
              }
            }}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors flex items-center gap-1.5"
            title="Hapus blok"
          >
            <Trash2 size={14} strokeWidth={2.5} />
            <span className="text-[10px] font-bold uppercase tracking-wider pr-1">Hapus</span>
          </button>
        </div>
      </div>

      <div className={cn(
        "rounded-2xl transition-all duration-300",
        "group-hover:bg-gray-50/40 dark:group-hover:bg-white/[0.02]",
        "px-2 py-1"
      )}>
        {children}
      </div>

      {/* Inline Add Block Menu Trigger */}
      <div className="h-4 relative mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
          <button 
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="absolute bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-brand-red hover:border-brand-red transition-all shadow-sm"
          >
            <Plus size={14} className={cn("transition-transform", showAddMenu && "rotate-45")} />
          </button>
        </div>
      </div>
      
      {showAddMenu && (
        <div className="my-4 animate-in fade-in slide-in-from-top-2">
          <AddBlockMenu afterId={block.id} onClose={() => setShowAddMenu(false)} />
        </div>
      )}
    </div>
  )
}