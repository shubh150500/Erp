export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-700 text-ivory">
      <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
      <div
        className="absolute -top-20 right-10 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
        aria-hidden
      />
      <div className="container-page relative py-16 md:py-20 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-400">
          {eyebrow}
        </span>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl font-bold">{title}</h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl mx-auto text-navy-100/80 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
