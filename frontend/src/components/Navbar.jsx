import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard, PlusCircle } from 'lucide-react'
import { Sparkle, Compass as CompassPh, Robot, ArrowsLeftRight } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'

const PRIMARY_NAV = [
  { to: '/properties', label: 'Discover', icon: CompassPh },
  { to: '/recommend', label: 'AI Match', icon: Robot },
  { to: '/compare', label: 'Compare', icon: ArrowsLeftRight },
]

const SECONDARY_NAV = [
  { to: '/system', label: 'Research' },
]

export default function Navbar() {
  const { user, logout, isLandlord, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
    setUserOpen(false)
  }, [location])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (to) => location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  return (
    <>
      <motion.header
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: scrolled ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${scrolled ? '#E5E7EB' : 'rgba(229,231,235,0.68)'}`,
          transition: 'background 0.25s, border-color 0.25s',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 24 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, var(--c-indigo) 0%, #14B8A6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 22px rgba(15,118,110,0.24)' }}>
              <Sparkle size={16} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.0625rem', color: 'var(--c-text)', letterSpacing: '-0.01em' }}>
              Prop<span style={{ color: 'var(--c-indigo)' }}>AI</span>
            </span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }} className="hidden-mobile">
            <Link to="/" style={homeLinkStyle(isActive('/') && location.pathname === '/')}>
              <span style={{ fontWeight: 700 }}>Home</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--c-text-4)' }}>Start here</span>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 4, background: 'rgba(255,255,255,0.74)', border: '1px solid rgba(229,231,235,0.9)', borderRadius: 999 }}>
              {PRIMARY_NAV.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} style={journeyLinkStyle(isActive(to))}>
                  <Icon size={14} /> {label}
                </Link>
              ))}
            </div>

            {SECONDARY_NAV.map(({ to, label }) => (
              <Link key={to} to={to} style={navLinkStyle(isActive(to))}>{label}</Link>
            ))}

          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 }} className="hidden-mobile">
            {user ? (
              <>
                {isLandlord && <Link to="/list" className="btn btn-ghost btn-sm">List Property</Link>}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setUserOpen(!userOpen)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                      background: 'rgba(255,255,255,0.74)', border: '1px solid var(--c-border)',
                      borderRadius: 999, cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--c-indigo)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                      {user.username[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-text-2)' }}>{user.username}</span>
                    <ChevronDown size={14} color="var(--c-text-4)" style={{ transition: 'transform 0.2s', transform: userOpen ? 'rotate(180deg)' : 'none' }} />
                  </button>

                  <AnimatePresence>
                    {userOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                          width: 220, background: '#fff',
                          border: '1px solid var(--c-border)', borderRadius: 16,
                          boxShadow: '0 16px 36px rgba(0,0,0,0.12)', overflow: 'hidden',
                          zIndex: 200,
                        }}
                      >
                        <div style={{ padding: '12px 16px 6px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: isLandlord ? '#ECFDF5' : '#EEF2FF', border: `1px solid ${isLandlord ? '#A7F3D0' : '#C7D2FE'}`, fontSize: '0.72rem', fontWeight: 700, color: isLandlord ? '#065F46' : '#4338CA' }}>
                            {isLandlord ? 'Landlord account' : 'Tenant account'}
                          </span>
                        </div>
                        {[
                          { to: '/profile', icon: User, label: 'My Profile' },
                          ...(isAdmin ? [{ to: '/admin', icon: LayoutDashboard, label: 'Dashboard' }] : []),
                          ...(isLandlord ? [{ to: '/list', icon: PlusCircle, label: 'List Property' }] : []),
                        ].map(({ to, icon: Icon, label }) => (
                          <Link key={to} to={to} style={dropdownItemStyle}>
                            <Icon size={14} /> {label}
                          </Link>
                        ))}
                        <div style={{ height: 1, background: 'var(--c-border)', margin: '4px 0' }} />
                        <button
                          onClick={() => { logout(); navigate('/') }}
                          style={{ ...dropdownItemStyle, width: '100%', border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer', textAlign: 'left' }}
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Create Account</Link>
              </>
            )}
          </div>

          <button
            className="show-mobile"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ marginLeft: 'auto', padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text)' }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
              background: '#fff', borderBottom: '1px solid var(--c-border)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Link to="/" style={mobileNavStyle(location.pathname === '/')}>Home</Link>
              {PRIMARY_NAV.map(({ to, label }) => (
                <Link key={to} to={to} style={mobileNavStyle(isActive(to))}>{label}</Link>
              ))}
              {SECONDARY_NAV.map(({ to, label }) => (
                <Link key={to} to={to} style={mobileNavStyle(isActive(to))}>{label}</Link>
              ))}
              {isLandlord && <Link to="/list" style={mobileNavStyle(isActive('/list'))}>List Property</Link>}
              {isAdmin && <Link to="/admin" style={mobileNavStyle(isActive('/admin'))}>Dashboard</Link>}
              <div style={{ height: 1, background: 'var(--c-border)', margin: '8px 0' }} />
              {user ? (
                <button onClick={() => { logout(); navigate('/') }} style={{ ...mobileNavStyle(false), background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: '#DC2626' }}>
                  Sign Out
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <Link to="/login" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Sign In</Link>
                  <Link to="/register" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Create Account</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hidden-mobile { display: flex; }
        .show-mobile   { display: none; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: block !important; }
        }
      `}</style>
    </>
  )
}

const navLinkStyle = (active) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 12px',
  borderRadius: 8,
  fontSize: '0.875rem',
  fontWeight: active ? 600 : 500,
  color: active ? 'var(--c-indigo)' : 'var(--c-text-3)',
  background: active ? 'var(--c-indigo-light)' : 'transparent',
  textDecoration: 'none',
  transition: 'all 0.15s',
})

const homeLinkStyle = (active) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '6px 2px',
  textDecoration: 'none',
  color: active ? 'var(--c-text)' : 'var(--c-text-3)',
})

const journeyLinkStyle = (active) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '8px 14px',
  borderRadius: 999,
  fontSize: '0.86rem',
  fontWeight: 700,
  color: active ? '#fff' : 'var(--c-text-2)',
  background: active ? 'linear-gradient(135deg, var(--c-indigo) 0%, #14B8A6 100%)' : 'transparent',
  textDecoration: 'none',
  boxShadow: active ? '0 10px 22px rgba(15,118,110,0.22)' : 'none',
  transition: 'all 0.18s ease',
})

const dropdownItemStyle = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 16px',
  fontSize: '0.875rem', fontWeight: 500,
  color: 'var(--c-text-2)', textDecoration: 'none',
  transition: 'background 0.1s',
}

const mobileNavStyle = (active) => ({
  display: 'block',
  padding: '10px 12px',
  borderRadius: 8,
  fontSize: '0.9375rem',
  fontWeight: active ? 600 : 500,
  color: active ? 'var(--c-indigo)' : 'var(--c-text-2)',
  background: active ? 'var(--c-indigo-light)' : 'transparent',
  textDecoration: 'none',
})
