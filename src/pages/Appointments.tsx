
import { useEffect, useState } from 'react'
import { CalendarClock, RefreshCw, XCircle } from 'lucide-react'
import DateObject from 'react-date-object'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'



import gregorian from 'react-date-object/calendars/gregorian'
import english from 'react-date-object/locales/gregorian_en'


const API_URL = '/api/admin/appointments'
const BARBERS_API_URL = '/api/barbers'

type Barber = {
    id: string
    name: string
    phone: string
    active: boolean
}

type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled'

type Appointment = {
    id: string
    customer_id: string
    customer_name: string
    customer_phone: string
    service_id: string
    service_name: string
    price: string | number
    duration: number
    barber_id: string
    barber_name: string
    appointment_start: string
    appointment_end: string
    status: AppointmentStatus
    created_at: string
    updated_at: string
}

function toPersianDigits(value: string | number) {
    return String(value).replace(
        /\d/g,
        (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)],
    )
}

function toEnglishDigits(value: string) {
    return value
        .replace(/[۰-۹]/g, (digit) =>
            String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)),
        )
        .replace(/[٠-٩]/g, (digit) =>
            String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)),
        )
}

// استخراج تاریخ و ساعت بر اساس منطقه زمانی تهران
function getTehranDateTime(value: string) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Tehran',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(new Date(value))

    const getPart = (type: string) =>
        parts.find((part) => part.type === type)?.value ?? ''

    const year = getPart('year')
    const month = getPart('month')
    const day = getPart('day')
    const hour = getPart('hour')
    const minute = getPart('minute')

    return {
        gregorianDate: `${year}-${month}-${day}`,
        time: `${hour}:${minute}`,
    }
}

// تبدیل تاریخ میلادی به شمسی
function getJalaliDate(gregorianDate: string) {
    return new DateObject({
        date: gregorianDate,
        calendar: gregorian,
        locale: english,
    })
        .convert(persian, persian_fa)
        .format('YYYY/MM/DD')
}

function getStatusLabel(status: AppointmentStatus) {
    switch (status) {
        case 'confirmed':
            return 'تأییدشده'
        case 'completed':
            return 'تکمیل‌شده'
        case 'cancelled':
            return 'لغوشده'
        default:
            return status
    }
}

async function fetchAppointments(): Promise<Appointment[]> {
    const response = await fetch(API_URL, {
        credentials: 'include',
    })

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('برای مشاهده نوبت‌ها ابتدا وارد حساب مدیریت شوید.')
        }

        if (response.status === 403) {
            throw new Error('شما اجازه مشاهده نوبت‌های مدیریت را ندارید.')
        }

        throw new Error('دریافت نوبت‌ها ناموفق بود.')
    }

    const data: {
        count: number
        appointments: Appointment[]
    } = await response.json()

    return data.appointments
}

async function fetchBarbers(): Promise<Barber[]> {
    const response = await fetch(BARBERS_API_URL, {
        credentials: 'include',
    })

    if (!response.ok) {
        throw new Error('دریافت آرایشگرها ناموفق بود.')
    }

    return response.json()
}

