import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') })

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'webshield',
  waitForConnections: true,
  connectionLimit: 4,
})

const PROTOCOL = 'HTTPS/1.1'
const HOST = 'webshield.lab.tec.local'
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']

const URIS = ['/index.html', '/api/products', '/api/login', '/search', '/dashboard', '/api/users', '/admin/config.php', '/api/comments']
const IPS = [
  { ip: '10.0.5.21', country: null },
  { ip: '192.168.1.47', country: null },
  { ip: '203.0.113.8', country: 'CL' },
  { ip: '198.51.100.15', country: 'NL' },
  { ip: '45.155.205.211', country: 'RU' },
  { ip: '91.234.99.124', country: 'UA' },
]

const DETAILED_EVENTS = [
  {
    code: 'evt-9281', agoMin: 2, verdict: 'anomalous', action: 'blocked', score: 0.94, rule: 'CRS-942100', latency: 21, ip: '192.168.1.47', country: null,
    http: { method: 'POST', uri: '/api/login', ua: 'curl/8.4.0', cl: 52, ct: 'application/json', post: `{"username":"admin","password":"' OR 1=1 --"}`, get: null },
    ml: { sql: 1, xss: 0, trav: 0, enc: 0, admin: 1, eq: 2, quote: 4, comment: 1, pct: 0, dot: 0, slash: 1, lenUri: 10, lenGet: 0, lenPost: 52 },
    features: [['has_sql_kw', 1, 0.41], ['cnt_quote', 4, 0.18], ['cnt_comment', 1, 0.14], ['len_POST_Data', 52, 0.09], ['has_admin', 1, 0.07]],
  },
  {
    code: 'evt-9280', agoMin: 4, verdict: 'valid', action: 'allowed', score: 0.02, rule: null, latency: 18, ip: '10.0.5.21', country: null,
    http: { method: 'GET', uri: '/index.html', ua: 'Mozilla/5.0', cl: 0, ct: null, post: null, get: null },
    ml: { sql: 0, xss: 0, trav: 0, enc: 0, admin: 0, eq: 0, quote: 0, comment: 0, pct: 0, dot: 0, slash: 1, lenUri: 11, lenGet: 0, lenPost: 0 },
    features: [],
  },
  {
    code: 'evt-9279', agoMin: 6, verdict: 'anomalous', action: 'blocked', score: 0.89, rule: 'CRS-941100', latency: 24, ip: '203.0.113.8', country: 'CL',
    http: { method: 'PATCH', uri: '/search', ua: 'sqlmap/1.7.11', cl: 0, ct: null, post: null, get: 'q=%3Cscript%3Ealert(1)%3C%2Fscript%3E' },
    ml: { sql: 0, xss: 1, trav: 0, enc: 1, admin: 0, eq: 1, quote: 0, comment: 0, pct: 8, dot: 0, slash: 1, lenUri: 7, lenGet: 44, lenPost: 0 },
    features: [['has_xss_kw', 1, 0.38], ['has_encoded', 1, 0.22], ['cnt_percent', 8, 0.13], ['len_GET_Query', 44, 0.09]],
  },
  {
    code: 'evt-9278', agoMin: 8, verdict: 'valid', action: 'allowed', score: 0.04, rule: null, latency: 19, ip: '10.0.5.21', country: null,
    http: { method: 'HEAD', uri: '/api/products', ua: 'Mozilla/5.0', cl: 0, ct: null, post: null, get: 'category=electronics' },
    ml: { sql: 0, xss: 0, trav: 0, enc: 0, admin: 0, eq: 1, quote: 0, comment: 0, pct: 0, dot: 0, slash: 2, lenUri: 13, lenGet: 20, lenPost: 0 },
    features: [],
  },
  {
    code: 'evt-9277', agoMin: 10, verdict: 'anomalous', action: 'blocked', score: 0.97, rule: 'CRS-930100', latency: 22, ip: '198.51.100.15', country: 'NL',
    http: { method: 'OPTIONS', uri: '/../../../../etc/passwd', ua: 'python-requests/2.31.0', cl: 0, ct: null, post: null, get: null },
    ml: { sql: 0, xss: 0, trav: 1, enc: 0, admin: 0, eq: 0, quote: 0, comment: 0, pct: 0, dot: 8, slash: 5, lenUri: 22, lenGet: 0, lenPost: 0 },
    features: [['has_traversal', 1, 0.52], ['cnt_dot', 8, 0.24], ['cnt_slash', 5, 0.12]],
  },
  {
    code: 'evt-9275', agoMin: 14, verdict: 'anomalous', action: 'flagged', score: 0.62, rule: 'CRS-932100', latency: 25, ip: '203.0.113.8', country: 'CL',
    http: { method: 'PUT', uri: '/admin/config.php', ua: 'Mozilla/5.0', cl: 0, ct: null, post: null, get: null },
    ml: { sql: 0, xss: 0, trav: 0, enc: 0, admin: 1, eq: 0, quote: 0, comment: 0, pct: 0, dot: 2, slash: 2, lenUri: 17, lenGet: 0, lenPost: 0 },
    features: [],
  },
  {
    code: 'evt-9273', agoMin: 18, verdict: 'anomalous', action: 'blocked', score: 0.81, rule: 'CRS-913100', latency: 23, ip: '45.155.205.211', country: 'RU',
    http: { method: 'GET', uri: '/wp-admin/setup-config.php', ua: 'Mozilla/5.0 (compatible; Nmap NSE)', cl: 0, ct: null, post: null, get: 'step=1' },
    ml: { sql: 0, xss: 0, trav: 0, enc: 0, admin: 1, eq: 1, quote: 0, comment: 0, pct: 0, dot: 2, slash: 3, lenUri: 32, lenGet: 6, lenPost: 0 },
    features: [],
  },
  {
    code: 'evt-9272', agoMin: 20, verdict: 'anomalous', action: 'blocked', score: 0.91, rule: 'CRS-942110', latency: 20, ip: '192.168.1.47', country: null,
    http: { method: 'DELETE', uri: '/api/user/1%20OR%201%3D1', ua: 'curl/8.4.0', cl: 0, ct: null, post: null, get: null },
    ml: { sql: 1, xss: 0, trav: 0, enc: 1, admin: 0, eq: 0, quote: 0, comment: 0, pct: 4, dot: 0, slash: 3, lenUri: 22, lenGet: 0, lenPost: 0 },
    features: [['has_sql_kw', 1, 0.39], ['has_encoded', 1, 0.21], ['cnt_percent', 4, 0.11]],
  },
]

