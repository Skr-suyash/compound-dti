"use client";

import { Lightbulb, MessageCircle, Reply as ReplyIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { authorFor, useStore } from "@/lib/store";
import type { Post } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { toast } from "./toast";
import { Avatar, Button, Chip } from "./ui";

export function Replies({ post }: { post: Post }) {
  const user = useStore((s) => s.user);
  const helpful = useStore((s) => s.helpful);
  const { addReply, toggleHelpful } = useStore.getState();
  const [draft, setDraft] = useState("");
  const [sort, setSort] = useState<"helpful" | "new">("helpful");
  const box = useRef<HTMLTextAreaElement>(null);

  const replies = [...post.replies].sort((a, b) => (sort === "helpful" ? b.helpful - a.helpful || b.at - a.at : b.at - a.at));

  const submit = () => {
    if (!draft.trim()) return;
    addReply(post.id, draft);
    setDraft("");
    setSort("new");
    toast({ title: "Reply posted", body: "Readers can mark it helpful.", tone: "ink" });
  };

  return (
    <section id="replies" className="mt-14 scroll-mt-24">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-display text-[24px] font-semibold tracking-tight text-ink">
            <MessageCircle className="h-5 w-5 text-value" /> Discussion
            <span className="font-mono text-[14px] font-normal text-muted">{post.replies.length}</span>
          </p>
          <p className="mt-1 text-[13.5px] text-muted">Ranked by how helpful readers found each reply — not by likes.</p>
        </div>
        <div className="inline-flex rounded-lg bg-paper-2 p-0.5 text-[12.5px]">
          {(["helpful", "new"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={cn("h-7 rounded-md px-3 capitalize transition-colors", sort === k ? "bg-card text-ink shadow-sm" : "text-muted")}
            >
              {k === "helpful" ? "Most helpful" : "Newest"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-card p-4 sm:p-5">
        <div className="flex gap-3">
          {user && <Avatar name={user.name} tone="value" size={34} />}
          <div className="flex-1">
            <textarea
              ref={box}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              maxLength={600}
              placeholder="Add something useful — a question, an example, or a correction."
              className="w-full resize-none bg-transparent pt-1.5 text-[15px] leading-relaxed text-ink outline-none placeholder:text-muted/70"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted">{draft.length}/600</span>
              <Button size="sm" onClick={submit} disabled={!draft.trim()}>
                Reply
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        <AnimatePresence initial={false}>
          {replies.map((r) => {
            const a = authorFor(r.authorHandle, user);
            const isAuthor = r.authorHandle === post.authorHandle;
            const mine = r.authorHandle === user?.handle;
            const marked = helpful.includes(r.id);
            return (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-line bg-card px-5 py-4"
              >
                <div className="flex items-center gap-2.5">
                  <Link href={`/u/${a.handle}`}>
                    <Avatar name={a.name} tone={a.tone} size={30} />
                  </Link>
                  <Link href={`/u/${a.handle}`} className="text-[14px] font-semibold text-ink hover:underline">
                    {a.name}
                  </Link>
                  {isAuthor && <Chip tone="value">Author</Chip>}
                  <span className="text-[12.5px] text-muted">· {timeAgo(r.at)}</span>
                </div>
                <p className="mt-2.5 text-[15px] leading-relaxed text-ink-2">{r.body}</p>
                <div className="mt-3 flex items-center gap-1">
                  <button
                    onClick={() => !mine && toggleHelpful(post.id, r.id)}
                    disabled={mine}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] transition-colors disabled:opacity-50",
                      marked ? "bg-value-soft text-value" : "text-body hover:bg-paper-2 hover:text-ink",
                    )}
                  >
                    <Lightbulb className={cn("h-3.5 w-3.5", marked && "fill-current")} /> Helpful{r.helpful ? ` · ${r.helpful}` : ""}
                  </button>
                  <button
                    onClick={() => {
                      setDraft((d) => (d.startsWith(`@${a.handle}`) ? d : `@${a.handle} ${d}`));
                      box.current?.focus();
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] text-body hover:bg-paper-2 hover:text-ink"
                  >
                    <ReplyIcon className="h-3.5 w-3.5" /> Reply
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {replies.length === 0 && <p className="mt-6 text-center text-[14px] text-muted">No replies yet. Start a useful discussion.</p>}
    </section>
  );
}
