export interface BaseBlock {
  id: string
  type: string
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph'
  content: string
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading'
  level: 1 | 2 | 3 | 4 | 5 | 6
  content: string
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote'
  content: string
  attribution?: string
}

export interface ImageItem {
  url: string
  alt: string
  caption?: string
  width?: number
  height?: number
}

export interface ImageBlock extends BaseBlock {
  type: 'image'
  url: string
  alt: string
  caption?: string
  width?: number
  height?: number
}

export interface ImageGridBlock extends BaseBlock {
  type: 'imageGrid'
  images: ImageItem[]
  columns: 2 | 3
}

export interface GalleryBlock extends BaseBlock {
  type: 'gallery'
  images: ImageItem[]
}

export interface EmbedBlock extends BaseBlock {
  type: 'embed'
  url: string
  embedType: 'youtube' | 'twitter' | 'instagram' | 'other'
  title?: string
}

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | QuoteBlock
  | ImageBlock
  | ImageGridBlock
  | GalleryBlock
  | EmbedBlock