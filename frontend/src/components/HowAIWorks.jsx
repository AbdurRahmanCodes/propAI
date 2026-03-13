import { motion } from 'framer-motion'
import { CursorClick, Stack, ArrowsLeftRight, ListNumbers, ArrowRight } from '@phosphor-icons/react'

const STEPS = [
  {
    n: '01',
    icon: CursorClick,
    title: 'Enter Preferences',
    desc: 'Tell us your budget, bedroom count, bathrooms, and max station distance.',
    accent: 'var(--c-indigo)',
    bg: 'var(--c-indigo-light)',
  },
  {
    n: '02',
    icon: Stack,
    title: 'Feature Vector',
    desc: 'Inputs are encoded into a 6-dimensional vector and normalised using MinMaxScaler.',
    accent: '#7C3AED',
    bg: '#F5F3FF',
  },
  {
    n: '03',
    icon: ArrowsLeftRight,
    title: 'Cosine Similarity',
    desc: 'The engine measures the angle between your vector and all 3,406 property vectors.',
    accent: '#0EA5E9',
    bg: '#F0F9FF',
  },
  {
    n: '04',
    icon: ListNumbers,
    title: 'Ranked Results',
    desc: 'Top properties ranked by match score with a full explanation of why each was chosen.',
    accent: 'var(--c-green)',
    bg: 'var(--c-green-light)',
  },
]

export default function HowAIWorks() {
  return (
    <section style={{ padding: '96px 0', background: 'var(--c-bg)' }}>
      <div className="container" style={{ maxWidth: 1200 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: 64 }}
        >
          <p className="label" style={{ marginBottom: 12 }}>AI Transparency</p>
          <h2 className="heading-1" style={{ marginBottom: 16, maxWidth: 560, margin: '0 auto 16px' }}>
            How the recommendation engine works
          </h2>
          <p className="body-lg" style={{ maxWidth: 520, margin: '0 auto' }}>
            Content-based filtering powered by cosine similarity — no black box, no guessing.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 2 }}>
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  padding: '36px 32px',
                  background: 'var(--c-surface)',
                  border: '1px solid var(--c-border)',
                  borderRadius: i === 0 ? '16px 0 0 16px' : i === STEPS.length - 1 ? '0 16px 16px 0' : '0',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Step number — large faded background */}
                <div style={{
                  position: 'absolute', top: -8, right: 16,
                  fontSize: '5rem', fontWeight: 900, color: 'rgba(17,24,39,0.18)',
                  fontFamily: 'Sora', lineHeight: 1, userSelect: 'none',
                  pointerEvents: 'none',
                }}>
                  {step.n}
                </div>

                {/* Icon */}
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: step.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Icon size={22} color={step.accent} />
                </div>

                <h3 className="heading-3" style={{ marginBottom: 8 }}>{step.title}</h3>
                <p className="body-md">{step.desc}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Data flow pill */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}
        >
          {['User Inputs', 'Feature Vector', 'MinMaxScaler', 'cosine_similarity()', 'Top 5 + Explanations'].map((s, i, arr) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                padding: '5px 12px', borderRadius: 6,
                background: 'var(--c-surface)', border: '1px solid var(--c-border)',
                fontSize: '0.8125rem', fontWeight: i === arr.length - 1 ? 700 : 500,
                color: i === arr.length - 1 ? 'var(--c-indigo)' : 'var(--c-text-3)',
                fontFamily: i >= 2 ? 'monospace' : 'inherit',
              }}>
                {s}
              </span>
              {i < arr.length - 1 && <ArrowRight size={14} color="var(--c-border-strong)" />}
            </span>
          ))}
        </motion.div>

        {/* Model stats */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ marginTop: 20, textAlign: 'center' }}
        >
          <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-4)' }}>
            6 features · MinMaxScaler normalisation · Precision@5 = 0.622 · 3,406 London properties
          </p>
        </motion.div>
      </div>
    </section>
  )
}
