import { Scissors } from 'lucide-react'

const services = [
  {
    name: 'اصلاح مو',
    description: 'اصلاح کلاسیک، فید و مدل‌های مدرن',
    duration: '۳۰ دقیقه',
    price: 'قیمت تعیین نشده',
  },
  {
    name: 'اصلاح و فرم‌دهی ریش',
    description: 'مرتب‌سازی و فرم‌دهی متناسب با چهره',
    duration: '۲۰ دقیقه',
    price: 'قیمت تعیین نشده',
  },
  {
    name: 'اصلاح مو و ریش',
    description: 'یک تجربه کامل برای استایل شما',
    duration: '۵۰ دقیقه',
    price: 'قیمت تعیین نشده',
  },
]

export default function Services() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-sm text-gold">خدمات رویال باربر</p>
      <h1 className="mt-3 text-3xl font-black sm:text-4xl"> خدمات و قیمت‌ها  </h1>
      <p className="mt-4 leading-8 text-neutral-400">
        خدمت موردنظر خود را انتخاب کنید. قیمت‌ها پس از تأیید
        اطلاعات واقعی آرایشگاه در این بخش نمایش داده خواهند شد.
      </p>

      <div className="mt-8 space-y-4">
        {services.map((service) => (
          <article key={service.name} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-barber-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <Scissors className="mt-1 shrink-0 text-gold" />
              <div>
                <h2 className="font-bold">{service.name}</h2>
                <p className="mt-2 text-sm leading-7 text-neutral-400"> {service.description}</p>
                <p className="mt-2 text-xs text-neutral-500">مدت تقریبی: {service.duration} </p>
              </div>
            </div>

            <p className="shrink-0 text-sm text-gold">{service.price}</p>
          </article>
        ))}
      </div>
    </section>
  )
}