import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Heart, SignOut, Sparkle, Buildings, Robot, ArrowsLeftRight, ClockCounterClockwise, UserCircle } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { getFavorites, getMyJourneySummary } from '../services/api'
import PropertyCard from '../components/PropertyCard'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [favs, setFavs] = useState([])
  const [journey, setJourney] = useState(null)
  const [loading, setLoading] = useState(true)

  if (!user) return <Navigate to="/login" />

  useEffect(() => {
    Promise.allSettled([getFavorites(), getMyJourneySummary()])
      .then(([favsRes, journeyRes]) => {
        if (favsRes.status === 'fulfilled') setFavs(favsRes.value.data.favorites)
        if (journeyRes.status === 'fulfilled') setJourney(journeyRes.value.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const refresh = () => getFavorites().then(r => setFavs(r.data.favorites)).catch(() => {})

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="container" style={{ maxWidth: 1100 }}>
          <div className="page-hero-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 0.8fr)' }}>
            <div>
              <span className="eyebrow-pill"><UserCircle size={12} /> Profile</span>
              <h1 className="heading-display" style={{ marginTop: 18, marginBottom: 14 }}>Your saved properties and account context in one place.</h1>
              <p className="hero-kicker">
                This dashboard now works as part of the product journey: return to favorites, continue discovery, or switch to landlord actions if your role supports them.
              </p>
            </div>
            <div className="hero-side-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--c-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Sora', flexShrink: 0 }}>
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{user.username}</p>
                  <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.62)' }}>{user.email}</p>
                </div>
              </div>
              <div className="chip-row" style={{ marginBottom: 16 }}>
                <span className="page-tab"><Heart size={13} /> {favs.length} saved</span>
                <span className="page-tab"><Buildings size={13} /> {user.role}</span>
              </div>
              <button onClick={logout} className="btn btn-white btn-sm" style={{ color: 'var(--c-red)' }}>
                <SignOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="page-content">
        <div className="container" style={{ maxWidth: 1100, padding: '0 24px 80px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 26 }} className="journey-stats-grid">
            {[
              { label: 'Saved properties', value: favs.length, icon: Heart },
              { label: 'AI runs', value: journey?.recommendation_requests ?? 0, icon: Robot },
              { label: 'Comparisons', value: journey?.comparison_requests ?? 0, icon: ArrowsLeftRight },
              { label: 'Last activity', value: journey?.last_recommendation?.timestamp || journey?.last_comparison?.timestamp ? 'recent' : 'none', icon: ClockCounterClockwise },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="surface-subtle" style={{ padding: '14px 14px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Icon size={16} color="var(--c-indigo)" />
                  <p style={{ fontSize: '0.74rem', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--c-text-4)' }}>{label}</p>
                </div>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--c-text)' }}>{value}</p>
              </div>
            ))}
          </div>

          <div className="section-intro">
            <div>
              <p className="label" style={{ marginBottom: 8 }}>Saved List</p>
              <h2 className="heading-3">Saved properties</h2>
            </div>
            {favs.length > 0 && <span className="tag tag-indigo">{favs.length} saved</span>}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}><div className="spinner" /></div>
          ) : favs.length === 0 ? (
            <div className="empty-state">
              <Sparkle size={36} color="var(--c-border-strong)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 600, color: 'var(--c-text-3)', marginBottom: 4 }}>No saved properties yet</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--c-text-4)' }}>Browse listings and click the ♡ to save them here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="favs-grid">
              {favs.map((p, i) => <PropertyCard key={p.id ?? i} property={p} index={i} isFavorited onFavoriteChange={refresh} />)}
            </div>
          )}
        </div>
      </div>
      <style>{`@media(max-width:900px){.favs-grid{grid-template-columns:repeat(2,1fr)!important;}.journey-stats-grid{grid-template-columns:repeat(2,1fr)!important;}}@media(max-width:500px){.favs-grid{grid-template-columns:1fr!important;}.journey-stats-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  )
}
