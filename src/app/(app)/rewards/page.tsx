"use client";

import { Award, BookOpen, Check, Sprout, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Card, Eyebrow, PageHeader } from "@/components/ui";
import { TOPICS } from "@/lib/seed";
import { balances, quotaFor, useStore } from "@/lib/store";
import { cn, timeAgo } from "@/lib/utils";

const EARN = [
  { Icon: TrendingUp, t: "Your post climbs a stage", merit: "+10 / +15 / +25", cred: "+2 / +3 / +5" },
  { Icon: Sprout, t: "You finish your day's feed", merit: "+1", cred: "—" },
  { Icon: Check, t: "Your ratings match the community", merit: "+1 per 10", cred: "—" },
  { Icon: BookOpen, t: "A post is marked junk", merit: "—", cred: "−5", bad: true },
];

export default function RewardsPage() {
  const ledger = useStore((s) => s.ledger);
  const posts = useStore((s) => s.posts);
  const user = useStore((s) => s.user);
  const config = useStore((s) => s.config);
  const { merit, cred } = balances(ledger);
  const quota = quotaFor({ posts, user, config });
  const maxCred = Math.max(10, ...Object.values(cred).map((v) => v ?? 0));
  const entries = [...ledger].sort((a, b) => b.at - a.at);

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-10 lg:py-14">
      <PageHeader
        eyebrow="Merit & Cred"
        title={
          <>
            Rewarded for value, <span className="font-serif font-normal italic">not for attention.</span>
          </>
        }
        sub="Points can't be bought, sold or traded — so they can't be farmed. They reflect one thing: whether people found your time on Compound worth it."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-3xl bg-ink p-8 text-paper">
            <p className="eyebrow text-paper/50">Merit balance</p>
            <p className="mt-4 font-display text-[80px] leading-none font-semibold tracking-[-0.05em]">{merit}</p>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-paper/60">
              Earned by creating posts readers value, finishing your day and rating honestly.
            </p>
            <Award className="absolute top-8 right-8 h-10 w-10 text-[#3CC7A4]" strokeWidth={1.4} />
          </div>

          <Card className="p-7">
            <div className="flex items-center justify-between">
              <Eyebrow>Cred by topic</Eyebrow>
              <span className="text-[12px] text-muted">reputation · decays slowly</span>
            </div>
            <div className="mt-6 space-y-4">
              {TOPICS.map((t) => {
                const v = cred[t.id] ?? 0;
                return (
                  <div key={t.id} className="grid grid-cols-[90px_1fr_32px] items-center gap-3">
                    <span className="text-[13.5px] text-ink">{t.name}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                      <div className={cn("h-full rounded-full", v > 0 ? "bg-value" : "bg-transparent")} style={{ width: `${(Math.max(0, v) / maxCred) * 100}%` }} />
                    </div>
                    <span className="text-right font-mono text-[12.5px] text-ink">{v}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-7">
            <Eyebrow>Your posting limit</Eyebrow>
            <p className="mt-4 font-display text-[36px] leading-none font-semibold tracking-tight text-ink">
              {quota.limit} <span className="text-[18px] text-muted">posts / day</span>
            </p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-body">
              {quota.penalised
                ? "Reduced for 7 days because a recent post was marked junk."
                : "Every 3 posts that reach Stage 1 add one more. Clickbait reduces it — low traction never does."}
            </p>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-7">
            <Eyebrow>How you earn</Eyebrow>
            <div className="mt-5 divide-y divide-line">
              <div className="grid grid-cols-[1fr_96px_80px] gap-3 pb-3">
                <span />
                <span className="eyebrow text-right text-muted">Merit</span>
                <span className="eyebrow text-right text-muted">Cred</span>
              </div>
              {EARN.map(({ Icon, t, merit: m, cred: c, bad }) => (
                <div key={t} className="grid grid-cols-[1fr_96px_80px] items-center gap-3 py-3.5">
                  <span className="flex items-center gap-3 text-[14px] text-ink">
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", bad ? "bg-ember-soft text-ember" : "bg-value-soft text-value")}>
                      <Icon className="h-4 w-4" />
                    </span>
                    {t}
                  </span>
                  <span className="text-right font-mono text-[12.5px] text-ink">{m}</span>
                  <span className={cn("text-right font-mono text-[12.5px]", bad ? "text-ember" : "text-ink")}>{c}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-7">
            <div className="flex items-center justify-between">
              <Eyebrow>History</Eyebrow>
              <span className="font-mono text-[12px] text-muted">{entries.length} entries</span>
            </div>
            <ul className="mt-4 divide-y divide-line">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] text-ink">
                      {e.postId ? (
                        <Link href={`/studio/${e.postId}`} className="hover:underline">
                          {e.reason}
                        </Link>
                      ) : (
                        e.reason
                      )}
                    </p>
                    <p className="font-mono text-[11px] text-muted">
                      {timeAgo(e.at)}
                      {e.topic && ` · ${TOPICS.find((t) => t.id === e.topic)?.name}`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 font-mono text-[12px]",
                      e.amount < 0 ? "bg-ember-soft text-ember" : e.currency === "cred" ? "bg-slate-soft text-slate" : "bg-value-soft text-value",
                    )}
                  >
                    {e.amount > 0 ? "+" : ""}
                    {e.amount} {e.currency}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
