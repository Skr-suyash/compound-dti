"use client";

import { Check, ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { topicName } from "@/lib/seed";
import { authorFor, useStore } from "@/lib/store";
import type { RatingValue, SparkScene, SparkTheme, SparkVisual } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RATING_OPTIONS } from "./domain";
import { SPARK_THEMES, sparkBackground } from "./media";
import { toast } from "./toast";
import { Avatar } from "./ui";

const SCENE_MS = 4200;
const clock = () => Date.now();

/* ---------------------------- Scene visuals ---------------------------- */

function Visual({ kind, accent, fg }: { kind: SparkVisual; accent: string; fg: string }) {
  const draw = { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 1.4, ease: "easeInOut" as const } };
  switch (kind) {
    case "lever":
      return (
        <svg viewBox="0 0 240 140" className="w-full">
          <rect x="18" y="20" width="10" height="100" rx="3" fill={fg} opacity={0.5} />
          <motion.g style={{ originX: "23px", originY: "70px" }} initial={{ rotate: 0 }} animate={{ rotate: [-0, -28, -28] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.6 }}>
            <rect x="28" y="62" width="190" height="16" rx="5" fill={fg} opacity={0.9} />
            <circle cx="205" cy="70" r="6" fill={accent} />
          </motion.g>
          <motion.path d="M205,120 L205,92" stroke={accent} strokeWidth="5" strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.6 }} />
          <text x="120" y="132" textAnchor="middle" fontSize="11" fill={fg} opacity={0.6} fontFamily="monospace">r →</text>
        </svg>
      );
    case "bars":
      return (
        <div className="flex h-36 w-full items-end gap-3">
          {[
            [55, "Needs"],
            [20, "Wants"],
            [25, "Invest"],
          ].map(([v, l], i) => (
            <div key={l as string} className="flex flex-1 flex-col items-center gap-2">
              <motion.div
                className="w-full rounded-t-xl"
                style={{ background: i === 2 ? accent : fg, opacity: i === 2 ? 1 : 0.35 + i * 0.15 }}
                initial={{ height: 0 }}
                animate={{ height: `${(v as number) * 2}px` }}
                transition={{ delay: 0.2 + i * 0.25, type: "spring", stiffness: 120, damping: 16 }}
              />
              <span className="font-mono text-[10px] uppercase" style={{ color: fg, opacity: 0.7 }}>
                {l} {v}%
              </span>
            </div>
          ))}
        </div>
      );
    case "curves":
      return (
        <svg viewBox="0 0 240 150" className="w-full">
          {[
            "M10,140 L230,140",
            "M10,140 C80,110 150,100 230,95",
            "M10,140 L230,40",
            "M10,140 C90,120 160,70 230,15",
            "M10,140 C120,135 170,90 200,5",
          ].map((d, i) => (
            <motion.path key={d} d={d} fill="none" stroke={i === 4 ? accent : fg} strokeOpacity={i === 4 ? 1 : 0.35 + i * 0.12} strokeWidth={i === 4 ? 4 : 2.5} strokeLinecap="round" {...draw} transition={{ ...draw.transition, delay: i * 0.18 }} />
          ))}
        </svg>
      );
    case "swatches":
      return (
        <div className="grid w-full grid-cols-2 gap-3">
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-xl bg-white p-3">
            <p className="text-[15px] font-semibold text-[#c9c9c9]">Hard to read</p>
            <p className="mt-1 font-mono text-[10px] text-[#9c3d14]">1.6 : 1 · fails</p>
          </motion.div>
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }} className="rounded-xl bg-white p-3">
            <p className="text-[15px] font-semibold text-[#1c2b3d]">Easy to read</p>
            <p className="mt-1 font-mono text-[10px] text-[#0b7a63]">12.6 : 1 · passes</p>
          </motion.div>
        </div>
      );
    case "waves":
      return (
        <svg viewBox="0 0 240 110" className="w-full overflow-visible">
          {[0, 1, 2].map((i) => (
            <motion.path
              key={i}
              d={`M0,55 Q30,${20 + i * 10} 60,55 T120,55 T180,55 T240,55`}
              fill="none"
              stroke={i === 0 ? accent : fg}
              strokeOpacity={i === 0 ? 1 : 0.3}
              strokeWidth={i === 0 ? 3.5 : 2}
              animate={{ x: [0, -60] }}
              transition={{ duration: 2.2 + i, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </svg>
      );
    case "checklist":
      return (
        <div className="w-full space-y-2.5">
          {["Strong verb", "What you did", "A measurable result"].map((t, i) => (
            <motion.div key={t} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.25 + i * 0.35 }} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.12)" }}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: accent, color: "#0f1b2a" }}>
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              <span className="text-[14px] font-medium" style={{ color: fg }}>
                {t}
              </span>
            </motion.div>
          ))}
        </div>
      );
    case "steps":
      return (
        <div className="relative flex h-28 w-full items-end gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 rounded-t-lg" style={{ height: 28 + i * 24, background: fg, opacity: 0.18 + i * 0.12 }} />
          ))}
          <motion.span
            className="absolute h-4 w-4 rounded-full"
            style={{ background: accent }}
            initial={{ left: "8%", bottom: 32 }}
            animate={{ left: ["8%", "33%", "58%", "84%"], bottom: [32, 56, 80, 104] }}
            transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 0.5 }}
          />
        </div>
      );
    default:
      return null;
  }
}

