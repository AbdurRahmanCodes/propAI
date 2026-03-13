import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlusCircle, House } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { createListing } from '../services/api'

const lbl = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text-2)', marginBottom: 6 }

const PROPERTY_TYPES = ['Apartment', 'Flat', 'House', 'Studio', 'End of Terrace', 'Maisonette', 'Bungalow', 'Detached', 'Semi-Detached', 'Terraced']
const FURNISH_TYPES = ['Furnished', 'Unfurnished', 'Part furnished', 'Furnished or unfurnished, landlord is flexible']

export default function ListProperty() {
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!user) return <Navigate to="/login" />
  if (user.role !== 'landlord') return <Navigate to="/" />

  const [form, setForm] = useState({
    address: '', rent: '', deposit: '',
    bedrooms: 1, bathrooms: 1,
    property_type: 'Apartment', furnish_type: 'Unfurnished',
    let_type: 'Long term', avg_distance_to_nearest_station: '',
    description: '', contact_email: user.email || '', contact_phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await createListing({
        ...form,
        rent: +form.rent,
        deposit: form.deposit ? +form.deposit : undefined,
        avg_distance_to_nearest_station: form.avg_distance_to_nearest_station
          ? +form.avg_distance_to_nearest_station : undefined,
      })
      setSuccess(true)
      setTimeout(() => navigate('/properties'), 2000)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create listing.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="soft-panel" style={{ padding: '48px', textAlign: 'center', maxWidth: 420 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <PlusCircle size={28} color="#10B981" />
        </div>
        <h2 className="heading-2" style={{ marginBottom: 6 }}>Listing Created!</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--c-text-3)' }}>Your property has been listed. Redirecting to properties...</p>
      </div>
    </div>
  )

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="container" style={{ maxWidth: 1100 }}>
          <div className="page-hero-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 0.85fr)' }}>
            <div>
              <span className="eyebrow-pill"><House size={12} /> Landlord listing flow</span>
              <h1 className="heading-display" style={{ marginTop: 18, marginBottom: 16 }}>Create a direct-to-tenant listing with clear contact details.</h1>
              <p className="hero-kicker">
                This form is now positioned as a guided publishing flow, not a raw admin screen. Add essential property facts, then expose the contact method tenants need.
              </p>
            </div>
            <div className="hero-side-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, padding: '8px 12px', background: 'rgba(16,185,129,0.16)', borderRadius: 10, border: '1px solid rgba(167,243,208,0.28)', width: 'fit-content' }}>
                <House size={14} color="#6EE7B7" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D1FAE5' }}>Landlord account: {user.username}</span>
              </div>
              <div className="flow-note">
                Listings created here remain first-class property records in the platform and can expose direct contact information on the detail page.
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="page-content">
        <div className="container" style={{ maxWidth: 920, padding: '0 24px 80px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="soft-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, padding: '8px 12px', background: '#ECFDF5', borderRadius: 8, border: '1px solid #A7F3D0', width: 'fit-content' }}>
              <House size={14} color="#059669" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065F46' }}>Landlord Account — {user.username}</span>
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={lbl}>Full Address <span style={{ color: 'var(--c-red)' }}>*</span></label>
                <input type="text" className="input" placeholder="e.g. 42 Baker Street, London, W1U 7BW" value={form.address} onChange={set('address')} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Monthly Rent (£) <span style={{ color: 'var(--c-red)' }}>*</span></label>
                  <input type="number" className="input" placeholder="2500" value={form.rent} onChange={set('rent')} min="100" required />
                </div>
                <div>
                  <label style={lbl}>Deposit (£)</label>
                  <input type="number" className="input" placeholder="2875" value={form.deposit} onChange={set('deposit')} min="0" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Bedrooms <span style={{ color: 'var(--c-red)' }}>*</span></label>
                  <input type="number" className="input" value={form.bedrooms} onChange={set('bedrooms')} min="1" max="10" required />
                </div>
                <div>
                  <label style={lbl}>Bathrooms <span style={{ color: 'var(--c-red)' }}>*</span></label>
                  <input type="number" className="input" value={form.bathrooms} onChange={set('bathrooms')} min="1" max="10" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Property Type</label>
                  <select className="input" value={form.property_type} onChange={set('property_type')} style={{ cursor: 'pointer' }}>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Furnished Status</label>
                  <select className="input" value={form.furnish_type} onChange={set('furnish_type')} style={{ cursor: 'pointer' }}>
                    {FURNISH_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Let Type</label>
                  <select className="input" value={form.let_type} onChange={set('let_type')} style={{ cursor: 'pointer' }}>
                    <option value="Long term">Long term</option>
                    <option value="Short term">Short term</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Avg. Distance to Station (km)</label>
                  <input type="number" step="0.1" className="input" placeholder="0.4" value={form.avg_distance_to_nearest_station} onChange={set('avg_distance_to_nearest_station')} min="0.1" max="15" />
                </div>
              </div>

              <div>
                <label style={lbl}>Property Description</label>
                <textarea rows={4} className="input" placeholder="Describe the property, available amenities, and any special conditions..." value={form.description} onChange={set('description')} style={{ resize: 'vertical', height: 90 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>Contact Email</label>
                  <input type="email" className="input" placeholder="landlord@example.com" value={form.contact_email} onChange={set('contact_email')} />
                </div>
                <div>
                  <label style={lbl}>Contact Phone</label>
                  <input type="text" className="input" placeholder="07xxx xxxxxx" value={form.contact_phone} onChange={set('contact_phone')} />
                </div>
              </div>

              {error && <p style={{ fontSize: '0.875rem', color: 'var(--c-red)' }}>{error}</p>}

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                {loading
                  ? <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin .65s linear infinite' }} />
                  : <><PlusCircle size={15} /> Create Listing</>}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
