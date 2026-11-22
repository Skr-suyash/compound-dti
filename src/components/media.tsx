"use client";

import { Play, Zap } from "lucide-react";
import { useState } from "react";
import type { Media, Post, SparkTheme, TopicId } from "@/lib/types";
import { cn, hashString, mulberry32 } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Generative cover art — every text post gets a unique, on-brand image */
/* ------------------------------------------------------------------ */

const ART: Record<TopicId, { bg: string; a: string; b: string; c: string }> = {
  coding: { bg: "#0f1b2a", a: "#3cc7a4", b: "#2d4060", c: "#8fb0d9" },
  science: { bg: "#16263a", a: "#e0b45a", b: "#2d4060", c: "#f4f1ea" },
  design: { bg: "#f1e6cc", a: "#b84a1a", b: "#0f1b2a", c: "#0b7a63" },
  finance: { bg: "#0a5e4d", a: "#f4f1ea", b: "#3cc7a4", c: "#e0b45a" },
  careers: { bg: "#f7e0d3", a: "#0f1b2a", b: "#b84a1a", c: "#0b7a63" },
};

export function CoverArt({ seed, topic, className }: { seed: string; topic: TopicId; className?: string }) {
  const rnd = mulberry32(hashString(seed));
  const p = ART[topic];
  let shapes: React.ReactNode = null;

  if (topic === "coding") {
    shapes = Array.from({ length: 9 }, (_, row) => {
      let x = 40 + Math.floor(rnd() * 3) * 22;
      return Array.from({ length: 3 + Math.floor(rnd() * 3) }, (_, i) => {
        const w = 30 + rnd() * 90;
        const el = (
          <rect key={`${row}-${i}`} x={x} y={52 + row * 34} width={w} height={14} rx={7} fill={rnd() > 0.72 ? p.a : rnd() > 0.5 ? p.c : p.b} opacity={rnd() > 0.72 ? 1 : 0.85} />
        );
        x += w + 14;
        return x < 380 ? el : null;
      });
    });
  } else if (topic === "science") {
    const cx = 160 + rnd() * 80;
    const cy = 170 + rnd() * 60;
    shapes = (
      <>
        {[60, 105, 150, 195].map((r, i) => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={i % 2 ? p.b : p.c} strokeOpacity={i % 2 ? 1 : 0.25} strokeWidth={2} />
        ))}
        <circle cx={cx} cy={cy} r={26} fill={p.a} />
        {[60, 105, 150, 195].map((r, i) => {
          const t = rnd() * Math.PI * 2;
          return <circle key={`d${i}`} cx={cx + Math.cos(t) * r} cy={cy + Math.sin(t) * r} r={6 + i * 2} fill={i === 2 ? p.a : p.c} />;
        })}
      </>
    );
  } else if (topic === "design") {
    shapes = (
      <>
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={40 + i * 40} y1={20} x2={40 + i * 40} y2={380} stroke={p.b} strokeOpacity={0.08} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1={20} y1={40 + i * 40} x2={380} y2={40 + i * 40} stroke={p.b} strokeOpacity={0.08} />
        ))}
        <circle cx={120 + rnd() * 40} cy={150 + rnd() * 40} r={78} fill={p.a} />
        <rect x={190 + rnd() * 30} y={170 + rnd() * 30} width={130} height={130} fill={p.b} />
        <polygon points={`${60 + rnd() * 30},330 ${150},${230 + rnd() * 20} ${230},330`} fill={p.c} />
      </>
    );
  } else if (topic === "finance") {
    const heights = Array.from({ length: 7 }, (_, i) => 40 + i * 32 + rnd() * 30);
    shapes = (
      <>
        {heights.map((h, i) => (
          <rect key={i} x={40 + i * 48} y={350 - h} width={32} height={h} rx={6} fill={i === 6 ? p.c : p.b} opacity={0.45 + i * 0.08} />
        ))}
        <path d={`M40,300 C140,${290 - rnd() * 30} 240,${200 - rnd() * 40} 360,${70 + rnd() * 30}`} fill="none" stroke={p.a} strokeWidth={5} strokeLinecap="round" />
        <circle cx={360} cy={86} r={10} fill={p.a} />
      </>
    );
  } else {
    shapes = (
      <>
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={50 + i * 62} y={300 - i * 50} width={70} height={14 + i * 50} rx={8} fill={i === 4 ? p.c : p.b} opacity={i === 4 ? 1 : 0.25 + i * 0.12} />
        ))}
        <circle cx={85 + Math.floor(rnd() * 4) * 62} cy={110 + rnd() * 40} r={14} fill={p.a} />
        <path d="M60,90 Q200,20 340,80" fill="none" stroke={p.a} strokeWidth={3} strokeDasharray="6 10" />
      </>
    );
  }

  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" className={cn("block h-full w-full", className)} aria-hidden>
      <rect width="400" height="400" fill={p.bg} />
      {shapes}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* YouTube — a lightweight facade that loads the player only on click   */
