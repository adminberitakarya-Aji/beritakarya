import { prisma } from '../../db/client'
import { generateSlug } from '@beritakarya/utils'

export class CategoryService {
  async getSiteCategories(siteId: string) {
    return await prisma.category.findMany({
      where: {
        OR: [
          { siteId },
          { isGlobal: true }
        ]
      },
      include: {
        site: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
  }

  async getAllCategories() {
    return await prisma.category.findMany({
      include: {
        site: true
      },
      orderBy: [
        { siteId: 'asc' },
        { createdAt: 'asc' }
      ]
    })
  }

  async getGlobalCategories() {
    return await prisma.category.findMany({
      where: { isGlobal: true },
      include: { site: true }
    })
  }

  async createCategory(data: {
    name: string
    slug: string
    siteId?: string | null
    description?: string
  }, actorUserId: string) {
    const isGlobal = data.siteId === null
    const effectiveSiteId = data.siteId === '' ? null : data.siteId

    const where = effectiveSiteId
      ? { slug: data.slug, siteId: effectiveSiteId }
      : { slug: data.slug, isGlobal: true }

    const existing = await prisma.category.findFirst({ where })
    if (existing) {
      throw Object.assign(
        new Error(`Category with slug "${data.slug}" already exists in this scope`),
        { statusCode: 409 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        siteId: effectiveSiteId,
        isGlobal,
        description: data.description
      },
      include: { site: true }
    })

    return category
  }

  async updateCategory(
    categoryId: string,
    data: Partial<{
      name: string
      description: string
      siteId?: string | null
    }>,
    actorUserId: string
  ) {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!existing) {
      throw Object.assign(new Error('Category not found'), { statusCode: 404 })
    }

    if (existing.isGlobal && data.siteId !== undefined && data.siteId !== null) {
      throw Object.assign(
        new Error('Cannot change global category to site-specific'),
        { statusCode: 400 }
      )
    }

    if (data.siteId !== undefined && data.siteId !== existing.siteId) {
      const newSiteId = data.siteId === null ? null : data.siteId
      const whereCondition = newSiteId
        ? { slug: existing.slug, siteId: newSiteId, id: { not: categoryId } }
        : { slug: existing.slug, isGlobal: true, id: { not: categoryId } }

      const conflict = await prisma.category.findFirst({
        where: whereCondition
      })

      if (conflict) {
        throw Object.assign(
          new Error(`Category slug "${existing.slug}" already exists in the target site`),
          { statusCode: 409 }
        )
      }
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        description: data.description,
        siteId: data.siteId !== undefined
          ? (data.siteId === '' ? null : data.siteId)
          : undefined
      },
      include: { site: true }
    })

    return category
  }

  async deleteCategory(categoryId: string, actorUserId: string) {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId }
    })

    if (!existing) {
      throw Object.assign(new Error('Category not found'), { statusCode: 404 })
    }

    if (existing.isGlobal) {
      throw Object.assign(
        new Error('Cannot delete global category'),
        { statusCode: 400 }
      )
    }

    await prisma.category.delete({
      where: { id: categoryId }
    })

    return { success: true, message: 'Category deleted' }
  }
}

export const categoryService = new CategoryService()