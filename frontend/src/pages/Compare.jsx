import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, Search, Target, ArrowRight, Info } from 'lucide-react'
import { compareRecommendations } from '../services/api'

const lbl = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text-3)', marginBottom: 6 }

// Small comparison row showing property value vs user preference
function PrefRow({ label, prefVal, propVal, match }) {
  const color = match === 'exact' ? '#059669' : match === 'near' ? '#D97706' : '#DC2626'
  const bg = match === 'exact' ? '#ECFDF5' : match === 'near' ? '#FFFBEB' : '#FEF2F2'
  const border = match === 'exact' ? '#A7F3D0' : match === 'near' ? '#FDE68A' : '#FECACA'
  const icon = match === 'exact' ? '✓' : match === 'near' ? '≈' : '✗'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--c-text-4)', width: 58, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.7rem', color: 'var(--c-text-3)' }}>You: <strong>{prefVal}</strong></span>
      <span style={{ fontSize: '0.65rem', color: 'var(--c-text-4)' }}>→</span>
      <span style={{ fontSize: '0.7rem', color: 'var(--c-text-3)' }}>This: <strong>{propVal}</strong></span>
      <span style={{ marginLeft: 'auto', background: bg, border: `1px solid ${border}`, color, borderRadius: 10, padding: '1px 6px', fontSize: '0.65rem', fontWeight: 700 }}>{icon}</span>
    </div>
  )
}

