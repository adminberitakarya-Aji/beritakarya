import { prisma } from '../../db/client'

export async function createNotification(data: {
  userId: string;
  siteId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const notification = await prisma.notification.create({ data })
  // We'll trigger the event emitter here in the service/controller layer
  return notification
}

export async function findUserNotifications(userId: string, siteId: string, limit: number = 20) {
  return prisma.notification.findMany({
    where: { userId, siteId },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}

export async function markAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true }
  })
}

export async function markAllAsRead(userId: string, siteId: string) {
  return prisma.notification.updateMany({
    where: { userId, siteId, isRead: false },
    data: { isRead: true }
  })
}

export async function getUnreadCount(userId: string, siteId: string) {
  return prisma.notification.count({
    where: { userId, siteId, isRead: false }
  })
}
