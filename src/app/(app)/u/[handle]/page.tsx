"use client";

import { CalendarDays, Check, FileText, Image as ImageIcon, PenLine, Play, Settings, UserPlus, Zap } from "lucide-react";
import { useState } from "react";
import { PostThumb } from "@/components/media";
import { toast } from "@/components/toast";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Avatar, ButtonLink, Chip, Eyebrow } from "@/components/ui";
import { posteriorFor } from "@/lib/scoring";
import { TOPICS, topicName } from "@/lib/seed";
import { authorFor, balances, useStore } from "@/lib/store";
import { cn, pct, timeAgo } from "@/lib/utils";

export default function ProfilePage() {
  const { handle } = useParams<{ handle: string }>();
  const user = useStore((s) => s.user);
  const posts = useStore((s) => s.posts);
  const ledger = useStore((s) => s.ledger);
  const author = authorFor(decodeURIComponent(handle), user);
  const own = user?.handle === author.handle;

  const theirs = posts
    .filter((p) => p.authorHandle === author.handle && p.status === "screened" && (own || p.verdict !== "junk"))
    .sort((a, b) => b.stage - a.stage || b.createdAt - a.createdAt);
  const canon = theirs.filter((p) => p.stage === 3).length;
  const rated = theirs.map((p) => posteriorFor(p.counts, p.ai.aiQuality)).filter((p) => p.n > 0);
  const worth = rated.length ? rated.reduce((a, p) => a + p.worthPct, 0) / rated.length : 0;
  const topics = [...new Set(theirs.map((p) => p.topic))];
  const myBalances = own ? balances(ledger) : null;
  const following = useStore((s) => s.following.includes(author.handle));
  const toggleFollow = useStore((s) => s.toggleFollow);
  const [tab, setTab] = useState<"all" | "text" | "video" | "spark" | "image">("all");
  const counts = {
    all: theirs.length,
    text: theirs.filter((p) => p.type === "text" || p.type === "link").length,
    video: theirs.filter((p) => p.type === "video").length,
    spark: theirs.filter((p) => p.type === "spark").length,
    image: theirs.filter((p) => p.type === "image").length,
  };
  const shown = theirs.filter((p) => tab === "all" || p.type === tab || (tab === "text" && p.type === "link"));

  return (
    <div>
      <div className="relative h-44 overflow-hidden border-b border-line bg-paper-2 md:h-56">
        <div className="absolute inset-0 rule-dots opacity-80" />
        <div className="absolute right-10 bottom-0 hidden items-end gap-3 md:flex">
          {[40, 70, 110, 160].map((h, i) => (
            <div key={h} className="w-14 rounded-t-2xl bg-value" style={{ height: h, opacity: 0.18 + i * 0.22 }} />
          ))}
        </div>
      </div>
      <div className="relative z-10 mx-auto max-w-[1000px] px-5 md:px-10">
        <div className="-mt-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Avatar name={author.name} tone={author.tone} size={112} className="border-[6px] border-paper text-[40px]" />
            <h1 className="mt-5 font-display text-[40px] leading-none font-semibold tracking-[-0.035em] text-ink">{author.name}</h1>
            <p className="mt-2 font-mono text-[13px] text-muted">@{author.handle}</p>
            <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-body">{author.bio}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {topics.map((t) => (
                <Chip key={t}>{topicName(t)}</Chip>
              ))}
              {own && user && (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
                  <CalendarDays className="h-3.5 w-3.5" /> Joined {new Date(user.joinedAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
          {!own && (
            <button
              onClick={() => {
                toggleFollow(author.handle);
                if (!following) toast({ title: `Following ${author.name}`, body: "No follower counts here — just their new posts in your discovery slots.", tone: "ink" });
              }}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[14px] font-medium transition-colors",
                following ? "border border-line-2 text-ink hover:border-ink" : "bg-ink text-paper hover:bg-ink-2",
              )}
            >
              {following ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />} {following ? "Following" : "Follow"}
            </button>
          )}
          {own && (
            <div className="flex gap-2">
              <ButtonLink href="/settings" variant="outline">
                <Settings className="h-4 w-4" /> Settings
              </ButtonLink>
              <ButtonLink href="/create">
                <PenLine className="h-4 w-4" /> Write
              </ButtonLink>
            </div>
          )}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 border-y border-line py-7 md:grid-cols-4">
          <div>
            <Eyebrow>Posts</Eyebrow>
            <p className="mt-2 font-display text-[30px] font-semibold text-ink">{theirs.length}</p>
          </div>
          <div>
            <Eyebrow>In the Canon</Eyebrow>
            <p className="mt-2 font-display text-[30px] font-semibold text-ink">{canon}</p>
          </div>
          <div>
            <Eyebrow>Worth-it rate</Eyebrow>
            <p className="mt-2 font-display text-[30px] font-semibold text-value">{rated.length ? pct(worth) : "—"}</p>
          </div>
          <div>
            <Eyebrow>{own ? "Merit" : "Readers"}</Eyebrow>
            <p className="mt-2 font-display text-[30px] font-semibold text-ink">
              {own ? myBalances?.merit : rated.reduce((a, p) => a + p.n, 0)}
            </p>
          </div>
        </div>

        {own && myBalances && (
          <div className="mt-8 flex flex-wrap gap-2">
            {TOPICS.filter((t) => (myBalances.cred[t.id] ?? 0) > 0).map((t) => (
              <span key={t.id} className="rounded-full border border-line bg-card px-3 py-1.5 text-[12.5px] text-body">
                {t.name} cred <span className="font-mono text-value">{myBalances.cred[t.id]}</span>
              </span>
            ))}
          </div>
        )}

        <section className="py-10">
          <div className="no-scrollbar mb-6 flex gap-1.5 overflow-x-auto">
            {(
              [
                ["all", "All", null],
                ["text", "Posts", FileText],
                ["video", "Videos", Play],
                ["spark", "Sparks", Zap],
                ["image", "Images", ImageIcon],
              ] as const
            ).map(([k, label, Icon]) =>
              counts[k] || k === "all" ? (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13.5px] transition-colors",
                    tab === k ? "bg-ink text-paper" : "text-body hover:bg-paper-2 hover:text-ink",
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />} {label} <span className="font-mono text-[11px] opacity-60">{counts[k]}</span>
                </button>
              ) : null,
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {shown.map((post) => {
              const p = posteriorFor(post.counts, post.ai.aiQuality);
              const href = post.type === "spark" ? `/sparks/${post.id}` : own ? `/studio/${post.id}` : `/p/${post.id}`;
              return (
                <Link key={post.id} href={href} className="group relative aspect-square overflow-hidden rounded-2xl">
                  <PostThumb post={post} bare className="transition-transform duration-500 group-hover:scale-[1.03]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {post.stage === 3 && <Chip tone="ink">Canon</Chip>}
                  </div>
                  <div className="absolute inset-x-4 bottom-3.5 text-white">
                    <p className="line-clamp-2 font-serif text-[16px] leading-snug font-medium">{post.title}</p>
                    <p className="mt-1 font-mono text-[10.5px] tracking-wide text-white/70 uppercase">
                      {topicName(post.topic)} · {p.n ? `${pct(p.worthPct)} worth it` : timeAgo(post.createdAt)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          {shown.length === 0 && <p className="py-10 text-body">No posts yet.</p>}
        </section>
      </div>
    </div>
  );
}
