import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeSlash, Sparkle } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await login(form.username, form.password); navigate('/') }
    catch { setError('Invalid username or password.') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-layout">
      <div className="auth-panel">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 420 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 28 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--c-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkle size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1.125rem', color: 'var(--c-text)', letterSpacing: '-0.01em' }}>
              Prop<span style={{ color: 'var(--c-indigo)' }}>AI</span>
            </span>
          </Link>

          <div className="soft-panel" style={{ padding: '36px 32px' }}>
            <h1 className="heading-2" style={{ marginBottom: 6 }}>Welcome back</h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--c-text-3)', marginBottom: 28 }}>Sign in to continue browsing, saving, and managing your rental journey.</p>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Username</label>
                <input type="text" placeholder="your_username" value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required className="input" />
              </div>
              <div>
                <label style={lbl}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} placeholder="••••••••" value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required className="input" style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-4)', padding: 0 }}>
                    {showPwd ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && <p style={{ fontSize: '0.875rem', color: 'var(--c-red)', marginTop: -4 }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', width: '100%', marginTop: 4 }}>
                {loading ? <><span style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin .65s linear infinite' }} /></> : 'Sign In'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--c-text-3)', marginTop: 20 }}>
              No account?{' '}
              <Link to="/register" style={{ color: 'var(--c-indigo)', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
            </p>
          </div>
        </motion.div>
      </div>
      <aside className="auth-aside">
        <span className="eyebrow-pill">Sign in</span>
        <h2 style={{ fontFamily: 'Sora', fontSize: 'clamp(2rem,4vw,3.25rem)', fontWeight: 800, lineHeight: 1.05, marginTop: 20, marginBottom: 18, letterSpacing: '-0.03em' }}>
          Return to your shortlist, not just your account.
        </h2>
        <p style={{ maxWidth: 520, color: 'rgba(255,255,255,0.68)', lineHeight: 1.8 }}>
          Saved properties, AI recommendations, and landlord flows now sit inside one clearer platform journey instead of isolated screens.
        </p>
        <div className="auth-points">
          {['Resume browsing and favorites quickly', 'Access landlord listing tools if your role allows it', 'Keep research comparison and AI matching in the same product flow'].map((point) => (
            <div key={point} className="auth-point">
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--c-sand-deep)', marginTop: 8, flexShrink: 0 }} />
              <p style={{ color: 'rgba(255,255,255,0.8)' }}>{point}</p>
            </div>
          ))}
        </div>
      </aside>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const lbl = { display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-2)', marginBottom: 7 }
