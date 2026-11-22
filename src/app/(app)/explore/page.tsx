"use client";

import { ArrowUpRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MiniLadder } from "@/components/domain";
import { PostThumb, SparkThumb } from "@/components/media";
import { Avatar, Chip, Eyebrow, PageHeader } from "@/components/ui";
import { posteriorFor } from "@/lib/scoring";
import { TOPICS, topicName } from "@/lib/seed";
import { authorFor, useStore } from "@/lib/store";
import type { Post, TopicId } from "@/lib/types";
import { cn, excerpt, pct } from "@/lib/utils";

function CanonCard({ post }: { post: Post }) {
  const user = useStore((s) => s.user);
  const author = authorFor(post.authorHandle, user);
  const p = posteriorFor(post.counts, post.ai.aiQuality);
  return (
    <Link
      href={`/p/${post.id}`}
      className="group relative flex w-[300px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl bg-ink p-6 text-paper transition-transform hover:-translate-y-1 md:w-[340px]"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="eyebrow text-paper/50">{topicName(post.topic)}</span>
          <span className="rounded-full bg-[#3CC7A4] px-2 py-0.5 font-mono text-[10px] tracking-widest text-ink uppercase">Canon</span>
        </div>
        <p className="mt-6 font-serif text-[25px] leading-[1.15] font-medium">{post.title}</p>
      </div>
      <div className="mt-10 flex items-center justify-between border-t border-paper/15 pt-4">
        <span className="flex items-center gap-2 text-[13px] text-paper/70">
          <Avatar name={author.name} tone={author.tone} size={22} /> {author.name}
        </span>
        <span className="font-mono text-[11.5px] text-[#3CC7A4]">{pct(p.worthPct)} worth it</span>
      </div>
      <div className="pointer-events-none absolute -right-14 -bottom-14 h-40 w-40 rounded-full border border-paper/10 transition-transform duration-500 group-hover:scale-110" />
    </Link>
  );
}

function ListRow({ post }: { post: Post }) {
  const user = useStore((s) => s.user);
  const author = authorFor(post.authorHandle, user);
  const p = posteriorFor(post.counts, post.ai.aiQuality);
  return (
    <Link href={`/p/${post.id}`} className="group flex flex-col gap-3 overflow-hidden rounded-3xl border border-line bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-line-2">
      <div className="-mx-6 -mt-6 mb-2 aspect-[16/9]">
        <PostThumb post={post} bare />
      </div>
      <div className="flex items-center justify-between">
        <span className="eyebrow text-muted">{topicName(post.topic)}</span>
        {post.stage === 0 ? (
          <Chip tone="ochre">New voice</Chip>
        ) : (
          <span className="flex items-center gap-2 font-mono text-[10.5px] text-muted uppercase">
            <MiniLadder stage={post.stage} /> Stage {post.stage}
          </span>
        )}
      </div>
      <p className="font-serif text-[21px] leading-snug font-medium text-ink decoration-value underline-offset-4 group-hover:underline">{post.title}</p>
      <p className="line-clamp-2 text-[13.5px] leading-relaxed text-body">{excerpt(post.body, 150)}</p>
      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="flex items-center gap-2 text-[12.5px] text-body">
          <Avatar name={author.name} tone={author.tone} size={20} /> {author.name}
        </span>
        <span className="font-mono text-[11px] text-muted">{p.n ? `${pct(p.worthPct)} of ${p.n}` : "Awaiting ratings"}</span>
      </div>
    </Link>
  );
}

