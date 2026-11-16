
import { ArrowLeft, Clock3, MapPin, Scissors } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-l from-gold/10 via-transparent to-transparent" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="mb-5 flex items-center gap-2 text-sm text-gold">
              <Scissors size={18} />
              هنر اصلاح، امضای استایل شما
            </p>

            <h1 className="max-w-xl text-4xl leading-[1.5] font-black sm:text-5xl md:text-6xl">
              استایل متفاوت،
              <span className="block text-gold">تجربه‌ای خاص</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-neutral-400">
              در رویال باربر، جزئیات اهمیت دارند؛
              از یک اصلاح دقیق تا استایلی که شخصیت شما را نشان می‌دهد.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link  to="/booking" className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 font-bold text-black transition hover:bg-gold-light" >
                رزرو نوبت
                <ArrowLeft size={18} />
              </Link>

              <Link to="/services" className="rounded-lg border border-white/20 px-6 py-3 transition hover:border-gold hover:text-gold">
                مشاهده خدمات
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-neutral-400">
              <span className="flex items-center gap-2">
                <Clock3 size={17} className="text-gold" />
                با تعیین وقت قبلی
              </span>

              <span className="flex items-center gap-2">
                <MapPin size={17} className="text-gold" />
                آدرس آرایشگاه
              </span>
            </div>
          </div>

          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-gold/20 bg-barber-card p-8 text-center sm:min-h-96">
            <div>
              <Scissors className="mx-auto mb-5 text-gold" size={64} strokeWidth={1}/>
              <p className="text-xl font-bold">ROYAL BARBER</p>
              <p className="mt-3 text-sm text-neutral-500"> استایل شما، تخصص ما </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-bold text-gold">خدمات ما</p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl"> به استایل خود اهمیت بدهید </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: 'اصلاح مو',
              description: 'اصلاح دقیق متناسب با فرم چهره',
            },
            {
              title: 'اصلاح ریش',
              description: 'فرم‌دهی و مرتب‌سازی حرفه‌ای ریش',
            },
            {
              title: 'اصلاح ترکیبی',
              description: 'ترکیبی از اصلاح مو و مرتب‌سازی ریش',
            },
          ].map((service) => (
            <article key={service.title} className="rounded-xl border border-white/10 bg-barber-card p-6 transition hover:border-gold/50">
              <Scissors className="mb-4 text-gold" size={25} />
              <h3 className="text-lg font-bold">{service.title}</h3>
              <p className="mt-3 text-sm leading-7 text-neutral-400"> {service.description} </p>
            </article>
          ))}
        </div>

        <Link to="/services" className="mt-6 inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light">
          تمام خدمات و قیمت‌ها
          <ArrowLeft size={16} />
        </Link>
      </section>
    </>
  )
}