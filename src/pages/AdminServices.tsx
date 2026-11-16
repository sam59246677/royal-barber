
import { useEffect, useState } from 'react'
import { Save, RefreshCw, Plus } from 'lucide-react'

const API_URL = '/api/admin/services'

type Service = {
    id: string
    name: string
    price: number
    duration: number
    active: boolean
}

type ServiceResponse = {
    message: string
    service: Service
}

type ServicesResponse = {
    count: number
    services: Service[]
}

function normalizeNumber(value: string) {
    return value
        .replace(/[۰-۹]/g, digit =>
            String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))
        )
        .replace(/[٠-٩]/g, digit =>
            String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
        )
        .replace(/[٬,،\s]/g, '')
}

function formatNumber(value: string | number) {
    const number = Number(normalizeNumber(String(value)))

    if (!Number.isFinite(number)) return ''

    return new Intl.NumberFormat('fa-IR').format(number)
}

async function readResponse<T>(response: Response): Promise<T> {
    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.message || 'عملیات ناموفق بود.')
    }

    return data as T
}

export default function AdminServices() {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState<string | null>(null)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const [newService, setNewService] = useState({
        name: '',
        price: '',
        duration: '',
    })

    const [addingService, setAddingService] = useState(false)

    // دریافت خدمات

    async function loadServices() {
        setLoading(true)
        setError('')
        setMessage('')

        try {
            const response = await fetch(API_URL, {
                credentials: 'include',
            })

            const data = await readResponse<ServicesResponse>(response)

            setServices(
                data.services.map(service => ({
                    ...service,
                    price: Number(service.price),
                    duration: Number(service.duration),
                }))
            )
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'دریافت خدمات ناموفق بود.'
            )
        } finally {
            setLoading(false)
        }
    }



    useEffect(() => {
        let isActive = true

        async function fetchServices() {
            try {
                const response = await fetch(API_URL, {
                    credentials: 'include',
                })

                const data = await readResponse<ServicesResponse>(response)

                if (isActive) {
                    setServices(
                        data.services.map(service => ({
                            ...service,
                            price: Number(service.price),
                            duration: Number(service.duration),
                        }))
                    )
                }
            } catch (error) {
                if (isActive) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : 'دریافت خدمات ناموفق بود.'
                    )
                }
            } finally {
                if (isActive) {
                    setLoading(false)
                }
            }
        }

        void fetchServices()

        return () => {
            isActive = false
        }
    }, [])


    // تغییر اطلاعات خدمت در فرم
    function updateService(
        id: string,
        field: 'name' | 'price' | 'duration',
        value: string,
    ) {
        setServices(current =>
            current.map(service => {
                if (service.id !== id) return service

                return {
                    ...service,
                    [field]: field === 'name'
                        ? value
                        : value === ''
                            ? ''
                            : Number(normalizeNumber(value)),
                } as Service
            })
        )
        console.log('Field changed:', field, 'Value:', value)

        setMessage('')
        setError('')
    }

    // اعتبارسنجی اطلاعات خدمت
    function validateService(service: Service) {
        if (!service.name.trim()) {
            return 'نام خدمت را وارد کنید.'
        }

        if (
            !Number.isSafeInteger(service.price) ||
            service.price < 0
        ) {
            return 'قیمت باید یک عدد صحیح و غیرمنفی باشد.'
        }

        if (
            !Number.isSafeInteger(service.duration) ||
            service.duration <= 0
        ) {
            return 'مدت‌زمان باید عدد صحیح و بزرگ‌تر از صفر باشد.'
        }

        return null
    }

    // ذخیره تغییرات خدمت
    async function saveService(service: Service) {
        console.log('Service before save:', service)

        console.log('Name:', service.name, typeof service.name)

        console.log('Price:', service.price, typeof service.price)

        console.log('Duration:', service.duration, typeof service.duration)
        console.log('Duration before save:', service.duration, typeof service.duration)
        const validationError = validateService(service)

        if (validationError) {
            setError(validationError)
            return
        }

        setSavingId(service.id)
        setError('')
        setMessage('')

        try {
            const response = await fetch(`${API_URL}/${service.id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: service.name.trim(),
                    price: service.price,
                    duration: service.duration,
                }),
            })

            const data = await readResponse<ServiceResponse>(response)

            const updatedService = data.service

            setServices(current =>
                current.map(item =>
                    item.id === updatedService.id
                        ? updatedService
                        : item
                )
            )


            setMessage(data.message)
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'ذخیره اطلاعات خدمت ناموفق بود.'
            )
        } finally {
            setSavingId(null)
        }
    }

    // فعال یا غیرفعال کردن خدمت
    async function toggleService(service: Service) {
        setSavingId(service.id)
        setError('')
        setMessage('')

        try {
            const response = await fetch(
                `${API_URL}/${service.id}/active`,
                {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        active: !service.active,
                    }),
                }
            )

            const data = await readResponse<ServiceResponse>(response)

            setServices(current =>
                current.map(item =>
                    item.id === service.id
                        ? data.service
                        : item
                )
            )

            setMessage(data.message)
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'تغییر وضعیت خدمت ناموفق بود.'
            )
        } finally {
            setSavingId(null)
        }
    }

    // افزودن خدمت جدید
    async function addService(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const name = newService.name.trim()
        const priceText = normalizeNumber(newService.price)
        const durationText = normalizeNumber(newService.duration)

        if (!name || !priceText || !durationText) {
            setError('لطفاً تمام اطلاعات خدمت را وارد کنید.')
            return
        }

        const price = Number(priceText)
        const duration = Number(durationText)

        if (
            !Number.isSafeInteger(price) ||
            price < 0 ||
            !Number.isSafeInteger(duration) ||
            duration <= 0
        ) {
            setError('قیمت و مدت‌زمان باید عدد معتبر باشند.')
            return
        }

        setAddingService(true)
        setError('')
        setMessage('')

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    price,
                    duration,
                }),
            })

            const data = await readResponse<ServiceResponse>(response)

            setServices(current => [
                data.service,
                ...current,
            ])

            setNewService({
                name: '',
                price: '',
                duration: '',
            })

            setMessage(data.message)
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'افزودن خدمت ناموفق بود.'
            )
        } finally {
            setAddingService(false)
        }
    }

    return (
        <section
            dir="rtl"
            className="mx-auto max-w-4xl px-4 py-12 sm:px-6"
        >
            <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black">
                        مدیریت قیمت و خدمات
                    </h1>

                    <p className="mt-3 text-neutral-400">
                        قیمت‌ها را تغییر بده و ذخیره کن.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => void loadServices()}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg border border-gold/40 px-4 py-3 text-gold disabled:opacity-50"
                >
                    <RefreshCw size={18} />
                    بروزرسانی
                </button>
            </div>

            {loading && (
                <p className="py-8 text-center text-neutral-400">
                    در حال دریافت خدمات...
                </p>
            )}

            {error && (
                <p
                    role="alert"
                    className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300"
                >
                    {error}
                </p>
            )}

            {message && (
                <p
                    role="status"
                    className="mb-5 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-300"
                >
                    {message}
                </p>
            )}

            {!loading && services.length === 0 && !error && (
                <p className="rounded-xl border border-white/10 bg-barber-card p-6 text-neutral-400">
                    خدمتی پیدا نشد.
                </p>
            )}

            <form
                onSubmit={addService}
                className="mb-8 rounded-xl border border-gold/30 bg-barber-card p-5"
            >
                <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-gold">
                    <Plus size={22} />
                    افزودن خدمت جدید
                </h2>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <label className="mb-2 block text-sm text-neutral-300">
                            نام خدمت
                        </label>

                        <input
                            type="text"
                            value={newService.name}
                            onChange={event =>
                                setNewService(current => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                            placeholder="مثلاً رنگ مو"
                            className="w-full rounded-lg border border-white/10 bg-barber p-3 text-white"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-neutral-300">
                            قیمت (تومان)
                        </label>

                        <input
                            type="text"
                            inputMode="numeric"
                            value={formatNumber(newService.price)}
                            onChange={event =>
                                setNewService(current => ({
                                    ...current,
                                    price: event.target.value,
                                }))
                            }
                            placeholder="300000"
                            className="w-full rounded-lg border border-white/10 bg-barber p-3 text-white"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-neutral-300">
                            مدت‌زمان (دقیقه)
                        </label>

                        <input
                            type="text"
                            inputMode="numeric"
                            value={formatNumber(newService.duration)}
                            onChange={event =>
                                setNewService(current => ({
                                    ...current,
                                    duration: event.target.value,
                                }))
                            }
                            placeholder="30"
                            className="w-full rounded-lg border border-white/10 bg-barber p-3 text-white"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={addingService}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 font-bold text-black hover:bg-gold-light disabled:opacity-50"
                >
                    <Plus size={18} />
                    {addingService ? 'در حال افزودن...' : 'افزودن خدمت'}
                </button>
            </form>

            <div className="space-y-4">
                {services.map(service => (
                    <article
                        key={service.id}
                        className="rounded-xl border border-white/10 bg-barber-card p-5"
                    >
                        <div
                            className={`mb-4 rounded-2xl border p-5 transition-colors ${service.active
                                ? 'border-gray-700 bg-gray-900'
                                : 'border-red-900/50 bg-gray-950 opacity-70'
                                }`}
                        >
                            <div className="mb-4">
                                <label
                                    htmlFor={`name-${service.id}`}
                                    className="mb-2 block text-sm text-neutral-300"
                                >
                                    نام خدمت
                                </label>

                                <input
                                    id={`name-${service.id}`}
                                    type="text"
                                    value={service.name}
                                    onChange={event =>
                                        updateService(
                                            service.id,
                                            'name',
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-white/10 bg-barber p-3 text-white"
                                />

                                <span
                                    className={`mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${service.active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}
                                >
                                    {service.active ? 'فعال' : 'غیرفعال'}
                                </span>
                            </div>

                            <div>
                                <label
                                    htmlFor={`duration-${service.id}`}
                                    className="mb-2 block text-sm text-neutral-300"
                                >
                                    مدت‌زمان (دقیقه)
                                </label>

                                <input
                                    id={`duration-${service.id}`}
                                    type="text"
                                    inputMode="numeric"
                                    value={formatNumber(service.duration)}
                                    onChange={event =>
                                        updateService(
                                            service.id,
                                            'duration',
                                            event.target.value
                                        )
                                    }
                                    className="w-full rounded-lg border border-white/10 bg-barber p-3 text-white"
                                />
                            </div>
                        </div>

                        <label
                            htmlFor={`price-${service.id}`}
                            className="mb-2 block text-sm text-neutral-300"
                        >
                            قیمت خدمت (تومان)
                        </label>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <input
                                id={`price-${service.id}`}
                                type="text"
                                inputMode="numeric"
                                value={formatNumber(service.price)}
                                onChange={event =>
                                    updateService(
                                        service.id,
                                        'price',
                                        event.target.value
                                    )
                                }
                                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-barber p-3 text-white focus:border-gold focus:outline-none"
                            />

                            <button
                                type="button"
                                onClick={() => void toggleService(service)}
                                disabled={savingId !== null}
                                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${service.active
                                    ? 'border border-red-500/40 text-red-400 hover:bg-red-500/10'
                                    : 'border border-green-500/40 text-green-400 hover:bg-green-500/10'
                                    }`}
                            >
                                {service.active
                                    ? 'غیرفعال کردن'
                                    : 'فعال کردن'}
                            </button>

                            <button
                                type="button"
                                onClick={() => void saveService(service)}
                                disabled={savingId !== null}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Save size={18} />
                                {savingId === service.id
                                    ? 'در حال ذخیره...'
                                    : 'ذخیره'}
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}
