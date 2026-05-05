import { useState, useCallback } from 'react'
import { api } from '../lib/api'

interface AIState<T> {
  loading: boolean
  result: T | null
  error: string | null
}

function useAIAction<TInput, TResult>(
  endpoint: string
): [AIState<TResult>, (input: TInput) => Promise<TResult | null>] {
  const [state, setState] = useState<AIState<TResult>>({
    loading: false, result: null, error: null
  })

  const call = useCallback(async (input: TInput): Promise<TResult | null> => {
    setState({ loading: true, result: null, error: null })
    try {
      const { data } = await api.post(`/ai/${endpoint}`, input)
      if (!data.success) throw new Error(data.error || 'AI gagal')
      setState({ loading: false, result: data.data, error: null })
      return data.data
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'AI tidak tersedia'
      setState({ loading: false, result: null, error: msg })
      return null
    }
  }, [endpoint])

  return [state, call]
}

// ── Write ─────────────────────────────────────────────────────
export function useRewrite() {
  return useAIAction<{
    content: string
    tone?: 'formal' | 'santai' | 'berita'
    length?: 'lebih_pendek' | 'sama' | 'lebih_panjang'
    prevContent?: string
    nextContent?: string
  }, string>('rewrite')
}

export function useExpand() {
  return useAIAction<{ content: string; prevContent?: string }, string>('expand')
}

// ── Optimize ──────────────────────────────────────────────────
export function useHeadlines() {
  return useAIAction<
    { title: string; contentExcerpt: string },
    { headlines: string[] }
  >('headline')
}

export function useSEO() {
  return useAIAction<
    { title: string; contentExcerpt: string },
    { metaTitle: string; metaDescription: string; keywords: string[] }
  >('seo')
}

// ── Validate ──────────────────────────────────────────────────
export function useGrammar() {
  return useAIAction<
    { text: string },
    { corrections: { original: string; suggestion: string; reason: string }[]; totalIssues: number }
  >('grammar')
}

export function useReadability() {
  return useAIAction<
    { text: string },
    { score: number; level: string; summary: string; suggestions: string[] }
  >('readability')
}

// ── Layout ────────────────────────────────────────────────────
export function useLayout() {
  return useAIAction<
    { blocks: any[] },
    { suggestions: any[]; summary: string }
  >('layout')
}

// ── Caption ───────────────────────────────────────────────────
export function useCaption() {
  return useAIAction<
    { imageUrl: string },
    { caption: string; altText: string }
  >('caption')
}