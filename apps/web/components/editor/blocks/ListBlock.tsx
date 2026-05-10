'use client'
import { useEditorStore } from '../../../store/editorStore'
import type { ListBlock as TListBlock } from '@beritakarya/types'
import { Plus, X, List as ListIcon, ListOrdered } from 'lucide-react'

export function ListBlock({ block }: { block: TListBlock }) {
  const { updateBlock } = useEditorStore()

  const handleUpdate = (idx: number, value: string) => {
    const next = [...block.items]
    next[idx] = value
    updateBlock(block.id, { items: next })
  }

  const addItem = () => {
    updateBlock(block.id, { items: [...block.items, ''] })
  }

  const removeItem = (idx: number) => {
    if (block.items.length <= 1) return
    const next = block.items.filter((_, i) => i !== idx)
    updateBlock(block.id, { items: next })
  }

  const toggleOrder = () => {
    updateBlock(block.id, { ordered: !block.ordered })
  }

  return (
    <div className="group/list py-2">
      <div className="flex items-center gap-4 mb-4 opacity-0 group-hover/list:opacity-100 transition-opacity">
        <button 
          onClick={toggleOrder}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-md text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-brand-red transition-colors"
        >
          {block.ordered ? <ListOrdered size={14} /> : <ListIcon size={14} />}
          {block.ordered ? 'Numbered' : 'Bulleted'}
        </button>
      </div>

      <div className="space-y-3">
        {block.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-4 group/item">
            <div className="mt-2.5 flex-shrink-0">
              {block.ordered ? (
                <span className="text-sm font-black text-brand-red tabular-nums">{idx + 1}.</span>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-brand-red mt-1.5" />
              )}
            </div>
            <textarea
              value={item}
              onChange={(e) => handleUpdate(idx, e.target.value)}
              placeholder="Tulis poin..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-base text-brand-black dark:text-gray-200 leading-relaxed py-1"
            />
            <button 
              onClick={() => removeItem(idx)}
              className="mt-2 opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-brand-red transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={addItem}
        className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-red transition-colors px-4 py-2 border border-dashed border-gray-200 dark:border-white/5 rounded-lg w-full justify-center"
      >
        <Plus size={14} /> Tambah Poin
      </button>
    </div>
  )
}
