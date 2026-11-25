/** litvo.ai mark: an L monogram (literature spine + baseline) with a citation link to a highlighted evidence node. */
export function LogoMark({ className = "h-8 w-8", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {title && <title>{title}</title>}
      <rect width="64" height="64" rx="14" fill="#1E4A47" />
      <path d="M22 14v34h22" stroke="#F4F0E3" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M22 30l18-10" stroke="#9DBFA8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="42" cy="19" r="6" fill="#E9B23E" />
    </svg>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5" aria-label="litvo.ai">
      <LogoMark />
      <span aria-hidden="true" className={`font-display text-xl font-semibold tracking-tight ${light ? "text-[hsl(40_30%_94%)]" : ""}`}>litvo<span className="text-[#C9962A]">.ai</span></span>
    </span>
  );
}
