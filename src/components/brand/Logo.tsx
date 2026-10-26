import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("h-9 w-9 shrink-0", className)}>
      <rect width="40" height="40" rx="11" className="fill-navy" />
      <rect x="9" y="22" width="5" height="9" rx="1.5" className="fill-mist" />
      <rect x="17.5" y="16" width="5" height="15" rx="1.5" className="fill-mist" />
      <rect x="26" y="10" width="5" height="21" rx="1.5" className="fill-champagne" />
      <path
        d="M9.5 17.5 L17 12 L22 14.5 L30 7.5"
        className="stroke-champagne"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} dir="ltr">
      <LogoMark />
      <span className="font-brand text-xl font-semibold tracking-tight text-navy">
        AI <span className="text-taupe">CFO</span>
      </span>
    </span>
  );
}
