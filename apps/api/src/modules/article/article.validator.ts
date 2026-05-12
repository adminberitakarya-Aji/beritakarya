import { z } from 'zod'

const baseBlock = z.object({ id: z.string() })

export const blockSchema = z.discriminatedUnion('type', [
  baseBlock.extend({ type: z.literal('paragraph'), content: z.string() }),
  baseBlock.extend({ type: z.literal('heading'), level: z.union([z.literal(1),z.literal(2),z.literal(3),z.literal(4),z.literal(5),z.literal(6)]), content: z.string() }),
  baseBlock.extend({ type: z.literal('quote'), content: z.string(), attribution: z.string().optional() }),
  baseBlock.extend({ type: z.literal('image'), url: z.string().url(), alt: z.string(), caption: z.string().optional(), width: z.number().optional(), height: z.number().optional() }),
  baseBlock.extend({
    type: z.literal('imageGrid'),
    columns: z.union([z.literal(2), z.literal(3)]),
    images: z.array(z.object({ url: z.string().url(), alt: z.string(), caption: z.string().optional() }))
  }),
  baseBlock.extend({
    type: z.literal('gallery'),
    images: z.array(z.object({ url: z.string().url(), alt: z.string(), caption: z.string().optional() }))
  }),
  baseBlock.extend({
    type: z.literal('embed'),
    url: z.string().url(),
    embedType: z.enum(['youtube','twitter','instagram','other']),
    title: z.string().optional()
  }),
])

export const createArticleSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter').max(200),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  blocks: z.array(blockSchema).default([])
})

export const updateArticleSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  blocks: z.array(blockSchema).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  status: z.enum(['draft','review','published']).optional(),
  publishedAt: z.date().optional()
})

  export const articleQuerySchema = z.object({
    status: z.enum(['draft','submitted','review','revision','approved','scheduled','published','archived']).optional(),
    search: z.string().optional(),
    category: z.string().optional(),
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().positive().max(100).default(20)
  })
