import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
  className = "",
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lede?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`border-b border-border py-16 md:py-20 ${className}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-dark mb-3">{eyebrow}</div>
          <h2 className="font-editorial text-2xl md:text-3xl text-ink">{title}</h2>
          {lede && <p className="text-sm md:text-base text-ink-muted mt-3 leading-relaxed">{lede}</p>}
        </div>
        {children && <div className="mt-10">{children}</div>}
      </div>
    </section>
  );
}