export default function ExplorePage() {
  const posts = useStore((s) => s.posts);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState<TopicId | "all">("all");

  const visible = useMemo(
    () =>
      posts.filter(
        (p) =>
          p.status === "screened" &&
          p.verdict !== "junk" &&
          p.verdict !== "stopped" &&
          (topic === "all" || p.topic === topic) &&
          (!q.trim() || `${p.title} ${p.body}`.toLowerCase().includes(q.trim().toLowerCase())),
      ),
    [posts, q, topic],
  );
  const score = (p: Post) => posteriorFor(p.counts, p.ai.aiQuality).mean;
  const canon = visible.filter((p) => p.stage === 3 && p.type !== "spark").sort((a, b) => score(b) - score(a));
  const sparks = visible.filter((p) => p.type === "spark").sort((a, b) => score(b) - score(a));
  const videos = visible.filter((p) => p.type === "video").sort((a, b) => b.stage - a.stage || score(b) - score(a));
  const climbing = visible.filter((p) => p.type !== "spark" && p.type !== "video" && (p.stage === 1 || p.stage === 2)).sort((a, b) => b.stage - a.stage || score(b) - score(a));
  const fresh = visible.filter((p) => p.type !== "spark" && p.type !== "video" && p.stage === 0).sort((a, b) => b.createdAt - a.createdAt);
  const searching = q.trim().length > 0;

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-10 lg:py-14">
      <PageHeader
        eyebrow="Explore"
        title={
          <>
            Browse on purpose, <span className="font-serif font-normal italic">not by accident.</span>
          </>
        }
        sub="Search and topic shelves for when you're looking for something specific. Explore doesn't count against your daily feed."
      />

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts — try “dynamic programming” or “budget”"
          className="h-14 w-full rounded-2xl border border-line-2 bg-card pr-12 pl-14 text-[16px] text-ink outline-none placeholder:text-muted/70 focus:border-ink"
        />
        {q && (
          <button onClick={() => setQ("")} className="absolute top-1/2 right-4 -translate-y-1/2 rounded-lg p-1 text-muted hover:text-ink" aria-label="Clear">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="no-scrollbar mt-5 flex gap-1.5 overflow-x-auto">
        {[{ id: "all" as const, name: "All topics" }, ...TOPICS].map((t) => (
          <button
            key={t.id}
            onClick={() => setTopic(t.id)}
            className={cn(
              "h-9 shrink-0 rounded-full border px-4 text-[13.5px] transition-colors",
              topic === t.id ? "border-ink bg-ink text-paper" : "border-line text-body hover:border-line-2 hover:text-ink",
            )}
          >
            {t.name}
          </button>
        ))}
      </div>

      {searching ? (
        <section className="mt-12">
          <Eyebrow className="mb-5">
            {visible.length} result{visible.length === 1 ? "" : "s"} for “{q}”
          </Eyebrow>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <ListRow key={p.id} post={p} />
            ))}
          </div>
          {visible.length === 0 && <p className="mt-6 text-body">Nothing matches yet. Maybe you should write it?</p>}
        </section>
      ) : (
        <>
          {canon.length > 0 && (
            <section className="mt-14">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink">The Canon</h2>
                  <p className="mt-1 text-[14px] text-body">Posts that climbed every rung. Still worth your time months later.</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted" />
              </div>
              <div className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 md:-mx-10 md:px-10">
                {canon.map((p) => (
                  <CanonCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}
          {sparks.length > 0 && (
            <section className="mt-16">
              <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink">Sparks</h2>
              <p className="mt-1 mb-6 text-[14px] text-body">Lessons under a minute. Tap one to watch.</p>
              <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 md:-mx-10 md:px-10">
                {sparks.map((p) => (
                  <Link key={p.id} href={`/sparks/${p.id}`} className="w-[150px] shrink-0 transition-transform hover:-translate-y-1">
                    <SparkThumb post={p} />
                  </Link>
                ))}
              </div>
            </section>
          )}
          {videos.length > 0 && (
            <section className="mt-16">
              <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink">Worth watching</h2>
              <p className="mt-1 mb-6 text-[14px] text-body">Videos shared by creators, each with their take on why it&apos;s worth your time.</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {videos.map((p) => (
                  <ListRow key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}
          {climbing.length > 0 && (
            <section className="mt-16">
              <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink">Climbing now</h2>
              <p className="mt-1 mb-6 text-[14px] text-body">Readers are confident these are worth it. They&apos;re earning wider reach.</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {climbing.map((p) => (
                  <ListRow key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}
          {fresh.length > 0 && (
            <section className="mt-16">
              <h2 className="font-display text-[28px] font-semibold tracking-tight text-ink">New voices</h2>
              <p className="mt-1 mb-6 text-[14px] text-body">Fresh posts still finding their first audience.</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {fresh.map((p) => (
                  <ListRow key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
