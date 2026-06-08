// Salud del modelo: requests/seg, accuracy en ventana móvil,
// drift y un mini histograma de confianza para visualizar calibración.

const STATUS_DOT = {
  healthy: 'badge badge--ok',
  degraded: 'badge badge--warn',
  failing: 'badge badge--danger',
}

export default function ModelHealth({ data }) {
  const maxBin = Math.max(...data.confidenceHistogram.map((b) => b.count))
  return (
    <section className="panel" aria-labelledby="model-health-title">
      <header className="panel__header">
        <div>
          <h2 id="model-health-title" className="panel__title">Salud del modelo</h2>
          <p className="panel__sub">Random Forest + reglas OWASP CRS</p>
        </div>
        <span className={STATUS_DOT[data.status]}>{data.status.toUpperCase()}</span>
      </header>

      <dl className="kv">
        <div className="kv__row">
          <dt>Predicciones/seg</dt>
          <dd className="mono">{data.predictionsPerSecond}</dd>
        </div>
        <div className="kv__row">
          <dt>Accuracy (60 min)</dt>
          <dd className="mono">{(data.rollingAccuracy * 100).toFixed(1)}%</dd>
        </div>
        <div className="kv__row">
          <dt>Drift score</dt>
          <dd className="mono">{data.drift.toFixed(2)} <span className="kv__hint">menor = mejor</span></dd>
        </div>
      </dl>

      <div className="histogram" aria-label="Distribución de confianza del modelo">
        <p className="histogram__title">Distribución de confianza</p>
        <div className="histogram__bars">
          {data.confidenceHistogram.map((b, i) => (
            <div
              key={b.bin}
              className={`histogram__bar ${i < 3 ? 'histogram__bar--valid' : i > 6 ? 'histogram__bar--anom' : 'histogram__bar--mid'}`}
              style={{ height: `${(b.count / maxBin) * 100}%` }}
              title={`${b.bin}: ${b.count}`}
            ></div>
          ))}
        </div>
        <div className="histogram__axis">
          <span>valid</span>
          <span>incierto</span>
          <span>anómalo</span>
        </div>
      </div>
    </section>
  )
}
