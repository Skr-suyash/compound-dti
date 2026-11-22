"use client";

import { ArrowLeft, Eye, Bookmark, Play, Square, Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ConfidenceChart, RatingBars, StageLadder, VerdictBadge } from "@/components/domain";
import { PostMedia, SparkThumb } from "@/components/media";
import { toast } from "@/components/toast";
import { Button, Chip, Eyebrow, Meter } from "@/components/ui";
import { STAGE_NAMES, STAGE_QUORUM, posteriorFor } from "@/lib/scoring";
import { PATTERN_LABELS, topicName } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { RatingValue } from "@/lib/types";
import { cn, pct, timeAgo } from "@/lib/utils";

const MOODS = [
  { id: "loved", label: "Readers love it", weights: [0.04, 0.08, 0.58, 0.3] },
  { id: "mixed", label: "Mixed reactions", weights: [0.2, 0.3, 0.38, 0.12] },
  { id: "disliked", label: "Readers feel baited", weights: [0.62, 0.2, 0.15, 0.03] },
] as const;
const VALUES: RatingValue[] = [-1, 0, 1, 2];

function pick(weights: readonly number[]): RatingValue {
  const r = Math.random();
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]!;
    if (r <= acc) return VALUES[i]!;
  }
  return 1;
}

function Card({ title, right, children, className }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl border border-line bg-card p-6 md:p-7", className)}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <Eyebrow>{title}</Eyebrow>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function StudioPostPage() {
  const { id } = useParams<{ id: string }>();
  const post = useStore((s) => s.posts.find((p) => p.id === id));
  const config = useStore((s) => s.config);
  const simulateRating = useStore((s) => s.simulateRating);
  const [mood, setMood] = useState<(typeof MOODS)[number]["id"]>("loved");
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<RatingValue[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  };
  useEffect(() => stop, []);

  if (!post) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="font-display text-[28px] font-semibold text-ink">Post not found.</p>
        <Link href="/studio" className="mt-4 inline-block text-value">Back to Studio</Link>
      </div>
    );
  }

  const p = posteriorFor(post.counts, post.ai.aiQuality);
  const latest = [...post.events].reverse().find((e) => e.rule !== "screened") ?? post.events[post.events.length - 1];
  const finalState = post.verdict === "stopped" || post.verdict === "junk" || post.stage === 3;
  const stageQuorum = Math.min(STAGE_QUORUM[post.stage], config.quorum);
  const pending = post.ai.engine === "pending";

  const run = () => {
    if (running || finalState || post.status !== "screened") return;
    setRunning(true);
    setLog([]);
    const weights = MOODS.find((m) => m.id === mood)!.weights;
    let n = 0;
    timer.current = setInterval(() => {
      const v = pick(weights);
      const d = simulateRating(post.id, v);
      setLog((l) => [...l.slice(-23), v]);
      n++;
      if (d?.action === "promote") {
        toast({ title: d.stage === 3 ? "Entered the Canon" : `Reached Stage ${d.stage}`, body: "Readers' confidence cleared the bar." });
      } else if (d?.action === "stop") {
        toast({ title: "Stopped climbing", body: "Not enough readers found it worth their time. No penalty.", tone: "ink" });
        stop();
      } else if (d?.action === "junk") {
        toast({ title: "Marked as junk", body: "Readers clearly said it wasted their time.", tone: "ember" });
        stop();
      }
      if (n >= 12) stop();
    }, 260);
  };

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-10 lg:py-14">
      <Link href="/studio" className="mb-10 inline-flex items-center gap-1.5 text-[13.5px] text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Studio
      </Link>

      <div className="flex flex-col gap-6 border-b border-line pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Eyebrow className="text-value">{topicName(post.topic)}</Eyebrow>
            <span className="text-[13px] text-muted">Published {timeAgo(post.createdAt)}</span>
            <VerdictBadge verdict={post.verdict} />
          </div>
          <h1 className="font-serif text-[36px] leading-[1.1] font-medium tracking-[-0.02em] text-ink md:text-[46px]">{post.title}</h1>
        </div>
        <Link href={post.type === "spark" ? `/sparks/${post.id}` : `/p/${post.id}`} className="shrink-0 text-[13.5px] font-medium text-value hover:underline">
          View as a reader →
        </Link>
      </div>

      {latest && (
        <motion.div
          key={latest.at}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-8 flex items-start gap-4 rounded-2xl px-6 py-5",
            post.verdict === "junk" ? "bg-ember-soft" : post.verdict === "stopped" ? "bg-paper-2" : "bg-value-soft",
          )}
        >
          <span
            className={cn(
              "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
              post.verdict === "junk" ? "bg-ember" : post.verdict === "stopped" ? "bg-muted" : "bg-value",
            )}
          />
          <div>
            <p className="text-[15.5px] font-medium text-ink">{latest.message}</p>
            <p className="mt-1 font-mono text-[11px] tracking-wider text-muted uppercase">{timeAgo(latest.at)} · rule: {latest.rule.replace("_", " ")}</p>
          </div>
        </motion.div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {post.media && (
            <Card
              title={post.type === "spark" ? "Your Spark" : post.type === "video" ? "Video" : "Image"}
              right={
                post.type === "spark" ? (
                  <Link href={`/sparks/${post.id}`} className="text-[13px] font-medium text-value hover:underline">
                    Play →
                  </Link>
                ) : undefined
              }
            >
              {post.media.kind === "spark" ? (
                <div className="flex gap-4 overflow-x-auto">
                  <Link href={`/sparks/${post.id}`} className="w-[150px] shrink-0">
                    <SparkThumb post={post} />
                  </Link>
                  <ol className="space-y-2 text-[13.5px] text-body">
                    {post.media.scenes.map((sc, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="font-mono text-[11px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-ink">{sc.text}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <PostMedia post={post} variant="full" />
              )}
            </Card>
          )}
          <Card
            title="Reach ladder"
            right={<span className="font-mono text-[12px] text-ink">{post.stage === 3 ? "Canon" : `Stage ${post.stage} · ${STAGE_NAMES[post.stage]}`}</span>}
          >
            <StageLadder stage={post.stage} verdict={post.verdict} shown={post.stageShown} target={post.stageTarget} />
            {post.stage < 3 && (
              <div className="mt-7 grid gap-5 border-t border-line pt-6 sm:grid-cols-2">
                <div>
                  <div className="mb-2 flex justify-between text-[13px]">
                    <span className="text-body">Readers reached this stage</span>
                    <span className="font-mono text-ink">
                      {post.stageShown}/{post.stageTarget}
                    </span>
                  </div>
                  <Meter value={post.stageShown / Math.max(1, post.stageTarget)} tone="ink" />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-[13px]">
                    <span className="text-body">Ratings needed for a verdict</span>
                    <span className="font-mono text-ink">
                      {Math.min(post.stageRatings, stageQuorum)}/{stageQuorum}
                    </span>
                  </div>
                  <Meter value={Math.min(1, post.stageRatings / Math.max(1, stageQuorum))} />
                </div>
              </div>
            )}
          </Card>

          <Card
            title="Confidence in its worth-it rate"
            right={<Chip tone={p.lower >= config.promoteBar ? "value" : "muted"}>{p.lower >= config.promoteBar ? "Above bar" : "Below bar"}</Chip>}
          >
            <ConfidenceChart p={p} bar={config.promoteBar} />
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
              <div>
                <p className="font-display text-[26px] font-semibold text-ink">{pct(p.lower)}</p>
                <p className="text-[12px] leading-snug text-muted">Pessimistic estimate</p>
              </div>
              <div>
                <p className="font-display text-[26px] font-semibold text-value">{pct(p.mean)}</p>
                <p className="text-[12px] leading-snug text-muted">Best estimate</p>
              </div>
              <div>
                <p className="font-display text-[26px] font-semibold text-ink">{pct(p.upper)}</p>
                <p className="text-[12px] leading-snug text-muted">Optimistic estimate</p>
              </div>
            </div>
            <p className="mt-5 text-[13px] leading-relaxed text-body">
              A post climbs only when the <span className="font-semibold text-ink">pessimistic</span> estimate clears{" "}
              {pct(config.promoteBar)}. With few ratings the curve is wide, so uncertain posts keep being shown instead of buried.
            </p>
          </Card>

          <Card title="How readers rated it" right={<span className="font-mono text-[12px] text-ink">{p.n} ratings</span>}>
            <RatingBars counts={post.counts} />
          </Card>

          <Card title="History">
            <ol className="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-line">
              {[...post.events].reverse().map((e, i) => (
                <li key={`${e.at}-${i}`} className="relative pl-7">
                  <span
                    className={cn(
                      "absolute top-1.5 left-0 h-[11px] w-[11px] rounded-full border-2 border-card",
                      e.to === "junk" ? "bg-ember" : e.to === "stopped" ? "bg-muted" : e.rule === "screened" ? "bg-line-2" : "bg-value",
                    )}
                  />
                  <p className="text-[14px] text-ink">{e.message}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted">{timeAgo(e.at)}</p>
                </li>
              ))}
              {post.events.length === 0 && <li className="pl-7 text-[14px] text-muted">Screening in progress…</li>}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl bg-ink p-6 text-paper md:p-7">
            <p className="eyebrow text-paper/50">Live demo</p>
            <p className="mt-3 font-display text-[24px] leading-tight font-semibold tracking-tight">Simulate readers</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-paper/60">
              Sends simulated ratings through the real scoring engine. Watch the curve tighten and the verdict update.
            </p>
            <div className="mt-6 space-y-2">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMood(m.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-[13.5px] transition-colors",
                    mood === m.id ? "border-[#3CC7A4] bg-[#3CC7A4]/10 text-paper" : "border-paper/15 text-paper/70 hover:border-paper/30",
                  )}
                >
                  {m.label}
                  <span className={cn("h-2 w-2 rounded-full", mood === m.id ? "bg-[#3CC7A4]" : "bg-paper/20")} />
                </button>
              ))}
            </div>
            <div className="mt-5 flex min-h-[26px] flex-wrap gap-1">
              {log.map((v, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "h-[18px] w-[18px] rounded-[5px]",
                    v === -1 ? "bg-[#F08A4B]" : v === 0 ? "bg-paper/25" : v === 1 ? "bg-[#3CC7A4]/60" : "bg-[#3CC7A4]",
                  )}
                />
              ))}
            </div>
            {running ? (
              <button onClick={stop} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-paper/10 text-[14px] font-medium text-paper">
                <Square className="h-3.5 w-3.5" /> Stop
              </button>
            ) : (
              <button
                onClick={run}
                disabled={finalState || post.status !== "screened"}
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3CC7A4] text-[14px] font-semibold text-ink transition-opacity disabled:opacity-40"
              >
                <Play className="h-4 w-4" /> Send 12 readers
              </button>
            )}
            {finalState && (
              <p className="mt-3 text-[12px] text-paper/45">
                {post.stage === 3 ? "This post is in the Canon — its climb is complete." : "This post has a final verdict at this stage."}
              </p>
            )}
          </section>

          <Card title="Screening" right={pending ? <Chip tone="ochre">Model pending</Chip> : <Chip tone="value">Passed</Chip>}>
            {pending ? (
              <p className="text-[13.5px] leading-relaxed text-body">
                Format, duplicate and topic checks passed. The AI quality review (promise vs. delivery, information density, bait
                patterns) will appear here once the screening model is connected.
              </p>
            ) : (
              <>
                <div className="space-y-4">
                  {(
                    [
                      ["Promise vs. delivery", post.ai.promiseDelivery],
                      ["Information density", post.ai.infoDensity],
                      ["Originality", post.ai.originality],
                    ] as const
                  ).map(([label, v]) => (
                    <div key={label}>
                      <div className="mb-1.5 flex justify-between text-[13px]">
                        <span className="text-body">{label}</span>
                        <span className="font-mono text-ink">{v.toFixed(2)}</span>
                      </div>
                      <Meter value={v} tone={v < 0.35 ? "ember" : v < 0.6 ? "ochre" : "value"} />
                    </div>
                  ))}
                </div>
                {post.ai.baitPatterns.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {post.ai.baitPatterns.map((b) => (
                      <Chip key={b} tone="ember">
                        {PATTERN_LABELS[b]}
                      </Chip>
                    ))}
                  </div>
                )}
                <p className="mt-5 border-t border-line pt-4 font-serif text-[16px] leading-snug text-ink italic">“{post.ai.explanation}”</p>
              </>
            )}
          </Card>

          <Card title="Engagement">
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  [Eye, post.impressions, "shown"],
                  [Users, p.n, "rated"],
                  [Bookmark, post.saves, "saved"],
                ] as const
              ).map(([Icon, n, l]) => (
                <div key={l}>
                  <Icon className="h-4 w-4 text-muted" />
                  <p className="mt-2 font-display text-[22px] font-semibold text-ink">{n}</p>
                  <p className="text-[12px] text-muted">{l}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-[12.5px] leading-relaxed text-muted">
              There are no like counts or follower numbers on Compound. Reach depends only on whether readers found it worth their time.
            </p>
          </Card>
          <Button variant="outline" className="w-full" onClick={() => history.back()}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
