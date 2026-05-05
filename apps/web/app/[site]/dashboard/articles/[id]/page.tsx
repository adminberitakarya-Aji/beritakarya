import { Editor } from '../../../../../components/editor/Editor'

interface Props {
  params: { site: string; id: string }
}

export default function ArticleEditorPage({ params }: Props) {
  return (
    <main className="min-h-screen bg-white">
      <Editor articleId={params.id} siteId={params.site} />
    </main>
  )
}

export function generateMetadata({ params }: Props) {
  return { title: `Editor — ${params.site} | BeritaKarya` }
}