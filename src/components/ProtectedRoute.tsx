import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, type StaffRole } from '../context/authContext'

type ProtectedRouteProps = {
    allowedRoles: StaffRole[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center py-20">
                <p className="text-neutral-400">
                    در حال بررسی وضعیت ورود...
                </p>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (!allowedRoles.includes(user.role)) {
        if (user.role === 'admin') {
            return <Navigate to="/appointments" replace />
        }

        return <Navigate to="/barber/appointments" replace />
    }

    return <Outlet />
}