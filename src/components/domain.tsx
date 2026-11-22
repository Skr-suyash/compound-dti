"use client";

import { Gem, Minus, ThumbsDown, ThumbsUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { STAGE_NAMES, betaPdf, verdictMeta, type Posterior } from "@/lib/scoring";
import type { RatingValue, Stage, Verdict } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Chip } from "./ui";

export function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  const m = verdictMeta(verdict);
  return (
    <Chip tone={m.tone} className={className}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          { value: "bg-value", slate: "bg-slate", ochre: "bg-ochre", muted: "bg-muted", ember: "bg-ember" }[m.tone],
        )}
      />
      {m.label}
    </Chip>
  );
}

/** Compact four-step ladder used in lists. */
export function MiniLadder({ stage, verdict }: { stage: Stage; verdict?: Verdict }) {
  const lit = verdict === "junk" ? "bg-ember" : verdict === "stopped" ? "bg-muted" : "bg-value";
  return (
    <span className="inline-flex items-end gap-[3px]" aria-label={`Stage ${stage} of 3`}>
      {[0, 1, 2, 3].map((s) => (
        <span
          key={s}
          className={cn("w-[5px] rounded-[1.5px]", s <= stage ? lit : "bg-line-2")}
          style={{ height: 6 + s * 3.5 }}
        />
      ))}
    </span>
  );
}

