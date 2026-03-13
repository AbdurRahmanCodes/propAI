import { motion } from 'framer-motion'
import { Monitor, HardDrives, Cpu, Database, ArrowDown, Code, CheckCircle } from '@phosphor-icons/react'

const LAYERS = [
  {
    n: '01', icon: Monitor, title: 'React Frontend',
    tech: 'React 18 · Vite 7 · TailwindCSS · Framer Motion · Axios',
    desc: 'User-facing interface for browsing, searching, and receiving AI-matched property recommendations.',
    items: ['9 page routes', 'Framer Motion animations', 'JWT auth via localStorage', 'Axios API service'],
    col: 'var(--c-indigo)', bg: 'var(--c-indigo-light)',
  },
  {
    n: '02', icon: HardDrives, title: 'FastAPI Backend',
    tech: 'Python 3.11 · FastAPI · Uvicorn · Pydantic · JWT',
    desc: 'REST API that serves property data, handles authentication, and delegates recommendation requests to the AI engine.',
    items: ['GET /properties', 'POST /recommend', 'POST /login  /register', 'GET /dashboard/stats'],
    col: '#0EA5E9', bg: '#F0F9FF',
  },
  {
    n: '03', icon: Cpu, title: 'AI Recommendation Engine',
    tech: 'scikit-learn · NumPy · MinMaxScaler · cosine_similarity',
    desc: 'Content-based filtering module. Encodes user preferences into a feature vector, normalises via MinMaxScaler, and ranks all 3,406 properties by cosine similarity.',
    items: ['6-feature vector', 'MinMaxScaler normalisation', 'cosine_similarity()', 'Explainability per property'],
    col: '#7C3AED', bg: '#F5F3FF',
  },
  {
    n: '04', icon: Database, title: 'Dataset & Pre-trained Artefacts',
    tech: 'London Property Dataset · Kaggle · CSV · .npy · .pkl',
    desc: 'Cleaned 3,406-property London rental dataset with pre-computed 88 MB similarity matrix and fitted MinMaxScaler loaded at startup.',
    items: ['cleaned_dataset.csv  (3,406 rows)', 'similarity_matrix.npy  (88 MB)', 'scaler.pkl  (MinMaxScaler)'],
    col: '#059669', bg: '#ECFDF5',
  },
]

const DECISIONS = [
  { q: 'Why Content-Based over Collaborative Filtering?', a: 'Collaborative filtering suffers from the cold-start problem with new users. Content-based filtering uses explicit property features, requires no user history, and enables transparent explainability.' },
  { q: 'Why Cosine Similarity?', a: 'Cosine similarity is scale-invariant and measures the angle between feature vectors rather than Euclidean distance, making it robust to feature scale differences even after normalisation.' },
  { q: 'Why MinMaxScaler?', a: 'Features span wildly different ranges (rent: £50–£78k, station distance: 0.1–10.8 km). MinMaxScaler maps all features to [0, 1] ensuring equal contribution to the similarity score.' },
  { q: 'Why FastAPI?', a: 'FastAPI provides async support, automatic OpenAPI/Swagger docs, and native Pydantic validation — ideal for wrapping NumPy and pandas-based AI pipelines as a production-grade REST API.' },
]

