import { Router, Request, Response } from 'express'
import { EventEmitter } from 'events'
import { requireAuth } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import * as repo from './notification.repository'

export const notificationRouter: Router = Router()
export const notificationEvents = new EventEmitter()

const withSite = [requireAuth, siteMiddleware, requireSiteAccess]

// SSE Endpoint for real-time notifications
notificationRouter.get('/stream', ...withSite, (req: Request, res: Response) => {
  const userId = req.user!.id
  const siteId = req.site!

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const onNotification = (notification: any) => {
    if (notification.userId === userId && notification.siteId === siteId) {
      res.write(`data: ${JSON.stringify(notification)}\n\n`)
    }
  }

  notificationEvents.on('new_notification', onNotification)

  req.on('close', () => {
    notificationEvents.off('new_notification', onNotification)
  })
})

// GET /notifications
notificationRouter.get('/', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  const notifications = await repo.findUserNotifications(req.user!.id, req.site!)
  const unreadCount = await repo.getUnreadCount(req.user!.id, req.site!)
  res.json({ success: true, data: { items: notifications, unreadCount } })
}))

// PATCH /notifications/read-all
notificationRouter.patch('/read-all', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  await repo.markAllAsRead(req.user!.id, req.site!)
  res.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca' })
}))

// PATCH /notifications/:id/read
notificationRouter.patch('/:id/read', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  await repo.markAsRead(req.params.id)
  res.json({ success: true })
}))

// Helper to send notification (can be called from other modules)
export async function sendNotification(data: {
  userId: string;
  siteId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const notification = await repo.createNotification(data)
  notificationEvents.emit('new_notification', notification)
  return notification
}
