"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Eyebrow, PageHeader } from "@/components/ui";
import { topicName } from "@/lib/seed";
import { todayStat, useStore } from "@/lib/store";
import type { DayStat, TopicId } from "@/lib/types";
import { cn, pct } from "@/lib/utils";

function fmtMinutes(m: number) {
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}

export default function WellbeingPage() {
  const state = useStore();
  const today = todayStat(state);
  const all: DayStat[] = [...state.history.filter((h) => h.date !== today?.date), ...(today ? [today] : [])].slice(-28);
  const week = all.slice(-7);
  const prevWeek = all.slice(-14, -7);

  const weekMinutes = week.reduce((a, d) => a + d.minutes, 0);
  const prevMinutes = prevWeek.reduce((a, d) => a + d.minutes, 0);
  const rated = week.filter((d) => d.worthRate > 0);
  const worth = rated.length ? rated.reduce((a, d) => a + d.worthRate, 0) / rated.length : 0;
  const caught = week.filter((d) => d.caughtUp).length;
  let streak = 0;
  for (let i = all.length - 1; i >= 0; i--) {
    if (all[i]!.caughtUp) streak++;
    else if (i !== all.length - 1) break;
  }
  const byTopic: Partial<Record<TopicId, number>> = {};
  for (const d of week) for (const [t, m] of Object.entries(d.byTopic)) byTopic[t as TopicId] = (byTopic[t as TopicId] ?? 0) + (m ?? 0);
  const topicRows = Object.entries(byTopic).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)) as [TopicId, number][];
  const topicTotal = Math.max(1, topicRows.reduce((a, [, m]) => a + m, 0));

  const chart = all.slice(-14).map((d) => ({
    day: new Date(`${d.date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 2),
    date: d.date,
    minutes: d.minutes,
    caughtUp: d.caughtUp,
  }));

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-10 lg:py-14">
      <PageHeader
        eyebrow="Time well spent"
        title={
          <>
            Less time. <span className="font-serif font-normal italic">Better time.</span>
          </>
        }
        sub="Compound measures whether your time was worth it — not how much of it we captured."
      />

      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-7">
          <Eyebrow>This week</Eyebrow>
          <p className="mt-4 font-display text-[52px] leading-none font-semibold tracking-[-0.04em] text-ink">{fmtMinutes(weekMinutes)}</p>
          <p className={cn("mt-3 text-[13.5px]", weekMinutes <= prevMinutes ? "text-value" : "text-body")}>
            {prevMinutes ? `${weekMinutes <= prevMinutes ? "↓" : "↑"} ${fmtMinutes(Math.abs(weekMinutes - prevMinutes))} vs last week` : "Your first week"}
          </p>
        </Card>
        <Card className="p-7">
          <Eyebrow>Rated worth it</Eyebrow>
          <p className="mt-4 font-display text-[52px] leading-none font-semibold tracking-[-0.04em] text-value">{pct(worth)}</p>
          <p className="mt-3 text-[13.5px] text-body">of everything you read this week</p>
        </Card>
        <Card className="p-7">
          <Eyebrow>Caught up</Eyebrow>
          <p className="mt-4 font-display text-[52px] leading-none font-semibold tracking-[-0.04em] text-ink">
            {caught}
            <span className="text-[24px] text-muted">/7</span>
          </p>
          <p className="mt-3 text-[13.5px] text-body">days you finished and logged off · {streak}-day streak</p>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-7">
          <div className="flex items-center justify-between">
            <Eyebrow>Minutes per day · last 14 days</Eyebrow>
            <span className="flex items-center gap-4 text-[12px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-value" /> caught up
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-line-2" /> didn&apos;t finish
              </span>
            </span>
          </div>
          <div className="mt-6 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)", fontFamily: "var(--font-jetbrains)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted)", fontFamily: "var(--font-jetbrains)" }} />
                <Tooltip
                  cursor={{ fill: "var(--paper-2)" }}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "var(--ink)" }}
                  formatter={(v) => [`${v} min`, "Reading"]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
                />
                <Bar dataKey="minutes" radius={[6, 6, 2, 2]} maxBarSize={28}>
                  {chart.map((d) => (
                    <Cell key={d.date} fill={d.caughtUp ? "var(--value)" : "var(--line-2)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-7">
          <Eyebrow>Where your time went</Eyebrow>
          <div className="mt-6 space-y-5">
            {topicRows.map(([t, m]) => (
              <div key={t}>
                <div className="mb-2 flex justify-between text-[13.5px]">
                  <span className="text-ink">{topicName(t)}</span>
                  <span className="font-mono text-muted">{fmtMinutes(m)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${(m / topicTotal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-5 p-7">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <Eyebrow>Last four weeks</Eyebrow>
            <p className="mt-3 font-display text-[24px] leading-tight font-semibold tracking-tight text-ink">
              Every filled square is a day you finished your feed and got on with your life.
            </p>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="text-center font-mono text-[10px] text-muted">
                {d}
              </span>
            ))}
            {Array.from({ length: (new Date(`${all[0]?.date ?? "2026-01-01"}T12:00:00`).getDay() + 6) % 7 }, (_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {all.map((d) => (
              <span
                key={d.date}
                title={`${d.date} · ${d.minutes} min`}
                className={cn(
                  "h-8 w-8 rounded-lg md:h-9 md:w-9",
                  d.caughtUp ? (d.worthRate > 0.85 ? "bg-value" : "bg-value/60") : "border border-dashed border-line-2",
                  d.date === today?.date && "ring-2 ring-ink ring-offset-2 ring-offset-card",
                )}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
