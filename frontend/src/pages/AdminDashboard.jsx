import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getDashboardStats, getFigureUrl, getPerformanceSummary, getUsabilitySummary } from '../services/api'

const fmt = (n, decimals = 0) => n != null ? Number(n).toLocaleString('en-GB', { maximumFractionDigits: decimals }) : '—'

function StatCard({ label, value, unit = '', sub, color = 'var(--c-indigo)' }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 14, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{label}</p>
      <p style={{ fontFamily: 'Sora', fontSize: '1.75rem', fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}<span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--c-text-4)', marginLeft: 3 }}>{unit}</span></p>
      {sub && <p style={{ fontSize: '0.75rem', color: 'var(--c-text-4)' }}>{sub}</p>}
    </motion.div>
  )
}

function ChartPanel({ title, filename, sub }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--c-border)' }}>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--c-text)' }}>{title}</p>
        {sub && <p style={{ fontSize: '0.75rem', color: 'var(--c-text-4)', marginTop: 2 }}>{sub}</p>}
      </div>
      <div style={{ background: '#FAFAFA', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <img src={getFigureUrl(filename)} alt={title}
          style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', display: 'block' }}
          onError={e => { e.target.parentNode.innerHTML = '<p style="color:#9CA3AF;font-size:0.8rem;padding:40px 0">Chart unavailable — backend offline</p>' }} />
      </div>
    </div>
  )
}

const METRIC_TABLE = [
  { metric: 'Algorithm', value: 'Content-Based Filtering' },
  { metric: 'Similarity Metric', value: 'Cosine Similarity' },
  { metric: 'Normalisation', value: 'MinMaxScaler' },
  { metric: 'Features Used', value: '6 (rent, bedrooms, bathrooms, size, distance, station count)' },
  { metric: 'Train/Test Split', value: '80% / 20%' },
  { metric: 'Dataset', value: 'London Rental Properties (3,406 records)' },
  { metric: 'Precision@5', value: '0.622 — 62.2% of top-5 results match user preferences' },
  { metric: 'Recall@5', value: '0.497 — 49.7% of all relevant properties surfaced in top-5' },
  { metric: 'Intra-list Diversity', value: '2.31 / 5.0 — moderate variety across recommended properties' },
]

