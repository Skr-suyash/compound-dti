"use client";

import { ArrowUpRight, ChevronRight, PenLine } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MiniLadder, VerdictBadge } from "@/components/domain";
import { PostThumb } from "@/components/media";
import { ButtonLink, Eyebrow, PageHeader, Stat } from "@/components/ui";
import { posteriorFor } from "@/lib/scoring";
import { topicName } from "@/lib/seed";
import { balances, quotaFor, useStore } from "@/lib/store";
import { cn, pct, timeAgo } from "@/lib/utils";

const FILTERS = [
  ["all", "All"],
  ["climbing", "On the ladder"],
  ["testing", "Testing"],
  ["stopped", "Stopped"],
] as const;

export default function StudioPage() {
  const user = useStore((s) => s.user);
  const posts = useStore((s) => s.posts);
  const ledger = useStore((s) => s.ledger);
  const config = useStore((s) => s.config);
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");

  const mine = posts.filter((p) => p.authorHandle === user?.handle && p.status !== "removed").sort((a, b) => b.createdAt - a.createdAt);
  const quota = quotaFor({ posts, user, config });
  const { merit } = balances(ledger);
  const rated = mine.map((p) => posteriorFor(p.counts, p.ai.aiQuality)).filter((p) => p.n > 0);
  const avgWorth = rated.length ? rated.reduce((a, p) => a + p.worthPct, 0) / rated.length : 0;

  const shown = mine.filter((p) =>
    filter === "all"
      ? true
      : filter === "climbing"
        ? p.stage >= 1
        : filter === "testing"
          ? p.stage === 0 && (p.verdict === "testing" || p.verdict === "insufficient")
          : p.verdict === "stopped" || p.verdict === "junk",
  );

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-10 lg:py-14">
      <PageHeader
        eyebrow="Studio"
        title={
          <>
            Your posts, and <span className="font-serif font-normal italic">where they stand.</span>
          </>
        }
        sub="Every verdict comes with a reason. No shadowbans, no hidden penalties — and never a penalty for low traction."
        right={
          <ButtonLink href="/create" size="lg">
            <PenLine className="h-4 w-4" /> Write a post
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-8 border-b border-line pb-10 md:grid-cols-4">
        <Stat label="Posts" value={mine.length} sub={`${quota.left} of ${quota.limit} left today`} />
        <Stat label="On the ladder" value={mine.filter((p) => p.stage >= 1).length} sub="reached Stage 1 or higher" />
        <Stat label="Worth-it rate" value={rated.length ? pct(avgWorth) : "—"} sub="average across rated posts" accent />
        <Stat label="Merit" value={merit} sub={<Link href="/rewards" className="hover:text-ink">View history →</Link>} />
      </div>

      <div className="mt-8 flex flex-wrap gap-1.5">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn(
              "h-8 rounded-full px-3.5 text-[13px] transition-colors",
              filter === k ? "bg-ink text-paper" : "text-body hover:bg-paper-2 hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-line bg-card">
        <div className="hidden grid-cols-[1fr_110px_150px_90px_90px_28px] gap-4 border-b border-line px-6 py-3 md:grid">
          {["Post", "Ladder", "Verdict", "Ratings", "Worth it", ""].map((h) => (
            <Eyebrow key={h}>{h}</Eyebrow>
          ))}
        </div>
        {shown.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="font-display text-[20px] font-semibold text-ink">Nothing here yet.</p>
            <p className="mt-1 text-[14px] text-body">Posts you write will show up with their stage and verdict.</p>
          </div>
        )}
        {shown.map((post) => {
          const p = posteriorFor(post.counts, post.ai.aiQuality);
          return (
            <Link
              key={post.id}
              href={`/studio/${post.id}`}
              className="group grid grid-cols-1 gap-3 border-b border-line px-6 py-5 transition-colors last:border-b-0 hover:bg-paper/60 md:grid-cols-[1fr_110px_150px_90px_90px_28px] md:items-center md:gap-4"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                  <PostThumb post={post} bare />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-serif text-[19px] font-medium text-ink decoration-value underline-offset-4 group-hover:underline">
                    {post.title}
                  </p>
                  <p className="mt-1 text-[12.5px] text-muted">
                    {post.type === "spark" ? "Spark" : post.type === "video" ? "Video" : post.type === "image" ? "Image" : "Post"} · {topicName(post.topic)} · {timeAgo(post.createdAt)}
                    {post.status === "screening" && " · screening…"}
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-2.5">
                <MiniLadder stage={post.stage} verdict={post.verdict} />
                <span className="font-mono text-[11px] text-muted">{post.stage === 3 ? "Canon" : `Stage ${post.stage}`}</span>
              </span>
              <span>
                <VerdictBadge verdict={post.verdict} />
              </span>
              <span className="font-mono text-[13px] text-ink">{p.n}</span>
              <span className="font-mono text-[13px] text-ink">{p.n ? pct(p.worthPct) : "—"}</span>
              <ChevronRight className="hidden h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5 md:block" />
            </Link>
          );
        })}
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-[13px] text-muted">
        Tip: open a post to watch its confidence update as readers rate it.
        <ArrowUpRight className="h-3.5 w-3.5" />
      </p>
    </div>
  );
}
