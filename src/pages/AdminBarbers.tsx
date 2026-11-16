
import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, Power } from 'lucide-react'

const API_URL = '/api/admin/barbers'

type Barber = {
    id: string
    name: string
    phone: string | null
    active: boolean
    left_at: string | null
}

function toPersianDigits(value: string | number) {
    return String(value).replace(
        /\d/g,
        (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]
    )
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(value))
}

export default function AdminBarbers() {
    const [barbers, setBarbers] = useState<Barber[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [newBarber, setNewBarber] = useState({
        name: '',
        phone: '',
    })

    const [adding, setAdding] = useState(false)
    const [message, setMessage] = useState('')
    const [editingBarber, setEditingBarber] = useState<Barber | null>(null)
    const [editForm, setEditForm] = useState({
        name: '',
        phone: '',
    })
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

    async function addBarber(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const name = newBarber.name.trim()
        const phone = newBarber.phone.trim()

        if (!name) {
            setError('نام آرایشگر را وارد کنید.')
            return
        }

        setAdding(true)
        setError('')
        setMessage('')

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'افزودن آرایشگر ناموفق بود.')
            }

            const savedBarber: Barber = data.barber

            setBarbers((current) => [...current, savedBarber])

            setNewBarber({
                name: '',
                phone: '',
            })

            setMessage(`آرایشگر «${name}» با موفقیت اضافه شد.`)
        } catch {
            setError('افزودن آرایشگر انجام نشد.')
        } finally {
            setAdding(false)
        }
    }

    function startEditing(barber: Barber) {
        setEditingBarber(barber)

        setEditForm({
            name: barber.name,
            phone: barber.phone || '',
        })

        setError('')
        setMessage('')
    }

    async function updateBarber(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!editingBarber) return

        const name = editForm.name.trim()
        const phone = editForm.phone.trim()

        if (!name) {
            setError('نام آرایشگر را وارد کنید.')
            return
        }

        setError('')
        setMessage('')

        try {
            const response = await fetch(`${API_URL}/${editingBarber.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'ویرایش آرایشگر ناموفق بود.')
            }

            const savedBarber: Barber = data.barber

            setBarbers((current) =>
                current.map((item) =>
                    item.id === savedBarber.id ? savedBarber : item
                )
            )

            setEditingBarber(null)
            setEditForm({ name: '', phone: '' })

            setMessage(`اطلاعات ${name} با موفقیت ویرایش شد.`)
        } catch {
            setError('ویرایش اطلاعات آرایشگر انجام نشد.')
        }
    }

    async function toggleBarberStatus(barber: Barber) {
        if (barber.left_at || updatingStatusId) return

        const nextActive = !barber.active

        const confirmed = window.confirm(
            nextActive
                ? `آیا می‌خواهید ${barber.name} را دوباره فعال کنید؟`
                : `آیا می‌خواهید ${barber.name} را موقتاً غیرفعال کنید؟ حساب کاربری او نیز غیرفعال خواهد شد.`
        )

        if (!confirmed) return

        setUpdatingStatusId(barber.id)
        setError('')
        setMessage('')

        try {
            const response = await fetch(
                `${API_URL}/${barber.id}/active`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        active: nextActive,
                    }),
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data.message || 'تغییر وضعیت آرایشگر انجام نشد.'
                )
            }

            const savedBarber: Barber = data.barber

            setBarbers((current) =>
                current.map((item) =>
                    item.id === savedBarber.id ? savedBarber : item
                )
            )

            setMessage(
                nextActive
                    ? `${barber.name} دوباره فعال شد. حساب کاربری او همچنان غیرفعال است.`
                    : `${barber.name} موقتاً غیرفعال شد و حساب کاربری او نیز غیرفعال شد.`
            )
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'تغییر وضعیت آرایشگر انجام نشد.'
            )
        } finally {
            setUpdatingStatusId(null)
        }
    }

    async function removeBarber(barber: Barber) {
        if (barber.left_at) {
            setError('خروج دائمی این آرایشگر قبلاً ثبت شده است.')
            return
        }

        const confirmed = window.confirm(
            `آیا مطمئن هستید که می‌خواهید خروج دائمی ${barber.name} را ثبت کنید؟`
        )

        if (!confirmed) return

        setError('')
        setMessage('')

        try {
            const response = await fetch(
                `${API_URL}/${barber.id}/leave`,
                {
                    method: 'PATCH',
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'ثبت خروج ناموفق بود.')
            }

            const savedBarber: Barber = data.barber

            setBarbers((current) =>
                current.map((item) =>
                    item.id === savedBarber.id ? savedBarber : item
                )
            )

            setMessage(`خروج دائمی ${barber.name} با موفقیت ثبت شد.`)
        } catch {
            setError('ثبت خروج دائمی انجام نشد. لطفاً دوباره تلاش کنید.')
        }
    }

    useEffect(() => {
        let isActive = true

        async function fetchBarbers() {
            try {
                const response = await fetch(API_URL)

                if (!response.ok) {
                    throw new Error('دریافت اطلاعات ناموفق بود.')
                }

                const data: { count: number; barbers: Barber[] } =
                    await response.json()

                if (isActive) {
                    setBarbers(data.barbers)
                }
            } catch {
                if (isActive) {
                    setError('دریافت اطلاعات آرایشگران انجام نشد.')
                }
            } finally {
                if (isActive) {
                    setLoading(false)
                }
            }
        }

        void fetchBarbers()

        return () => {
            isActive = false
        }
    }, [])

    if (loading) {
        return (
            <div className="py-20 text-center text-neutral-400">
                در حال دریافت اطلاعات...
            </div>
        )
    }

    if (error && barbers.length === 0) {
        return (
            <div className="py-20 text-center text-red-400">
                {error}
            </div>
        )
    }

    return (
        <section className="mx-auto max-w-7xl px-4 py-12">
            <h1 className="mb-8 text-3xl font-bold">
                مدیریت آرایشگران
            </h1>

            <form
                onSubmit={addBarber}
                className="mb-8 rounded-2xl border border-white/10 bg-neutral-900 p-6"
            >
                <h2 className="mb-5 text-xl font-bold">
                    افزودن آرایشگر جدید
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                    <input
                        type="text"
                        placeholder="نام آرایشگر"
                        value={newBarber.name}
                        onChange={(event) =>
                            setNewBarber((current) => ({
                                ...current,
                                name: event.target.value,
                            }))
                        }
                        className="rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 outline-none focus:border-gold"
                        required
                    />

                    <input
                        type="tel"
                        placeholder="شماره تماس"
                        value={newBarber.phone}
                        onChange={(event) =>
                            setNewBarber((current) => ({
                                ...current,
                                phone: toPersianDigits(event.target.value),
                            }))
                        }
                        className="rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 outline-none focus:border-gold"
                    />
                </div>

                <button
                    type="submit"
                    disabled={adding}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 font-bold text-black hover:bg-gold-light disabled:opacity-50"
                >
                    <Plus size={18} />
                    افزودن آرایشگر
                </button>
            </form>

            {editingBarber && (
                <form
                    onSubmit={updateBarber}
                    className="mb-8 rounded-2xl border border-gold/30 bg-neutral-900 p-6"
                >
                    <h2 className="mb-5 text-xl font-bold">
                        ویرایش اطلاعات {editingBarber.name}
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <input
                            type="text"
                            placeholder="نام آرایشگر"
                            value={editForm.name}
                            onChange={(event) =>
                                setEditForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                            className="rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 outline-none focus:border-gold"
                            required
                        />

                        <input
                            type="tel"
                            placeholder="شماره تماس"
                            value={editForm.phone}
                            onChange={(event) =>
                                setEditForm((current) => ({
                                    ...current,
                                    phone: toPersianDigits(event.target.value),
                                }))
                            }
                            className="rounded-xl border border-white/10 bg-neutral-800 px-4 py-3 outline-none focus:border-gold"
                        />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <button
                            type="submit"
                            className="rounded-xl bg-gold px-5 py-3 font-bold text-black hover:bg-gold-light"
                        >
                            ذخیره تغییرات
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setEditingBarber(null)
                                setEditForm({ name: '', phone: '' })
                                setError('')
                            }}
                            className="rounded-xl border border-white/10 px-5 py-3 text-neutral-300 hover:bg-white/5"
                        >
                            انصراف
                        </button>
                    </div>
                </form>
            )}

            {error && (
                <p role="alert" className="mb-5 text-sm text-red-400">
                    {error}
                </p>
            )}

            {message && (
                <p role="status" className="mb-5 text-sm text-green-400">
                    {message}
                </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {barbers.map((barber) => (
                    <div
                        key={barber.id}
                        className="rounded-2xl border border-white/10 bg-neutral-900 p-6"
                    >
                        <h2 className="mb-3 text-xl font-bold">
                            {barber.name}
                        </h2>

                        <p className="mb-3 text-sm text-neutral-400">
                            شماره تماس: {barber.phone
                                ? toPersianDigits(barber.phone)
                                : 'ثبت نشده'}
                        </p>

                        {barber.left_at ? (
                            <div className="mb-4">
                                <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-400">
                                    کارمند سابق
                                </span>

                                <p className="mt-3 text-sm text-neutral-400">
                                    تاریخ خروج: {formatDate(barber.left_at)}
                                </p>
                            </div>
                        ) : (
                            <span
                                className={
                                    barber.active
                                        ? 'mb-4 inline-block rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400'
                                        : 'mb-4 inline-block rounded-full bg-yellow-500/10 px-3 py-1 text-sm text-yellow-400'
                                }
                            >
                                {barber.active ? 'فعال' : 'غیرفعال موقت'}
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={() => startEditing(barber)}
                            className="mb-3 flex w-full items-center gap-2 rounded-lg bg-gold/10 px-4 py-2 text-sm text-gold transition hover:bg-gold/20"
                        >
                            <Pencil size={16} />
                            ویرایش اطلاعات
                        </button>

                        {!barber.left_at && (
                            <button
                                type="button"
                                disabled={updatingStatusId !== null}
                                onClick={() => void toggleBarberStatus(barber)}
                                className={
                                    barber.active
                                        ? 'mb-3 flex w-full items-center gap-2 rounded-lg bg-yellow-500/10 px-4 py-2 text-sm text-yellow-400 transition hover:bg-yellow-500/20 disabled:opacity-50'
                                        : 'mb-3 flex w-full items-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400 transition hover:bg-green-500/20 disabled:opacity-50'
                                }
                            >
                                <Power size={16} />
                                {updatingStatusId === barber.id
                                    ? 'در حال تغییر وضعیت...'
                                    : barber.active
                                        ? 'غیرفعال کردن موقت'
                                        : 'فعال کردن مجدد'}
                            </button>
                        )}

                        <button
                            type="button"
                            disabled={Boolean(barber.left_at)}
                            onClick={() => void removeBarber(barber)}
                            className="flex w-full items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <Trash2 size={16} />
                            {barber.left_at ? 'خروج ثبت شده' : 'خروج دائمی'}
                        </button>
                    </div>
                ))}
            </div>
        </section>
    )
}
