
import { createContext, useContext } from 'react'

export type StaffRole = 'admin' | 'barber'

export type StaffUser = {
    id: string
    username: string
    role: StaffRole
    barberId: string | null
}

export type AuthContextType = {
    user: StaffUser | null
    loading: boolean
    login: (username: string, password: string) => Promise<StaffUser>
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

// دسترسی به اطلاعات احراز هویت در کامپوننت‌ها
export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth باید داخل AuthProvider استفاده شود.')
    }

    return context
}