export function SceneView({ scene, theme }: { scene: SparkScene; theme: SparkTheme }) {
  const t = SPARK_THEMES[theme];
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex h-full flex-col justify-center gap-6 px-7"
    >
      {scene.kicker && (
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: t.muted }}>
          {scene.kicker}
        </p>
      )}
      <p className="font-display text-[30px] leading-[1.08] font-semibold tracking-[-0.025em] sm:text-[34px]" style={{ color: t.fg }}>
        {scene.text}
      </p>
      {scene.sub && (
        <p className="font-serif text-[19px] italic" style={{ color: t.accent }}>
          {scene.sub}
        </p>
      )}
      {scene.visual && scene.visual !== "none" && (
        <div className="mt-2">
          <Visual kind={scene.visual} accent={t.accent} fg={t.fg} />
        </div>
      )}
    </motion.div>
  );
}

/* ---------------------------- Player ---------------------------- */

export function SparkPlayer({ ids, startId, onClose }: { ids: string[]; startId: string; onClose: () => void }) {
  const posts = useStore((s) => s.posts);
  const user = useStore((s) => s.user);
  const myRatings = useStore((s) => s.myRatings);
  const { ratePost, markWatched } = useStore.getState();
  const [index, setIndex] = useState(Math.max(0, ids.indexOf(startId)));
  const [scene, setScene] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const started = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  const post = posts.find((p) => p.id === ids[index]);
  const scenes = post?.media?.kind === "spark" ? post.media.scenes : [];

  const goTo = (i: number) => {
    if (i < 0 || i >= ids.length) {
      if (i >= ids.length) onClose();
      return;
    }
    setIndex(i);
    setScene(0);
    setEnded(false);
    setElapsed(0);
  };

  const next = () => {
    if (ended) return goTo(index + 1);
    if (scene < scenes.length - 1) {
      setScene((s) => s + 1);
      setElapsed(0);
    } else {
      setEnded(true);
      if (post) markWatched(post.id);
    }
  };

  const prev = () => {
    if (ended) {
      setEnded(false);
      return;
    }
    if (scene > 0) {
      setScene((s) => s - 1);
      setElapsed(0);
    } else goTo(index - 1);
  };

  // Timer
  useEffect(() => {
    if (paused || ended) return;
    started.current = clock() - elapsed;
    const t = setInterval(() => {
      const e = clock() - started.current;
      if (e >= SCENE_MS) next();
      else setElapsed(e);
    }, 50);
    return () => clearInterval(t);
  }, [paused, ended, scene, index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!post || post.media?.kind !== "spark") return null;
  const theme = SPARK_THEMES[post.media.theme];
  const author = authorFor(post.authorHandle, user);
  const own = post.authorHandle === user?.handle;
  const rating = myRatings[post.id];

  const rate = (v: RatingValue) => {
    if (own) return;
    const d = ratePost(post.id, v);
    if (d?.action === "promote") toast({ title: "Your rating helped it climb", body: `This Spark reached Stage ${d.stage}.` });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05090f]/95 backdrop-blur-md">
      <button onClick={onClose} className="absolute top-5 right-5 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:flex" aria-label="Close">
        <X className="h-5 w-5" />
      </button>
      <p className="absolute top-6 left-6 hidden font-mono text-[11px] tracking-[0.14em] text-white/50 uppercase md:block">
        Today&apos;s sparks · {index + 1} of {ids.length}
      </p>

      <button onClick={() => goTo(index - 1)} disabled={index === 0} className="mr-6 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-20 md:flex" aria-label="Previous spark">
        <ChevronLeft className="h-6 w-6" />
      </button>

      <motion.div
        key={post.id}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 26 }}
        className="relative h-[min(92vh,820px)] w-[min(100vw,calc(min(92vh,820px)*9/16))] overflow-hidden sm:rounded-[28px]"
        style={{ background: sparkBackground(post.media.theme) }}
      >
        {/* progress */}
        <div className="absolute inset-x-4 top-4 z-20 flex gap-1.5">
          {scenes.map((_, i) => (
            <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
              <span
                className="block h-full rounded-full bg-white"
                style={{ width: ended || i < scene ? "100%" : i === scene ? `${(elapsed / SCENE_MS) * 100}%` : "0%" }}
              />
            </span>
          ))}
        </div>
        {/* header */}
        <div className="absolute inset-x-4 top-9 z-20 flex items-center justify-between">
          <Link href={`/u/${author.handle}`} onClick={onClose} className="flex items-center gap-2.5">
            <Avatar name={author.name} tone={author.tone} size={32} className="ring-2 ring-white/40" />
            <span>
              <span className="block text-[13.5px] font-semibold" style={{ color: theme.fg }}>
                {author.name}
              </span>
              <span className="block font-mono text-[10.5px] uppercase" style={{ color: theme.muted }}>
                {topicName(post.topic)} · spark
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setPaused((p) => !p)} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white" aria-label={paused ? "Play" : "Pause"}>
              {paused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5 fill-current" />}
            </button>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white md:hidden" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* content */}
        <div className="absolute inset-0 pt-20 pb-24">
          <AnimatePresence mode="wait">
            {!ended ? (
              <SceneView key={`${post.id}-${scene}`} scene={scenes[scene]!} theme={post.media.theme} />
            ) : (
              <motion.div key="end" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col justify-center gap-6 px-6">
                <p className="font-mono text-[11px] tracking-[0.16em] uppercase" style={{ color: theme.muted }}>
                  {post.title}
                </p>
                <p className="font-display text-[32px] leading-[1.05] font-semibold tracking-[-0.025em]" style={{ color: theme.fg }}>
                  {own ? "This is your Spark." : "Was it worth your time?"}
                </p>
                {!own && (
                  <div className="grid grid-cols-2 gap-2">
                    {RATING_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => rate(o.value)}
                        className={cn("flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-left text-[13.5px] font-semibold transition-all active:scale-[0.97]")}
                        style={{
                          background: rating === o.value ? theme.fg : "rgba(255,255,255,0.12)",
                          color: rating === o.value ? theme.bg : theme.fg,
                        }}
                      >
                        <o.Icon className="h-4 w-4 shrink-0" /> {o.label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setEnded(false); setScene(0); setElapsed(0); }} className="flex h-11 items-center gap-2 rounded-xl px-4 text-[13.5px] font-medium" style={{ background: "rgba(255,255,255,0.12)", color: theme.fg }}>
                    <RotateCcw className="h-4 w-4" /> Replay
                  </button>
                  <button onClick={() => goTo(index + 1)} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold" style={{ background: theme.fg, color: theme.bg }}>
                    {index < ids.length - 1 ? "Next spark" : "That's all for today"} <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* tap zones */}
        {!ended && (
          <>
            <button className="absolute top-20 bottom-24 left-0 z-10 w-1/3" onClick={prev} aria-label="Previous" />
            <button className="absolute top-20 right-0 bottom-24 z-10 w-2/3" onClick={next} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} aria-label="Next" />
          </>
        )}

        {/* footer */}
        <div className="absolute inset-x-5 bottom-5 z-20">
          <p className="line-clamp-2 text-[13px] leading-snug" style={{ color: theme.muted }}>
            {post.body}
          </p>
        </div>
      </motion.div>

      <button onClick={() => goTo(index + 1)} disabled={index >= ids.length - 1} className="ml-6 hidden h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-20 md:flex" aria-label="Next spark">
        <ChevronRight className="h-6 w-6" />
      </button>
    </motion.div>
  );
}
