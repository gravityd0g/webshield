import { Router } from 'express'
import { modelHealth, modelAnalyze } from '../services/modelService.js'
import { requireAuth } from '../middleware/auth.js'
import { sendSafeError } from '../middleware/security.js'

const router = Router()

router.get('/health', requireAuth, async (_req, res) => {
  try {
    const result = await modelHealth()
    res.json(result)
  } catch (err) {
    sendSafeError(res, err.status ?? 502, 'Model API unreachable', err)
  }
})

router.post('/inspect', requireAuth, async (req, res) => {
  try {
    const { method, uri, query, body, userAgent, cookie } = req.body ?? {}
    const result = await modelAnalyze({ method, uri, query, body, userAgent, cookie })
    res.json(result)
  } catch (err) {
    sendSafeError(res, err.status ?? 502, 'Model inspection failed', err)
  }
})

export default router