export default function Appointments() {

    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [search, setSearch] = useState('')
    const [selectedBarber, setSelectedBarber] = useState('all')
    const [selectedDate, setSelectedDate] = useState('')

    const [barbers, setBarbers] = useState<Barber[]>([])
    const [barbersError, setBarbersError] = useState('')

    const [updatingId, setUpdatingId] = useState<string | null>(null)

    async function loadAppointments() {
        setLoading(true)
        setError('')

        try {
            const data = await fetchAppointments()
            setAppointments(data)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'دریافت نوبت‌ها انجام نشد.',
            )
        } finally {
            setLoading(false)
        }
    }

    async function cancelAppointment(id: string) {
        const confirmed = window.confirm(
            'آیا مطمئن هستید که می‌خواهید این نوبت را لغو کنید؟',
        )

        if (!confirmed) return

        setUpdatingId(id)
        setError('')

        try {
            const response = await fetch(`${API_URL}/${id}/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'cancelled',
                }),
            })

            const data = await response.json().catch(() => null)

            if (!response.ok) {
                throw new Error(
                    data?.message || 'لغو نوبت انجام نشد.',
                )
            }

            // دریافت مجدد اطلاعات از دیتابیس
            await loadAppointments()
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'لغو نوبت انجام نشد. لطفاً دوباره تلاش کنید.',
            )
        } finally {
            setUpdatingId(null)
        }
    }



    useEffect(() => {
        let isActive = true

        async function loadInitialAppointments() {
            try {
                const data = await fetchAppointments()

                if (isActive) {
                    setAppointments(data)
                }
            } catch (err) {
                if (isActive) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'دریافت نوبت‌ها انجام نشد.',
                    )
                }
            } finally {
                if (isActive) {
                    setLoading(false)
                }
            }
        }

        async function loadInitialBarbers() {
            try {
                const data = await fetchBarbers()

                if (isActive) {
                    setBarbers(data)
                }
            } catch {
                if (isActive) {
                    setBarbersError('دریافت فهرست آرایشگرها انجام نشد.')
                }
            }
        }

        void loadInitialAppointments()
        void loadInitialBarbers()

        return () => {
            isActive = false
        }
    }, [])

    const selectedGregorianDate = selectedDate
    ? selectedDate
    : ''

    const filteredAppointments = appointments.filter((appointment) => {
        const normalizedSearch = toEnglishDigits(search.trim()).toLowerCase()
        const normalizedPhone = toEnglishDigits(appointment.customer_phone)

        const matchesSearch =
            appointment.customer_name.toLowerCase().includes(normalizedSearch) ||
            normalizedPhone.includes(normalizedSearch)

        const matchesBarber =
            selectedBarber === 'all' ||
            appointment.barber_id === selectedBarber

        const appointmentDate = getTehranDateTime(
            appointment.appointment_start,
        ).gregorianDate

        const matchesDate =
            !selectedGregorianDate ||
            appointmentDate === selectedGregorianDate

        return matchesSearch && matchesBarber && matchesDate
    })



    return (
        <section
            dir="rtl"
            className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
        >
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black">مدیریت نوبت‌ها</h1>
                    <p className="mt-3 text-neutral-400">
                        فهرست نوبت‌های ثبت‌شده در آرایشگاه
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadAppointments()}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gold/40 px-4 py-3 text-gold hover:bg-gold/10 disabled:opacity-50"
                >
                    <RefreshCw size={18} />
                    بروزرسانی
                </button>
            </div>

            <div className="mb-6 rounded-xl border border-white/10 bg-barber-card p-5">
                <p className="text-sm text-neutral-400">
                    تعداد کل نوبت‌های فیلترشده
                </p>

                <p className="mt-2 text-3xl font-black text-gold">
                    {toPersianDigits(filteredAppointments.length)}
                </p>
            </div>

            <div className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-barber-card p-5 sm:grid-cols-3">
                <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="جست‌وجوی نام یا موبایل"
                    className="w-full rounded-lg border border-white/10 bg-barber p-3 text-white focus:border-gold focus:outline-none"
                />

                {barbersError && (
                    <p role="alert" className="text-sm text-red-400">
                        {barbersError}
                    </p>
                )}

                <select
                    value={selectedBarber}
                    onChange={(event) => setSelectedBarber(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-barber p-3 text-white focus:border-gold focus:outline-none"
                >
                    <option value="all">همه آرایشگرها</option>

                    {barbers.map((barber) => (
                        <option key={barber.id} value={barber.id}>
                            {barber.name}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-barber p-3 text-white focus:border-gold focus:outline-none"
                />
            </div>

            {loading && (
                <p className="py-10 text-center text-neutral-400">
                    در حال دریافت نوبت‌ها...
                </p>
            )}

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
                >
                    {error}

                    <button
                        type="button"
                        onClick={() => void loadAppointments()}
                        className="mr-3 underline"
                    >
                        تلاش مجدد
                    </button>
                </div>
            )}

            {!loading && !error && appointments.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-barber-card px-5 py-12 text-center">
                    <CalendarClock
                        className="mx-auto text-gold"
                        size={40}
                    />

                    <p className="mt-4 font-bold">
                        هنوز نوبتی ثبت نشده است.
                    </p>

                    <p className="mt-2 text-sm text-neutral-400">
                        پس از ثبت اولین نوبت، اطلاعات آن در این صفحه نمایش داده می‌شود.
                    </p>
                </div>
            )}

            {!loading && !error && filteredAppointments.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredAppointments.map((appointment) => {
                        const dateTime = getTehranDateTime(
                            appointment.appointment_start,
                        )

                        return (
                            <article
                                key={appointment.id}
                                className="rounded-xl border border-white/10 bg-barber-card p-5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="text-lg font-bold">
                                        {appointment.customer_name}
                                    </h2>

                                    <span className="rounded-md bg-gold/10 px-2 py-1 text-xs text-gold">
                                        {toPersianDigits(dateTime.time)}
                                    </span>
                                </div>

                                <div className="mt-4 space-y-3 text-sm">
                                    <p className="text-neutral-300">
                                        <span className="text-neutral-500">
                                            شماره موبایل:{' '}
                                        </span>

                                        <span dir="ltr" className="inline-block">
                                            {toPersianDigits(
                                                appointment.customer_phone,
                                            )}
                                        </span>
                                    </p>

                                    <p>
                                        <span className="text-neutral-500">
                                            خدمت:{' '}
                                        </span>
                                        {appointment.service_name}
                                    </p>

                                    <p>
                                        <span className="text-neutral-500">
                                            آرایشگر:{' '}
                                        </span>
                                        {appointment.barber_name}
                                    </p>

                                    <p>
                                        <span className="text-neutral-500">
                                            تاریخ:{' '}
                                        </span>
                                        {getJalaliDate(dateTime.gregorianDate)}
                                    </p>

                                    <p>
                                        <span className="text-neutral-500">
                                            وضعیت:{' '}
                                        </span>

                                        <span
                                            className={
                                                appointment.status === 'confirmed'
                                                    ? 'text-green-400'
                                                    : appointment.status === 'completed'
                                                        ? 'text-blue-400'
                                                        : 'text-red-400'
                                            }
                                        >
                                            {getStatusLabel(appointment.status)}
                                        </span>
                                    </p>

                                    {appointment.status === 'confirmed' && (
                                        <div className="mt-5 border-t border-white/10 pt-4">
                                            <button
                                                type="button"
                                                disabled={updatingId === appointment.id}
                                                onClick={() =>
                                                    void cancelAppointment(appointment.id)
                                                }
                                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <XCircle size={18} />

                                                {updatingId === appointment.id
                                                    ? 'در حال لغو...'
                                                    : 'لغو نوبت'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </article>
                        )
                    })}
                </div>
            )}

            {!loading &&
                !error &&
                appointments.length > 0 &&
                filteredAppointments.length === 0 && (
                    <p className="rounded-xl border border-white/10 bg-barber-card p-8 text-center text-neutral-400">
                        نوبتی با این مشخصات پیدا نشد.
                    </p>
                )}
        </section>
    )
}