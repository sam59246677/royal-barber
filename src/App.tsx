
import { lazy, Suspense } from 'react'
import { Route, Routes, Link } from 'react-router-dom'
import { Scissors } from 'lucide-react'

import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/authContext'

const Home = lazy(() => import('./pages/Home'))
const Services = lazy(() => import('./pages/Services'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Contact = lazy(() => import('./pages/Contact'))
const Booking = lazy(() => import('./pages/Booking'))
const Appointments = lazy(() => import('./pages/Appointments'))
const AdminServices = lazy(() => import('./pages/AdminServices'))
const AdminBarbers = lazy(() => import('./pages/AdminBarbers'))
const Login = lazy(() => import('./pages/Login'))
const BarberAppointments = lazy(() => import('./pages/BarberAppointments'))

function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">صفحه پیدا نشد</h1>
      <p className="mt-4 text-neutral-400">آدرس واردشده معتبر نیست.</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-lg bg-gold px-5 py-3 font-bold text-black"
      >
        بازگشت به صفحه اصلی
      </Link>
    </section>
  )
}

function PageLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-gold">در حال بارگذاری صفحه...</p>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-barber text-neutral-100">
      <Header />

      <main className="flex-1">
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/admin/services" element={<AdminServices />} />
              <Route path="/admin/barbers" element={<AdminBarbers />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['barber']} />}>
              <Route path="/barber/appointments" element={<BarberAppointments />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <Scissors className="text-gold" size={20} />
            رویال <span className="text-gold">باربر</span>
          </Link>

          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} رویال باربر
          </p>

          <Link to="/booking" className="text-sm text-gold hover:text-gold-light">
            رزرو نوبت
          </Link>

          {!loading && user?.role === 'admin' && (
            <>
              <Link to="/appointments" className="text-sm text-gold hover:text-gold-light">
                مدیریت نوبت‌ها
              </Link>

              <Link to="/admin/services" className="text-sm text-gold hover:text-gold-light">
                مدیریت خدمات
              </Link>

              <Link to="/admin/barbers" className="text-sm text-gold hover:text-gold-light">
                مدیریت کارکنان
              </Link>
            </>
          )}

          {!loading && user?.role === 'barber' && (
            <Link to="/barber/appointments" className="text-sm text-gold hover:text-gold-light">
              نوبت‌های من
            </Link>
          )}
        </div>
      </footer>
    </div>
  )
}
