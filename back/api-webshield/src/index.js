import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import fs from 'node:fs'
import https from 'node:https'
import http from 'node:http'
import path from 'node:path'

import dashboardRouter from './routes/dashboard.js'
import authRouter from './routes/auth.js'
import modelRouter from './routes/model.js'
import { ping } from './db.js'
import { requireAuth } from './middleware/auth.js'
import {
  corsMiddleware,
  helmetMiddleware,
  securityHeaders,
  sendSafeError,
} from './middleware/security.js'

dotenv.config()

const app = express()
const port = Number(process.env.API_PORT ?? 3001)
const host = process.env.API_HOST ?? '127.0.0.1'

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmetMiddleware())
app.use(securityHeaders)
app.use(corsMiddleware())
app.use(cookieParser())
app.use(express.json({ limit: '32kb' }))

app.get('/api/health', async (_req, res) => {
  try {
    await ping()
    res.json({ backend: 'healthy', db: 'healthy' })
  } catch (err) {
    sendSafeError(res, 503, 'Database unavailable', err)
  }
})

app.use('/api/auth', authRouter)
app.use('/api/model', modelRouter)
app.use('/api/dashboard', requireAuth, dashboardRouter)

app.use((err, _req, res, next) => {
  if (err.message === 'Origin not allowed') {
    sendSafeError(res, 403, 'Forbidden', err)
    return
  }
  next(err)
})

function loadTls() {
  const certPath = process.env.TLS_CERT_PATH
  const keyPath = process.env.TLS_KEY_PATH
  if (!certPath || !keyPath) return null
  const certAbs = path.isAbsolute(certPath) ? certPath : path.resolve(process.cwd(), certPath)
  const keyAbs = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath)
  if (!fs.existsSync(certAbs) || !fs.existsSync(keyAbs)) {
    console.warn(`TLS cert/key no encontrado en ${certAbs} / ${keyAbs}. Falling back a HTTP.`)
    return null
  }
  return {
    cert: fs.readFileSync(certAbs),
    key: fs.readFileSync(keyAbs),
  }
}

const tls = loadTls()
const server = tls ? https.createServer(tls, app) : http.createServer(app)
const proto = tls ? 'https' : 'http'

server.listen(port, host, () => {
  console.log(`WebShield API listening on ${proto}://${host}:${port}`)
  if (!tls) {
    console.warn('⚠️  Corriendo HTTP. Para HTTPS, corre `bash scripts/gen-cert.sh` y reinicia.')
  }
})