/* ------------------------------------------------------------------ */

export function YouTubePlayer({ media, className }: { media: Extract<Media, { kind: "youtube" }>; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-2xl bg-ink", className)}>
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${media.id}?autoplay=1&rel=0&modestbranding=1`}
          title={media.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button onClick={() => setPlaying(true)} className="group absolute inset-0 h-full w-full text-left" aria-label={`Play ${media.title}`}>
          <VideoPoster media={media} failed={thumbFailed} onFail={() => setThumbFailed(true)} large />
        </button>
      )}
    </div>
  );
}

export function VideoPoster({
  media,
  failed,
  onFail,
  large,
  bare,
}: {
  media: Extract<Media, { kind: "youtube" }>;
  failed?: boolean;
  onFail?: () => void;
  large?: boolean;
  bare?: boolean;
}) {
  return (
    <>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://i.ytimg.com/vi/${media.id}/hqdefault.jpg`}
          alt=""
          onError={onFail}
          className="absolute inset-0 h-full w-full scale-[1.02] object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#2d4060,#0f1b2a)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />
      <span
        className={cn(
          "absolute flex items-center justify-center rounded-full bg-paper/95 text-ink shadow-xl transition-transform duration-200 group-hover:scale-110",
          bare ? "top-3 left-3 h-8 w-8" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          !bare && (large ? "h-16 w-16" : "h-12 w-12"),
        )}
      >
        <Play className={cn("translate-x-px fill-current", bare ? "h-3.5 w-3.5" : large ? "h-6 w-6" : "h-5 w-5")} />
      </span>
      <span className={cn("absolute right-4 bottom-3.5 left-4 flex items-end justify-between gap-3 text-white", bare && "hidden")}>
        <span className={cn("line-clamp-1 font-medium drop-shadow", large ? "text-[15px]" : "text-[13px]")}>{media.title}</span>
        <span className="shrink-0 rounded-md bg-black/55 px-2 py-0.5 font-mono text-[10.5px] tracking-wide uppercase">{media.channel}</span>
      </span>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Sparks                                                                */
/* ------------------------------------------------------------------ */

export const SPARK_THEMES: Record<SparkTheme, { bg: string; glow: string; fg: string; accent: string; muted: string }> = {
  ink: { bg: "#0f1b2a", glow: "#22405e", fg: "#f4f1ea", accent: "#3cc7a4", muted: "rgba(244,241,234,0.6)" },
  value: { bg: "#0a5e4d", glow: "#13896f", fg: "#f4f1ea", accent: "#f1e6cc", muted: "rgba(244,241,234,0.7)" },
  ember: { bg: "#9c3d14", glow: "#d0622e", fg: "#fbf9f4", accent: "#ffd9c2", muted: "rgba(251,249,244,0.72)" },
  ochre: { bg: "#7a5714", glow: "#b8892f", fg: "#fbf9f4", accent: "#fff0cf", muted: "rgba(251,249,244,0.72)" },
  slate: { bg: "#2e4566", glow: "#4a6a96", fg: "#f4f1ea", accent: "#cfe0f5", muted: "rgba(244,241,234,0.7)" },
};

export function sparkBackground(theme: SparkTheme) {
  const t = SPARK_THEMES[theme];
  return `radial-gradient(120% 80% at 20% 0%, ${t.glow} 0%, ${t.bg} 60%)`;
}

export function SparkThumb({ post, watched, className }: { post: Post; watched?: boolean; className?: string }) {
  if (post.media?.kind !== "spark") return null;
  const t = SPARK_THEMES[post.media.theme];
  const first = post.media.scenes[0]!;
  return (
    <div
      className={cn("relative flex aspect-[9/16] flex-col justify-between overflow-hidden rounded-2xl p-3.5", className)}
      style={{ background: sparkBackground(post.media.theme), color: t.fg }}
    >
      <div className="flex gap-1">
        {post.media.scenes.map((_, i) => (
          <span key={i} className="h-[3px] flex-1 rounded-full" style={{ background: watched ? t.fg : "rgba(255,255,255,0.28)" }} />
        ))}
      </div>
      <div>
        <p className="font-mono text-[9.5px] tracking-[0.12em] uppercase" style={{ color: t.muted }}>
          {first.kicker}
        </p>
        <p className="mt-1.5 line-clamp-4 font-display text-[15px] leading-[1.15] font-semibold tracking-tight">{post.title}</p>
      </div>
    </div>
  );
}

/** A thumbnail that fills its parent box, for grids and lists. */
export function PostThumb({ post, className, bare }: { post: Post; className?: string; bare?: boolean }) {
  const m = post.media;
  return (
    <div className={cn("group relative h-full w-full overflow-hidden bg-ink", className)}>
      {m?.kind === "youtube" ? (
        <VideoPoster media={m} bare={bare} />
      ) : m?.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.src} alt={m.alt} className="absolute inset-0 h-full w-full object-cover" />
      ) : post.type === "note" ? (
        <div className="absolute inset-0 flex flex-col justify-between bg-card p-4">
          <p className="line-clamp-5 text-[14px] leading-snug text-ink">{post.body}</p>
          {m?.kind === "poll" && (
            <div className="space-y-1">
              {m.options.slice(0, 3).map((o) => (
                <div key={o.label} className="h-1.5 rounded-full bg-paper-2">
                  <div className="h-full rounded-full bg-value" style={{ width: `${Math.min(100, (o.votes / Math.max(1, Math.max(...m.options.map((x) => x.votes)))) * 100)}%` }} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : m?.kind === "spark" ? (
        <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ background: sparkBackground(m.theme), color: SPARK_THEMES[m.theme].fg }}>
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase">
            <Zap className="h-3 w-3" /> Spark
          </span>
          {!bare && <p className="line-clamp-3 font-display text-[16px] leading-tight font-semibold">{post.title}</p>}
        </div>
      ) : (
        <CoverArt seed={post.id} topic={post.topic} />
      )}
    </div>
  );
}

/** Media block for a post, in card (feed) or full (reading page) size. */
export function PostMedia({ post, variant }: { post: Post; variant: "card" | "full" }) {
  const m = post.media;
  if (!m) return null;
  if (m.kind === "youtube") {
    if (variant === "full") return <YouTubePlayer media={m} />;
    return (
      <div className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-ink">
        <VideoPoster media={m} />
      </div>
    );
  }
  if (m.kind === "image") {
    return (
      <div className={cn("overflow-hidden rounded-2xl border border-line bg-paper-2", variant === "card" && "max-h-[420px]")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.src} alt={m.alt} className="block h-full w-full object-cover" />
      </div>
    );
  }
  return null;
}