function AICard({ rec, index, prefs }) {
  const scoreColor = rec.similarity_score >= 80 ? '#10B981' : rec.similarity_score >= 60 ? '#F59E0B' : '#0F766E'
  const scoreBg = rec.similarity_score >= 80 ? '#ECFDF5' : rec.similarity_score >= 60 ? '#FFFBEB' : '#CCFBF1'
  const scoreBorder = rec.similarity_score >= 80 ? '#A7F3D0' : rec.similarity_score >= 60 ? '#FDE68A' : '#99F6E4'
  const rentDiff = rec.rent - prefs.budget
  const rentMatch = rentDiff <= 0 ? 'exact' : rentDiff <= prefs.budget * 0.15 ? 'near' : 'miss'
  const bedMatch = rec.bedrooms == prefs.bedrooms ? 'exact' : Math.abs(rec.bedrooms - prefs.bedrooms) === 1 ? 'near' : 'miss'
  const bathMatch = rec.bathrooms == prefs.bathrooms ? 'exact' : Math.abs(rec.bathrooms - prefs.bathrooms) === 1 ? 'near' : 'miss'
  const dist = rec.avg_distance_to_nearest_station
  const distMatch = dist <= prefs.max_distance ? 'exact' : dist <= prefs.max_distance + 0.5 ? 'near' : 'miss'
  const rentLabel = rentDiff <= 0 ? `£${Math.abs(rentDiff).toLocaleString()} under` : `£${rentDiff.toLocaleString()} over`
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="surface-subtle" style={{ padding: '16px', marginBottom: 10, border: '1px solid var(--c-border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--c-text)', marginBottom: 2, lineHeight: 1.3 }}>{rec.address}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>{rec.property_type}{rec.furnish_type ? ` · ${rec.furnish_type}` : ''}</p>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0, background: scoreBg, border: `1px solid ${scoreBorder}`, borderRadius: 10, padding: '6px 10px' }}>
          <p style={{ fontWeight: 800, fontSize: '1.1rem', color: scoreColor, lineHeight: 1 }}>{rec.similarity_score}%</p>
          <p style={{ fontSize: '0.62rem', color: scoreColor, opacity: 0.8, fontWeight: 600 }}>AI match</p>
        </div>
      </div>

      {/* Rent */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--c-indigo)' }}>£{rec.rent?.toLocaleString()}<span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--c-text-4)' }}>/mo</span></p>
        <span style={{ fontSize: '0.72rem', color: rentMatch === 'miss' ? '#DC2626' : '#059669', fontWeight: 600 }}>({rentLabel} budget)</span>
      </div>

      {/* Preference comparison grid */}
      <div style={{ background: 'var(--c-bg)', borderRadius: 8, padding: '10px 10px 6px', marginBottom: 10 }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>How it matches your preferences</p>
        <PrefRow label="Bedrooms" prefVal={prefs.bedrooms} propVal={rec.bedrooms ?? '?'} match={bedMatch} />
        <PrefRow label="Bathrooms" prefVal={prefs.bathrooms} propVal={rec.bathrooms ?? '?'} match={bathMatch} />
        <PrefRow label="Station" prefVal={`≤${prefs.max_distance}km`} propVal={dist != null ? `${dist}km` : '?'} match={distMatch} />
      </div>

      {/* AI explanation chips */}
      <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Why AI selected this</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        {rec.explanation?.map((e, i) => (
          <span key={i} style={{ padding: '2px 8px', borderRadius: 20, background: '#ECFDF5', color: '#059669', fontSize: '0.68rem', fontWeight: 600, border: '1px solid #D1FAE5' }}>✓ {e}</span>
        ))}
      </div>

      <Link to={`/properties/${rec.id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>View full details →</Link>
    </motion.div>
  )
}

function QueryCard({ rec, index, prefs }) {
  const isRelaxed = rec.matched_criteria?.some(c => c.includes('Relaxed') || c.includes('Near'))
  const strictCriteria = rec.matched_criteria?.filter(c => !c.includes('Relaxed') && !c.includes('Near')) || []
  const relaxedCriteria = rec.matched_criteria?.filter(c => c.includes('Near') || c.includes('Relaxed')) || []
  const rentDiff = rec.rent - prefs.budget
  const rentLabel = rentDiff <= 0 ? `£${Math.abs(rentDiff).toLocaleString()} under budget` : `£${rentDiff.toLocaleString()} over budget`
  const rentColor = rentDiff <= 0 ? '#059669' : rentDiff <= prefs.budget * 0.15 ? '#D97706' : '#DC2626'
  const dist = rec.avg_distance_to_nearest_station
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="surface-subtle" style={{ padding: '16px', marginBottom: 10, border: `1px solid ${isRelaxed ? '#FDE68A' : 'var(--c-border)'}`, background: isRelaxed ? '#FFFDF5' : undefined }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--c-text)', marginBottom: 2, lineHeight: 1.3 }}>{rec.address}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--c-text-3)' }}>{rec.property_type} · {rec.bedrooms}bed · {rec.bathrooms}bath{dist != null ? ` · ${dist}km` : ''}</p>
        </div>
        {isRelaxed
          ? <span style={{ flexShrink: 0, background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', borderRadius: 10, padding: '4px 8px', fontSize: '0.65rem', fontWeight: 700 }}>Near match</span>
          : <span style={{ flexShrink: 0, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', borderRadius: 10, padding: '4px 8px', fontSize: '0.65rem', fontWeight: 700 }}>Exact match</span>
        }
      </div>

      {/* Rent */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0284C7' }}>£{rec.rent?.toLocaleString()}<span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--c-text-4)' }}>/mo</span></p>
        <span style={{ fontSize: '0.72rem', color: rentColor, fontWeight: 600 }}>({rentLabel})</span>
      </div>

      {/* Matched criteria */}
      {strictCriteria.length > 0 && (
        <div style={{ marginBottom: relaxedCriteria.length > 0 ? 6 : 10 }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Criteria matched exactly</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {strictCriteria.map((c, i) => (
              <span key={i} style={{ padding: '2px 8px', borderRadius: 20, background: '#ECFDF5', color: '#059669', fontSize: '0.68rem', fontWeight: 600, border: '1px solid #D1FAE5' }}>✓ {c}</span>
            ))}
          </div>
        </div>
      )}
      {relaxedCriteria.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Near match (relaxed criteria)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {relaxedCriteria.map((c, i) => (
              <span key={i} style={{ padding: '2px 8px', borderRadius: 20, background: '#FFFBEB', color: '#92400E', fontSize: '0.68rem', fontWeight: 600, border: '1px solid #FDE68A' }}>≈ {c}</span>
            ))}
          </div>
        </div>
      )}

      <Link to={`/properties/${rec.id}`} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>View full details →</Link>
    </motion.div>
  )
}

export default function ComparePage() {
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [form, setForm] = useState({
    budget: Number(sp.get('budget') || 2500),
    bedrooms: Number(sp.get('bedrooms') || 2),
    bathrooms: Number(sp.get('bathrooms') || 1),
    max_distance: Number(sp.get('max_distance') || 1.0),
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      setSp({
        budget: String(form.budget),
        bedrooms: String(form.bedrooms),
        bathrooms: String(form.bathrooms),
        max_distance: String(form.max_distance),
      })
      const res = await compareRecommendations(form)
      setResult(res.data)
    } catch { setError('Could not fetch comparison. Ensure the backend is running.') }
    finally { setLoading(false) }
  }

  const summary = result?.summary

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="container" style={{ maxWidth: 1100 }}>
          <div className="page-hero-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 0.9fr)' }}>
            <div>
              <span className="eyebrow-pill"><Target size={12} /> Research Comparison</span>
              <h1 className="heading-display" style={{ marginTop: 18, marginBottom: 14 }}>Compare AI ranking against strict query filtering.</h1>
              <p className="hero-kicker">
                Use one preference set to see where similarity ranking outperforms exact-match logic.
              </p>
            </div>
            <div className="hero-side-card">
              <div className="metric-strip" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <div className="metric-tile"><div className="metric-value">AI</div><div className="metric-label">cosine similarity ranking</div></div>
                <div className="metric-tile"><div className="metric-value">Query</div><div className="metric-label">exact criteria filter</div></div>
              </div>
              <div className="flow-note" style={{ marginTop: 12 }}>
                Same inputs, two methods, immediate overlap and gap visibility.
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="page-content">
        <div className="container" style={{ maxWidth: 1100, padding: '0 24px 80px' }}>
          <div className="soft-panel" style={{ padding: '24px', marginBottom: 28 }}>
            <form onSubmit={submit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }} className="compare-form-grid">
                <div>
                  <label style={lbl}>Max Budget (£/mo)</label>
                  <input type="number" className="input" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: +e.target.value }))} min="500" max="20000" required />
                </div>
                <div>
                  <label style={lbl}>Bedrooms</label>
                  <input type="number" className="input" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: +e.target.value }))} min="1" max="10" required />
                </div>
                <div>
                  <label style={lbl}>Bathrooms</label>
                  <input type="number" className="input" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: +e.target.value }))} min="1" max="10" required />
                </div>
                <div>
                  <label style={lbl}>Max Station Distance (km)</label>
                  <input type="number" step="0.1" className="input" value={form.max_distance} onChange={e => setForm(f => ({ ...f, max_distance: +e.target.value }))} min="0.1" max="15" required />
                </div>
              </div>
              {error && <p style={{ fontSize: '0.875rem', color: 'var(--c-red)', marginBottom: 12 }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                {loading ? <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin .65s linear infinite' }} /> : <><Search size={15} /> Compare Both Methods</>}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginLeft: 10 }}
                onClick={() => navigate(`/recommend?budget=${form.budget}&bedrooms=${form.bedrooms}&bathrooms=${form.bathrooms}&max_distance=${form.max_distance}`)}
              >
                Run AI-only view
              </button>
            </form>
          </div>

          {result && (
            <>
              {summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }} className="summary-grid">
                  {[
                    { label: 'AI Found', val: summary.ai_count, col: 'var(--c-indigo)', bg: 'var(--c-indigo-light)' },
                    { label: 'Query Found', val: summary.query_count, col: '#0EA5E9', bg: '#F0F9FF' },
                    { label: 'Results Overlap', val: summary.overlap_count, col: '#059669', bg: '#ECFDF5' },
                    { label: 'Overlap Rate', val: `${summary.overlap_rate_pct ?? 0}%`, col: '#0F766E', bg: '#CCFBF1' },
                  ].map(({ label, val, col, bg }) => (
                    <div key={label} style={{ background: bg, border: `1px solid ${col}30`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                      <p style={{ fontSize: '1.5rem', fontWeight: 800, color: col, fontFamily: 'Sora' }}>{val}</p>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: col, opacity: 0.8 }}>{label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="soft-panel" style={{ padding: '10px 14px', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'flex-start', background: '#FFFBEB', borderColor: '#FDE68A' }}>
                <Info size={15} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: '0.79rem', color: '#92400E', lineHeight: 1.5 }}>
                  <strong>Note:</strong> {summary?.note || 'AI can surface strong near-matches; query filtering prioritises exact criteria and then near-matches.'}
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="compare-columns">
                <div>
                  <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--c-indigo-light)', borderRadius: 10, border: '1px solid rgba(15,118,110,0.24)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Sparkles size={16} color="var(--c-indigo)" />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--c-indigo)' }}>AI Recommendations</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--c-text-4)', fontWeight: 600 }}>Cosine Similarity</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--c-text-3)', lineHeight: 1.4, paddingLeft: 24 }}>Ranks properties by overall feature closeness to your profile — may return near-matches that exceed exact criteria but score highly across all dimensions.</p>
                  </div>
                  {result.ai_results?.length > 0
                    ? result.ai_results.map((r, i) => <AICard key={r.id} rec={r} index={i} prefs={form} />)
                    : <p style={{ fontSize: '0.875rem', color: 'var(--c-text-4)', textAlign: 'center', padding: '24px 0' }}>No AI results found</p>
                  }
                </div>
                <div>
                  <div style={{ marginBottom: 14, padding: '10px 14px', background: '#F0F9FF', borderRadius: 10, border: '1px solid rgba(14,165,233,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Search size={16} color="#0EA5E9" />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0284C7' }}>Simple Query</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--c-text-4)', fontWeight: 600 }}>Criteria Filter</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--c-text-3)', lineHeight: 1.4, paddingLeft: 24 }}>Filters by exact criteria first (green = strict match). When too few results exist, falls back to relaxed thresholds (amber = near match — criteria were loosened to return results).</p>
                  </div>
                  {result.query_results?.length > 0
                    ? result.query_results.map((r, i) => <QueryCard key={r.id} rec={r} index={i} prefs={form} />)
                    : <div style={{ padding: '24px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, textAlign: 'center' }}>
                        <p style={{ fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>No exact matches found</p>
                        <p style={{ fontSize: '0.8rem', color: '#B91C1C' }}>The query requires exact criteria matches. Try relaxing bedrooms or bathrooms.</p>
                      </div>
                  }
                </div>
              </div>

              {summary && (
                <div className="soft-panel" style={{ marginTop: 24, padding: '16px 20px' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--c-text)', marginBottom: 10 }}>Average Rent Comparison</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--c-text-4)', marginBottom: 2 }}>AI average</p>
                      <p style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--c-indigo)' }}>£{summary.ai_avg_rent?.toLocaleString()}/mo</p>
                    </div>
                    <ArrowRight size={16} color="var(--c-text-4)" />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--c-text-4)', marginBottom: 2 }}>Query average</p>
                      <p style={{ fontWeight: 800, fontSize: '1.125rem', color: '#0EA5E9' }}>£{summary.query_avg_rent?.toLocaleString()}/mo</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:700px){.compare-form-grid{grid-template-columns:1fr 1fr!important;}.compare-columns{grid-template-columns:1fr!important;}.summary-grid{grid-template-columns:repeat(2,1fr)!important;}}
      `}</style>
    </div>
  )
}
