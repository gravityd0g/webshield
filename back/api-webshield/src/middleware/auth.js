import { verifyToken, findUserById } from '../services/authService.js'

function cookieName() {
  return process.env.COOKIE_NAME ?? 'webshield_session'
}

export async function requireAuth(req, res, next) {
  const token = req.cookies?.[cookieName()]
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
  const user = await findUserById(payload.sub).catch(() => null)
  if (!user) {
    return res.status(401).json({ error: 'User not found' })
  }
  req.user = user
  next()
}

export function setSessionCookie(res, token) {
  res.cookie(cookieName(), token, {
    httpOnly: true,
    secure: true,
    sameSite: (process.env.COOKIE_SAMESITE ?? 'Strict').toLowerCase(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

export function clearSessionCookie(res) {
  res.clearCookie(cookieName(), { path: '/' })
}