// Thesis usability study results (5 participants, conducted 2025)
const USABILITY_TASKS = [
  { task: 'Search and filter properties', success: 5, total: 5 },
  { task: 'Get AI recommendations', success: 5, total: 5 },
  { task: 'Compare AI vs query methods', success: 4, total: 5 },
  { task: 'View property detail page', success: 5, total: 5 },
  { task: 'Register and manage profile', success: 4, total: 5 },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [usability, setUsability] = useState(null)
  const [performance, setPerformance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([getDashboardStats(), getUsabilitySummary(), getPerformanceSummary()])
      .then(([sr, ur, pr]) => {
        if (sr.status === 'fulfilled') setStats(sr.value.data)
        if (ur.status === 'fulfilled') setUsability(ur.value.data)
        if (pr.status === 'fulfilled') setPerformance(pr.value.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ paddingTop: 60, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg)' }}>
      <p style={{ color: 'var(--c-text-4)' }}>Loading dashboard…</p>
    </div>
  )

  return (
    <div className="page-shell">

      {/* ── Hero ── */}
      <section className="page-hero">
        <div className="container" style={{ maxWidth: 1100, position: 'relative', zIndex: 1 }}>
          <div style={{ padding: '44px 0 40px' }}>
            <span className="eyebrow-pill">Admin · AI Dashboard</span>
            <h1 className="heading-display" style={{ marginTop: 18, marginBottom: 12 }}>
              AI Model Dashboard
            </h1>
            <p className="hero-kicker">
              Research metrics, model evaluation, and dataset analytics — all in one place.
            </p>
            <div className="metric-strip" style={{ marginTop: 28 }}>
              {[
                { val: fmt(stats?.total_properties), sub: 'properties' },
                { val: stats?.precision_at_5 ?? '0.622', sub: 'precision@5' },
                { val: stats?.recall_at_5 ?? '0.497', sub: 'recall@5' },
                { val: fmt(stats?.avg_diversity, 2) || '2.31', sub: 'diversity / 5' },
                { val: '6', sub: 'model features' },
                { val: '74.5', sub: 'SUS score' },
              ].map(item => (
                <div key={item.sub} className="metric-tile">
                  <div className="metric-value">{item.val}</div>
                  <div className="metric-label">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="page-content">
        <div className="container" style={{ maxWidth: 1100 }}>

        {/* Stats — Row 1: Dataset */}
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Dataset Overview</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }} className="stat-grid">
          <StatCard label="Total Properties" value={fmt(stats?.total_properties)} />
          <StatCard label="Average Rent" value={`£${fmt(stats?.average_rent)}`} sub="per month" color="#0EA5E9" />
          <StatCard label="Max Rent" value={`£${fmt(stats?.max_rent)}`} />
          <StatCard label="Min Rent" value={`£${fmt(stats?.min_rent)}`} color="#059669" />
        </div>

        {/* Stats — Row 2: AI Model */}
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Model Evaluation</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }} className="stat-grid-5">
          <StatCard label="Precision@5" value={stats?.precision_at_5 ?? '—'} sub="How often top-5 are relevant" color="var(--c-indigo)" />
          <StatCard label="Recall@5" value={stats?.recall_at_5 ?? '—'} sub="Coverage of relevant results" color="#7C3AED" />
          <StatCard label="Avg Diversity" value={fmt(stats?.avg_diversity, 2)} sub="Intra-list variety score" color="#0EA5E9" />
          <StatCard label="Gini Exposure" value={stats?.gini_exposure != null ? fmt(stats.gini_exposure, 3) : '—'} sub="0 = fair, 1 = unfair" color={stats?.gini_exposure > 0.5 ? '#DC2626' : '#059669'} />
          <StatCard label="Never Recommended" value={stats?.never_recommended_pct != null ? `${fmt(stats.never_recommended_pct, 1)}%` : '—'} sub="Properties with 0 exposure" color="#D97706" />
        </div>

        {/* Charts */}
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Dataset Distributions</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }} className="chart-grid">
          <ChartPanel title="Rent Distribution" filename="rent_distribution.png" sub="Monthly rent frequency histogram" />
          <ChartPanel title="Bedroom Distribution" filename="bedroom_distribution.png" sub="Bedroom count frequency" />
          <ChartPanel title="Property Types" filename="property_type_distribution.png" sub="Distribution across 27 property types" />
          <ChartPanel title="Recommendation Exposure" filename="exposure_distribution.png" sub="Frequency properties appear in top-5 results" />
        </div>

        {/* Usability Evaluation */}
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Usability Evaluation — Study Results</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }} className="stat-grid">
          <StatCard label="Participants" value="5" sub="Usability study (2025)" color="var(--c-indigo)" />
          <StatCard label="Avg Completion" value="89%" sub="Across all 5 tasks" color="#059669" />
          <StatCard label="SUS Score" value="74.5" sub="System Usability Scale / 100" color="#0EA5E9" />
          <StatCard label="SUS Grade" value="C+" sub="Acceptability: Good" color="#7C3AED" />
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 14, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--c-text)' }}>Task Completion Breakdown</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--c-text-4)', marginTop: 2 }}>5 participants · SUS = 74.5 ("Good" — acceptability threshold ≥ 70)</p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--c-surface-2)' }}>
                <th style={{ padding: '11px 18px', textAlign: 'left', fontWeight: 700, fontSize: '0.8rem', color: 'var(--c-text-3)' }}>Task</th>
                <th style={{ padding: '11px 18px', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--c-text-3)' }}>Successes</th>
                <th style={{ padding: '11px 18px', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--c-text-3)' }}>Rate</th>
                <th style={{ padding: '11px 18px', textAlign: 'left', fontWeight: 700, fontSize: '0.8rem', color: 'var(--c-text-3)' }}>Bar</th>
              </tr>
            </thead>
            <tbody>
              {USABILITY_TASKS.map((t, i) => {
                const pct = Math.round(t.success / t.total * 100)
                const barColor = pct === 100 ? '#10B981' : pct >= 80 ? '#F59E0B' : '#EF4444'
                return (
                  <tr key={t.task} style={{ borderTop: '1px solid var(--c-border)', background: i % 2 === 0 ? '#fff' : 'var(--c-surface)' }}>
                    <td style={{ padding: '11px 18px', fontSize: '0.875rem', color: 'var(--c-text-2)' }}>{t.task}</td>
                    <td style={{ padding: '11px 18px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--c-text-3)' }}>{t.success}/{t.total}</td>
                    <td style={{ padding: '11px 18px', textAlign: 'center', fontWeight: 700, fontSize: '0.875rem', color: barColor }}>{pct}%</td>
                    <td style={{ padding: '11px 18px' }}>
                      <div style={{ background: '#F3F4F6', borderRadius: 4, height: 8, width: '100%', maxWidth: 180 }}>
                        <div style={{ background: barColor, borderRadius: 4, height: 8, width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>API Performance</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }} className="stat-grid">
          <StatCard label="Tracked Requests" value={performance?.request_count ?? 0} sub={`Rolling window: ${performance?.window_size ?? 0}`} color="var(--c-indigo)" />
          <StatCard label="Avg Response" value={fmt(performance?.avg_response_ms, 2)} unit="ms" sub="Across recent API calls" color="#0EA5E9" />
          <StatCard label="Min Response" value={fmt(performance?.min_response_ms, 2)} unit="ms" sub="Fastest recorded" color="#059669" />
          <StatCard label="Max Response" value={fmt(performance?.max_response_ms, 2)} unit="ms" sub="Slowest recorded" color="#D97706" />
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 14, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--c-text)' }}>Per-route response times</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--c-text-4)', marginTop: 2 }}>Useful for the prototype performance evaluation section.</p>
          </div>
          {performance?.routes?.length ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fff' }}>
                  <th style={perfHeadStyle}>Route</th>
                  <th style={perfHeadStyle}>Requests</th>
                  <th style={perfHeadStyle}>Avg (ms)</th>
                  <th style={perfHeadStyle}>Max (ms)</th>
                </tr>
              </thead>
              <tbody>
                {performance.routes.map((row, index) => (
                  <tr key={row.route} style={{ borderTop: '1px solid var(--c-border)', background: index % 2 === 0 ? '#fff' : 'var(--c-surface)' }}>
                    <td style={perfCellStyle}>{row.route}</td>
                    <td style={perfCellStyle}>{row.count}</td>
                    <td style={perfCellStyle}>{fmt(row.avg_response_ms, 2)}</td>
                    <td style={perfCellStyle}>{fmt(row.max_response_ms, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '18px', color: 'var(--c-text-4)', fontSize: '0.875rem' }}>No API calls have been recorded yet in this server session.</div>
          )}
        </div>

        {/* AI Model Summary Table */}
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>AI Model Summary</p>
        <div style={{ background: '#fff', border: '1px solid var(--c-border)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--c-surface-2)' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 700, fontSize: '0.8rem', color: 'var(--c-text-3)' }}>Parameter</th>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontWeight: 700, fontSize: '0.8rem', color: 'var(--c-text-3)' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {METRIC_TABLE.map((row, i) => (
                <tr key={row.metric} style={{ borderTop: '1px solid var(--c-border)', background: i % 2 === 0 ? '#fff' : 'var(--c-surface)' }}>
                  <td style={{ padding: '11px 20px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-text-2)' }}>{row.metric}</td>
                  <td style={{ padding: '11px 20px', fontSize: '0.875rem', color: 'var(--c-text-3)', fontFamily: row.metric.includes('Algorithm') || row.metric.includes('Metric') ? 'inherit' : 'monospace' }}>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      <style>{`
        @media(max-width:900px){.stat-grid{grid-template-columns:repeat(2,1fr)!important;}.stat-grid-5{grid-template-columns:repeat(2,1fr)!important;}.chart-grid{grid-template-columns:1fr!important;}}
        @media(max-width:600px){.stat-grid{grid-template-columns:1fr!important;}}
      `}</style>
    </div>
  )
}

const perfHeadStyle = {
  padding: '12px 18px',
  textAlign: 'left',
  fontWeight: 700,
  fontSize: '0.8rem',
  color: 'var(--c-text-3)',
}

const perfCellStyle = {
  padding: '11px 18px',
  fontSize: '0.875rem',
  color: 'var(--c-text-3)',
}
