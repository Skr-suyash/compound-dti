"use client";

import { ArrowRight, BarChart3, Bookmark, BookmarkCheck, Compass, FileText, HeartPulse, ImagePlus, MessageCircle, Plus, Share2, Sprout, Video, Zap } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MiniLadder, ProgressRing } from "@/components/domain";
import { PostMedia, SPARK_THEMES, sparkBackground } from "@/components/media";
import { ArticleCard, CirclesRail, PeopleToFollow, PollView, QuickRate, SocialProof, TopReply, captionFor } from "@/components/social";
import { toast } from "@/components/toast";
import { Avatar, Button, Chip } from "@/components/ui";
import { topicName } from "@/lib/seed";
import { authorFor, useStore } from "@/lib/store";
import type { FeedItem, Post } from "@/lib/types";
import { cn, pct, timeAgo } from "@/lib/utils";

/* ------------------------------ Feed card ------------------------------ */

function FeedCard({ index, total, item, post }: { index?: number; total?: number; item?: FeedItem; post: Post }) {
  const user = useStore((s) => s.user);
  const rating = useStore((s) => s.myRatings[post.id]);
  const skipped = useStore((s) => s.reads[post.id]?.skipped);
  const saved = useStore((s) => s.saved.includes(post.id));
  const following = useStore((s) => s.following.includes(post.authorHandle));
  const { toggleSave, toggleFollow } = useStore.getState();
  const author = authorFor(post.authorHandle, user);
  const done = rating !== undefined || skipped;
  const isArticle = post.type === "text" || post.type === "link";
  const own = post.authorHandle === user?.handle;

  return (
    <motion.li initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index ?? 0, 6) * 0.04, duration: 0.3 }}>
      <article className={cn("rounded-[24px] border border-line bg-card transition-shadow duration-200 hover:shadow-[0_18px_40px_-30px_rgba(15,27,42,0.4)]", done && "opacity-80 hover:opacity-100")}>
        {/* header */}
        <header className="flex items-start gap-3 px-5 pt-5 sm:px-6">
          <Link href={`/u/${author.handle}`} className="shrink-0">
            <Avatar name={author.name} tone={author.tone} size={44} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Link href={`/u/${author.handle}`} className="text-[15px] font-semibold text-ink hover:underline">
                {author.name}
              </Link>
              {!following && !own && (
                <button
                  onClick={() => {
                    toggleFollow(post.authorHandle);
                    toast({ title: `Following ${author.name}`, tone: "ink" });
                  }}
                  className="text-[13px] font-semibold text-value hover:underline"
                >
                  · Follow
                </button>
              )}
            </div>
            <p className="text-[12.5px] text-muted">
              @{author.handle} · {timeAgo(post.createdAt)} · {topicName(post.topic)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {item?.slot === "discovery" ? (
              <Chip tone="ochre">New voice</Chip>
            ) : item?.slot === "canon" ? (
              <Chip tone="ink">Canon</Chip>
            ) : post.stage > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] text-muted uppercase">
                <MiniLadder stage={post.stage} /> Stage {post.stage}
              </span>
            ) : null}
            {index !== undefined && total && (
              <span className={cn("font-mono text-[10.5px]", done ? "text-value" : "text-muted")}>
                {String(index + 1).padStart(2, "0")}/{total}
              </span>
            )}
          </div>
        </header>

        {/* body */}
        <div className="px-5 pt-3 sm:px-6">
          {post.type === "note" ? (
            <Link href={`/p/${post.id}`} className="block">
              <p className="text-[16px] leading-[1.6] whitespace-pre-line text-ink-2">{post.body}</p>
            </Link>
          ) : isArticle ? (
            <p className="text-[15px] leading-[1.6] text-ink-2">{captionFor(post)}</p>
          ) : (
            <Link href={`/p/${post.id}`} className="block">
              <p className="text-[16px] leading-snug font-semibold text-ink">{post.title}</p>
              {post.type !== "image" && <p className="mt-1 line-clamp-2 text-[14.5px] leading-relaxed text-body">{captionFor(post)}</p>}
            </Link>
          )}
          {post.media?.kind === "poll" && (
            <div className="mt-4">
              <PollView post={post} />
            </div>
          )}
          {(post.media?.kind === "youtube" || post.media?.kind === "image") && (
            <Link href={`/p/${post.id}`} className="mt-4 block">
              <PostMedia post={post} variant="card" />
            </Link>
          )}
          {isArticle && (
            <div className="mt-4">
              <ArticleCard post={post} />
            </div>
          )}
        </div>

        {/* social proof */}
        <div className="px-5 pt-4 sm:px-6">
          <SocialProof post={post} discovery={item?.slot === "discovery"} />
        </div>

        {/* actions */}
        <footer className="mt-3 flex items-center gap-0.5 border-t border-line px-2 py-1.5 sm:px-3">
          <QuickRate post={post} />
          <Link href={`/p/${post.id}#replies`} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-body hover:bg-paper-2 hover:text-ink">
            <MessageCircle className="h-4 w-4" /> {post.replies.length || "Reply"}
          </Link>
          <button
            onClick={() => {
              toggleSave(post.id);
              toast({ title: saved ? "Removed from saved" : "Saved for later", tone: "ink" });
            }}
            className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] hover:bg-paper-2", saved ? "text-value" : "text-body hover:text-ink")}
            aria-label="Save"
          >
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(`${window.location.origin}/p/${post.id}`);
              toast({ title: "Link copied", tone: "ink" });
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-body hover:bg-paper-2 hover:text-ink"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
          {skipped && rating === undefined && <span className="ml-auto pr-3 text-[12px] text-muted">Skipped</span>}
        </footer>

        <TopReply post={post} />
      </article>
    </motion.li>
  );
}

