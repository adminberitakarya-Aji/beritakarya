'use client'
import { useEditorStore } from '../../store/editorStore'
import { BlockWrapper } from './BlockWrapper'
import { ParagraphBlock } from './blocks/ParagraphBlock'
import { HeadingBlock } from './blocks/HeadingBlock'
import { QuoteBlock } from './blocks/QuoteBlock'
import { ImageBlock } from './blocks/ImageBlock'
import { EmbedBlock } from './blocks/EmbedBlock'
import { ImageGridBlock } from './blocks/ImageGridBlock'
import { GalleryBlock } from './blocks/GalleryBlock'
import type { Block } from '@beritakarya/types'

export function BlockList() {
  const { blocks } = useEditorStore()

  if (!blocks.length) {
    return (
      <p className="text-gray-300 text-sm py-4 text-center">
        Belum ada blok. Klik + untuk menambah konten.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {blocks.map((block, idx) => (
        <BlockWrapper key={block.id} block={block} index={idx}>
          <BlockRenderer block={block} />
        </BlockWrapper>
      ))}
    </div>
  )
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'paragraph': return <ParagraphBlock block={block} />
    case 'heading': return <HeadingBlock block={block} />
    case 'quote': return <QuoteBlock block={block} />
    case 'image': return <ImageBlock block={block} />
    case 'imageGrid': return <ImageGridBlock block={block} />
    case 'gallery': return <GalleryBlock block={block} />
    case 'embed': return <EmbedBlock block={block} />
    default:
      return (
        <div className="text-xs text-gray-400 py-2 px-3 border rounded bg-gray-50">
          Blok tipe &quot;{(block as any).type}&quot; belum didukung
        </div>
      )
  }
}