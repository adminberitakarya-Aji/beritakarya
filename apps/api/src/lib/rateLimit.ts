import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak percobaan login. Coba lagi dalam 1 menit.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak request. Coba lagi sebentar.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMITED',
      message: 'Batas penggunaan AI tercapai. Coba lagi dalam 1 jam.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
})