export default function SystemArchitecturePage() {
  return (
    <div style={{ paddingTop: 60, minHeight: '100vh', background: 'var(--c-bg)' }}>

      {/* Header */}
      <div style={{ background: 'var(--c-hero)', padding: '56px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30%', right: 0, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,118,110,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="container" style={{ maxWidth: 700, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, background: 'rgba(15,118,110,0.2)', border: '1px solid rgba(20,184,166,0.28)', fontSize: '0.8rem', fontWeight: 600, color: '#5EEAD4', marginBottom: 20, letterSpacing: '0.03em' }}>
            <Code size={13} /> System Architecture
          </span>
          <h1 style={{ fontFamily: 'Sora', fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 14, lineHeight: 1.15 }}>
            Platform Architecture
          </h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            A 4-layer full-stack AI property recommendation system.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 900, padding: '56px 24px 80px' }}>

        {/* Architecture layers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {LAYERS.map((layer, i) => {
            const Icon = layer.icon
            return (
              <div key={i}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    background: 'var(--c-surface)',
                    border: '1px solid var(--c-border)',
                    borderRadius: i === 0 ? '16px 16px 0 0' : i === LAYERS.length - 1 ? '0 0 16px 16px' : '0',
                    borderTop: i > 0 ? 'none' : undefined,
                    padding: '28px 28px',
                    display: 'flex', alignItems: 'flex-start', gap: 20,
                  }}
                >
                  {/* Icon */}
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: layer.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} color={layer.col} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: layer.col, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Layer {layer.n}</span>
                        </div>
                        <h3 style={{ fontSize: '1.0625rem', fontWeight: 800, color: 'var(--c-text)', fontFamily: 'Sora', letterSpacing: '-0.01em' }}>{layer.title}</h3>
                        <p style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--c-text-3)', marginTop: 2 }}>{layer.tech}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--c-text-3)', lineHeight: 1.65, margin: '10px 0 12px' }}>{layer.desc}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {layer.items.map((item, j) => (
                        <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: layer.bg, fontSize: '0.75rem', fontWeight: 600, color: layer.col }}>
                          <CheckCircle size={10} />
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Arrow connector */}
                {i < LAYERS.length - 1 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 60, height: 32, alignItems: 'center', borderLeft: '1px solid var(--c-border)', borderRight: '1px solid var(--c-border)' }}>
                    <ArrowDown size={16} color="var(--c-border-strong)" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Data flow */}
        <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: '24px', marginTop: 32, marginBottom: 32 }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Data Flow</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, fontFamily: 'monospace', fontSize: '0.8125rem' }}>
            {[
              { s: 'User Inputs Preferences', mono: false },
              { s: '→', mono: false },
              { s: 'POST /recommend', mono: true },
              { s: '→', mono: false },
              { s: 'Encode Feature Vector', mono: false },
              { s: '→', mono: false },
              { s: 'MinMaxScaler.transform()', mono: true },
              { s: '→', mono: false },
              { s: 'cosine_similarity()', mono: true },
              { s: '→', mono: false },
              { s: 'Rank Top 5 + Explanations', mono: false },
            ].map((item, i) => (
              <span key={i} style={item.s === '→' ? { color: 'var(--c-text-4)' } : {
                padding: '4px 10px', borderRadius: 6,
                background: item.mono ? 'var(--c-surface-2)' : 'var(--c-indigo-light)',
                color: item.mono ? 'var(--c-text-3)' : 'var(--c-indigo)',
                fontFamily: item.mono ? 'monospace' : 'Inter',
                fontWeight: item.mono ? 400 : 600, fontSize: '0.8rem',
                border: '1px solid var(--c-border)',
              }}>{item.s}</span>
            ))}
          </div>
        </div>

        {/* Design decisions */}
        <h2 className="heading-3" style={{ marginBottom: 16 }}>Key Design Decisions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DECISIONS.map((d, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '18px 20px' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: 6 }}>{d.q}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--c-text-3)', lineHeight: 1.7 }}>{d.a}</p>
            </motion.div>
          ))}
        </div>

        {/* Tech stack chips */}
        <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['React 18', 'Vite 7', 'TailwindCSS', 'Framer Motion', 'FastAPI', 'Python 3.11', 'scikit-learn', 'NumPy', 'Pandas', 'MinMaxScaler', 'Cosine Similarity', 'JWT', 'bcrypt', 'Axios'].map(t => (
            <span key={t} style={{ padding: '5px 12px', borderRadius: 20, background: 'var(--c-surface)', border: '1px solid var(--c-border)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-text-3)' }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
