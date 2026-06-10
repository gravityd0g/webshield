import cors from 'cors'

const DEFAULT_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173'

export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
}

export function corsMiddleware() {
  const allowed = new Set(
    (process.env.ALLOWED_ORIGINS ?? DEFAULT_ORIGINS)
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  )

  return cors({
    origin(origin, callback) {
      if (!origin || allowed.has(origin)) {
        callback(null, true)
        return
      }
      callback(new Error('Origin not allowed'))
    },
    methods: ['GET'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
  })
}

export function sendSafeError(res, status, message, err) {
  console.error(message, err?.message ?? err)
  res.status(status).json({ error: message })
}
