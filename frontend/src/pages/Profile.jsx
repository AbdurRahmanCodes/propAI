import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Heart, SignOut, Sparkle, Buildings, Robot, ArrowsLeftRight, ClockCounterClockwise, UserCircle } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { deleteListing, getFavorites, getMyJourneySummary, getMyListings, updateListing } from '../services/api'
import PropertyCard from '../components/PropertyCard'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [favs, setFavs] = useState([])
  const [journey, setJourney] = useState(null)
  const [loading, setLoading] = useState(true)
  const [myListings, setMyListings] = useState([])
  const [listingsLoading, setListingsLoading] = useState(false)
  const [listingsError, setListingsError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editForm, setEditForm] = useState({
    address: '',
    rent: '',
    deposit: '',
    bedrooms: '',
    bathrooms: '',
    property_type: '',
    furnish_type: '',
    let_type: '',
    avg_distance_to_nearest_station: '',
    description: '',
    contact_email: '',
    contact_phone: '',
  })

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    Promise.allSettled([getFavorites(), getMyJourneySummary()])
      .then(([favsRes, journeyRes]) => {
        if (favsRes.status === 'fulfilled') setFavs(favsRes.value.data.favorites)
        if (journeyRes.status === 'fulfilled') setJourney(journeyRes.value.data)
      })
      .finally(() => setLoading(false))

    if (user.role === 'landlord') {
      loadMyListings()
    }
  }, [user])

  if (!user) return <Navigate to="/login" />

  const refresh = () => getFavorites().then(r => setFavs(r.data.favorites)).catch(() => {})

  const loadMyListings = () => {
    setListingsLoading(true)
    setListingsError('')
    return getMyListings({ limit: 100 })
      .then((res) => setMyListings(res.data.data || []))
      .catch((err) => setListingsError(err?.response?.data?.detail || 'Failed to load your listings.'))
      .finally(() => setListingsLoading(false))
  }

  const startEdit = (listing) => {
    setEditingId(listing.id)
    setEditForm({
      address: listing.address || '',
      rent: listing.rent ?? '',
      deposit: listing.deposit ?? '',
      bedrooms: listing.bedrooms ?? '',
      bathrooms: listing.bathrooms ?? '',
      property_type: listing.property_type || '',
      furnish_type: listing.furnish_type || '',
      let_type: listing.let_type || '',
      avg_distance_to_nearest_station: listing.avg_distance_to_nearest_station ?? '',
      description: listing.description || '',
      contact_email: listing.contact_email || '',
      contact_phone: listing.contact_phone || '',
    })
  }

  const onEditField = (key) => (e) => setEditForm((prev) => ({ ...prev, [key]: e.target.value }))

  const saveEdit = async () => {
    const payload = {
      ...editForm,
      rent: editForm.rent === '' ? undefined : Number(editForm.rent),
      deposit: editForm.deposit === '' ? undefined : Number(editForm.deposit),
      bedrooms: editForm.bedrooms === '' ? undefined : Number(editForm.bedrooms),
      bathrooms: editForm.bathrooms === '' ? undefined : Number(editForm.bathrooms),
      avg_distance_to_nearest_station: editForm.avg_distance_to_nearest_station === ''
        ? undefined
        : Number(editForm.avg_distance_to_nearest_station),
    }

    try {
      await updateListing(editingId, payload)
      setEditingId('')
      await loadMyListings()
    } catch (err) {
      setListingsError(err?.response?.data?.detail || 'Failed to update listing.')
    }
  }

  const removeMyListing = async (listingId) => {
    if (!window.confirm('Delete this listing? This action cannot be undone.')) return
    try {
      await deleteListing(listingId)
      if (editingId === listingId) setEditingId('')
      await loadMyListings()
    } catch (err) {
      setListingsError(err?.response?.data?.detail || 'Failed to delete listing.')
    }
  }

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

          {user.role === 'landlord' && (
            <section style={{ marginBottom: 30 }}>
              <div className="section-intro">
                <div>
                  <p className="label" style={{ marginBottom: 8 }}>Listing Lifecycle</p>
                  <h2 className="heading-3">Manage your listings</h2>
                </div>
                <span className="tag tag-indigo">{myListings.length} active</span>
              </div>

              {listingsError && <p style={{ fontSize: '0.875rem', color: 'var(--c-red)', marginBottom: 10 }}>{listingsError}</p>}

              {listingsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}><div className="spinner" /></div>
              ) : myListings.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px' }}>
                  <p style={{ fontWeight: 600, color: 'var(--c-text-3)', marginBottom: 4 }}>No landlord listings yet</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--c-text-4)' }}>Create one from the list property page, then update or remove it here.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }} className="landlord-listings-grid">
                  {myListings.map((listing) => (
                    <div key={listing.id} className="surface-subtle" style={{ padding: 14 }}>
                      <p style={{ fontWeight: 700, marginBottom: 6, color: 'var(--c-text)' }}>{listing.address}</p>
                      <p style={{ fontSize: '0.84rem', color: 'var(--c-text-3)', marginBottom: 12 }}>
                        £{Number(listing.rent || 0).toLocaleString()} · {listing.bedrooms || '-'} bed · {listing.bathrooms || '-'} bath
                      </p>

                      {editingId === listing.id ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                          <input className="input" value={editForm.address} onChange={onEditField('address')} placeholder="Address" />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <input className="input" type="number" value={editForm.rent} onChange={onEditField('rent')} placeholder="Rent" />
                            <input className="input" type="number" value={editForm.deposit} onChange={onEditField('deposit')} placeholder="Deposit" />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <input className="input" type="number" value={editForm.bedrooms} onChange={onEditField('bedrooms')} placeholder="Bedrooms" />
                            <input className="input" type="number" value={editForm.bathrooms} onChange={onEditField('bathrooms')} placeholder="Bathrooms" />
                          </div>
                          <textarea className="input" rows={2} value={editForm.description} onChange={onEditField('description')} placeholder="Description" style={{ resize: 'vertical' }} />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
                            <button className="btn btn-white btn-sm" onClick={() => setEditingId('')}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-white btn-sm" onClick={() => startEdit(listing)}>Edit</button>
                          <button className="btn btn-white btn-sm" style={{ color: 'var(--c-red)' }} onClick={() => removeMyListing(listing.id)}>Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

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
      <style>{`@media(max-width:900px){.favs-grid{grid-template-columns:repeat(2,1fr)!important;}.journey-stats-grid{grid-template-columns:repeat(2,1fr)!important;}.landlord-listings-grid{grid-template-columns:1fr!important;}}@media(max-width:500px){.favs-grid{grid-template-columns:1fr!important;}.journey-stats-grid{grid-template-columns:1fr!important;}}`}</style>
    </div>
  )
}