async function exec(sql, params = []) {
  await pool.execute(sql, params)
}

async function getEventId(code) {
  const [[row]] = await pool.execute('SELECT event_id FROM request_events WHERE event_code = ?', [code])
  return row?.event_id
}

async function insertEventBundle(evt) {
  await exec(
    `INSERT INTO request_events (event_code, detected_at, verdict, action, confidence_score, waf_rule, latency_ms, client_ip, client_country)
     VALUES (?, NOW() - INTERVAL ? MINUTE, ?, ?, ?, ?, ?, ?, ?)`,
    [evt.code, evt.agoMin, evt.verdict, evt.action, evt.score, evt.rule, evt.latency, evt.ip, evt.country],
  )

  const eventId = await getEventId(evt.code)
  const h = evt.http
  const headers = JSON.stringify({
    Host: HOST,
    'User-Agent': h.ua,
    'X-Forwarded-Proto': 'https',
    ...(h.ct ? { 'Content-Type': h.ct } : {}),
    ...(h.cl ? { 'Content-Length': String(h.cl) } : {}),
  })

  await exec(
    `INSERT INTO request_http (event_id, http_method, uri, host_header, \`host\`, user_agent, content_length, content_type, post_data, get_query, request_headers)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [eventId, h.method, h.uri, PROTOCOL, HOST, h.ua, h.cl, h.ct, h.post, h.get, headers],
  )

  const m = evt.ml
  await exec(
    `INSERT INTO request_ml_indicators (
      event_id, has_sql_kw, has_xss_kw, has_traversal, has_encoded, has_admin,
      cnt_equal, cnt_quote, cnt_comment, cnt_percent, cnt_dot, cnt_slash,
      len_uri, len_get_query, len_post_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [eventId, m.sql, m.xss, m.trav, m.enc, m.admin, m.eq, m.quote, m.comment, m.pct, m.dot, m.slash, m.lenUri, m.lenGet, m.lenPost],
  )

  for (const [name, value, contribution] of evt.features) {
    await exec(
      'INSERT INTO request_event_features (event_id, feature_name, feature_value, contribution) VALUES (?, ?, ?, ?)',
      [eventId, name, value, contribution],
    )
  }
}

async function insertSimpleEvent({ code, agoMin, agoHour = 0, verdict, action, score, rule, latency, ip, country, uri, method = 'GET' }) {
  await exec(
    `INSERT INTO request_events (event_code, detected_at, verdict, action, confidence_score, waf_rule, latency_ms, client_ip, client_country)
     VALUES (?, NOW() - INTERVAL ? HOUR - INTERVAL ? MINUTE, ?, ?, ?, ?, ?, ?, ?)`,
    [code, agoHour, agoMin, verdict, action, score, rule, latency, ip, country],
  )

  const eventId = await getEventId(code)
  const isAnom = verdict === 'anomalous'

  await exec(
    `INSERT INTO request_http (event_id, http_method, uri, host_header, \`host\`, user_agent, content_length, request_headers)
     VALUES (?, ?, ?, ?, ?, 'Mozilla/5.0', 0, ?)`,
    [eventId, method, uri, PROTOCOL, HOST, JSON.stringify({ Host: HOST, 'User-Agent': 'Mozilla/5.0', 'X-Forwarded-Proto': 'https' })],
  )

  await exec(
    `INSERT INTO request_ml_indicators (
      event_id, has_sql_kw, has_xss_kw, has_traversal, has_encoded, has_admin,
      cnt_equal, cnt_quote, cnt_comment, cnt_percent, cnt_dot, cnt_slash, len_uri, len_get_query, len_post_data
    ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 1, ?, 0, 0)`,
    [
      eventId,
      isAnom && uri.includes('login') ? 1 : 0,
      isAnom && uri.includes('search') ? 1 : 0,
      isAnom && uri.includes('admin') ? 1 : 0,
      0,
      isAnom && uri.includes('admin') ? 1 : 0,
      uri.length,
    ],
  )
}

async function clearSampleData() {
  await exec("DELETE FROM request_events WHERE event_code LIKE 'evt-%' OR event_code LIKE 'gen-%'")
}

async function seedModelHealth() {
  await exec(
    `INSERT INTO model_health_snapshots (predictions_per_second, rolling_accuracy, drift_score, status)
     VALUES (142, 0.918, 0.07, 'healthy')`,
  )
}

async function seedHourlyTraffic() {
  let code = 9000
  for (let hour = 0; hour < 24; hour += 1) {
    const validCount = 12 + (hour % 5) * 3
    const anomCount = 2 + (hour % 4)
    for (let i = 0; i < validCount + anomCount; i += 1) {
      code += 1
      const isAnom = i >= validCount
      const ip = IPS[code % IPS.length]
      const uri = URIS[code % URIS.length]
      await insertSimpleEvent({
        code: `gen-${code}`,
        agoHour: 23 - hour,
        agoMin: Math.floor((i / (validCount + anomCount)) * 59),
        verdict: isAnom ? 'anomalous' : 'valid',
        action: isAnom ? (code % 5 === 0 ? 'flagged' : 'blocked') : 'allowed',
        score: isAnom ? 0.55 + (code % 40) / 100 : 0.02 + (code % 8) / 100,
        rule: isAnom ? `CRS-94${2100 + (code % 20)}` : null,
        latency: 18 + (code % 12),
        ip: ip.ip,
        country: ip.country,
        uri,
        method: HTTP_METHODS[code % HTTP_METHODS.length],
      })
    }
  }
}

async function seedConfidenceSpread() {
  const bins = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95]
  let code = 8000
  for (const score of bins) {
    for (let n = 0; n < 8; n += 1) {
      code += 1
      const ip = IPS[n % IPS.length]
      await insertSimpleEvent({
        code: `gen-${code}`,
        agoMin: 30 + (code % 90),
        verdict: 'valid',
        action: 'allowed',
        score,
        rule: null,
        latency: 20,
        ip: ip.ip,
        country: ip.country,
        uri: '/api/health',
        method: HTTP_METHODS[code % HTTP_METHODS.length],
      })
    }
  }
}

async function main() {
  console.log('Clearing old sample events…')
  await clearSampleData()

  console.log('Seeding model health…')
  await seedModelHealth()

  console.log('Seeding 8 detailed events…')
  for (const evt of DETAILED_EVENTS) {
    await insertEventBundle(evt)
  }

  console.log('Generating 24h traffic…')
  await seedHourlyTraffic()

  console.log('Generating confidence histogram…')
  await seedConfidenceSpread()

  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM request_events WHERE detected_at >= NOW() - INTERVAL 24 HOUR',
  )

  console.log(`Done. ${total} events in the last 24h. Refresh http://localhost:5173/`)
  await pool.end()
}

main().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
