"use client";

import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Check, Flag, Link2, SkipForward } from "lucide-react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Markdown, RatingPicker, StageLadder, VerdictBadge } from "@/components/domain";
import { PostMedia } from "@/components/media";
import { Replies } from "@/components/replies";
import { PollView } from "@/components/social";
import { toast } from "@/components/toast";
import { Avatar, Button, Chip, Eyebrow, Kbd } from "@/components/ui";
import { posteriorFor } from "@/lib/scoring";
import { topicName } from "@/lib/seed";
import { authorFor, useStore } from "@/lib/store";
import type { RatingValue } from "@/lib/types";
import { cn, pct, timeAgo } from "@/lib/utils";

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const post = useStore((s) => s.posts.find((p) => p.id === id));
  const user = useStore((s) => s.user);
  const feed = useStore((s) => s.feed);
  const myRating = useStore((s) => s.myRatings[id]);
  const reads = useStore((s) => s.reads);
  const myRatings = useStore((s) => s.myRatings);
  const saved = useStore((s) => s.saved.includes(id));
  const reported = useStore((s) => s.reported.includes(id));
  const { openPost, addReadSeconds, ratePost, toggleSave, reportPost, skipPost } = useStore.getState();
  const [justRated, setJustRated] = useState<RatingValue | null>(null);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });

  useEffect(() => {
    if (post?.type === "spark") router.replace(`/sparks/${post.id}`);
  }, [post?.type, post?.id, router]);

  useEffect(() => {
    if (!post) return;
    openPost(id);
    window.scrollTo(0, 0);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") addReadSeconds(id, 5);
    }, 5000);
    return () => clearInterval(t);
  }, [id, post?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const own = post?.authorHandle === user?.handle;

  const rate = (v: RatingValue) => {
    if (!post || own) return;
    const decision = ratePost(post.id, v);
    setJustRated(v);
    if (decision?.action === "promote") {
      toast({ title: `Your rating helped it climb`, body: `This post just reached ${decision.stage === 3 ? "the Canon" : `Stage ${decision.stage}`}.` });
    } else if (decision?.action === "junk") {
      toast({ title: "Marked as junk", body: "Enough readers agreed this wasted their time.", tone: "ember" });
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const map: Record<string, RatingValue> = { "1": -1, "2": 0, "3": 1, "4": 2 };
      if (map[e.key] !== undefined) rate(map[e.key]!);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!post) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="font-display text-[28px] font-semibold text-ink">This post isn&apos;t available.</p>
        <Link href="/feed" className="mt-4 inline-block text-value">Back to today</Link>
      </div>
    );
  }

  const author = authorFor(post.authorHandle, user);
  const p = posteriorFor(post.counts, post.ai.aiQuality);
  const slot = feed?.items.find((i) => i.postId === post.id)?.slot;
  const nextItem = feed?.items.find((i) => i.postId !== post.id && myRatings[i.postId] === undefined && !reads[i.postId]?.skipped);
  const rated = myRating !== undefined;

  const why =
    slot === "discovery"
      ? "This is a new post getting its fair first audience. Your rating is one of the first ~20 that decide whether it climbs."
      : slot === "canon"
        ? `This post is in the Canon — ${pct(p.worthPct)} of ${p.n} readers found it worth their time.`
        : slot === "ranked"
          ? `Reached Stage ${post.stage}: ${pct(p.worthPct)} of ${p.n} readers found it worth their time.`
          : own
            ? "This is your post. Readers' ratings appear in your Studio."
            : `Opened from outside your daily feed. Ratings here are saved but don't affect its reach.`;

  return (
    <article className="relative">
      <motion.div style={{ scaleX: progress }} className="fixed top-0 right-0 left-0 z-50 h-[3px] origin-left bg-value lg:left-[264px]" />

      <div className="mx-auto grid max-w-[1180px] gap-14 px-5 py-8 md:px-10 lg:py-12 xl:grid-cols-[1fr_280px]">
        <div className="mx-auto w-full max-w-[700px] min-w-0">
          <button onClick={() => router.back()} className="mb-10 inline-flex items-center gap-1.5 text-[13.5px] text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Eyebrow className="text-value">{topicName(post.topic)}</Eyebrow>
            <span className="h-1 w-1 rounded-full bg-line-2" />
            <span className="text-[13px] text-muted">{post.type === "video" ? "Video" : post.type === "note" ? (post.media?.kind === "poll" ? "Poll" : "Note") : `${post.readMinutes} min read`}</span>
            {slot === "discovery" && <Chip tone="ochre">New voice</Chip>}
            {slot === "canon" && <Chip tone="ink">Canon</Chip>}
          </div>
          {post.type !== "note" && (
            <h1 className="font-serif text-[40px] leading-[1.08] font-medium tracking-[-0.02em] text-ink md:text-[54px]">{post.title}</h1>
          )}

          <div className="mt-8 flex items-center justify-between gap-4 border-y border-line py-5">
            <Link href={`/u/${author.handle}`} className="flex items-center gap-3">
              <Avatar name={author.name} tone={author.tone} size={42} />
              <span>
                <span className="block text-[15px] font-semibold text-ink">{author.name}</span>
                <span className="block font-mono text-[12px] text-muted">
                  @{author.handle} · {timeAgo(post.createdAt)}
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  toggleSave(post.id);
                  toast({ title: saved ? "Removed from saved" : "Saved for later", tone: "ink" });
                }}
                className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-paper-2", saved ? "text-value" : "text-body")}
                aria-label="Save"
              >
                {saved ? <BookmarkCheck className="h-[18px] w-[18px]" /> : <Bookmark className="h-[18px] w-[18px]" />}
              </button>
              <button
                onClick={() => {
                  void navigator.clipboard?.writeText(window.location.href);
                  toast({ title: "Link copied", tone: "ink" });
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-body hover:bg-paper-2"
                aria-label="Copy link"
              >
                <Link2 className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>

          <div className="my-8 flex gap-3 rounded-2xl bg-paper-2 px-5 py-4 text-[13.5px] leading-relaxed text-body">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-value" />
            <p>
              <span className="font-semibold text-ink">Why you&apos;re seeing this. </span>
              {why}
            </p>
          </div>

          {(post.media?.kind === "youtube" || post.media?.kind === "image") && (
            <div className="mb-10">
              <PostMedia post={post} variant="full" />
              {post.media.kind === "youtube" && (
                <p className="mt-3 text-[12.5px] text-muted">
                  Video by <span className="font-medium text-ink">{post.media.channel}</span> · shared by {author.name} with the take below
                </p>
              )}
            </div>
          )}

          {post.type === "link" && post.url && (
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mb-8 flex items-center justify-between gap-4 rounded-2xl border border-line bg-card px-5 py-4 transition-colors hover:border-line-2"
            >
              <span className="min-w-0">
                <span className="eyebrow block text-muted">Shared link</span>
                <span className="mt-1 block truncate text-[15px] font-medium text-ink">{post.site ?? post.url}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
            </a>
          )}

          {post.type === "note" ? (
            <div>
              <p className="text-[22px] leading-[1.55] whitespace-pre-line text-ink">{post.body}</p>
              {post.media?.kind === "poll" && (
                <div className="mt-6">
                  <PollView post={post} />
                </div>
              )}
            </div>
          ) : (
            <Markdown>{post.body}</Markdown>
          )}

          {/* Rating */}
          <section className="mt-16 rounded-[28px] border border-line bg-card p-6 md:p-8">
            {own ? (
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-display text-[22px] font-semibold text-ink">This is your post.</p>
                  <p className="mt-1 text-[14px] text-body">See how readers rated it and where it is on the ladder.</p>
                </div>
                <Link href={`/studio/${post.id}`}>
                  <Button>
                    Open in Studio <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-display text-[26px] leading-tight font-semibold tracking-tight text-ink">
                      {post.type === "video" ? "Was this video worth your time?" : post.type === "note" ? "Was this worth your time?" : "Was this worth your time?"}
                    </p>
                    <p className="mt-1.5 text-[14px] text-body">Be honest — it decides whether this post reaches more people.</p>
                  </div>
                  <span className="hidden items-center gap-1 text-[12px] text-muted sm:flex">
                    <Kbd>1</Kbd>–<Kbd>4</Kbd>
                  </span>
                </div>
                <RatingPicker value={myRating} onChange={rate} />
                <AnimatePresence>
                  {(rated || justRated !== null) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 sm:flex-row sm:items-center">
                        <p className="flex items-center gap-2 text-[14px] text-body">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-value text-on-ink">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                          Thanks — your rating counts toward its reach.
                        </p>
                        {nextItem ? (
                          <Link href={`/p/${nextItem.postId}`}>
                            <Button>
                              Next post <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        ) : (
                          <Link href="/feed">
                            <Button variant="accent">
                              Finish your day <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!rated && slot && (
                  <button
                    onClick={() => {
                      skipPost(post.id);
                      router.push(nextItem ? `/p/${nextItem.postId}` : "/feed");
                    }}
                    className="mt-5 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink"
                  >
                    <SkipForward className="h-3.5 w-3.5" /> Skip without rating
                  </button>
                )}
              </>
            )}
          </section>

          <Replies post={post} />

          {!own && (
            <button
              onClick={() => {
                reportPost(post.id);
                toast({ title: "Report received", body: "A moderator will review this post.", tone: "ink" });
              }}
              disabled={reported}
              className="mt-6 inline-flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ember disabled:opacity-50"
            >
              <Flag className="h-3.5 w-3.5" /> {reported ? "Reported" : "Report this post"}
            </button>
          )}
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-12 space-y-5">
            <div className="rounded-3xl border border-line bg-card p-6">
              <div className="flex items-center justify-between">
                <Eyebrow>Reach</Eyebrow>
                <VerdictBadge verdict={post.verdict} />
              </div>
              <div className="mt-5">
                <StageLadder stage={post.stage} verdict={post.verdict} shown={post.stageShown} target={post.stageTarget} />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5">
                <div>
                  <p className="font-display text-[24px] font-semibold text-ink">{p.n ? pct(p.worthPct) : "—"}</p>
                  <p className="text-[12px] text-muted">worth it</p>
                </div>
                <div>
                  <p className="font-display text-[24px] font-semibold text-ink">{p.n}</p>
                  <p className="text-[12px] text-muted">ratings</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-line p-6">
              <Eyebrow>About the author</Eyebrow>
              <div className="mt-4 flex items-center gap-3">
                <Avatar name={author.name} tone={author.tone} size={36} />
                <p className="text-[14px] font-semibold text-ink">{author.name}</p>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-body">{author.bio}</p>
              <Link href={`/u/${author.handle}`} className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-value hover:underline">
                View profile <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
