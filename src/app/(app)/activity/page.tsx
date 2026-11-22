"use client";

import { Award, Bell, MessageCircle, TrendingUp, TriangleAlert } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, PageHeader } from "@/components/ui";
import { activityFor, authorFor, useStore } from "@/lib/store";
import { cn, timeAgo } from "@/lib/utils";

const ICONS = {
  reply: { Icon: MessageCircle, cls: "bg-slate-soft text-slate" },
  reward: { Icon: Award, cls: "bg-value-soft text-value" },
  verdict: { Icon: TrendingUp, cls: "bg-value-soft text-value" },
  penalty: { Icon: TriangleAlert, cls: "bg-ember-soft text-ember" },
};

export default function ActivityPage() {
  const posts = useStore((s) => s.posts);
  const user = useStore((s) => s.user);
  const ledger = useStore((s) => s.ledger);
  const seenAt = useStore((s) => s.activitySeenAt);
  const markActivitySeen = useStore((s) => s.markActivitySeen);
  const [lastSeen] = useState(seenAt);
  const [filter, setFilter] = useState<"all" | "reply" | "reach">("all");
  const items = activityFor({ posts, user, ledger }).filter(
    (i) => filter === "all" || (filter === "reply" ? i.kind === "reply" : i.kind !== "reply"),
  );

  useEffect(() => {
    markActivitySeen();
  }, [markActivitySeen]);

  return (
    <div className="mx-auto max-w-[860px] px-5 py-10 md:px-10 lg:py-14">
      <PageHeader
        eyebrow="Activity"
        title={
          <>
            What happened <span className="font-serif font-normal italic">while you were away.</span>
          </>
        }
        sub="Replies to your posts, how they're climbing, and what you've earned. No “someone liked your post” noise."
      />
      <div className="mb-6 flex gap-1.5">
        {(
          [
            ["all", "All"],
            ["reply", "Replies"],
            ["reach", "Reach & rewards"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn("h-8 rounded-full px-3.5 text-[13px] transition-colors", filter === k ? "bg-ink text-paper" : "text-body hover:bg-paper-2 hover:text-ink")}
          >
            {l}
          </button>
        ))}
      </div>
      <ul className="overflow-hidden rounded-3xl border border-line bg-card">
        {items.map((it, i) => {
          const actor = it.actor ? authorFor(it.actor, user) : null;
          const { Icon, cls } = ICONS[it.kind];
          const unread = it.at > lastSeen;
          return (
            <motion.li key={it.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
              <Link href={it.href} className={cn("flex gap-4 border-b border-line px-5 py-4 transition-colors last:border-b-0 hover:bg-paper/70", unread && "bg-value-soft/30")}>
                <div className="relative shrink-0">
                  {actor ? <Avatar name={actor.name} tone={actor.tone} size={40} /> : (
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", cls)}>
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                  )}
                  {actor && (
                    <span className={cn("absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card", cls)}>
                      <Icon className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] leading-snug text-ink">
                    {actor && <span className="font-semibold">{actor.name} </span>}
                    {it.title}
                  </p>
                  {it.body && <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-body">{it.body}</p>}
                  <p className="mt-1.5 font-mono text-[11px] text-muted">{timeAgo(it.at)}</p>
                </div>
                {unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-value" />}
              </Link>
            </motion.li>
          );
        })}
        {items.length === 0 && (
          <li className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Bell className="h-6 w-6 text-muted" />
            <p className="text-[14px] text-body">Nothing here yet.</p>
          </li>
        )}
      </ul>
    </div>
  );
}
