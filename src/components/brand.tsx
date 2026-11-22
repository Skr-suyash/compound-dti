import Link from "next/link";
import { cn } from "@/lib/utils";

/** Four ascending steps — the reach ladder — with the top step lit. */
export function LadderMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="2" y="21" width="5.5" height="9" rx="1.6" className="fill-ink" opacity="0.28" />
      <rect x="9.5" y="15" width="5.5" height="15" rx="1.6" className="fill-ink" opacity="0.5" />
      <rect x="17" y="8.5" width="5.5" height="21.5" rx="1.6" className="fill-ink" opacity="0.78" />
      <rect x="24.5" y="2" width="5.5" height="28" rx="1.6" className="fill-value" />
    </svg>
  );
}

export function Logo({ href = "/", className, compact }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Compound home">
      <LadderMark className="transition-transform duration-300 group-hover:-translate-y-0.5" />
      {!compact && (
        <span className="font-display text-[19px] font-semibold tracking-[-0.03em] text-ink">
          compound<span className="text-value">.</span>
        </span>
      )}
    </Link>
  );
}

export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  );
}
