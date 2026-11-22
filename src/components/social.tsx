"use client";

import { ArrowUpRight, Check, Clock, FileText, ThumbsUp, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { posteriorFor } from "@/lib/scoring";
import { AUTHORS, CIRCLES, topicName } from "@/lib/seed";
import { authorFor, useStore } from "@/lib/store";
import type { Post, RatingValue } from "@/lib/types";
import { cn, excerpt, hashString, mulberry32, timeAgo } from "@/lib/utils";
import { RATING_OPTIONS } from "./domain";
import { CoverArt } from "./media";
import { toast } from "./toast";
import { Avatar } from "./ui";

const PEOPLE = AUTHORS.filter((a) => !["motivationking", "viral.facts"].includes(a.handle));

/* ------------------------------- Polls ------------------------------- */

export function PollView({ post }: { post: Post }) {
  const myVote = useStore((s) => s.votes[post.id]);
  const vote = useStore((s) => s.vote);
  if (post.media?.kind !== "poll") return null;
  const total = post.media.options.reduce((a, o) => a + o.votes, 0);
  const voted = myVote !== undefined;
  const max = Math.max(...post.media.options.map((o) => o.votes));
  return (
    <div className="space-y-2">
      {post.media.options.map((o, i) => {
        const pct = total ? Math.round((o.votes / total) * 100) : 0;
        const mine = myVote === i;
        return (
          <button
            key={o.label}
            onClick={(e) => {
              e.preventDefault();
              vote(post.id, i);
            }}
            className={cn(
              "relative flex h-11 w-full items-center justify-between overflow-hidden rounded-xl border px-4 text-left text-[14px] transition-colors",
              voted ? (mine ? "border-value" : "border-line") : "border-line-2 hover:border-ink",
            )}
          >
            {voted && (
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className={cn("absolute inset-y-0 left-0", mine ? "bg-value-soft" : o.votes === max ? "bg-paper-2" : "bg-paper-2/70")}
              />
            )}
            <span className={cn("relative flex items-center gap-2", mine ? "font-semibold text-value" : "text-ink")}>
              {mine && <Check className="h-4 w-4" strokeWidth={3} />} {o.label}
            </span>
            {voted && <span className="relative font-mono text-[12.5px] text-ink">{pct}%</span>}
          </button>
        );
      })}
      <p className="pt-1 text-[12.5px] text-muted">
        {total.toLocaleString("en-IN")} votes · {voted ? "you can change your vote" : "vote to see results"}
      </p>
    </div>
  );
}

/* ---------------------------- Social proof ---------------------------- */

function ratersFor(post: Post) {
  const rnd = mulberry32(hashString(post.id));
  const pool = PEOPLE.filter((a) => a.handle !== post.authorHandle);
  const picked: typeof pool = [];
  while (picked.length < 3 && pool.length) picked.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]!);
  return picked;
}

export function SocialProof({ post, discovery }: { post: Post; discovery?: boolean }) {
  const p = posteriorFor(post.counts, post.ai.aiQuality);
  const worth = post.counts.worth + post.counts.changed;
  if (discovery && p.n < 10) {
    return (
      <p className="flex items-center gap-2 text-[12.5px] text-ochre">
        <span className="h-1.5 w-1.5 rounded-full bg-ochre" /> New voice — be one of the first 20 to say if it was worth it
      </p>
    );
  }
  if (!worth) return null;
  const raters = ratersFor(post);
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex -space-x-2">
        {raters.map((r) => (
          <Avatar key={r.handle} name={r.name} tone={r.tone} size={22} className="ring-2 ring-card" />
        ))}
      </span>
      <p className="text-[12.5px] text-body">
        <span className="font-medium text-ink">{raters[0]?.name.split(" ")[0]}</span>,{" "}
        <span className="font-medium text-ink">{raters[1]?.name.split(" ")[0]}</span> and {Math.max(0, worth - 2)} others found this
        worth their time
      </p>
    </div>
  );
}

/* ----------------------------- Quick rate ----------------------------- */

