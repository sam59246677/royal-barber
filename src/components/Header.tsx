
import { Scissors } from 'lucide-react'
import { useAuth } from '../context/authContext'
import { NavLink, useNavigate } from 'react-router-dom'

const links = [
  { to: '/', label: 'صفحه اصلی', end: true },
  { to: '/services', label: 'خدمات' },
  { to: '/gallery', label: 'نمونه‌کارها' },
  { to: '/contact', label: 'تماس با ما' },
]

export default function Header() {

  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('خطا در خروج از حساب:', error)
    }
  }
  return (

    <header className="border-b border-white/10 bg-barber">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex shrink-0 items-center gap-2" aria-label="رویال باربر، صفحه اصلی" >
          <Scissors className="text-gold" size={28} />
          <span className="text-lg font-bold tracking-wide sm:text-xl">
            رویال <span className="text-gold">باربر</span>
          </span>
        </NavLink>

        <nav aria-label="منوی اصلی" className="flex items-center gap-3 text-xs sm:gap-6 sm:text-sm" >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap transition-colors ${isActive
                  ? '!text-gold font-bold'
                  : 'text-neutral-300 hover:!text-gold'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {!loading && user?.role === 'admin' && (
            <>
              <NavLink to="/appointments">
                مدیریت نوبت‌ها
              </NavLink>

              <NavLink to="/admin/services">
                مدیریت خدمات
              </NavLink>

              <NavLink to="/admin/barbers">
                مدیریت آرایشگران
              </NavLink>
            </>
          )}

          {!loading && user?.role === 'barber' && (
            <NavLink to="/barber/appointments">
              نوبت‌های من
            </NavLink>
          )}

          {!loading && !user && (
            <NavLink to="/login">
              ورود کارکنان
            </NavLink>
          )}

          {!loading && user && (
            <button
              onClick={handleLogout}
              className="whitespace-nowrap text-sm text-neutral-300 transition-colors hover:text-gold"
            >
              خروج ({user.username})
            </button>
          )}
        </nav>

        <NavLink to="/booking" className="hidden shrink-0 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-black transition hover:bg-gold-light sm:inline-flex">
          رزرو نوبت
        </NavLink>
      </div>
    </header>
  )
}