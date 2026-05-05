import { prisma } from '../../db/client'

export async function getAds(siteId: string) {
  return prisma.advertisement.findMany({
    where: { siteId }
  })
}

export async function upsertAd(siteId: string, slot: string, data: any) {
  return prisma.advertisement.upsert({
    where: { siteId_slot: { siteId, slot } },
    update: data,
    create: { ...data, siteId, slot }
  })
}

export async function deleteAd(id: string, siteId: string) {
  return prisma.advertisement.delete({
    where: { id }
  })
}
