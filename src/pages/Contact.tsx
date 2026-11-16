import { Clock3, MapPin, Phone } from 'lucide-react'

const contactItems = [
  {
    title: 'آدرس',
    description: 'آدرس دقیق آرایشگاه پس از تأیید درج می‌شود.',
    Icon: MapPin,
  },
  {
    title: 'شماره تماس',
    description: 'شماره تماس واقعی آرایشگاه درج خواهد شد.',
    Icon: Phone,
  },
  {
    title: 'ساعات کاری',
    description: 'روزها و ساعات کاری پس از تأیید مشخص می‌شوند.',
    Icon: Clock3,
  },
]

export default function Contact() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <p className="text-sm text-gold">در ارتباط باشید</p>
      <h1 className="mt-3 text-3xl font-black">تماس با ما</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {contactItems.map(({ title, description, Icon }) => (
          <article key={title} className="rounded-xl border border-white/10 bg-barber-card p-5">
            <Icon className="text-gold" size={26} />
            <h2 className="mt-4 font-bold">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-neutral-400">{description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}