/* ------------------------------ Stories row ------------------------------ */

function SparkStories({ ids }: { ids: string[] }) {
  const posts = useStore((s) => s.posts);
  const watched = useStore((s) => s.watched);
  const user = useStore((s) => s.user);
  const sparks = ids.map((id) => posts.find((p) => p.id === id)).filter((p): p is Post => !!p);
  return (
    <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 py-1 md:mx-0 md:px-0">
      <Link href="/create?kind=spark" className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
        <span className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full border-2 border-dashed border-line-2 bg-card">
          {user && <Avatar name={user.name} tone="value" size={56} />}
          <span className="absolute -right-0.5 -bottom-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-paper bg-ink text-paper">
            <Plus className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        </span>
        <span className="text-[11.5px] text-body">Your Spark</span>
      </Link>
      {sparks.map((s, i) => {
        const author = authorFor(s.authorHandle, user);
        const seen = watched.includes(s.id);
        const theme = s.media?.kind === "spark" ? s.media.theme : "ink";
        return (
          <motion.div key={s.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="w-[72px] shrink-0">
            <Link href={`/sparks/${s.id}`} className="group flex flex-col items-center gap-1.5">
              <span className={cn("rounded-full p-[2.5px] transition-transform group-hover:scale-105", seen ? "bg-line-2" : "bg-gradient-to-tr from-ochre via-ember to-value")}>
                <span className="flex h-[63px] w-[63px] items-center justify-center rounded-full border-[3px] border-paper" style={{ background: sparkBackground(theme) }}>
                  <span className="font-display text-[15px] font-semibold" style={{ color: SPARK_THEMES[theme].fg }}>
                    {author.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </span>
              </span>
              <span className={cn("w-full truncate text-center text-[11.5px]", seen ? "text-muted" : "font-medium text-ink")}>{author.name.split(" ")[0]}</span>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ------------------------------ Composer box ------------------------------ */

function ComposerBox() {
  const user = useStore((s) => s.user);
  if (!user) return null;
  const actions = [
    { kind: "image", label: "Photo", Icon: ImagePlus, cls: "text-value" },
    { kind: "video", label: "Video", Icon: Video, cls: "text-ember" },
    { kind: "spark", label: "Spark", Icon: Zap, cls: "text-ochre" },
    { kind: "poll", label: "Poll", Icon: BarChart3, cls: "text-slate" },
    { kind: "text", label: "Article", Icon: FileText, cls: "text-ink" },
  ];
  return (
    <div className="rounded-[24px] border border-line bg-card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} tone="value" size={42} />
        <Link
          href="/create?kind=note"
          className="flex h-11 flex-1 items-center rounded-full border border-line bg-paper px-5 text-[14.5px] text-muted transition-colors hover:border-line-2 hover:text-body"
        >
          What did you learn today, {user.name.split(" ")[0]}?
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-1 pl-0 sm:pl-[54px]">
        {actions.map(({ kind, label, Icon, cls }) => (
          <Link key={kind} href={`/create?kind=${kind}`} className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-[13px] font-medium text-body hover:bg-paper-2 hover:text-ink">
            <Icon className={cn("h-4 w-4", cls)} /> {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Caught up ------------------------------ */

function CaughtUp({ minutes, worthRate }: { minutes: number; worthRate: number }) {
  const completeFeed = useStore((s) => s.completeFeed);
  const startNewDay = useStore((s) => s.startNewDay);
  useEffect(() => {
    completeFeed();
  }, [completeFeed]);
  return (
    <motion.section
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 22 }}
      className="relative mt-6 overflow-hidden rounded-[28px] bg-ink px-8 py-12 text-paper md:px-12"
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 14 }}
        className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3CC7A4] text-[#0f1b2a]"
      >
        <Sprout className="h-7 w-7" strokeWidth={1.8} />
      </motion.div>
      <h2 className="font-display text-[44px] leading-[1] font-semibold tracking-[-0.04em] md:text-[56px]">You&apos;re caught up.</h2>
      <p className="mt-4 max-w-md font-serif text-[20px] leading-snug text-paper/70 italic">That&apos;s everything worth your time today. Go do something with it.</p>
      <div className="mt-9 grid max-w-lg grid-cols-3 gap-6 border-t border-paper/15 pt-7">
        <div>
          <p className="font-display text-[32px] font-semibold tracking-tight">{Math.max(1, minutes)}</p>
          <p className="text-[12.5px] text-paper/55">minutes today</p>
        </div>
        <div>
          <p className="font-display text-[32px] font-semibold tracking-tight">{pct(worthRate)}</p>
          <p className="text-[12.5px] text-paper/55">worth it</p>
        </div>
        <div>
          <p className="font-display text-[32px] font-semibold tracking-tight text-[#3CC7A4]">+1</p>
          <p className="text-[12.5px] text-paper/55">merit</p>
        </div>
      </div>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link href="/wellbeing" className="inline-flex h-11 items-center gap-2 rounded-xl bg-paper px-5 text-[14px] font-medium text-ink">
          <HeartPulse className="h-4 w-4" /> See your week
        </Link>
        <Link href="/explore" className="inline-flex h-11 items-center gap-2 rounded-xl border border-paper/20 px-5 text-[14px] font-medium text-paper hover:bg-paper/10">
          <Compass className="h-4 w-4" /> Browse the Canon
        </Link>
      </div>
      <button onClick={startNewDay} className="mt-8 font-mono text-[11px] tracking-wider text-paper/35 uppercase hover:text-paper/70">
        Prototype · jump to tomorrow&apos;s feed →
      </button>
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full border border-paper/10" />
    </motion.section>
  );
}

/* ------------------------------ Page ------------------------------ */

export default function FeedPage() {
  const feed = useStore((s) => s.feed);
  const posts = useStore((s) => s.posts);
  const myRatings = useStore((s) => s.myRatings);
  const reads = useStore((s) => s.reads);
  const following = useStore((s) => s.following);
  const user = useStore((s) => s.user);
  const [tab, setTab] = useState<"foryou" | "following">("foryou");

  const rows = useMemo(
    () =>
      (feed?.items ?? [])
        .map((item) => ({ item, post: posts.find((p) => p.id === item.postId) }))
        .filter((r): r is { item: FeedItem; post: Post } => !!r.post),
    [feed, posts],
  );
  const followingPosts = useMemo(
    () =>
      posts
        .filter((p) => following.includes(p.authorHandle) && p.status === "screened" && p.type !== "spark" && p.verdict !== "junk")
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 15),
    [posts, following],
  );

  if (!feed) return null;

  const isDone = (id: string) => myRatings[id] !== undefined || reads[id]?.skipped;
  const done = rows.filter((r) => isDone(r.post.id)).length;
  const rated = rows.filter((r) => myRatings[r.post.id] !== undefined);
  const worthRate = rated.length ? rated.filter((r) => (myRatings[r.post.id] ?? -1) >= 1).length / rated.length : 0;
  const minutes = Math.round(rows.reduce((a, r) => a + (reads[r.post.id]?.seconds ?? 0), 0) / 60);
  const caughtUp = rows.length > 0 && done === rows.length;
  const next = rows.find((r) => !isDone(r.post.id));

  return (
    <div className="mx-auto grid max-w-[1120px] gap-8 px-4 py-6 md:px-8 lg:py-8 xl:grid-cols-[minmax(0,640px)_320px] xl:justify-center">
      <div className="min-w-0">
        {/* tabs + progress */}
        <div className="sticky top-14 z-30 -mx-4 mb-5 flex items-center justify-between gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur-md md:-mx-8 md:px-8 lg:top-0">
          <div className="flex">
            {(
              [
                ["foryou", "For you"],
                ["following", "Following"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn("relative h-14 px-4 text-[14.5px] font-semibold transition-colors", tab === k ? "text-ink" : "text-muted hover:text-ink")}
              >
                {l}
                {tab === k && <motion.span layoutId="feed-tab" className="absolute right-3 bottom-0 left-3 h-[3px] rounded-full bg-value" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden w-32 gap-[3px] sm:flex">
              {rows.map((r) => (
                <span key={r.post.id} className={cn("h-1.5 flex-1 rounded-full", isDone(r.post.id) ? "bg-value" : "bg-paper-2")} />
              ))}
            </div>
            <span className="rounded-full bg-card px-3 py-1 font-mono text-[11.5px] text-ink ring-1 ring-line">
              {done}/{rows.length} today
            </span>
          </div>
        </div>

        <SparkStories ids={feed.sparks ?? []} />
        <div className="mt-5">
          <ComposerBox />
        </div>

        {tab === "foryou" ? (
          <>
            <ol className="mt-5 flex flex-col gap-4">
              {rows.map((r, i) => (
                <FeedCard key={r.post.id} index={i} total={rows.length} item={r.item} post={r.post} />
              ))}
            </ol>
            {caughtUp ? (
              <CaughtUp minutes={minutes} worthRate={worthRate} />
            ) : (
              rows.length > 0 && (
                <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[24px] border border-dashed border-line-2 p-6 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-display text-[17px] font-semibold text-ink">{rows.length - done} left, then today&apos;s feed ends.</p>
                    <p className="mt-1 text-[13px] text-muted">No “load more”. Rate or skip each one to finish your day.</p>
                  </div>
                  {next && (
                    <Link href={`/p/${next.post.id}`}>
                      <Button>
                        Continue <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              )
            )}
          </>
        ) : followingPosts.length ? (
          <>
            <ol className="mt-5 flex flex-col gap-4">
              {followingPosts.map((p, i) => (
                <FeedCard key={p.id} index={i} post={p} />
              ))}
            </ol>
            <p className="mt-6 text-center text-[13.5px] text-muted">That&apos;s everything from people you follow.</p>
          </>
        ) : (
          <div className="mt-5 rounded-[24px] border border-dashed border-line-2 p-10 text-center">
            <p className="font-display text-[20px] font-semibold text-ink">You&apos;re not following anyone yet.</p>
            <p className="mt-1 text-[14px] text-body">Follow people whose posts you found worth your time. There are no follower counts here.</p>
            <div className="mx-auto mt-6 max-w-sm text-left">
              <PeopleToFollow limit={4} />
            </div>
          </div>
        )}
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-6 space-y-4">
          <div className="flex items-center gap-4 rounded-3xl border border-line bg-card p-5">
            <ProgressRing value={rows.length ? done / rows.length : 0} size={64} stroke={6}>
              <span className="font-display text-[16px] font-semibold text-ink">{done}</span>
            </ProgressRing>
            <div>
              <p className="text-[14px] font-semibold text-ink">Your day</p>
              <p className="text-[12.5px] text-muted">
                {minutes} min · {rated.length ? `${pct(worthRate)} worth it` : "nothing rated yet"}
              </p>
              <p className="mt-0.5 text-[12.5px] text-muted">{rows.length - done} left, then it ends</p>
            </div>
          </div>
          <PeopleToFollow limit={4} />
          <CirclesRail />
          <p className="px-2 text-[11.5px] leading-relaxed text-muted">
            No likes. No follower counts. No infinite scroll. Signed in as @{user?.handle}.
          </p>
        </div>
      </aside>
    </div>
  );
}
