export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="12" fill="#173058" />
      <path d="M18 16h22M18 16v32h22M18 32h16" stroke="#F3F0E6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="46" cy="32" r="5" fill="#F1B83A" />
      <path d="M42 48h6" stroke="#DE4A2C" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-display text-xl font-semibold tracking-tight ${light ? "text-[hsl(40_30%_94%)]" : ""}`}>Evidora</span>
    </span>
  );
}
