import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { AvatarTone } from "@/lib/types";
import { TONE_CLASSES, cn, initials } from "@/lib/utils";

type Variant = "primary" | "accent" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-2 shadow-[0_1px_0_rgba(0,0,0,0.04)]",
  accent: "bg-value text-on-ink hover:bg-value-2",
  outline: "border border-line-2 text-ink hover:border-ink hover:bg-card",
  ghost: "text-body hover:text-ink hover:bg-paper-2",
  danger: "border border-ember/40 text-ember hover:bg-ember-soft",
};
const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2.5 rounded-xl",
};

const base =
  "inline-flex items-center justify-center font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-value";

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={cn(base, VARIANTS[variant], SIZES[size], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={cn(base, VARIANTS[variant], SIZES[size], className)} {...props} />;
}

type Tone = "value" | "ember" | "ochre" | "slate" | "muted" | "ink";
const CHIP: Record<Tone, string> = {
  value: "bg-value-soft text-value",
  ember: "bg-ember-soft text-ember",
  ochre: "bg-ochre-soft text-ochre",
  slate: "bg-slate-soft text-slate",
  muted: "bg-paper-2 text-muted",
  ink: "bg-ink text-paper",
};

export function Chip({ tone = "muted", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-[3px] font-mono text-[10.5px] font-medium tracking-[0.08em] uppercase",
        CHIP[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  tone = "ink",
  size = 32,
  className,
}: {
  name: string;
  tone?: AvatarTone;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold select-none",
        TONE_CLASSES[tone],
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn("eyebrow text-muted", className)}>{children}</p>;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-line bg-card", className)}>{children}</div>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-2 bg-paper px-1 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  );
}

export function PageHeader({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="mb-10 flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h1 className="font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.03em] text-ink md:text-[52px]">
          {title}
        </h1>
        {sub && <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-body">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Eyebrow>{label}</Eyebrow>
      <p className={cn("font-display text-[34px] leading-none font-semibold tracking-tight", accent ? "text-value" : "text-ink")}>
        {value}
      </p>
      {sub && <p className="text-[13px] text-muted">{sub}</p>}
    </div>
  );
}

export function Meter({ value, tone = "value", className }: { value: number; tone?: "value" | "ember" | "ochre" | "ink"; className?: string }) {
  const color = { value: "bg-value", ember: "bg-ember", ochre: "bg-ochre", ink: "bg-ink" }[tone];
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-paper-2", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
