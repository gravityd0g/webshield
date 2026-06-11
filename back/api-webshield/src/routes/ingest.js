import express from 'express'
import bearerAuth from '../middleware/bearerAuth.js'
import { insertEvent, ValidationError } from '../services/ingestService.js'

const router = express.Router()

router.post('/events', bearerAuth, async (req, res, next) => {
  try {
    await insertEvent(req.body)
    return res.status(204).end()
  } catch (e) {
    if (e instanceof ValidationError) {
      return res.status(400).json({ error: e.message })
    }
    return next(e)
  }
})

export default router
