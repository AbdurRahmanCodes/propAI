import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Bed, Bathtub, Train, Ruler, MapPin, Heart, Sparkle, EnvelopeSimple, Phone, UserCircle, X } from '@phosphor-icons/react'
import { getProperty, getPropertyContact, addFavorite, removeFavorite } from '../services/api'
import { useAuth } from '../context/AuthContext'

const IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=900&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=900&q=80&auto=format&fit=crop',
]

function hashId(value) {
  return String(value || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
}

const getImg = (id) => IMAGES[hashId(id) % IMAGES.length]
const fmt = (n) => n ? `£${Number(n).toLocaleString()}` : '—'

export default function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [prop, setProp] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [faved, setFaved] = useState(false)
  const [contactInfo, setContactInfo] = useState(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactLoading, setContactLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getProperty(id)
      .then(r => {
        setProp(r.data.property || null)
        setSimilar(r.data.similar_properties || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    setFaved(Boolean(user?.favorites?.includes(String(id))))
  }, [id, user])

  const toggleFav = async () => {
    if (!user) return
    if (faved) { await removeFavorite(id); setFaved(false) }
    else { await addFavorite(id); setFaved(true) }
  }

  const openContact = async () => {
    setContactOpen(true)
    if (contactInfo || contactLoading) return
    setContactLoading(true)
    try {
      const res = await getPropertyContact(id)
      setContactInfo(res.data)
    } catch {
      setContactInfo({ available: false, message: 'Could not load landlord contact details right now.' })
    } finally {
      setContactLoading(false)
    }
  }

  if (loading) return <div style={{ paddingTop: 100, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
  if (!prop) return <div style={{ paddingTop: 100, textAlign: 'center', color: 'var(--c-text-3)' }}>Property not found.</div>

  const img = getImg(id)

  return (
    <div className="page-shell">

      {/* ── Hero ── */}
      <section className="page-hero">
        <div className="container" style={{ maxWidth: 1200, position: 'relative', zIndex: 1 }}>
          <div style={{ padding: '40px 0 36px' }}>
            <button onClick={() => navigate(-1)} className="btn btn-white btn-sm" style={{ marginBottom: 22 }}>
              <ArrowLeft size={14} /> Back to listings
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {prop.property_type && <span className="eyebrow-pill"><MapPin size={12} /> {prop.property_type}</span>}
              {prop.source === 'landlord' && <span className="eyebrow-pill" style={{ background: 'rgba(5,150,105,0.18)', border: '1px solid rgba(5,150,105,0.3)', color: '#6EE7B7' }}>Direct listing</span>}
            </div>

            <h1 className="heading-display" style={{ marginBottom: 10 }}>
              {prop.address || `Property #${id}`}
            </h1>

            <div className="metric-strip" style={{ maxWidth: 480, marginTop: 24 }}>
              <div className="metric-tile">
                <div className="metric-value">{fmt(prop.rent)}</div>
                <div className="metric-label">per month</div>
              </div>
              <div className="metric-tile">
                <div className="metric-value">{prop.bedrooms != null ? Number(prop.bedrooms).toFixed(0) : '—'}</div>
                <div className="metric-label">bedrooms</div>
              </div>
              <div className="metric-tile">
                <div className="metric-value">{prop.bathrooms != null ? Number(prop.bathrooms).toFixed(0) : '—'}</div>
                <div className="metric-label">bathrooms</div>
              </div>
              <div className="metric-tile">
                <div className="metric-value">{prop.avg_distance_to_nearest_station != null ? `${Number(prop.avg_distance_to_nearest_station).toFixed(1)}km` : '—'}</div>
                <div className="metric-label">to station</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main content ── */}
      <div className="page-content">
        <div className="container" style={{ maxWidth: 1200 }}>

        {/* Main layout: image left, details right */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }} className="detail-grid">

          {/* LEFT */}
          <div>
            {/* Hero image */}
            <div style={{ height: 420, borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
              <img src={img} alt={prop.address} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            {/* Actions row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              {user && (
                <button onClick={toggleFav} className="btn btn-ghost">
                  <Heart size={15} fill={faved ? '#DC2626' : 'none'} color={faved ? '#DC2626' : 'inherit'} />
                  {faved ? 'Saved' : 'Save'}
                </button>
              )}
              {prop.source === 'landlord' && (
                <button onClick={openContact} className="btn btn-ghost">
                  <EnvelopeSimple size={14} /> Contact landlord
                </button>
              )}
              <Link to="/recommend" className="btn btn-primary">
                <Sparkle size={14} /> Get AI Match
              </Link>
            </div>

            {/* Rent highlight */}
            <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Monthly Rent</p>
                <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--c-indigo)', fontFamily: 'Sora', letterSpacing: '-0.02em' }}>{fmt(prop.rent)}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)' }}>per month</p>
              </div>
              {prop.deposit && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Deposit</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--c-text)' }}>{fmt(prop.deposit)}</p>
                </div>
              )}
            </div>

            {(prop.let_type || prop.furnish_type || prop.description) && (
              <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '18px 20px', marginBottom: 20 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Listing details
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: prop.description ? 10 : 0 }}>
                  {prop.let_type && <span className="tag tag-gray">{prop.let_type}</span>}
                  {prop.furnish_type && <span className="tag tag-gray">{prop.furnish_type}</span>}
                  {prop.source === 'landlord' && <span className="tag tag-green">Landlord provided</span>}
                </div>
                {prop.description && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--c-text-3)', lineHeight: 1.65 }}>{prop.description}</p>
                )}
              </div>
            )}

            {/* Feature grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }} className="feat-grid">
              {[
                { icon: Bed, label: 'Bedrooms', val: prop.bedrooms != null ? `${Number(prop.bedrooms).toFixed(0)}` : '—' },
                { icon: Bathtub, label: 'Bathrooms', val: prop.bathrooms != null ? `${Number(prop.bathrooms).toFixed(0)}` : '—' },
                { icon: Train, label: 'Station', val: prop.avg_distance_to_nearest_station != null ? `${Number(prop.avg_distance_to_nearest_station).toFixed(1)} km` : '—' },
                { icon: Ruler, label: 'Size', val: prop.size ? `${Math.round(prop.size)} ft²` : '—' },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: '16px', textAlign: 'center' }}>
                  <Icon size={20} color="var(--c-text-4)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--c-text)', marginBottom: 2 }}>{val}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--c-text-4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — similar properties sidebar */}
          <div>
            <div style={{ position: 'sticky', top: 80 }}>
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Sparkle size={15} color="var(--c-indigo)" />
                  <h3 className="heading-3" style={{ fontSize: '1rem' }}>Similar properties</h3>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-3)', marginBottom: 16, lineHeight: 1.6 }}>
                  Found by cosine similarity using this property's rent, bedrooms, bathrooms, and station distance.
                </p>

                {similar.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--c-text-4)', fontSize: '0.875rem' }}>
                    No similar properties computed yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {similar.map((s, i) => (
                      <motion.div
                        key={s.id ?? i}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                      >
                        <Link to={`/properties/${s.id}`} style={{ textDecoration: 'none', display: 'block', padding: '12px', borderRadius: 10, border: '1px solid var(--c-border)', background: 'var(--c-surface-2)', transition: 'border-color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-indigo-mid)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--c-border)'}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {s.address || 'London Property'}
                            </p>
                            {s.similarity_score && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-indigo)', background: 'var(--c-indigo-light)', padding: '2px 7px', borderRadius: 6, flexShrink: 0 }}>
                                {s.similarity_score}%
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--c-indigo)' }}>
                            {s.rent ? `£${Number(s.rent).toLocaleString()}/mo` : 'POA'}
                          </p>
                          {/* Match bar */}
                          {s.similarity_score && (
                            <div className="match-bar" style={{ marginTop: 8 }}>
                              <motion.div className="match-fill" initial={{ width: 0 }} animate={{ width: `${s.similarity_score}%` }} transition={{ delay: i * 0.08 + 0.3, duration: 0.7 }} />
                            </div>
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr !important; } .feat-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>

      {contactOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,15,26,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 120 }}>
          <div className="card" style={{ width: '100%', maxWidth: 460, padding: 28, position: 'relative' }}>
            <button onClick={() => setContactOpen(false)} style={{ position: 'absolute', top: 14, right: 14, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--c-text-4)' }}>
              <X size={18} />
            </button>
            <p className="label" style={{ marginBottom: 10 }}>Direct Contact</p>
            <h2 className="heading-3" style={{ marginBottom: 10 }}>Landlord contact details</h2>
            <p className="body-md" style={{ marginBottom: 18 }}>
              {contactInfo?.message || 'Use the details below to arrange a viewing or ask follow-up questions.'}
            </p>

            {contactLoading ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--c-text-4)' }}>Loading contact details…</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {contactInfo?.contact?.name && (
                  <div style={contactRowStyle}><UserCircle size={15} color="var(--c-indigo)" /> <span>{contactInfo.contact.name}</span></div>
                )}
                {contactInfo?.contact?.email && (
                  <div style={contactRowStyle}><EnvelopeSimple size={15} color="var(--c-indigo)" /> <a href={`mailto:${contactInfo.contact.email}`} style={contactLinkStyle}>{contactInfo.contact.email}</a></div>
                )}
                {contactInfo?.contact?.phone && (
                  <div style={contactRowStyle}><Phone size={15} color="var(--c-indigo)" /> <a href={`tel:${contactInfo.contact.phone}`} style={contactLinkStyle}>{contactInfo.contact.phone}</a></div>
                )}
                {!contactInfo?.available && !contactInfo?.contact?.email && !contactInfo?.contact?.phone && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--c-text-4)' }}>No direct contact details are available for this listing yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const contactRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 10,
  background: 'var(--c-surface-2)',
  border: '1px solid var(--c-border)',
  fontSize: '0.9rem',
  color: 'var(--c-text-2)',
}

const contactLinkStyle = {
  color: 'var(--c-indigo)',
  fontWeight: 600,
  textDecoration: 'none',
}
