import { Request, Response, NextFunction } from 'express'
import { metricsCollector } from '../lib/monitoring'

export function performanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - startTime
    const method = req.method
    const route = req.route?.path || req.path
    const statusCode = res.statusCode

    metricsCollector.recordRequest(
      method,
      route,
      statusCode,
      duration
    )
  })

  next()
}
