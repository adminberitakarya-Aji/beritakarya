import { useState, useCallback } from 'react'
import { api } from '../lib/api'

interface AIState<T> {
  loading: boolean
  result: T | null
  error: string | null
}

interface UseAIActionOptions {
  model?: string
}

function useAIAction<TInput, TResult>(
  endpoint: string,
  options?: UseAIActionOptions
): [AIState<TResult>, (input: TInput) => Promise<TResult | null>] {
  const [state, setState] = useState<AIState<TResult>>({
    loading: false, result: null, error: null
  })

  const call = useCallback(async (input: TInput): Promise<TResult | null> => {
    setState({ loading: true, result: null, error: null })
    try {
      const payload = options?.model
        ? { ...input, model: options.model }
        : input
      const { data } = await api.post(`/ai/${endpoint}`, payload)
      if (!data.success) throw new Error(data.error || 'AI gagal')
      setState({ loading: false, result: data.data, error: null })
      return data.data
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'AI tidak tersedia'
      
      if (msg === 'CONSENT_REQUIRED' && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ai:consent:required'))
      }

      setState({ loading: false, result: null, error: msg })
      return null
    }
  }, [endpoint, options?.model])

  return [state, call]
}

// ── Write ─────────────────────────────────────────────────────
export function useRewrite(model?: string) {
  return useAIAction<{
    content: string
    tone?: 'formal' | 'santai' | 'berita'
    length?: 'lebih_pendek' | 'sama' | 'lebih_panjang'
    prevContent?: string
    nextContent?: string
  }, string>('rewrite', { model })
}

export function useExpand(model?: string) {
  return useAIAction<{ content: string; prevContent?: string }, string>('expand', { model })
}

// ── Optimize ──────────────────────────────────────────────────
export function useHeadlines(model?: string) {
  return useAIAction<
    { title: string; contentExcerpt: string },
    { headlines: string[] }
  >('headline', { model })
}

export function useSEO(model?: string) {
  return useAIAction<
    { title: string; contentExcerpt: string },
    { metaTitle: string; metaDescription: string; keywords: string[] }
  >('seo', { model })
}

// ── Validate ──────────────────────────────────────────────────
export function useGrammar(model?: string) {
  return useAIAction<
    { text: string },
    { corrections: { original: string; suggestion: string; reason: string }[]; totalIssues: number }
  >('grammar', { model })
}

export function useReadability(model?: string) {
  return useAIAction<
    { text: string },
    { score: number; level: string; summary: string; suggestions: string[] }
  >('readability', { model })
}

// ── Layout ────────────────────────────────────────────────────
export function useLayout(model?: string) {
  return useAIAction<
    { blocks: any[] },
    { suggestions: any[]; summary: string }
  >('layout', { model })
}

// ── Caption ───────────────────────────────────────────────────
export function useCaption(model?: string) {
  return useAIAction<
    { imageUrl: string },
    { caption: string; altText: string }
  >('caption', { model })
}
