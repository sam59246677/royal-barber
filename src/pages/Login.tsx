
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LockKeyhole, Scissors, User } from 'lucide-react'
import { useAuth } from '../context/authContext'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setError('')
        setSubmitting(true)

        try {
            const user = await login(username.trim(), password)

            if (user.role === 'admin') {
                navigate('/appointments', { replace: true })
            } else {
                navigate('/barber/appointments', { replace: true })
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'ورود انجام نشد. دوباره تلاش کنید.',
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <section dir="rtl" className="flex flex-1 items-center justify-center px-4 py-16">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-barber-card p-7 shadow-xl sm:p-9">
                <div className="mb-8 text-center">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gold/10">
                        <Scissors className="text-gold" size={30} />
                    </div>

                    <h1 className="mt-5 text-2xl font-black">
                        ورود کارکنان
                    </h1>

                    <p className="mt-2 text-sm text-neutral-400">
                        برای ورود به پنل کاربری، اطلاعات خود را وارد کنید.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="username" className="mb-2 block text-sm font-medium" >
                            نام کاربری
                        </label>

                        <div className="relative">
                            <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"/>
                            <input
                                id="username"
                                type="text"
                                autoComplete="username"
                                required
                                maxLength={50}
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder="نام کاربری"
                                className="w-full rounded-lg border border-white/10 bg-barber py-3 pl-3 pr-10 text-white outline-none transition focus:border-gold"
                            />
                        </div>
                    </div>

                    <div>
                        <label  htmlFor="password" className="mb-2 block text-sm font-medium">
                            رمز عبور
                        </label>

                        <div className="relative">
                            <LockKeyhole size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"/>

                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                maxLength={200}
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="رمز عبور"
                                className="w-full rounded-lg border border-white/10 bg-barber py-3 pl-10 pr-10 text-white outline-none transition focus:border-gold"
                            />
                        </div>
                    </div>

                    {error && (
                        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || !username.trim() || !password}
                        className="w-full rounded-lg bg-gold px-4 py-3 font-bold text-black transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? 'در حال ورود...' : 'ورود به حساب'}
                    </button>
                </form>
            </div>
        </section>
    )
}