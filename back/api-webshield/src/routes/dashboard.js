import { Router } from 'express'
import { getDashboardData } from '../services/dashboardService.js'
import { sendSafeError } from '../middleware/security.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const data = await getDashboardData()
    res.json(data)
  } catch (err) {
    sendSafeError(res, 500, 'Failed to load dashboard data', err)
  }
})

export default router
