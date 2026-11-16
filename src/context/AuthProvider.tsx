
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type StaffUser } from './authContext'

const API_URL = '/api/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<StaffUser | null>(null)
    const [loading, setLoading] = useState(true)

    // بررسی Session هنگام بارگذاری برنامه
    useEffect(() => {
        async function checkAuth() {
            try {
                const response = await fetch(`${API_URL}/me`, {
                    credentials: 'include',
                })

                if (!response.ok) {
                    setUser(null)
                    return
                }

                const data = await response.json()
                setUser(data.user)
            } catch {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        void checkAuth()
    }, [])

    // ورود مدیر یا آرایشگر
    const login = useCallback(
        async (username: string, password: string) => {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'ورود ناموفق بود.')
            }

            setUser(data.user)

            return data.user as StaffUser
        },
        [],
    )

    // خروج از حساب
    const logout = useCallback(async () => {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include',
        })

        if (!response.ok) {
            const data = await response.json().catch(() => null)
            throw new Error(data?.message || 'خروج از حساب ناموفق بود.')
        }

        setUser(null)
    }, [])

    // بررسی دوباره اعتبار نشست
    const refreshUser = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/me`, {
                credentials: 'include',
            })

            if (response.status === 401) {
                setUser(null)
                return
            }

            if (!response.ok) {
                throw new Error('بررسی وضعیت حساب کاربری ناموفق بود.')
            }

            const data = await response.json()
            setUser(data.user)
        } catch (error) {
            console.error('خطا در بررسی وضعیت کاربر:', error)
        }
    }, [])

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
