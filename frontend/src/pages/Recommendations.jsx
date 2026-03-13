import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, BedDouble, Bath, Train, PoundSterling, Info } from 'lucide-react'
import RecommendationCard from '../components/RecommendationCard'
import { getRecommendations } from '../services/api'

export default function RecommendationsPage() {
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [form, setForm] = useState({
    budget: sp.get('budget') || '',
    bedrooms: sp.get('bedrooms') || '2',
    bathrooms: sp.get('bathrooms') || '1',
    max_distance: sp.get('max_distance') || '0.5',
  })
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modelInfo, setModelInfo] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const syncQuery = (values) => {
    const q = {}
    if (values.budget) q.budget = values.budget
    if (values.bedrooms) q.bedrooms = values.bedrooms
    if (values.bathrooms) q.bathrooms = values.bathrooms
    if (values.max_distance) q.max_distance = values.max_distance
    setSp(q)
  }

  const runRecommendations = async (values) => {
    const res = await getRecommendations({
      budget: parseFloat(values.budget),
      bedrooms: parseInt(values.bedrooms),
      bathrooms: parseInt(values.bathrooms),
      max_distance: parseFloat(values.max_distance),
    })
    setResults(res.data.recommendations)
    setModelInfo(res.data.model_info)
  }

  useEffect(() => {
    if (sp.get('budget')) {
      runRecommendations(form).catch(() => {
        setError('Could not connect to the backend. Ensure uvicorn is running on port 8000.')
      })
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.budget || parseFloat(form.budget) <= 0) { setError('Please enter a valid budget.'); return }
    setError(''); setLoading(true)
    try {
      syncQuery(form)
      await runRecommendations(form)
    } catch {
      setError('Could not connect to the backend. Ensure uvicorn is running on port 8000.')
    } finally { setLoading(false) }
  }

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="container" style={{ maxWidth: 1200 }}>
          <div className="page-hero-grid" style={{ gridTemplateColumns: 'minmax(0, 0.95fr) minmax(300px, 0.95fr)' }}>
            <div>
              <span className="eyebrow-pill"><Sparkles size={13} /> AI Recommendation Engine</span>
              <h1 className="heading-display" style={{ marginTop: 18, marginBottom: 14 }}>Tell the model what matters and get a ranked shortlist.</h1>
              <p className="hero-kicker">
                Submit your preferences once and review ranked options with clear match reasoning.
              </p>
            </div>
            <div className="hero-side-card">
              <div className="chip-row" style={{ marginBottom: 14 }}>
                <span className="chip-soft"><BedDouble size={13} /> Bedrooms</span>
                <span className="chip-soft"><Bath size={13} /> Bathrooms</span>
                <span className="chip-soft"><Train size={13} /> Station distance</span>
                <span className="chip-soft"><PoundSterling size={13} /> Budget</span>
              </div>
              <div className="flow-note">
                Best when ranking quality matters more than strict exact filters.
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="page-content">
        <div className="container" style={{ maxWidth: 980, padding: '0 24px 80px' }}>
          <div className="page-grid-two" style={{ alignItems: 'start' }}>
            <div className="soft-panel" style={{ padding: '32px' }}>
              <h2 className="heading-3" style={{ marginBottom: 10 }}>Your preferences</h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--c-text-3)', marginBottom: 18 }}>Enter your key constraints to get five ranked matches.</p>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }} className="pref-grid">
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Monthly budget (£) *</label>
                    <div style={{ position: 'relative' }}>
                      <PoundSterling size={15} color="var(--c-text-4)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="number" placeholder="e.g. 2500" value={form.budget} onChange={e => set('budget', e.target.value)} required className="input" style={{ paddingLeft: 36, fontSize: '1.0625rem', fontWeight: 600 }} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Bedrooms</label>
                    <select value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} className="input" style={{ appearance: 'auto' }}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} bedroom{n>1?'s':''}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Bathrooms</label>
                    <select value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} className="input" style={{ appearance: 'auto' }}>
                      {[1,2,3,4].map(n => <option key={n} value={n}>{n} bathroom{n>1?'s':''}</option>)}
                    </select>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Max distance to nearest station (km)</label>
                    <select value={form.max_distance} onChange={e => set('max_distance', e.target.value)} className="input" style={{ appearance: 'auto' }}>
                      {[0.3, 0.5, 0.8, 1.0, 1.5, 2.0].map(v => <option key={v} value={v}>{v} km</option>)}
                    </select>
                  </div>
                </div>

                {error && <p style={{ fontSize: '0.875rem', color: 'var(--c-red)', marginBottom: 14 }}>{error}</p>}

                <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                  {loading
                    ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.65s linear infinite' }} /> Computing…</>
                    : <><Sparkles size={16} /> Find my best matches</>
                  }
                </button>
              </form>
            </div>

            <div className="stack-lg">
              <div className="soft-panel" style={{ padding: '24px' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--c-text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>What the model uses</p>
                <div className="stack-md">
                  {[['Rent alignment', PoundSterling], ['Bedrooms and bathrooms', BedDouble], ['Distance to station', Train]].map(([label, Icon]) => (
                    <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(15,118,110,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} color="var(--c-indigo)" />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, color: 'var(--c-text)', fontSize: '0.9rem' }}>{label}</p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--c-text-3)' }}>Used as part of the cosine-similarity feature vector.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {modelInfo && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="soft-panel" style={{ padding: '18px 20px', background: 'linear-gradient(135deg, rgba(15,118,110,0.12) 0%, rgba(217,236,247,0.35) 100%)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Info size={15} color="var(--c-indigo)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.84rem', color: 'var(--c-text-2)', fontWeight: 500 }}>
                      {modelInfo.algorithm} · {modelInfo.similarity_metric} · {modelInfo.scaler} · Features: {modelInfo.features_used.join(', ')}
                    </span>
                  </div>
                </motion.div>
              )}

              <div className="soft-panel" style={{ padding: '18px 20px' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Continue the journey</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/compare?budget=${form.budget || ''}&bedrooms=${form.bedrooms}&bathrooms=${form.bathrooms}&max_distance=${form.max_distance}`)}
                  >
                    Compare methods
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/properties?max_rent=${form.budget || ''}&bedrooms=${form.bedrooms}&bathrooms=${form.bathrooms}&max_distance=${form.max_distance}`)}
                  >
                    Open matching listings
                  </button>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {results && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, marginTop: 28 }}>
                  <h2 className="heading-3">Top {results.length} matches</h2>
                  <span className="tag tag-indigo">{results.length} results</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {results.map((r, i) => <RecommendationCard key={r.id ?? i} result={r} index={i} />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) { .pref-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '0.8125rem', fontWeight: 600,
  color: 'var(--c-text-2)', marginBottom: 7, letterSpacing: '0.01em',
}
