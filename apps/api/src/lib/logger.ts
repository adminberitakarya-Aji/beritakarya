import winston from 'winston'
import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { env } from './env'

const { combine, timestamp, json, colorize, printf } = winston.format

const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  const metaStr = Object.keys(meta).length
    ? '  ' + JSON.stringify(meta, null, 0)
    : ''
  return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`
})

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), json()),
  transports: [
    new winston.transports.Console({
      format: env.NODE_ENV === 'production'
        ? combine(timestamp(), json())
        : combine(colorize(), timestamp({ format: 'HH:mm:ss' }), devFormat)
    }),
    ...(env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: path.join('logs', 'app.log'),
        maxsize: 10 * 1024 * 1024,
        maxFiles: 10
      })
    ] : [])
  ]
})

/**
 * HTTP request logging middleware
 */
export function httpLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info'
    
    logger[level]({
      message:   `${req.method} ${req.path} ${res.statusCode}`,
      method:    req.method,
      path:      req.path,
      status:    res.statusCode,
      duration:  `${duration}ms`,
      requestId: req.headers['x-request-id'],
      userId:    (req as any).user?.userId,
      site:      (req as any).site,
      ip:        req.ip
    })
  })
  next()
}