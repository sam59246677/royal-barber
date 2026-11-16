
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import DateObject from 'react-date-object'
import persian from 'react-date-object/calendars/persian'
import persian_fa from 'react-date-object/locales/persian_fa'
import DatePicker from 'react-multi-date-picker'
import gregorian from 'react-date-object/calendars/gregorian'
import english from 'react-date-object/locales/gregorian_en'

import { CalendarClock, CheckCircle2 } from 'lucide-react'



const API_URL = '/api/appointments'
const SERVICES_API_URL = '/api/services'
const BARBERS_API_URL = '/api/barbers'

const BUSINESS_TIME_ZONE = 'Asia/Tehran'
const BUSINESS_START_MINUTES = 9 * 60
const BUSINESS_END_MINUTES = 21 * 60
const SLOT_INTERVAL = 15

type Service = {
  id: string
  name: string
  price: number
  duration: number
  active: boolean
}

type Barber = {
  id: string
  name: string
  phone: string | null
  active: boolean
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

function toPersianPhone(value: string) {
  return toPersianDigits(toEnglishDigits(value))
}

function getTehranDate() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('دریافت تاریخ تهران ناموفق بود.')
  }

  return new DateObject({
    date: `${year}-${month}-${day}`,
    calendar: gregorian,
    locale: english,
  }).convert(persian, persian_fa)
}

function getAvailableTimes(duration: number) {
  const availableTimes: string[] = []

  for (
    let minutes = BUSINESS_START_MINUTES;
    minutes + duration <= BUSINESS_END_MINUTES;
    minutes += SLOT_INTERVAL
  ) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    const time =
      `${String(hours).padStart(2, '0')}:` +
      `${String(remainingMinutes).padStart(2, '0')}`

    availableTimes.push(time)
  }

  return availableTimes
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

  if (response.status === 409) {
    return 'این زمان با یک نوبت دیگر تداخل دارد. لطفاً ساعت دیگری انتخاب کنید.'
  }

  if (response.status === 401) {
    return 'درخواست شما توسط سرور پذیرفته نشد. لطفاً دوباره تلاش کنید.'
  }

  if (response.status >= 500) {
    return 'خطای داخلی سرور رخ داده است. لطفاً بعداً تلاش کنید.'
  }

  return 'ثبت درخواست ناموفق بود. لطفاً اطلاعات را بررسی کنید.'
}