/** Full ladder with stage names and progress through the current stage. */
export function StageLadder({
  stage,
  verdict,
  shown,
  target,
}: {
  stage: Stage;
  verdict: Verdict;
  shown: number;
  target: number;
}) {
  const stopped = verdict === "stopped" || verdict === "junk";
  return (
    <div className="grid grid-cols-4 items-end gap-2">
      {([0, 1, 2, 3] as Stage[]).map((s) => {
        const done = s < stage;
        const current = s === stage;
        const progress = current ? (s === 3 ? 1 : Math.min(1, shown / Math.max(1, target))) : done ? 1 : 0;
        return (
          <div key={s} className="flex flex-col gap-2">
            <div
              className="relative overflow-hidden rounded-lg border border-line bg-paper-2"
              style={{ height: 28 + s * 22 }}
            >
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 transition-[height] duration-700 ease-out",
                  current && stopped ? (verdict === "junk" ? "bg-ember/80" : "bg-muted/50") : "bg-value",
                )}
                style={{ height: `${progress * 100}%`, opacity: done ? 1 : 0.85 }}
              />
              {current && !stopped && s < 3 && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-value" />
              )}
            </div>
            <div>
              <p className={cn("font-mono text-[10px] tracking-[0.1em] uppercase", current ? "text-ink" : "text-muted")}>
                {s === 3 ? "Canon" : `Stage ${s}`}
              </p>
              <p className="text-[12px] leading-tight text-muted">{STAGE_NAMES[s]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-reading">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: (p) => <a {...p} target="_blank" rel="nofollow ugc noopener noreferrer" /> }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

export const RATING_OPTIONS: {
  value: RatingValue;
  label: string;
  sub: string;
  Icon: typeof ThumbsUp;
}[] = [
  { value: -1, label: "Wasted", sub: "Not worth it", Icon: ThumbsDown },
  { value: 0, label: "Meh", sub: "It was fine", Icon: Minus },
  { value: 1, label: "Worth it", sub: "Glad I read it", Icon: ThumbsUp },
  { value: 2, label: "Changed something", sub: "I'll use this", Icon: Gem },
];

export function RatingIcon({ value, className }: { value: RatingValue; className?: string }) {
  const o = RATING_OPTIONS.find((r) => r.value === value)!;
  return <o.Icon className={className} />;
}

export function RatingPicker({
  value,
  onChange,
  compact,
}: {
  value?: RatingValue;
  onChange: (v: RatingValue) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4")}>
      {RATING_OPTIONS.map((o, i) => {
        const active = value === o.value;
        const wasted = o.value === -1;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "group relative flex flex-col items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 active:scale-[0.98]",
              active
                ? wasted
                  ? "border-ember bg-ember text-on-ink"
                  : o.value === 2
                    ? "border-value bg-value text-on-ink"
                    : "border-ink bg-ink text-paper"
                : "border-line bg-card hover:border-line-2 hover:bg-paper",
            )}
          >
            <span className="flex w-full items-center justify-between">
              <o.Icon className={cn("h-[18px] w-[18px]", active ? "" : wasted ? "text-ember" : o.value === 2 ? "text-value" : "text-ink")} />
              {!compact && <span className={cn("font-mono text-[10px]", active ? "opacity-60" : "text-muted")}>{i + 1}</span>}
            </span>
            <span>
              <span className="block text-[14px] leading-tight font-semibold">{o.label}</span>
              {!compact && <span className={cn("mt-0.5 block text-[12px]", active ? "opacity-70" : "text-muted")}>{o.sub}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Posterior density with the 90% credible band and the promotion bar. */
export function ConfidenceChart({ p, bar = 0.6, height = 170 }: { p: Posterior; bar?: number; height?: number }) {
  const W = 600;
  const H = height;
  const pad = { l: 8, r: 8, t: 14, b: 26 };
  const xs = Array.from({ length: 161 }, (_, i) => 0.0025 + (i / 160) * 0.995);
  const ys = xs.map((x) => betaPdf(x, p.alpha, p.beta));
  const yMax = Math.max(...ys, 1e-6);
  const X = (x: number) => pad.l + x * (W - pad.l - pad.r);
  const Y = (y: number) => H - pad.b - (y / yMax) * (H - pad.t - pad.b);
  const line = xs.map((x, i) => `${i ? "L" : "M"}${X(x).toFixed(1)},${Y(ys[i]!).toFixed(1)}`).join(" ");
  const band = xs.filter((x) => x >= p.lower && x <= p.upper);
  const bandPath =
    band.length > 1
      ? `M${X(band[0]!)},${H - pad.b} ` +
        band.map((x) => `L${X(x).toFixed(1)},${Y(betaPdf(x, p.alpha, p.beta)).toFixed(1)}`).join(" ") +
        ` L${X(band[band.length - 1]!)},${H - pad.b} Z`
      : "";
  const above = p.lower >= bar;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Confidence in this post's worth-it rate">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={pad.t} y2={H - pad.b} className="stroke-line" strokeDasharray="2 4" />
          <text x={X(t)} y={H - 8} textAnchor={t === 0 ? "start" : t === 1 ? "end" : "middle"} className="fill-muted font-mono text-[10px]">
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}
      <path d={bandPath} className={above ? "fill-value/20" : "fill-ochre/20"} />
      <path d={line} fill="none" className={above ? "stroke-value" : "stroke-ink"} strokeWidth={2.2} strokeLinejoin="round" />
      <line x1={X(bar)} x2={X(bar)} y1={pad.t - 6} y2={H - pad.b} className="stroke-ember" strokeWidth={1.5} />
      <text x={X(bar) + 6} y={pad.t + 2} className="fill-ember font-mono text-[10px]">
        PROMOTE BAR {Math.round(bar * 100)}%
      </text>
      <circle cx={X(p.lower)} cy={H - pad.b} r={4} className={above ? "fill-value" : "fill-ochre"} />
      <circle cx={X(p.upper)} cy={H - pad.b} r={4} className="fill-ink" />
    </svg>
  );
}

export function RatingBars({ counts }: { counts: { wasted: number; meh: number; worth: number; changed: number } }) {
  const total = Math.max(1, counts.wasted + counts.meh + counts.worth + counts.changed);
  const rows = [
    { k: "changed", label: "Changed something", n: counts.changed, cls: "bg-value" },
    { k: "worth", label: "Worth it", n: counts.worth, cls: "bg-value/60" },
    { k: "meh", label: "Meh", n: counts.meh, cls: "bg-ochre/60" },
    { k: "wasted", label: "Wasted", n: counts.wasted, cls: "bg-ember" },
  ];
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.k} className="grid grid-cols-[132px_1fr_44px] items-center gap-3">
          <span className="text-[13px] text-body">{r.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-paper-2">
            <div className={cn("h-full rounded-full transition-[width] duration-500", r.cls)} style={{ width: `${(r.n / total) * 100}%` }} />
          </div>
          <span className="text-right font-mono text-[12px] text-ink">{r.n}</span>
        </div>
      ))}
    </div>
  );
}

export function ProgressRing({ value, size = 92, stroke = 7, children }: { value: number; size?: number; stroke?: number; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-paper-2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.min(1, value))}
          className="fill-none stroke-value transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
