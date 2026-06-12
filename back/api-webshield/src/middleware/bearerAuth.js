import crypto from 'node:crypto'

let cachedToken = null
let cachedBuf = null
let warnedMissing = false

function getTokenBuf() {
  const current = process.env.INGEST_API_TOKEN ?? ''
  if (current !== cachedToken) {
    cachedToken = current
    cachedBuf = current ? Buffer.from(current, 'utf8') : null
    warnedMissing = false
  }
  if (!cachedBuf && !warnedMissing) {
    console.error(
      '[bearerAuth] INGEST_API_TOKEN no configurado. /api/ingest/* responderá 503.',
    )
    warnedMissing = true
  }
  return cachedBuf
}

export default function bearerAuth(req, res, next) {
  const tokenBuf = getTokenBuf()
  if (!tokenBuf) {
    return res.status(503).json({ error: 'ingest disabled: token not configured' })
  }

  const header = req.headers['authorization'] ?? ''
  if (typeof header !== 'string') {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const match = header.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  const providedBuf = Buffer.from(match[1].trim(), 'utf8')
  if (providedBuf.length !== tokenBuf.length) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  let ok = false
  try {
    ok = crypto.timingSafeEqual(providedBuf, tokenBuf)
  } catch {
    ok = false
  }

  if (!ok) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  return next()
}
