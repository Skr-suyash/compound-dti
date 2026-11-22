"use client";

import { Check, Flag, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MiniLadder, VerdictBadge } from "@/components/domain";
import { toast } from "@/components/toast";
import { Avatar, Button, Card, Chip, Eyebrow, PageHeader } from "@/components/ui";
import { DEFAULT_CONFIG, posteriorFor } from "@/lib/scoring";
import { PATTERN_LABELS, topicName } from "@/lib/seed";
import { authorFor, useStore } from "@/lib/store";
import type { AlgoConfig, Post } from "@/lib/types";
import { cn, pct, timeAgo } from "@/lib/utils";

const TABS = [
  ["queue", "Review queue"],
  ["algorithm", "Algorithm"],
  ["health", "Platform health"],
] as const;

function QueueItem({ post }: { post: Post }) {
  const user = useStore((s) => s.user);
  const adminDecide = useStore((s) => s.adminDecide);
  const author = authorFor(post.authorHandle, user);
  const p = posteriorFor(post.counts, post.ai.aiQuality);
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center gap-2">
        {post.status === "held" && <Chip tone="ochre">Held for review</Chip>}
        {post.verdict === "junk" && <Chip tone="ember">Junk verdict</Chip>}
        {post.reports > 0 && (
          <Chip tone="muted">
            <Flag className="h-3 w-3" /> {post.reports} reports
          </Chip>
        )}
        <span className="ml-auto font-mono text-[11px] text-muted">{timeAgo(post.createdAt)}</span>
      </div>
      <p className="mt-4 font-serif text-[22px] leading-snug font-medium text-ink">{post.title}</p>
      <div className="mt-3 flex items-center gap-2 text-[13px] text-body">
        <Avatar name={author.name} tone={author.tone} size={20} /> {author.name}
        <span className="text-muted">· {topicName(post.topic)}</span>
      </div>
      <p className="mt-4 line-clamp-3 rounded-xl bg-paper-2 px-4 py-3 text-[13.5px] leading-relaxed text-body">{post.body}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="flex flex-wrap gap-1.5">
            {post.ai.baitPatterns.map((b) => (
              <Chip key={b} tone="ember">
                {PATTERN_LABELS[b]}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-muted italic">{post.ai.explanation}</p>
          {p.n > 0 && (
            <p className="mt-2 font-mono text-[11.5px] text-muted">
              {p.n} ratings · {pct(p.regret)} said wasted
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {post.status === "held" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                adminDecide(post.id, "approve");
                toast({ title: "Approved", body: "The post now enters its first audience.", tone: "ink" });
              }}
            >
              <Check className="h-3.5 w-3.5" /> Approve
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              adminDecide(post.id, "remove");
              toast({ title: "Removed", body: "The author can see the reason in their Studio.", tone: "ember" });
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Slider({
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="py-5">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-[14.5px] font-semibold text-ink">{label}</p>
          <p className="mt-0.5 text-[12.5px] text-muted">{hint}</p>
        </div>
        <span className="font-mono text-[15px] text-ink">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[var(--value)]"
        style={{ background: `linear-gradient(to right, var(--value) ${fill}%, var(--paper-2) ${fill}%)` }}
      />
    </div>
  );
}

function Preview({ cfg }: { cfg: AlgoConfig }) {
  const cases = [
    { label: "9-min explainer", counts: { worth: 17, changed: 0, meh: 0, wasted: 3 }, bait: false },
    { label: "“Secret trick” reel", counts: { worth: 6, changed: 0, meh: 0, wasted: 14 }, bait: true },
    { label: "Honest but thin", counts: { worth: 9, changed: 0, meh: 6, wasted: 5 }, bait: false },
  ];
  return (
    <div className="space-y-3">
      {cases.map((c) => {
        const p = posteriorFor(c.counts, 0.5);
        const n = p.n;
        const verdict =
          n < cfg.quorum
            ? "Not enough data"
            : p.upper < cfg.junkBar || (c.bait && p.upper < 0.55 && p.regret >= 0.3)
              ? "Junk"
              : p.lower >= cfg.promoteBar
                ? "Promoted"
                : p.upper < cfg.promoteBar
                  ? "Stopped"
                  : "Keep testing";
        const tone = verdict === "Promoted" ? "value" : verdict === "Junk" ? "ember" : verdict === "Stopped" ? "muted" : "ochre";
        return (
          <div key={c.label} className="rounded-2xl border border-line bg-paper p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13.5px] font-medium text-ink">{c.label}</p>
              <Chip tone={tone}>{verdict}</Chip>
            </div>
            <div className="relative mt-4 h-2 rounded-full bg-paper-2">
              <div className="absolute top-0 h-2 rounded-full bg-value/35" style={{ left: `${p.lower * 100}%`, width: `${(p.upper - p.lower) * 100}%` }} />
              <div className="absolute -top-1 h-4 w-0.5 bg-ember" style={{ left: `${cfg.promoteBar * 100}%` }} />
              <div className="absolute -top-0.5 h-3 w-3 -translate-x-1/2 rounded-full bg-ink" style={{ left: `${p.mean * 100}%` }} />
            </div>
            <p className="mt-3 font-mono text-[11px] text-muted">
              {c.counts.worth}/{n} worth it · range {pct(p.lower)}–{pct(p.upper)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminPage() {
  const posts = useStore((s) => s.posts);
  const config = useStore((s) => s.config);
  const setConfig = useStore((s) => s.setConfig);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("queue");

  const queue = posts
    .filter((p) => p.status === "held" || (p.status === "screened" && (p.reports > 0 || p.verdict === "junk")))
    .sort((a, b) => Number(b.status === "held") - Number(a.status === "held") || b.reports - a.reports);
  const removed = posts.filter((p) => p.status === "removed");
  const live = posts.filter((p) => p.status === "screened");
  const byVerdict = (["valuable", "testing", "insufficient", "stopped", "junk"] as const).map((v) => ({
    v,
    n: live.filter((p) => p.verdict === v).length,
  }));
  const byStage = [0, 1, 2, 3].map((s) => ({ s, n: live.filter((p) => p.stage === s).length }));
  const totals = live.reduce(
    (a, p) => ({ r: a.r + p.counts.worth + p.counts.changed + p.counts.meh + p.counts.wasted, w: a.w + p.counts.worth + p.counts.changed, x: a.x + p.counts.wasted }),
    { r: 0, w: 0, x: 0 },
  );

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-10 lg:py-14">
      <PageHeader
        eyebrow="Moderation"
        title={
          <>
            Keep it worth <span className="font-serif font-normal italic">everyone&apos;s time.</span>
          </>
        }
        sub="Review held and reported posts, tune the ranking thresholds, and watch the health of the platform."
        right={
          <span className="inline-flex items-center gap-2 rounded-full bg-ochre-soft px-3 py-1.5 text-[12.5px] font-medium text-ochre">
            <ShieldAlert className="h-4 w-4" /> {queue.filter((p) => p.status === "held").length} awaiting review
          </span>
        }
      />

      <div className="mb-8 inline-flex rounded-xl border border-line bg-paper-2 p-1">
        {TABS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "h-9 rounded-lg px-4 text-[13.5px] font-medium transition-all",
              tab === k ? "bg-card text-ink shadow-[0_1px_3px_rgba(15,27,42,0.12)]" : "text-muted hover:text-ink",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "queue" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {queue.map((p) => (
            <QueueItem key={p.id} post={p} />
          ))}
          {queue.length === 0 && (
            <Card className="p-12 text-center lg:col-span-2">
              <p className="font-display text-[22px] font-semibold text-ink">Queue is clear.</p>
              <p className="mt-1 text-body">Nothing needs a human decision right now.</p>
            </Card>
          )}
          {removed.length > 0 && (
            <div className="lg:col-span-2">
              <Eyebrow className="mt-6 mb-3">Removed ({removed.length})</Eyebrow>
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {removed.map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-5 py-3 text-[14px]">
                    <span className="truncate text-muted line-through">{p.title}</span>
                    <button onClick={() => useStore.getState().adminDecide(p.id, "restore")} className="inline-flex items-center gap-1 text-[12.5px] text-value hover:underline">
                      <RotateCcw className="h-3 w-3" /> Restore to queue
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === "algorithm" && (
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <Card className="px-7 py-3">
            <div className="divide-y divide-line">
              <Slider
                label="Promotion bar"
                hint="Pessimistic worth-it estimate needed to climb a stage"
                value={config.promoteBar}
                min={0.5}
                max={0.8}
                step={0.01}
                format={pct}
                onChange={(v) => setConfig({ promoteBar: v })}
              />
              <Slider
                label="Quorum"
                hint="Minimum ratings before any verdict (protects new posts)"
                value={config.quorum}
                min={5}
                max={30}
                step={1}
                format={(v) => `${v} ratings`}
                onChange={(v) => setConfig({ quorum: v })}
              />
              <Slider
                label="Junk bar"
                hint="Optimistic estimate below which a post is junk"
                value={config.junkBar}
                min={0.25}
                max={0.5}
                step={0.01}
                format={pct}
                onChange={(v) => setConfig({ junkBar: v })}
              />
              <Slider
                label="Discovery share"
                hint="Slots in each feed reserved for untested posts"
                value={config.discoveryShare}
                min={0.1}
                max={0.6}
                step={0.01}
                format={pct}
                onChange={(v) => setConfig({ discoveryShare: v })}
              />
              <Slider
                label="Daily feed size"
                hint="Posts per day before the feed ends"
                value={config.feedSize}
                min={6}
                max={20}
                step={1}
                format={(v) => `${v} posts`}
                onChange={(v) => setConfig({ feedSize: v })}
              />
              <Slider
                label="Base posting limit"
                hint="Posts per day for a new account"
                value={config.dailyQuota}
                min={1}
                max={10}
                step={1}
                format={(v) => `${v} / day`}
                onChange={(v) => setConfig({ dailyQuota: v })}
              />
            </div>
            <div className="flex justify-end py-5">
              <Button variant="ghost" size="sm" onClick={() => setConfig(DEFAULT_CONFIG)}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
              </Button>
            </div>
          </Card>
          <div>
            <Card className="p-7">
              <Eyebrow>Live preview</Eyebrow>
              <p className="mt-3 mb-6 text-[13.5px] leading-relaxed text-body">
                How the current thresholds would judge three example posts. Bars show the 90% confidence range; the red line is the
                promotion bar.
              </p>
              <Preview cfg={config} />
            </Card>
          </div>
        </div>
      )}

      {tab === "health" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="p-7">
            <Eyebrow>Worth-it rate, all posts</Eyebrow>
            <p className="mt-4 font-display text-[52px] leading-none font-semibold tracking-tight text-value">{pct(totals.w / Math.max(1, totals.r))}</p>
            <p className="mt-3 text-[13.5px] text-body">{totals.r.toLocaleString("en-IN")} ratings across {live.length} live posts</p>
          </Card>
          <Card className="p-7">
            <Eyebrow>Regret rate</Eyebrow>
            <p className="mt-4 font-display text-[52px] leading-none font-semibold tracking-tight text-ink">{pct(totals.x / Math.max(1, totals.r))}</p>
            <p className="mt-3 text-[13.5px] text-body">of ratings were “wasted” — target under 10%</p>
          </Card>
          <Card className="p-7">
            <Eyebrow>Caught by moderation</Eyebrow>
            <p className="mt-4 font-display text-[52px] leading-none font-semibold tracking-tight text-ember">
              {posts.filter((p) => p.verdict === "junk" || p.status === "held" || p.status === "removed").length}
            </p>
            <p className="mt-3 text-[13.5px] text-body">junk, held or removed posts</p>
          </Card>
          <Card className="p-7 lg:col-span-2">
            <Eyebrow>Posts by verdict</Eyebrow>
            <div className="mt-6 flex h-4 overflow-hidden rounded-full">
              {byVerdict.map(({ v, n }) => (
                <div
                  key={v}
                  className={cn({ valuable: "bg-value", testing: "bg-slate", insufficient: "bg-ochre", stopped: "bg-line-2", junk: "bg-ember" }[v])}
                  style={{ width: `${(n / Math.max(1, live.length)) * 100}%` }}
                />
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
              {byVerdict.map(({ v, n }) => (
                <span key={v} className="flex items-center gap-2">
                  <VerdictBadge verdict={v} /> <span className="font-mono text-[12.5px] text-ink">{n}</span>
                </span>
              ))}
            </div>
          </Card>
          <Card className="p-7">
            <Eyebrow>Ladder distribution</Eyebrow>
            <div className="mt-6 space-y-3">
              {byStage.map(({ s, n }) => (
                <div key={s} className="grid grid-cols-[70px_1fr_24px] items-center gap-3">
                  <span className="flex items-center gap-2 font-mono text-[11px] text-muted uppercase">
                    <MiniLadder stage={s as 0 | 1 | 2 | 3} /> {s === 3 ? "Canon" : `S${s}`}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                    <div className="h-full rounded-full bg-ink" style={{ width: `${(n / Math.max(1, live.length)) * 100}%` }} />
                  </div>
                  <span className="text-right font-mono text-[12px] text-ink">{n}</span>
                </div>
              ))}
            </div>
            <Link href="/explore" className="mt-6 inline-block text-[13px] font-medium text-value hover:underline">
              Browse the Canon →
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}
