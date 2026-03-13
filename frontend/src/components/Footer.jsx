import { Link } from 'react-router-dom'
import { Sparkle, ArrowRight, Compass, Brain, Buildings } from '@phosphor-icons/react'

const COL = [
  {
    heading: 'Explore',
    links: [{ to: '/', l: 'Home' }, { to: '/properties', l: 'Browse Properties' }, { to: '/recommend', l: 'AI Match' }, { to: '/compare', l: 'Compare Methods' }],
  },
  {
    heading: 'Account',
    links: [{ to: '/login', l: 'Sign In' }, { to: '/register', l: 'Register' }, { to: '/profile', l: 'Saved Properties' }],
  },
  {
    heading: 'Research',
    links: [{ to: '/admin', l: 'Analytics Dashboard' }, { to: '/system', l: 'System Architecture' }],
  },
]

export default function Footer() {
  return (
    <footer style={{ background: 'var(--c-hero)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="container" style={{ maxWidth: 1200, padding: '56px 24px 32px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 28 }} className="footer-flow-grid">
          {[
            { icon: Compass, title: '1. Browse', desc: 'Explore the 3,406-property catalogue and shortlist what feels close.' },
            { icon: Brain, title: '2. Match', desc: 'Run the AI matcher to narrow down options from your stated preferences.' },
            { icon: Buildings, title: '3. Connect', desc: 'Save properties or contact a landlord directly on landlord-created listings.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ padding: '18px 18px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon size={18} color="#DDE7FF" />
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>{title}</p>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.56)', lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }} className="footer-grid">
          <div>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 16 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--c-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkle size={14} color="#fff" />
              </div>
              <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1rem', color: '#fff', letterSpacing: '-0.01em' }}>
                Prop<span style={{ color: '#14B8A6' }}>AI</span>
              </span>
            </Link>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 260, marginBottom: 20 }}>
              A research-focused rental platform that brings discovery, explainable AI matching, and direct landlord interaction into one connected flow.
            </p>
            <Link to="/recommend" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#fff', fontWeight: 700, textDecoration: 'none', marginBottom: 20 }}>
              Start the AI journey <ArrowRight size={14} />
            </Link>
          </div>

          {/* Nav columns */}
          {COL.map(col => (
            <div key={col.heading}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
                {col.heading}
              </p>
              <ul style={{ listStyle: 'none' }}>
                {col.links.map(({ to, l }) => (
                  <li key={to} style={{ marginBottom: 10 }}>
                    <Link to={to} style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.72)', textDecoration: 'none', transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.72)'}
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24 }}>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.52)' }}>© 2024 PropAI · COM748 Masters Research Project</p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['FastAPI', 'React', 'scikit-learn', 'Cosine Similarity'].map(t => (
              <span key={t} style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.52)', fontFamily: 'monospace' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-flow-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
          .footer-grid > :first-child { grid-column: 1 / -1; }
        }
      `}</style>
    </footer>
  )
}
