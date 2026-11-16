import { Images } from 'lucide-react'

export default function Gallery() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <Images className="text-gold" size={36} />
      <h1 className="mt-5 text-3xl font-black"> گالری نمونه‌کارها  </h1>
      <p className="mt-4 max-w-2xl leading-8 text-neutral-400">
        در این بخش، نمونه‌های واقعی اصلاح مو، مدل‌های فید و
        فرم‌دهی ریش را نمایش خواهیم داد.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {['مدل مو', 'فید مدرن', 'اصلاح ریش'].map((title) => (
          <div  key={title} className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-gold/30 bg-barber-card p-4 text-center text-sm text-neutral-400">
            {title}
            <span className="sr-only">؛ تصویر هنوز اضافه نشده است</span>
          </div>
        ))}
      </div>
    </section>
  )
}