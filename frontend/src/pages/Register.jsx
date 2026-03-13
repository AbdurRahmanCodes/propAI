import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeSlash, Sparkle, Key, House } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [role, setRole] = useState('tenant')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError(''); setLoading(true)
    try { await register(form.username, form.email, form.password, role); navigate('/') }
    catch (err) { setError(err?.response?.data?.detail || 'Registration failed — username may already exist.') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-layout">
      <div className="auth-panel">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 440 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 28 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--c-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkle size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Sora', fontWeight: 800, fontSize: '1.125rem', color: 'var(--c-text)', letterSpacing: '-0.01em' }}>
              Prop<span style={{ color: 'var(--c-indigo)' }}>AI</span>
            </span>
          </Link>

          <div className="soft-panel" style={{ padding: '36px 32px' }}>
            <h1 className="heading-2" style={{ marginBottom: 6 }}>Create your account</h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--c-text-3)', marginBottom: 24 }}>Choose the role that fits your journey so the platform can surface the right tools.</p>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--c-text-2)', marginBottom: 8 }}>I am a…</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { val: 'tenant', icon: Key, label: 'Tenant', desc: 'Search & save properties' },
                  { val: 'landlord', icon: House, label: 'Landlord', desc: 'List & manage properties' },
                ].map(({ val, icon: Icon, label, desc }) => (
                  <button key={val} type="button" onClick={() => setRole(val)}
                    style={{ flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                      border: role === val ? '2px solid var(--c-indigo)' : '1px solid var(--c-border)',
                      background: role === val ? 'var(--c-indigo-light)' : 'var(--c-surface)',
                    }}>
                    <Icon size={16} color={role === val ? 'var(--c-indigo)' : 'var(--c-text-4)'} style={{ margin: '0 auto 4px' }} />
                    <p style={{ fontWeight: 700, fontSize: '0.8rem', color: role === val ? 'var(--c-indigo)' : 'var(--c-text-2)' }}>{label}</p>
                    <p style={{ fontSize: '0.68rem', color: role === val ? 'var(--c-indigo)' : 'var(--c-text-4)' }}>{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'username', label: 'Username', type: 'text', ph: 'jane_doe' },
                { key: 'email', label: 'Email', type: 'email', ph: 'jane@example.com' },
              ].map(({ key, label, type, ph }) => (
                <div key={key}>
                  <label style={lbl}>{label}</label>
                  <input type={type} placeholder={ph} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required className="input" />
                </div>
              ))}
              <div>
                <label style={lbl}>Password <span style={{ fontWeight: 400, color: 'var(--c-text-4)' }}>(min 6 chars)</span></label>
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
                {loading ? <span style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin .65s linear infinite' }} /> : `Create ${role === 'landlord' ? 'Landlord' : 'Tenant'} Account`}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--c-text-3)', marginTop: 20 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--c-indigo)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
      <aside className="auth-aside">
        <span className="eyebrow-pill">Create an account</span>
        <h2 style={{ fontFamily: 'Sora', fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 800, lineHeight: 1.05, marginTop: 20, marginBottom: 18, letterSpacing: '-0.03em' }}>
          Start as a tenant or a landlord with a clearer first-run flow.
        </h2>
        <p style={{ maxWidth: 520, color: 'rgba(255,255,255,0.68)', lineHeight: 1.8 }}>
          Tenants can browse, compare, and save. Landlords can create direct listings and expose contact details. The product now makes those branches explicit from the start.
        </p>
        <div className="auth-points">
          {['Tenant accounts focus on discovery and saved properties', 'Landlord accounts unlock direct property listing tools', 'Both roles keep access to research and recommendation views'].map((point) => (
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
