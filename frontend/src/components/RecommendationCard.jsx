import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { CheckCircle2, MapPin, BedDouble, Bath, Train } from 'lucide-react'

const fmt = (rent) => rent ? `£${Number(rent).toLocaleString()}/mo` : 'POA'

// SVG circular score ring
function ScoreRing({ score, size = 72 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = score >= 85 ? '#059669' : score >= 70 ? '#0F766E' : '#D97706'

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={5} />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - filled }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color, lineHeight: 1 }}>{score}%</span>
        <span style={{ fontSize: '0.55rem', color: 'var(--c-text-4)', fontWeight: 600, letterSpacing: '0.04em', marginTop: 2 }}>MATCH</span>
      </div>
    </div>
  )
}

export default function RecommendationCard({ result, index = 0 }) {
  const score = result.similarity_score || 0
  const explanations = result.explanation || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className="card"
      style={{ overflow: 'hidden' }}
    >
      {/* Top: rank indicator + property info + score ring */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 20px 16px' }}>
        {/* Rank circle */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'var(--c-indigo)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, marginTop: 2,
        }}>
          {index + 1}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Property type chip — one tag only */}
          {result.property?.property_type && (
            <span className="tag tag-gray" style={{ marginBottom: 6, display: 'inline-flex' }}>
              {result.property.property_type}
            </span>
          )}
          {/* Address */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 4 }}>
            <MapPin size={13} color="var(--c-indigo)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--c-text)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {result.address || 'London Property'}
            </p>
          </div>
          {/* Rent */}
          <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--c-indigo)', letterSpacing: '-0.01em' }}>
            {fmt(result.rent)}
          </p>
          {/* Feature mini-row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            {result.bedrooms != null && <span style={miniStat}><BedDouble size={11} color="var(--c-text-4)" /> {Number(result.bedrooms).toFixed(0)} bed</span>}
            {result.bathrooms != null && <span style={miniStat}><Bath size={11} color="var(--c-text-4)" /> {Number(result.bathrooms).toFixed(0)} bath</span>}
            {result.avg_distance_to_nearest_station != null && <span style={{ ...miniStat, color: 'var(--c-green)' }}><Train size={11} color="var(--c-green)" /> {Number(result.avg_distance_to_nearest_station).toFixed(1)} km</span>}
          </div>
        </div>

        {/* Score ring */}
        <ScoreRing score={score} />
      </div>

      {/* Bottom: match bar + explanation chips */}
      <div style={{ padding: '14px 20px 18px', borderTop: '1px solid var(--c-border)', background: 'var(--c-surface-2)' }}>
        {/* Match bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-text-4)', letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0 }}>Why recommended</span>
          <div className="match-bar" style={{ flex: 1 }}>
            <motion.div
              className="match-fill"
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ delay: index * 0.08 + 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Explanation chips — clean, compact */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {explanations.map((r, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 20,
              background: '#ECFDF5', border: '1px solid #A7F3D0',
              fontSize: '0.75rem', fontWeight: 600, color: '#065F46',
            }}>
              <CheckCircle2 size={11} color="#059669" />
              {r}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

const miniStat = {
  display: 'flex', alignItems: 'center', gap: 4,
  fontSize: '0.78rem', fontWeight: 500, color: 'var(--c-text-3)',
}
