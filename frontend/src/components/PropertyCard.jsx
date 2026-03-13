import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BedDouble, Bath, Train, Heart, MapPin } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { addFavorite, removeFavorite } from '../services/api'

// Curated London property images — consistent, high quality
const IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=640&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=640&q=80&auto=format&fit=crop',
]

function hashId(value) {
  return String(value || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
}

const getImage = (id) => IMAGES[hashId(id) % IMAGES.length]

const fmt = (rent) => rent ? `£${Number(rent).toLocaleString()}/mo` : 'POA'

export default function PropertyCard({ property, index = 0, isFavorited = false, onFavoriteChange }) {
  const { user } = useAuth()
  const [faved, setFaved] = useState(isFavorited)
  const [favLoading, setFavLoading] = useState(false)

  const onFav = async (e) => {
    e.preventDefault()
    if (!user || favLoading) return
    setFavLoading(true)
    try {
      if (faved) { await removeFavorite(property.id); setFaved(false) }
      else { await addFavorite(property.id); setFaved(true) }
      onFavoriteChange?.()
    } finally { setFavLoading(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.3 }}
      className="card card-hover"
      style={{ overflow: 'hidden' }}
    >
      <Link to={`/properties/${property.id}`} style={{ textDecoration: 'none', display: 'block' }}>
        {/* Image */}
        <div style={{ position: 'relative', height: 200, overflow: 'hidden', background: 'var(--c-surface-2)' }}>
          <img
            src={getImage(property.id)}
            alt={property.address || 'Property'}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
          {/* Subtle scrim at bottom only */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />

          {/* Rent — bottom left, white on dark */}
          <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
            <span style={{
              fontSize: '0.9375rem', fontWeight: 700, color: '#fff',
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}>
              {fmt(property.rent)}
            </span>
          </div>

          {/* Favourite — top right */}
          {user && (
            <button
              onClick={onFav}
              style={{
                position: 'absolute', top: 10, right: 10,
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Heart size={15} fill={faved ? '#DC2626' : 'none'} color={faved ? '#DC2626' : '#374151'} />
            </button>
          )}

          {/* Property type — top left */}
          {property.property_type && (
            <div style={{ position: 'absolute', top: 10, left: 10 }}>
              <span style={{
                padding: '3px 9px', borderRadius: 6,
                background: 'rgba(255,255,255,0.9)',
                fontSize: '0.7rem', fontWeight: 700, color: 'var(--c-text-2)',
                letterSpacing: '0.02em',
              }}>
                {property.property_type}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ padding: '16px 18px' }}>
          {/* Address */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 10 }}>
            <MapPin size={13} color="var(--c-indigo)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{
              fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-text)',
              lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {property.address || 'London, UK'}
            </p>
          </div>

          {/* Feature row — clean, minimal icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 10, borderTop: '1px solid var(--c-border)' }}>
            {property.bedrooms != null && (
              <span style={featStyle}>
                <BedDouble size={12} color="var(--c-text-4)" />
                {Number(property.bedrooms).toFixed(0)} bed
              </span>
            )}
            {property.bathrooms != null && (
              <span style={featStyle}>
                <Bath size={12} color="var(--c-text-4)" />
                {Number(property.bathrooms).toFixed(0)} bath
              </span>
            )}
            {property.avg_distance_to_nearest_station != null && (
              <span style={{ ...featStyle, marginLeft: 'auto', color: 'var(--c-green)' }}>
                <Train size={12} color="var(--c-green)" />
                {Number(property.avg_distance_to_nearest_station).toFixed(1)} km
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

const featStyle = {
  display: 'flex', alignItems: 'center', gap: 5,
  fontSize: '0.8rem', fontWeight: 500, color: 'var(--c-text-3)',
}