export function QuickRate({ post, onRated }: { post: Post; onRated?: () => void }) {
  const rating = useStore((s) => s.myRatings[post.id]);
  const user = useStore((s) => s.user);
  const ratePost = useStore((s) => s.ratePost);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const own = post.authorHandle === user?.handle;
  const longForm = post.type === "text" || post.type === "link" || post.type === "video";

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const current = rating !== undefined ? RATING_OPTIONS.find((o) => o.value === rating) : undefined;

  if (own) return <span className="px-3 text-[12.5px] text-muted">Your post</span>;
  if (longForm && rating === undefined) {
    return (
      <Link href={`/p/${post.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink hover:bg-paper-2">
        <ThumbsUp className="h-4 w-4" /> {post.type === "video" ? "Watch & rate" : "Read & rate"}
      </Link>
    );
  }

  const rate = (v: RatingValue) => {
    const d = ratePost(post.id, v);
    setOpen(false);
    onRated?.();
    if (d?.action === "promote") toast({ title: "Your rating helped it climb", body: `Now at Stage ${d.stage}.` });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors",
          current ? (rating === -1 ? "bg-ember-soft text-ember" : "bg-value-soft text-value") : "text-ink hover:bg-paper-2",
        )}
      >
        {current ? <current.Icon className="h-4 w-4" /> : <ThumbsUp className="h-4 w-4" />}
        {current ? current.label : "Worth it?"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-11 left-0 z-30 flex gap-1 rounded-2xl border border-line bg-card p-1.5 shadow-[0_16px_40px_-12px_rgba(15,27,42,0.35)]"
          >
            {RATING_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => rate(o.value)}
                title={o.label}
                className={cn(
                  "flex w-[76px] flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-medium transition-colors hover:bg-paper-2",
                  rating === o.value && "bg-paper-2",
                )}
              >
                <o.Icon className={cn("h-5 w-5", o.value === -1 ? "text-ember" : o.value === 2 ? "text-value" : "text-ink")} />
                <span className="text-center leading-tight text-ink">{o.label === "Changed something" ? "Changed me" : o.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ----------------------------- Top reply ----------------------------- */

export function TopReply({ post }: { post: Post }) {
  const user = useStore((s) => s.user);
  if (!post.replies.length) return null;
  const top = [...post.replies].sort((a, b) => b.helpful - a.helpful)[0]!;
  const a = authorFor(top.authorHandle, user);
  return (
    <Link href={`/p/${post.id}#replies`} className="block border-t border-line px-5 py-3.5 transition-colors hover:bg-paper/60 sm:px-6">
      <div className="flex gap-2.5">
        <Avatar name={a.name} tone={a.tone} size={26} />
        <div className="min-w-0 flex-1 rounded-2xl bg-paper-2/70 px-3.5 py-2.5">
          <p className="text-[12.5px]">
            <span className="font-semibold text-ink">{a.name}</span>
            {top.authorHandle === post.authorHandle && <span className="ml-1.5 text-[11px] text-value">Author</span>}
            <span className="text-muted"> · {timeAgo(top.at)}</span>
          </p>
          <p className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug text-ink-2">{top.body}</p>
        </div>
      </div>
      {post.replies.length > 1 && (
        <p className="mt-2 pl-9 text-[12.5px] font-medium text-muted hover:text-ink">
          View all {post.replies.length} replies
        </p>
      )}
    </Link>
  );
}

/* ---------------------------- Article card ---------------------------- */

export function ArticleCard({ post }: { post: Post }) {
  return (
    <Link href={`/p/${post.id}`} className="group/a flex overflow-hidden rounded-2xl border border-line bg-paper transition-colors hover:border-line-2">
      <div className="w-[112px] shrink-0 sm:w-[150px]">
        <CoverArt seed={post.id} topic={post.topic} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 p-4">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.1em] text-muted uppercase">
          <FileText className="h-3 w-3" /> {post.type === "link" ? post.site ?? "Link" : "Article"} · {topicName(post.topic)}
        </span>
        <p className="line-clamp-2 font-display text-[17px] leading-snug font-semibold tracking-tight text-ink group-hover/a:underline">
          {post.title}
        </p>
        <span className="inline-flex items-center gap-1 text-[12px] text-muted">
          <Clock className="h-3 w-3" /> {post.readMinutes} min read
        </span>
      </div>
    </Link>
  );
}

/** First sentence(s) of a post, used as the social caption above an article card. */
export function captionFor(post: Post) {
  const firstPara = post.body.split(/\n\s*\n/).find((p) => p.trim() && !p.trim().startsWith("|") && !p.trim().startsWith("```")) ?? post.body;
  return excerpt(firstPara, 220);
}

/* ------------------------------- Rails ------------------------------- */

export function PeopleToFollow({ limit = 4 }: { limit?: number }) {
  const user = useStore((s) => s.user);
  const following = useStore((s) => s.following);
  const toggleFollow = useStore((s) => s.toggleFollow);
  const people = PEOPLE.filter((a) => a.handle !== user?.handle && !following.includes(a.handle)).slice(0, limit);
  return (
    <div className="rounded-3xl border border-line bg-card p-5">
      <p className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-ink">
        <Users className="h-4 w-4 text-value" /> People worth following
      </p>
      <ul className="space-y-3.5">
        {people.map((a) => (
          <li key={a.handle} className="flex items-center gap-3">
            <Link href={`/u/${a.handle}`}>
              <Avatar name={a.name} tone={a.tone} size={36} />
            </Link>
            <Link href={`/u/${a.handle}`} className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-semibold text-ink hover:underline">{a.name}</span>
              <span className="block truncate text-[12px] text-muted">{a.bio}</span>
            </Link>
            <button
              onClick={() => {
                toggleFollow(a.handle);
                toast({ title: `Following ${a.name}`, tone: "ink" });
              }}
              className="shrink-0 rounded-full bg-ink px-3 py-1 text-[12px] font-medium text-paper hover:bg-ink-2"
            >
              Follow
            </button>
          </li>
        ))}
        {people.length === 0 && <li className="text-[13px] text-muted">You&apos;re following everyone we&apos;d suggest.</li>}
      </ul>
    </div>
  );
}

export function CirclesRail() {
  const joined = useStore((s) => s.circles);
  const toggleCircle = useStore((s) => s.toggleCircle);
  return (
    <div className="rounded-3xl border border-line bg-card p-5">
      <p className="mb-1 text-[14px] font-semibold text-ink">Circles</p>
      <p className="mb-4 text-[12.5px] text-muted">Small communities around one goal.</p>
      <ul className="space-y-3">
        {CIRCLES.map((c) => {
          const on = joined.includes(c.id);
          return (
            <li key={c.id} className="flex items-center gap-3">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-display text-[13px] font-semibold", c.cls)}>{c.short}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink">{c.name}</span>
                <span className="block text-[12px] text-muted">
                  {(c.members + (on ? 1 : 0)).toLocaleString("en-IN")} members · {c.active} active now
                </span>
              </span>
              <button
                onClick={() => {
                  toggleCircle(c.id);
                  if (!on) toast({ title: `Joined ${c.name}`, body: "Its posts can now appear in your discovery slots.", tone: "ink" });
                }}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                  on ? "border-value bg-value-soft text-value" : "border-line-2 text-ink hover:border-ink",
                )}
              >
                {on ? "Joined" : "Join"}
              </button>
            </li>
          );
        })}
      </ul>
      <Link href="/explore" className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-value hover:underline">
        Explore all <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

