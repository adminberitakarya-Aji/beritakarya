import type { Block } from './block';
export type ArticleStatus = 'draft' | 'review' | 'published';
export interface Article {
    id: string;
    title: string;
    slug: string;
    siteId: string;
    authorId: string;
    blocks: Block[];
    status: ArticleStatus;
    metaTitle?: string;
    metaDescription?: string;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateArticleInput {
    title: string;
    siteId: string;
    blocks?: Block[];
}
export interface UpdateArticleInput {
    title?: string;
    blocks?: Block[];
    metaTitle?: string;
    metaDescription?: string;
}
export interface ArticleListItem {
    id: string;
    title: string;
    slug: string;
    status: ArticleStatus;
    authorId: string;
    siteId: string;
    publishedAt?: Date;
    createdAt: Date;
}
//# sourceMappingURL=article.d.ts.map