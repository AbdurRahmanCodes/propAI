import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

const Home = lazy(() => import('./pages/Home'))
const Properties = lazy(() => import('./pages/Properties'))
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'))
const Recommendations = lazy(() => import('./pages/Recommendations'))
const Compare = lazy(() => import('./pages/Compare'))
const Usability = lazy(() => import('./pages/Usability'))
const ListProperty = lazy(() => import('./pages/ListProperty'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const SystemArchitecture = lazy(() => import('./pages/SystemArchitecture'))

function AdminRoute({ children }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin' && user.role !== 'landlord') {
    return <Navigate to="/" replace />
  }

  return children
}

function RouteFallback() {
  return (
    <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-4)', fontSize: '0.95rem' }}>
      Loading page…
    </div>
  )
}

function ScrollToTop() {
  const { pathname, search } = useLocation()

  // Keep navigation predictable: every route change starts at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search])

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/"              element={<Home />} />
                <Route path="/properties"    element={<Properties />} />
                <Route path="/properties/:id" element={<PropertyDetail />} />
                <Route path="/recommend"     element={<Recommendations />} />
                <Route path="/compare"       element={<Compare />} />
                <Route path="/usability"     element={<Usability />} />
                <Route path="/list"          element={<ListProperty />} />
                <Route path="/login"         element={<Login />} />
                <Route path="/register"      element={<Register />} />
                <Route path="/profile"       element={<Profile />} />
                <Route path="/admin"         element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/system"        element={<SystemArchitecture />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
