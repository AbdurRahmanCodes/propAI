import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, Sparkle, ArrowRight, Star, ChartLineUp, StackSimple, Compass, Robot, Buildings } from '@phosphor-icons/react'
import HowAIWorks from '../components/HowAIWorks'
import PropertyCard from '../components/PropertyCard'
import { getProperties } from '../services/api'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=85&auto=format&fit=crop'

export default function HomePage() {
  const navigate = useNavigate()
  const [featured, setFeatured] = useState([])
  const [form, setForm] = useState({ budget: '', bedrooms: '', bathrooms: '', max_distance: '' })
  const [imgLoaded, setImgLoaded] = useState(false)

  useEffect(() => {
    getProperties({ limit: 6 }).then(r => setFeatured(r.data.data)).catch(() => {})
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (form.budget) p.set('max_rent', form.budget)
    if (form.bedrooms) p.set('bedrooms', form.bedrooms)
    if (form.bathrooms) p.set('bathrooms', form.bathrooms)
    if (form.max_distance) p.set('max_distance', form.max_distance)
    navigate(`/properties?${p}`)
  }

  const toPreferenceQuery = () => {
    const p = new URLSearchParams()
    if (form.budget) p.set('budget', form.budget)
    if (form.bedrooms) p.set('bedrooms', form.bedrooms)
    if (form.bathrooms) p.set('bathrooms', form.bathrooms)
    if (form.max_distance) p.set('max_distance', form.max_distance)
    return p.toString()
  }

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div style={{ position: 'absolute', inset: 0 }}>
          <img
            src={HERO_IMAGE}
            alt=""
            onLoad={() => setImgLoaded(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: imgLoaded ? 0.16 : 0, transition: 'opacity 1s ease' }}
          />
        </div>

        <div className="container" style={{ maxWidth: 1200, position: 'relative', zIndex: 1 }}>
          <div className="page-hero-grid">
            <div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="eyebrow-pill"><Sparkle size={13} /> AI-powered London rental discovery</span>
              </motion.div>

              <motion.h1 className="heading-display" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.55 }} style={{ marginTop: 20, marginBottom: 18 }}>
                A clearer path from <span className="text-gradient-hero">search</span> to shortlist to landlord contact.
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="hero-kicker" style={{ marginBottom: 24 }}>
                Browse listings, run AI ranking, compare methods, and move straight to landlord contact without breaking flow.
              </motion.p>

              <div className="page-tabs" style={{ marginBottom: 26 }}>
                <span className="page-tab"><Compass size={14} /> Browse catalog</span>
                <span className="page-tab"><Robot size={14} /> Explainable AI match</span>
                <span className="page-tab"><Buildings size={14} /> Direct landlord listings</span>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="metric-strip">
                {[
                  { val: '3,406', sub: 'properties' },
                  { val: '0.622', sub: 'precision@5' },
                  { val: '2.31', sub: 'diversity score' },
                  { val: '6', sub: 'matching features' },
                ].map((item) => (
                  <div key={item.sub} className="metric-tile">
                    <div className="metric-value">{item.val}</div>
                    <div className="metric-label">{item.sub}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.5 }} className="hero-side-card">
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.58)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                Start your search
              </p>
              <form onSubmit={handleSearch}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }} className="home-hero-form-grid">
                  {[
                    { key: 'budget', label: 'Max budget', type: 'number', ph: '2,500' },
                    { key: 'bedrooms', label: 'Bedrooms', type: 'number', ph: '2' },
                    { key: 'bathrooms', label: 'Bathrooms', type: 'number', ph: '1' },
                    { key: 'max_distance', label: 'Station distance', type: 'number', ph: '0.5', step: '0.1' },
                  ].map(({ key, label, type, ph, step }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'rgba(255,255,255,0.74)', marginBottom: 6 }}>{label}</label>
                      <input
                        type={type}
                        placeholder={ph}
                        step={step}
                        value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        className="hero-input"
                        style={{ width: '100%', padding: '11px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, fontSize: '0.92rem', color: '#fff', outline: 'none' }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1, justifyContent: 'center' }}>
                    <MagnifyingGlass size={16} /> Browse Matches
                  </button>
                  <button type="button" onClick={() => navigate(`/recommend?${toPreferenceQuery()}`)} className="btn btn-white btn-lg" style={{ flex: 1, justifyContent: 'center' }}>
                    <Sparkle size={16} /> Run AI Match
                  </button>
                </div>
              </form>
              <div className="flow-note" style={{ marginTop: 14 }}>
                Start with direct filters, or switch to AI ranking for faster shortlists.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="page-content">
        <section className="section-sm">
          <div className="container" style={{ maxWidth: 1200 }}>
            <div className="section-intro" style={{ marginBottom: 22 }}>
              <div>
                <p className="label" style={{ marginBottom: 8 }}>Platform Flow</p>
                <h2 className="heading-1">One journey, three entry points</h2>
              </div>
            </div>

            <div className="journey-grid">
              {[
                { icon: Compass, title: 'Browse catalog', desc: 'Filter the full rental catalogue by price, bedrooms, bathrooms, property type, and station proximity.', action: '/properties', cta: 'Open properties' },
                { icon: Robot, title: 'Get AI-ranked matches', desc: 'Submit preferences once and get top-ranked results with matching explanations and similarity scores.', action: '/recommend', cta: 'Open AI match' },
                { icon: Buildings, title: 'Contact landlords', desc: 'Landlord-created listings expose contact details directly so the platform supports action, not just analysis.', action: '/properties', cta: 'See listings' },
              ].map(({ icon: Icon, title, desc, action, cta }) => (
                <button key={title} type="button" onClick={() => navigate(action)} className="journey-card" style={{ textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(15,118,110,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon size={20} color="var(--c-indigo)" />
                  </div>
                  <h3 className="heading-3" style={{ marginBottom: 10 }}>{title}</h3>
                  <p className="body-md" style={{ marginBottom: 10 }}>{desc}</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--c-indigo)' }}>{cta} <ArrowRight size={14} /></span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <HowAIWorks />

        <section className="section-sm">
          <div className="container" style={{ maxWidth: 1200 }}>
            <div className="section-intro">
              <div>

              <style>{`
                .hero-input::placeholder { color: rgba(255,255,255,0.62); }
              `}</style>
                <p className="label" style={{ marginBottom: 8 }}>London Rentals</p>
                <h2 className="heading-1">Featured properties</h2>
              </div>
              <button onClick={() => navigate('/properties')} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                View all listings <ArrowRight size={15} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="property-grid">
              {featured.map((p, i) => (
                <PropertyCard key={p.id ?? i} property={p} index={i} />
              ))}
            </div>
          </div>
        </section>

        <section className="section-sm">
          <div className="container" style={{ maxWidth: 1200 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, border: '1px solid var(--c-border)', borderRadius: 16, overflow: 'hidden' }} className="trust-grid">
              {[
                { icon: Star, title: 'Transparent AI', desc: 'Every recommendation comes with a match score and precise explanation of why each property was chosen.' },
                { icon: StackSimple, title: 'Research-grade evidence', desc: 'The platform exposes evaluation metrics and method comparison instead of presenting AI as a black box.' },
                { icon: ChartLineUp, title: 'Content-based filtering', desc: 'The recommendation engine works without historical user behaviour and stays aligned to property features.' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div key={i} style={{ padding: '40px 36px', background: 'var(--c-surface)', borderRight: i < 2 ? '1px solid var(--c-border)' : 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--c-indigo-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Icon size={20} color="var(--c-indigo)" />
                  </div>
                  <h3 className="heading-3" style={{ marginBottom: 10 }}>{title}</h3>
                  <p className="body-md">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-sm">
          <div className="container" style={{ maxWidth: 640, textAlign: 'center', position: 'relative' }}>
            <div className="soft-panel" style={{ padding: '36px 28px' }}>
              <p className="label" style={{ marginBottom: 14 }}>Get Started</p>
              <h2 style={{ fontFamily: 'Sora', fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 800, color: 'var(--c-text)', letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.2 }}>
                Ready to build your shortlist?
              </h2>
              <p style={{ fontSize: '0.96rem', color: 'var(--c-text-3)', marginBottom: 28, lineHeight: 1.65 }}>
                Use filters for exact constraints or AI ranking for fast, balanced options.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/recommend')} className="btn btn-primary btn-lg">
                  <Sparkle size={16} /> Get AI Recommendations
                </button>
                <button onClick={() => navigate('/properties')} className="btn btn-ghost btn-lg">
                  Browse Properties
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 768px) { .home-hero-form-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 900px) { .property-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 600px) { .property-grid { grid-template-columns: 1fr !important; } .trust-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
