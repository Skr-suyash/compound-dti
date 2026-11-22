"use client";

import { Check, CalendarClock, LogOut, Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/components/theme-toggle";
import { toast } from "@/components/toast";
import { Avatar, Button, Card, Eyebrow, PageHeader } from "@/components/ui";
import { TOPICS } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { CurrentUser, TopicId } from "@/lib/types";
import { cn } from "@/lib/utils";

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-6 border-b border-line py-10 md:grid-cols-[260px_1fr]">
      <div>
        <p className="font-display text-[18px] font-semibold text-ink">{title}</p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{sub}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  if (!user) return null;
  return <SettingsForm user={user} router={router} />;
}

function SettingsForm({ user, router }: { user: CurrentUser; router: ReturnType<typeof useRouter> }) {
  const { updateProfile, signOut, resetDemo, startNewDay } = useStore.getState();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [topics, setTopics] = useState<TopicId[]>(user.topics);

  const dirty = name !== user.name || bio !== user.bio || topics.join() !== user.topics.join();

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-10 md:px-10 lg:py-14">
      <PageHeader eyebrow="Settings" title="Your account" sub="Profile, topics, appearance and prototype controls." />

      <Section title="Profile" sub="How you appear on your posts and profile.">
        <div className="flex items-center gap-4">
          <Avatar name={name || user.name} tone="value" size={56} />
          <div>
            <p className="font-display text-[17px] font-semibold text-ink">{name || user.name}</p>
            <p className="font-mono text-[12.5px] text-muted">@{user.handle}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-xl border border-line-2 bg-card px-4 text-[15px] text-ink outline-none focus:border-ink" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">Bio</span>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} maxLength={160} className="w-full resize-none rounded-xl border border-line-2 bg-card px-4 py-3 text-[15px] text-ink outline-none focus:border-ink" />
          </label>
        </div>
      </Section>

      <Section title="Topics" sub="Your daily feed draws only from these. Pick up to four.">
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const on = topics.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => setTopics((x) => (on ? x.filter((y) => y !== t.id) : x.length >= 4 ? x : [...x, t.id]))}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-[14px] transition-colors",
                  on ? "border-ink bg-ink text-paper" : "border-line text-body hover:border-line-2",
                )}
              >
                {on && <Check className="h-3.5 w-3.5" />} {t.name}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[12.5px] text-muted">Topic changes apply from your next daily feed.</p>
      </Section>

      <div className="flex justify-end pt-6">
        <Button
          disabled={!dirty || !name.trim() || topics.length === 0}
          onClick={() => {
            updateProfile({ name: name.trim(), bio: bio.trim(), topics });
            toast({ title: "Saved", body: "Your profile has been updated.", tone: "ink" });
          }}
        >
          Save changes
        </Button>
      </div>

      <Section title="Appearance" sub="Compound is designed for long, comfortable reading in both themes.">
        <div className="grid max-w-md grid-cols-2 gap-3">
          {(
            [
              ["light", "Paper", Sun],
              ["dark", "Ink", Moon],
            ] as const
          ).map(([t, label, Icon]) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={cn(
                "overflow-hidden rounded-2xl border text-left transition-colors",
                theme === t ? "border-ink ring-1 ring-ink" : "border-line hover:border-line-2",
              )}
            >
              <div className={cn("flex h-20 items-end gap-1.5 p-3", t === "light" ? "bg-[#f4f1ea]" : "bg-[#0c141e]")}>
                {[10, 16, 22, 30].map((h, i) => (
                  <span key={h} className={cn("w-3 rounded-sm", i === 3 ? (t === "light" ? "bg-[#0b7a63]" : "bg-[#3cc7a4]") : t === "light" ? "bg-[#0f1b2a]/30" : "bg-[#ede8dd]/30")} style={{ height: h }} />
                ))}
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="flex items-center gap-2 text-[14px] font-medium text-ink">
                  <Icon className="h-4 w-4" /> {label}
                </span>
                {theme === t && <Check className="h-4 w-4 text-value" />}
              </div>
            </button>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-muted">
          <Monitor className="h-3.5 w-3.5" /> Defaults to your system setting on first visit.
        </p>
      </Section>

      <Section title="Prototype controls" sub="Helpers for demonstrating the product. Not part of the real app.">
        <Card className="divide-y divide-line">
          <div className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-[14.5px] font-medium text-ink">Jump to tomorrow</p>
              <p className="text-[13px] text-muted">Builds the next day&apos;s feed from posts you haven&apos;t seen.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                startNewDay();
                router.push("/feed");
              }}
            >
              <CalendarClock className="h-3.5 w-3.5" /> New day
            </Button>
          </div>
          <div className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="text-[14.5px] font-medium text-ink">Reset demo data</p>
              <p className="text-[13px] text-muted">Clears everything and returns to the landing page.</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                resetDemo();
                router.push("/");
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </Card>
      </Section>

      <div className="pt-10">
        <Eyebrow className="mb-3">Session</Eyebrow>
        <Button
          variant="outline"
          onClick={() => {
            signOut();
            router.push("/");
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
