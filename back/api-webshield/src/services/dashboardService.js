import { query } from '../db.js'

function deltaDirection(value) {
  if (value == null || Number(value) === 0) return 'flat'
  return Number(value) > 0 ? 'up' : 'down'
}

function formatDeltaPct(value, suffix = '%') {
  if (value == null) return '—'
  const n = Number(value)
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}${suffix}`
}

function parseJsonField(value, fallback) {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function buildKpis(kpiRow, timelineRows) {
  const buckets = timelineRows.slice(-12)
  const sparkTotal = buckets.map((r) => Number(r.valid) + Number(r.anomalous))
  const sparkBlocked = buckets.map((r) => Number(r.anomalous))
  const sparkRate = sparkTotal.map((t, i) => (t > 0 ? (sparkBlocked[i] / t) * 100 : 0))
  const sparkLatency = buckets.map((r) => Number(r.valid) + Number(r.anomalous))

  const blockRate = kpiRow.block_rate_pct != null ? `${Number(kpiRow.block_rate_pct).toFixed(1)}%` : '0%'
  const avgLatency = kpiRow.avg_latency_ms != null ? `${kpiRow.avg_latency_ms} ms` : '—'
  const p99 = kpiRow.p99_latency_ms != null ? `p99: ${kpiRow.p99_latency_ms} ms` : '—'
  const topAttack = kpiRow.top_attack_type_label ?? '—'
  const topShare = kpiRow.top_attack_type_share_pct != null
    ? `${Math.round(Number(kpiRow.top_attack_type_share_pct))}% de bloqueos`
    : '—'

  return [
    {
      id: 'total',
      label: 'Total requests',
      value: Number(kpiRow.total_requests ?? 0),
      delta: formatDeltaPct(kpiRow.total_requests_delta_pct),
      deltaDirection: deltaDirection(kpiRow.total_requests_delta_pct),
      period: 'vs ayer',
      sparkline: sparkTotal.length ? sparkTotal : null,
      accent: 'cyan',
    },
    {
      id: 'blocked',
      label: 'Bloqueados',
      value: Number(kpiRow.blocked ?? 0),
      delta: formatDeltaPct(kpiRow.blocked_delta_pct),
      deltaDirection: deltaDirection(kpiRow.blocked_delta_pct),
      period: 'vs ayer',
      sparkline: sparkBlocked.length ? sparkBlocked : null,
      accent: 'rose',
    },
    {
      id: 'rate',
      label: 'Block rate',
      value: blockRate,
      delta: '—',
      deltaDirection: 'flat',
      period: '24h',
      sparkline: sparkRate.length ? sparkRate : null,
      accent: 'amber',
    },
    {
      id: 'top-attack',
      label: 'Top attack type',
      value: topAttack,
      delta: topShare,
      deltaDirection: 'flat',
      period: '24h',
      sparkline: null,
      accent: 'violet',
    },
    {
      id: 'latency',
      label: 'Latencia WAF',
      value: avgLatency,
      delta: p99,
      deltaDirection: 'flat',
      period: 'media móvil',
      sparkline: sparkLatency.length ? sparkLatency : null,
      accent: 'blue',
    },
    {
      id: 'attackers',
      label: 'Attackers únicos',
      value: Number(kpiRow.unique_attackers ?? 0),
      delta: '24h',
      deltaDirection: 'flat',
      period: '24h',
      sparkline: null,
      accent: 'rose',
    },
  ]
}

function mapEvent(row) {
  return {
    id: row.id,
    ts: row.ts,
    ip: row.ip,
    method: row.method,
    uri: row.uri,
    verdict: row.verdict,
    action: row.action,
    score: Number(row.score ?? 0),
    attackType: row.attack_type ?? null,
    rule: row.rule ?? null,
    body: row.body ?? null,
    headers: parseJsonField(row.headers, {}),
    features: parseJsonField(row.features, []),
  }
}

export async function getDashboardData() {
  const [
    kpiRows,
    timelineRows,
    attackTypeRows,
    topIpRows,
    topEndpointRows,
    modelHealthRows,
    histogramRows,
    eventRows,
  ] = await Promise.all([
    query('SELECT * FROM v_dashboard_kpis'),
    query('SELECT label, valid, anomalous FROM v_timeline_24h'),
    query('SELECT id, label, value, color FROM v_attack_types_distribution WHERE value > 0'),
    query('SELECT ip, country, total, anomalous_pct AS anomalousPct, first_seen AS firstSeen, last_seen AS lastSeen, status FROM v_top_ips'),
    query('SELECT uri, attacks, total FROM v_top_endpoints'),
    query('SELECT predictions_per_second AS predictionsPerSecond, rolling_accuracy AS rollingAccuracy, drift_score AS driftScore, status FROM v_model_health'),
    query('SELECT bin, count FROM v_confidence_histogram ORDER BY bin'),
    query('SELECT id, ts, ip, method, uri, verdict, action, score, attack_type, rule, body, headers, features FROM v_recent_events'),
  ])

  const kpiRow = kpiRows[0] ?? {}
  const modelRow = modelHealthRows[0] ?? {}

  return {
    kpis: buildKpis(kpiRow, timelineRows),
    timeline: { buckets: timelineRows.map((r) => ({
      label: r.label,
      valid: Number(r.valid),
      anomalous: Number(r.anomalous),
    })) },
    attackTypes: attackTypeRows.map((r) => ({
      id: r.id,
      label: r.label,
      value: Number(r.value),
      color: r.color,
    })),
    topIPs: topIpRows.map((r) => ({
      ip: r.ip,
      country: r.country,
      total: Number(r.total),
      anomalousPct: Number(r.anomalousPct),
      firstSeen: r.firstSeen,
      lastSeen: r.lastSeen,
      status: r.status,
    })),
    topEndpoints: topEndpointRows.map((r) => ({
      uri: r.uri,
      attacks: Number(r.attacks),
      total: Number(r.total),
    })),
    modelHealth: {
      predictionsPerSecond: Number(modelRow.predictionsPerSecond ?? 0),
      rollingAccuracy: Number(modelRow.rollingAccuracy ?? 0),
      drift: Number(modelRow.driftScore ?? 0),
      status: modelRow.status ?? 'healthy',
      confidenceHistogram: histogramRows.map((r) => ({
        bin: r.bin,
        count: Number(r.count),
      })),
    },
    recentEvents: eventRows.map(mapEvent),
  }
}
