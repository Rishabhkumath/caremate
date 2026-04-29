const rateLimit = require('express-rate-limit')

// General API limiter — raised to 500 for development
// In production you can lower this back to 200
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 2000 : 500,
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Never rate-limit health checks
    return req.path === '/health'
  }
})

// Auth limiter — keep strict but slightly relaxed for testing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 50 : 10,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// AI limiter
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'AI service rate limit exceeded, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = { authLimiter, apiLimiter, aiLimiter }