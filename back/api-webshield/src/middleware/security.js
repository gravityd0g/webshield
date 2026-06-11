import cors from 'cors'
import helmet from 'helmet'

const DEFAULT_ORIGINS = 'https://localhost:5173,https://127.0.0.1:5173'

export function helmetMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
}

export function securityHeaders(_req, res, next) {
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
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
  })
}

export function sendSafeError(res, status, message, err) {
  console.error(message, err?.message ?? err)
  res.status(status).json({ error: message })
}
