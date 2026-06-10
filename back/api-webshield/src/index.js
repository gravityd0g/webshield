import express from 'express'
import dotenv from 'dotenv'
import dashboardRouter from './routes/dashboard.js'
import { ping } from './db.js'
import { corsMiddleware, securityHeaders, sendSafeError } from './middleware/security.js'

dotenv.config()

const app = express()
const port = Number(process.env.API_PORT ?? 3001)
const host = process.env.API_HOST ?? '127.0.0.1'

app.disable('x-powered-by')
app.use(securityHeaders)
app.use(corsMiddleware())
app.use(express.json({ limit: '8kb' }))

app.get('/api/health', async (_req, res) => {
  try {
    await ping()
    res.json({ backend: 'healthy', db: 'healthy' })
  } catch (err) {
    sendSafeError(res, 503, 'Database unavailable', err)
  }
})

app.use('/api/dashboard', dashboardRouter)

app.use((err, _req, res, next) => {
  if (err.message === 'Origin not allowed') {
    sendSafeError(res, 403, 'Forbidden', err)
    return
  }
  next(err)
})

app.listen(port, host, () => {
  console.log(`WebShield API listening on http://${host}:${port}`)
})