export default function Booking() {
  const [service, setService] = useState('')
  const [barber, setBarber] = useState('')
  const [time, setTime] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [date, setDate] = useState<DateObject | null>(null)

  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)
  const [servicesError, setServicesError] = useState('')

  const [barbers, setBarbers] = useState<Barber[]>([])
  const [barbersLoading, setBarbersLoading] = useState(true)
  const [barbersError, setBarbersError] = useState('')

  const today = useMemo(() => getTehranDate(), [])

  const selectedService = services.find(
    (item) => item.id === service,
  )

  const availableTimes = useMemo(() => {
    if (!selectedService) return []

    return getAvailableTimes(selectedService.duration)
  }, [selectedService])

  useEffect(() => {
    if (!success) return

    const timer = window.setTimeout(() => {
      setSuccess(false)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [success])

  useEffect(() => {
    async function loadServices() {
      setServicesLoading(true)
      setServicesError('')

      try {
        const response = await fetch(SERVICES_API_URL)

        if (!response.ok) {
          throw new Error('دریافت خدمات ناموفق بود.')
        }

        const data: Service[] = await response.json()

        setServices(
          data.filter(
            (item) =>
              item.active &&
              Number.isFinite(item.duration) &&
              item.duration > 0,
          ),
        )
      } catch {
        setServicesError(
          'دریافت خدمات ناموفق بود. لطفاً صفحه را دوباره بارگذاری کنید.',
        )
      } finally {
        setServicesLoading(false)
      }
    }

    void loadServices()
  }, [])

  useEffect(() => {
    async function loadBarbers() {
      setBarbersLoading(true)
      setBarbersError('')

      try {
        const response = await fetch(BARBERS_API_URL)

        if (!response.ok) {
          throw new Error('دریافت آرایشگرها ناموفق بود.')
        }

        const data: Barber[] = await response.json()

        setBarbers(
          data.filter((item) => item.active),
        )
      } catch {
        setBarbersError(
          'دریافت فهرست آرایشگرها ناموفق بود. لطفاً صفحه را دوباره بارگذاری کنید.',
        )
      } finally {
        setBarbersLoading(false)
      }
    }

    void loadBarbers()
  }, [])

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')
    setSuccess(false)

    const normalizedPhone = toEnglishDigits(phone.trim())
    const normalizedName = customerName.trim()

    if (
      !service ||
      !barber ||
      !date ||
      !time ||
      !normalizedName ||
      !normalizedPhone
    ) {
      setError('لطفاً تمام فیلدها را تکمیل کنید.')
      return
    }

    if (!/^09\d{9}$/.test(normalizedPhone)) {
      setError('شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود.')
      return
    }

    const selectedService = services.find(
      (item) => item.id === service,
    )

    const selectedBarber = barbers.find(
      (item) => item.id === barber,
    )

    if (!selectedService || !selectedBarber) {
      setError('خدمت یا آرایشگر انتخاب‌شده معتبر نیست.')
      return
    }

    if (!availableTimes.includes(time)) {
      setError(
        'ساعت انتخاب‌شده برای مدت این خدمت معتبر نیست.',
      )
      return
    }

const selectedGregorianDate = toEnglishDigits(
  new DateObject(date)
    .convert(gregorian, english)
    .format('YYYY-MM-DD')
)

const tehranTodayGregorian = new DateObject(today)
  .convert(gregorian, english)
  .format('YYYY-MM-DD')

if (selectedGregorianDate < tehranTodayGregorian) {
  setError('تاریخ نوبت نمی‌تواند در گذشته باشد.')
  return
}

    // زمان با منطقه زمانی تهران به سرور ارسال می‌شود.
    const appointmentDateTime =
      `${selectedGregorianDate}T${time}:00+03:30`
    console.log('Appointment DateTime:', appointmentDateTime)

    // بک‌اند قیمت، مدت، نام خدمت و نام آرایشگر را از دیتابیس می‌گیرد.
    const appointment = {
      customerName: normalizedName,
      customerPhone: normalizedPhone,
      serviceId: selectedService.id,
      barberId: selectedBarber.id,
      appointmentDateTime,
    }

    setSubmitting(true)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointment),
      })

      if (!response.ok) {
        throw new Error(await getErrorMessage(response))
      }

      await response.json()

      setSuccess(true)

      setService('')
      setBarber('')
      setDate(null)
      setTime('')
      setCustomerName('')
      setPhone('')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'ثبت نوبت انجام نشد. اتصال به سرور را بررسی کنید.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-barber p-3 text-white focus:border-gold focus:outline-none'

  const labelClass =
    'mb-2 block text-sm text-neutral-300'

  return (
    <section
      dir="rtl"
      className="mx-auto max-w-2xl px-4 py-12 sm:py-20"
    >
      <div className="mb-8 text-center">
        <CalendarClock
          className="mx-auto text-gold"
          size={44}
        />

        <h1 className="mt-4 text-3xl font-black">
          رزرو نوبت
        </h1>

        <p className="mt-3 leading-8 text-neutral-400">
          اطلاعات خود را وارد کنید تا درخواست رزرو ثبت شود.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-2xl border border-white/10 bg-barber-card p-5 sm:p-8"
      >
        <div>
          <label
            htmlFor="service"
            className={labelClass}
          >
            انتخاب خدمت
          </label>

          <select
            id="service"
            value={service}
            onChange={(event) => {
              setService(event.target.value)
              setTime('')
              setSuccess(false)
              setError('')
            }}
            disabled={
              servicesLoading ||
              Boolean(servicesError) ||
              services.length === 0
            }
            className={inputClass}
          >
            <option value="">
              {servicesLoading
                ? 'در حال دریافت خدمات...'
                : servicesError
                  ? 'دریافت خدمات ناموفق بود'
                  : services.length === 0
                    ? 'خدمتی برای رزرو وجود ندارد'
                    : 'خدمت موردنظر را انتخاب کنید'}
            </option>

            {services.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name} ـ{' '}
                {toPersianDigits(item.duration)} دقیقه
                {' ـ '}
                {toPersianDigits(
                  Number(item.price).toLocaleString('en-US'),
                )}
                {' تومان'}
              </option>
            ))}
          </select>

          {servicesError && (
            <p
              role="alert"
              className="mt-2 text-sm text-red-400"
            >
              {servicesError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="barber"
            className={labelClass}
          >
            انتخاب آرایشگر
          </label>

          <select
            id="barber"
            value={barber}
            onChange={(event) => {
              setBarber(event.target.value)
              setSuccess(false)
              setError('')
            }}
            disabled={
              barbersLoading ||
              Boolean(barbersError) ||
              barbers.length === 0
            }
            className={inputClass}
          >
            <option value="">
              {barbersLoading
                ? 'در حال دریافت آرایشگرها...'
                : barbersError
                  ? 'دریافت آرایشگرها ناموفق بود'
                  : barbers.length === 0
                    ? 'آرایشگری برای رزرو وجود ندارد'
                    : 'آرایشگر موردنظر را انتخاب کنید'}
            </option>

            {barbers.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.name}
              </option>
            ))}
          </select>

          {barbersError && (
            <p
              role="alert"
              className="mt-2 text-sm text-red-400"
            >
              {barbersError}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="date"
              className={labelClass}
            >
              تاریخ شمسی نوبت
            </label>

            <DatePicker
              value={date}
              onChange={(value: DateObject | null) => {
                setDate(value)
                setSuccess(false)
                setError('')
              }}
              calendar={persian}
              locale={persian_fa}
              format="YYYY/MM/DD"
              digits={[
                '۰', '۱', '۲', '۳', '۴',
                '۵', '۶', '۷', '۸', '۹',
              ]}
              minDate={today}
              calendarPosition="bottom-right"
              inputClass={inputClass}
              placeholder="انتخاب تاریخ شمسی"
            />
          </div>

          <div>
            <label
              htmlFor="time"
              className={labelClass}
            >
              ساعت نوبت
            </label>

            <select
              id="time"
              value={time}
              onChange={(event) => {
                setTime(event.target.value)
                setSuccess(false)
                setError('')
              }}
              disabled={!selectedService}
              className={inputClass}
            >
              <option value="">
                {!selectedService
                  ? 'ابتدا خدمت را انتخاب کنید'
                  : 'ساعت را انتخاب کنید'}
              </option>

              {availableTimes.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {toPersianDigits(item)}
                </option>
              ))}
            </select>

            {selectedService && (
              <p className="mt-2 text-xs leading-6 text-neutral-500">
                ساعت‌های قابل انتخاب بر اساس مدت خدمت و پایان کار در ساعت ۲۱ تنظیم شده‌اند.
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="customerName"
            className={labelClass}
          >
            نام و نام خانوادگی
          </label>

          <input
            id="customerName"
            type="text"
            autoComplete="name"
            value={customerName}
            onChange={(event) => {
              setCustomerName(event.target.value)
              setSuccess(false)
              setError('')
            }}
            placeholder="نام خود را وارد کنید"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className={labelClass}
          >
            شماره موبایل
          </label>

          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={toPersianPhone(phone)}
            onChange={(event) => {
              const normalizedValue = toEnglishDigits(
                event.target.value,
              )

              setPhone(normalizedValue)
              setSuccess(false)
              setError('')
            }}
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            dir="ltr"
            className={`${inputClass} text-left`}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {success && (
          <div
            role="status"
            className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm leading-7 text-green-300"
          >
            <p className="flex items-center gap-2 font-bold">
              <CheckCircle2 size={20} />
              نوبت با موفقیت ذخیره شد.
            </p>

            <p>
              اطلاعات رزرو در پایگاه داده ثبت شد.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={
            submitting ||
            servicesLoading ||
            Boolean(servicesError) ||
            barbersLoading ||
            Boolean(barbersError) ||
            barbers.length === 0 ||
            services.length === 0
          }
          className="w-full rounded-lg bg-gold px-5 py-3 font-bold text-black transition-colors hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? 'در حال ثبت نوبت...'
            : 'ثبت نوبت'}
        </button>
      </form>
    </section>
  )
}