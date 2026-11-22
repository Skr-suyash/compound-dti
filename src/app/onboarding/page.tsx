"use client";

import { ArrowLeft, ArrowRight, Atom, Briefcase, Check, Code2, Coins, Palette } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, Button } from "@/components/ui";
import { TOPICS } from "@/lib/seed";
import { useStore } from "@/lib/store";
import type { TopicId } from "@/lib/types";
import { cn } from "@/lib/utils";

const TOPIC_ICONS: Record<TopicId, typeof Code2> = {
  coding: Code2,
  careers: Briefcase,
  design: Palette,
  science: Atom,
  finance: Coins,
};

const RULES = [
  { n: "01", t: "Your feed ends.", d: "Around twelve posts a day, chosen by what readers found worth their time. Then you're caught up." },
  { n: "02", t: "You judge with hindsight.", d: "After reading, tell us if it was worth it. Your rating helps good posts climb — and stops bait." },
  { n: "03", t: "Posting is free. Reach is earned.", d: "Every post gets a fair first audience. Clickbait loses posting privileges; low traction never does." },
];

export default function Onboarding() {
  const router = useRouter();
  const complete = useStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleEdited, setHandleEdited] = useState(false);
  const [topics, setTopics] = useState<TopicId[]>([]);
  const [adult, setAdult] = useState(false);

  const suggested = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 18);
  const finalHandle = handleEdited ? handle : suggested;
  const handleOk = /^[a-z0-9_]{3,20}$/.test(finalHandle);

  const canNext = step === 0 ? name.trim().length >= 2 && handleOk : step === 1 ? topics.length >= 1 : adult;

  const next = () => {
    if (!canNext) return;
    if (step < 2) setStep(step + 1);
    else {
      complete({ name: name.trim(), handle: finalHandle, topics });
      router.push("/feed");
    }
  };

  const toggle = (id: TopicId) =>
    setTopics((t) => (t.includes(id) ? t.filter((x) => x !== id) : t.length >= 4 ? t : [...t, id]));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="font-mono text-[12px] text-muted">Step {step + 1} of 3</span>
          <ThemeToggle />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-5xl gap-2 px-6">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-paper-2">
            <motion.span className="block h-full bg-value" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} />
          </span>
        ))}
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-14">
        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="flex-1"
          >
            {step === 0 && (
              <div className="grid gap-14 md:grid-cols-[1fr_340px]">
                <div>
                  <h1 className="font-display text-[44px] leading-[1] font-semibold tracking-[-0.04em] text-ink md:text-[56px]">
                    First, what should we call you?
                  </h1>
                  <p className="mt-4 max-w-md text-[15.5px] text-body">Your name and handle appear on everything you post.</p>
                  <div className="mt-10 max-w-md space-y-6">
                    <label className="block">
                      <span className="mb-2 block text-[13px] font-medium text-ink">Your name</span>
                      <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && next()}
                        placeholder="Aarav Kumar"
                        className="h-13 w-full rounded-xl border border-line-2 bg-card px-4 text-[17px] text-ink outline-none placeholder:text-muted/60 focus:border-ink"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-[13px] font-medium text-ink">Handle</span>
                      <div className="relative">
                        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-[15px] text-muted">@</span>
                        <input
                          value={finalHandle}
                          onChange={(e) => {
                            setHandleEdited(true);
                            setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                          }}
                          onKeyDown={(e) => e.key === "Enter" && next()}
                          placeholder="aarav_kumar"
                          className="h-13 w-full rounded-xl border border-line-2 bg-card pr-4 pl-9 font-mono text-[15px] text-ink outline-none placeholder:text-muted/60 focus:border-ink"
                        />
                      </div>
                      <span className={cn("mt-2 block text-[12.5px]", finalHandle && !handleOk ? "text-ember" : "text-muted")}>
                        3–20 characters: lowercase letters, numbers and underscores.
                      </span>
                    </label>
                  </div>
                </div>
                <div className="self-start rounded-3xl border border-line bg-card p-6">
                  <p className="eyebrow text-muted">Preview</p>
                  <div className="mt-5 flex items-center gap-3">
                    <Avatar name={name || "You"} tone="value" size={48} />
                    <div className="min-w-0">
                      <p className="truncate font-display text-[18px] font-semibold text-ink">{name || "Your name"}</p>
                      <p className="truncate font-mono text-[12.5px] text-muted">@{finalHandle || "handle"}</p>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-line pt-5">
                    <p className="font-serif text-[19px] leading-snug text-ink">Notes from my first hackathon: what I&apos;d do differently</p>
                    <p className="mt-3 text-[12.5px] text-muted">5 min read · Careers</p>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h1 className="font-display text-[44px] leading-[1] font-semibold tracking-[-0.04em] text-ink md:text-[56px]">
                  What do you want to get better at?
                </h1>
                <p className="mt-4 max-w-lg text-[15.5px] text-body">
                  Pick up to four topics. Your daily feed draws from these — and nothing else is pushed at you.
                </p>
                <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {TOPICS.map((t) => {
                    const Icon = TOPIC_ICONS[t.id];
                    const on = topics.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggle(t.id)}
                        className={cn(
                          "group relative flex min-h-[148px] flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-200",
                          on ? "border-ink bg-ink text-paper" : "border-line bg-card hover:-translate-y-0.5 hover:border-line-2",
                        )}
                      >
                        <span className="flex items-start justify-between">
                          <Icon className={cn("h-6 w-6", on ? "text-[#3CC7A4]" : "text-value")} strokeWidth={1.7} />
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                              on ? "border-[#3CC7A4] bg-[#3CC7A4] text-ink" : "border-line-2",
                            )}
                          >
                            {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                          </span>
                        </span>
                        <span>
                          <span className="block font-display text-[21px] font-semibold tracking-tight">{t.name}</span>
                          <span className={cn("mt-1 block text-[13px] leading-snug", on ? "text-paper/60" : "text-muted")}>{t.blurb}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-5 font-mono text-[12px] text-muted">{topics.length}/4 selected</p>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="font-display text-[44px] leading-[1] font-semibold tracking-[-0.04em] text-ink md:text-[56px]">
                  Three things that make Compound different.
                </h1>
                <div className="mt-12 grid gap-5 md:grid-cols-3">
                  {RULES.map((r, i) => (
                    <motion.div
                      key={r.n}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * i + 0.1 }}
                      className="rounded-3xl border border-line bg-card p-7"
                    >
                      <p className="font-mono text-[12px] text-value">{r.n}</p>
                      <p className="mt-8 font-display text-[23px] leading-tight font-semibold tracking-tight text-ink">{r.t}</p>
                      <p className="mt-3 text-[14.5px] leading-relaxed text-body">{r.d}</p>
                    </motion.div>
                  ))}
                </div>
                <label className="mt-10 flex cursor-pointer items-center gap-3 text-[14.5px] text-body">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-md border transition-colors",
                      adult ? "border-value bg-value text-on-ink" : "border-line-2 bg-card",
                    )}
                  >
                    {adult && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <input type="checkbox" className="sr-only" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
                  I&apos;m 18 or older and agree to the community rules.
                </label>
              </div>
            )}
          </motion.section>
        </AnimatePresence>

        <div className="mt-14 flex items-center justify-between border-t border-line pt-6">
          <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} className={cn(step === 0 && "invisible")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button size="lg" onClick={next} disabled={!canNext}>
            {step === 2 ? "Start my first day" : "Continue"} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
