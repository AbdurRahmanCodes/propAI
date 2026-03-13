import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, X, CaretLeft, CaretRight } from '@phosphor-icons/react'
import PropertyCard from '../components/PropertyCard'
import { getProperties, getPropertyTypes } from '../services/api'

export default function PropertiesPage() {
  const [sp, setSp] = useSearchParams()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [types, setTypes] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const page = parseInt(sp.get('page') || '0', 10)
  const LIMIT = 12

  const [f, setF] = useState({
    max_rent: sp.get('max_rent') || '',
    bedrooms: sp.get('bedrooms') || '',
    bathrooms: sp.get('bathrooms') || '',
    property_type: sp.get('property_type') || '',
    max_distance: sp.get('max_distance') || '',
  })

  useEffect(() => {
    getPropertyTypes().then(r => setTypes(r.data.types)).catch(() => {})
  }, [])

  useEffect(() => {
    setF({
      max_rent: sp.get('max_rent') || '',
      bedrooms: sp.get('bedrooms') || '',
      bathrooms: sp.get('bathrooms') || '',
      property_type: sp.get('property_type') || '',
      max_distance: sp.get('max_distance') || '',
    })
  }, [sp])

  useEffect(() => {
    setLoading(true)
    const p = { skip: page * LIMIT, limit: LIMIT }
    const applied = {
      max_rent: sp.get('max_rent') || '',
      bedrooms: sp.get('bedrooms') || '',
      bathrooms: sp.get('bathrooms') || '',
      property_type: sp.get('property_type') || '',
      max_distance: sp.get('max_distance') || '',
    }
    if (applied.max_rent) p.max_rent = applied.max_rent
    if (applied.bedrooms) p.bedrooms = applied.bedrooms
    if (applied.bathrooms) p.bathrooms = applied.bathrooms
    if (applied.property_type) p.property_type = applied.property_type
    if (applied.max_distance) p.max_distance = applied.max_distance
    getProperties(p)
      .then(r => { setData(r.data.data); setTotal(r.data.total) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, sp])

  const apply = () => {
    const params = { page: '0' }
    Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v })
    setSp(params); setFiltersOpen(false)
  }
  const clear = () => { setF({ max_rent:'',bedrooms:'',bathrooms:'',property_type:'',max_distance:'' }); setSp({}) }
  const hasF = Object.values(f).some(Boolean)
  const pages = Math.ceil(total / LIMIT)

  const setPage = (nextPage) => {
    const next = new URLSearchParams(sp)
    next.set('page', String(nextPage))
    setSp(next)
  }

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="container" style={{ maxWidth: 1200 }}>
          <div className="page-hero-grid" style={{ gridTemplateColumns: 'minmax(0, 1.1fr) minmax(260px, 0.9fr)' }}>
            <div>
              <span className="eyebrow-pill">Browse the full catalogue</span>
              <h1 className="heading-display" style={{ marginTop: 18, marginBottom: 14 }}>Search London rentals with clear filters and fast scanability.</h1>
              <p className="hero-kicker">
                Use manual filtering when you need precise control over the shortlist.
              </p>
            </div>
            <div className="hero-side-card">
              <div className="metric-strip" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <div className="metric-tile">
                  <div className="metric-value">{loading ? '...' : total.toLocaleString()}</div>
                  <div className="metric-label">available properties</div>
                </div>
                <div className="metric-tile">
                  <div className="metric-value">{hasF ? 'Yes' : 'No'}</div>
                  <div className="metric-label">filters active</div>
                </div>
              </div>
              <div className="flow-note" style={{ marginTop: 12 }}>
                Need ranking help instead? Switch to AI Match with the same preferences.
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="page-content">
        <div className="container" style={{ maxWidth: 1200 }}>
          <div className="soft-panel" style={{ padding: '20px 20px 16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 className="heading-3">Filter and browse</h2>
                <p style={{ fontSize: '0.92rem', color: 'var(--c-text-3)', marginTop: 4 }}>
                  {loading ? 'Loading…' : `${total.toLocaleString()} properties ready to explore`}
                  {hasF && ' · Filters active'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {hasF && (
                  <button onClick={clear} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.875rem', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                    <X size={13} /> Clear
                  </button>
                )}
                <button onClick={() => setFiltersOpen(!filtersOpen)} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <SlidersHorizontal size={15} />
                  Filters
                  {hasF && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--c-indigo)', display: 'inline-block' }} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--c-border)' }} className="filter-grid">
                    {[
                      { key: 'max_rent', label: 'Max Rent (£/mo)', ph: '3,000', type: 'number' },
                      { key: 'bedrooms', label: 'Bedrooms', ph: 'Any', type: 'number', min: 1 },
                      { key: 'bathrooms', label: 'Bathrooms', ph: 'Any', type: 'number', min: 1 },
                      { key: 'max_distance', label: 'Station (km)', ph: 'Any', type: 'number', step: '0.1' },
                    ].map(({ key, label, ph, type, min, step }) => (
                      <div key={key}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-text-4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                        <input type={type} placeholder={ph} min={min} step={step} value={f[key]} onChange={e => setF(x => ({ ...x, [key]: e.target.value }))} className="input" />
                      </div>
                    ))}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-text-4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</label>
                      <select value={f.property_type} onChange={e => setF(x => ({ ...x, property_type: e.target.value }))} className="input" style={{ appearance: 'auto' }}>
                        <option value="">All types</option>
                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button onClick={apply} className="btn btn-primary btn-sm"><SlidersHorizontal size={14} /> Apply</button>
                    <button onClick={clear} className="btn btn-ghost btn-sm">Clear all</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="container" style={{ maxWidth: 1200, paddingTop: 6, paddingBottom: 64 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <div className="spinner" />
            </div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <SlidersHorizontal size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>No properties match your filters</p>
              <button onClick={clear} className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}>Clear filters</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }} className="prop-grid">
                {data.map((p, i) => <PropertyCard key={p.id ?? i} property={p} index={i} />)}
              </div>

              {pages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 48 }}>
                  <button disabled={page === 0} onClick={() => setPage(page - 1)} className="btn btn-ghost btn-sm" style={{ padding: 8 }}>
                    <CaretLeft size={18} />
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--c-text-3)' }}>Page {page + 1} of {pages}</span>
                  <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="btn btn-ghost btn-sm" style={{ padding: 8 }}>
                    <CaretRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) { .prop-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 768px)  { .prop-grid { grid-template-columns: repeat(2,1fr) !important; } .filter-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 480px)  { .prop-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
