import { prisma } from '../../db/client'
import { generateSlug } from '@beritakarya/utils'

export async function getCategories(siteId: string) {
  return prisma.category.findMany({
    where: { siteId },
    orderBy: { createdAt: 'asc' }
  })
}

export async function createCategory(siteId: string, name: string) {
  const slug = generateSlug(name)
  return prisma.category.create({
    data: { name, slug, siteId }
  })
}

export async function updateCategory(id: string, siteId: string, name: string) {
  const slug = generateSlug(name)
  return prisma.category.update({
    where: { id },
    data: { name, slug }
  })
}

export async function deleteCategory(id: string, siteId: string) {
  return prisma.category.delete({
    where: { id }
  })
}
