
import { useCallback, useEffect, useState } from 'react'
import { CalendarClock, RefreshCw } from 'lucide-react'
import DateObject from 'react-date-object'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import DatePicker from 'react-multi-date-picker'
import gregorian from 'react-date-object/calendars/gregorian'
import english from 'react-date-object/locales/gregorian_en'
import { useAuth } from '../context/authContext'

const API_URL = '/api/barber/appointments'

type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled'

type Appointment = {
    id: string
    customer_name: string
    customer_phone: string
    service_name: string
    price: string | number
    duration: number
    appointment_start: string
    appointment_end: string
    status: AppointmentStatus
}

type AppointmentsResponse = {
    count: number
    appointments: Appointment[]
}

type ApiError = {
    message?: string
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

async function getErrorMessage(response: Response) {
    try {
        const data: ApiError = await response.json()

        if (data.message) {
            return data.message
        }
    } catch {
        // پاسخ سرور JSON معتبر نداشت.
    }

    if (response.status === 403) {
        return 'شما اجازه مشاهده این نوبت‌ها را ندارید.'
    }

    if (response.status >= 500) {
        return 'خطای داخلی سرور رخ داده است.'
    }

    return 'دریافت نوبت‌ها ناموفق بود.'
}

export default function BarberAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedDate, setSelectedDate] = useState<DateObject | null>(null)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [actionError, setActionError] = useState('')

    const { refreshUser } = useAuth()

    const loadAppointments = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const response = await fetch(API_URL, {
                credentials: 'include',
            })

            if (response.status === 401) {
                await refreshUser()
                throw new Error(
                    'نشست شما معتبر نیست. لطفاً دوباره وارد شوید.',
                )
            }

            if (!response.ok) {
                throw new Error(await getErrorMessage(response))
            }

            const data: AppointmentsResponse = await response.json()

            setAppointments(data.appointments)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'دریافت نوبت‌ها انجام نشد.',
            )
        } finally {
            setLoading(false)
        }
    }, [refreshUser])

    useEffect(() => {
        let isActive = true

        async function fetchAppointments() {
            try {
                const response = await fetch(API_URL, {
                    credentials: 'include',
                })

                if (response.status === 401) {
                    await refreshUser()

                    throw new Error(
                        'نشست شما معتبر نیست. لطفاً دوباره وارد شوید.',
                    )
                }

                if (!response.ok) {
                    throw new Error(await getErrorMessage(response))
                }

                const data: AppointmentsResponse = await response.json()

                if (isActive) {
                    setAppointments(data.appointments)
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

        void fetchAppointments()

        return () => {
            isActive = false
        }
    }, [refreshUser])

    async function updateAppointmentStatus(
        appointmentId: string,
        status: 'completed' | 'cancelled',
    ) {
        const actionLabel =
            status === 'completed' ? 'تکمیل' : 'لغو'

        if (
            status === 'cancelled' &&
            !window.confirm('آیا از لغو این نوبت مطمئن هستید؟')
        ) {
            return
        }

        setUpdatingId(appointmentId)
        setActionError('')

        try {
            const response = await fetch(
                `${API_URL}/${appointmentId}/status`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status }),
                },
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data.message || `امکان ${actionLabel} نوبت وجود ندارد.`,
                )
            }

            setAppointments((currentAppointments) =>
                currentAppointments.map((appointment) =>
                    appointment.id === appointmentId
                        ? {
                            ...appointment,
                            status: data.appointment.status,
                        }
                        : appointment,
                ),
            )
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : 'تغییر وضعیت نوبت ناموفق بود.',
            )
        } finally {
            setUpdatingId(null)
        }
    }

    const selectedGregorianDate = selectedDate
        ? toEnglishDigits(
            new DateObject(selectedDate)
                .convert(gregorian, english)
                .format('YYYY-MM-DD'),
        )
        : ''

    const filteredAppointments = appointments.filter((appointment) => {
        const appointmentDate = getTehranDateTime(
            appointment.appointment_start,
        ).gregorianDate

        return (
            !selectedGregorianDate ||
            appointmentDate === selectedGregorianDate
        )
    })

    return (
        <section
            dir="rtl"
            className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
        >
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black">
                        نوبت‌های من
                    </h1>

                    <p className="mt-3 text-neutral-400">
                        فهرست نوبت‌های ثبت‌شده برای شما
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

            <div className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-barber-card p-5 sm:grid-cols-2">
                <DatePicker
                    value={selectedDate}
                    onChange={(value: DateObject | null) =>
                        setSelectedDate(value)
                    }
                    calendar={persian}
                    locale={persian_fa}
                    format="YYYY/MM/DD"
                    digits={['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']}
                    calendarPosition="bottom-right"
                    inputClass="w-full rounded-lg border border-white/10 bg-barber p-3 text-white focus:border-gold focus:outline-none"
                    placeholder="فیلتر بر اساس تاریخ شمسی"
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

            {!loading && !error && (
                <div className="mb-6 rounded-xl border border-white/10 bg-barber-card p-5">
                    <p className="text-sm text-neutral-400">
                        تعداد نوبت‌های شما
                    </p>

                    <p className="mt-2 text-3xl font-black text-gold">
                        {toPersianDigits(filteredAppointments.length)}
                    </p>
                </div>
            )}

            {!loading && !error && appointments.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-barber-card px-5 py-12 text-center">
                    <CalendarClock
                        className="mx-auto text-gold"
                        size={40}
                    />

                    <p className="mt-4 font-bold">
                        هنوز نوبتی برای شما ثبت نشده است.
                    </p>
                </div>
            )}

            {actionError && (
                <div
                    role="alert"
                    className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
                >
                    {actionError}
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
                                            مدت خدمت:{' '}
                                        </span>
                                        {toPersianDigits(appointment.duration)} دقیقه
                                    </p>

                                    <p>
                                        <span className="text-neutral-500">
                                            قیمت:{' '}
                                        </span>
                                        {toPersianDigits(
                                            Number(appointment.price).toLocaleString('en-US'),
                                        )} تومان
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
                                        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void updateAppointmentStatus(
                                                        appointment.id,
                                                        'completed',
                                                    )
                                                }
                                                disabled={updatingId === appointment.id}
                                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {updatingId === appointment.id
                                                    ? 'در حال ثبت...'
                                                    : 'تکمیل نوبت'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    void updateAppointmentStatus(
                                                        appointment.id,
                                                        'cancelled',
                                                    )
                                                }
                                                disabled={updatingId === appointment.id}
                                                className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                لغو نوبت
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
                        در تاریخ انتخاب‌شده نوبتی ندارید.
                    </p>
                )}
        </section>
    )
}
