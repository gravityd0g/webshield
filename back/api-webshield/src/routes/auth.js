import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { registerUser, verifyPassword, signToken } from '../services/authService.js'
import { requireAuth, setSessionCookie, clearSessionCookie } from '../middleware/auth.js'
import { sendSafeError } from '../middleware/security.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 255
}

function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 128
}

function isValidName(value) {
  return typeof value === 'string' && value.trim().length >= 1 && value.length <= 128
}

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body ?? {}
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email' })
    if (!isValidPassword(password)) return res.status(400).json({ error: 'Password must be 8-128 chars' })
    if (!isValidName(name)) return res.status(400).json({ error: 'Invalid name' })

    const user = await registerUser({ email, password, displayName: name.trim() })
    const token = signToken(user)
    setSessionCookie(res, token)
    res.status(201).json({ user })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    sendSafeError(res, 500, 'Registration failed', err)
  }
})

router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body ?? {}
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email' })
    if (!isValidPassword(password)) return res.status(400).json({ error: 'Invalid password' })

    const user = await verifyPassword({ email, password })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const token = signToken(user)
    setSessionCookie(res, token)
    res.json({ user })
  } catch (err) {
    sendSafeError(res, 500, 'Login failed', err)
  }
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

router.post('/logout', (req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

export default router
