'use client'
import { useState } from 'react'
import { WriteTab } from './ai/WriteTab'
import { OptimizeTab } from './ai/OptimizeTab'
import { ValidateTab } from './ai/ValidateTab'
import { LayoutTab } from './ai/LayoutTab'

type Tab = 'write' | 'optimize' | 'validate' | 'layout'

const TABS: { id: Tab; label: string }[] = [
  { id: 'write', label: 'Tulis' },
  { id: 'optimize', label: 'Optimasi' },
  { id: 'validate', label: 'Validasi' },
  { id: 'layout', label: 'Layout' }
]

import { Sparkles, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export function AISidebar() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('write')

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-6 bottom-6 bg-brand-black hover:bg-brand-red text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-sm shadow-2xl flex items-center gap-3 transition-all z-40"
      >
        <Sparkles size={16} className="text-brand-red animate-pulse" />
        <span>Asisten AI</span>
      </button>
    )
  }

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-100 shadow-[-20px_0_50px_rgba(0,0,0,0.05)] flex flex-col z-[60] animate-fade-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-brand-surface">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-brand-red" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-brand-black">Asisten AI Redaksi</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="p-2 text-gray-400 hover:text-brand-black transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex border-b border-gray-50">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2",
              tab === t.id
                ? 'border-brand-red text-brand-red bg-brand-red/[0.02]'
                : 'border-transparent text-gray-400 hover:text-brand-black hover:bg-gray-50'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {tab === 'write' && <WriteTab />}
        {tab === 'optimize' && <OptimizeTab />}
        {tab === 'validate' && <ValidateTab />}
        {tab === 'layout' && <LayoutTab />}
      </div>

      <div className="px-6 py-4 border-t border-gray-50 bg-brand-surface">
        <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-widest leading-relaxed">
          AI bersifat asistif — Selalu tinjau konten sebelum dipublikasikan demi menjaga integritas jurnalistik.
        </p>
      </div>
    </div>
  )
}