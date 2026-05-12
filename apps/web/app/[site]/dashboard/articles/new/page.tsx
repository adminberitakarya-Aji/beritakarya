import { Editor } from '../../../../../components/editor/Editor'

interface Props {
  params: { site: string }
}

export default function NewArticlePage({ params }: Props) {
  return (
    <main className="min-h-screen bg-white">
      <Editor articleId="new" siteId={params.site} />
    </main>
  )
}

export function generateMetadata({ params }: Props) {
  return { title: `Artikel Baru — ${params.site} | BeritaKarya` }
}