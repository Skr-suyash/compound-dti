"use client";

import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { GoogleMark, LadderMark, Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function Login() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const proceed = () => {
    setBusy(true);
    setTimeout(() => router.push(user ? "/feed" : "/onboarding"), 450);
  };

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setStep("code");
      setTimeout(() => inputs.current[0]?.focus(), 50);
    }, 600);
  };

  const setDigit = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    if (digits.length > 1) {
      const next = [...code];
      digits.slice(0, 6 - i).split("").forEach((d, k) => (next[i + k] = d));
      setCode(next);
      inputs.current[Math.min(5, i + digits.length)]?.focus();
      if (next.every(Boolean)) proceed();
      return;
    }
    const next = [...code];
    next[i] = digits;
    setCode(next);
    if (digits && i < 5) inputs.current[i + 1]?.focus();
    if (next.every(Boolean)) proceed();
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-paper lg:flex">
        <div className="flex items-center gap-2.5">
          <LadderMark className="[&_rect]:fill-paper [&_rect:last-child]:fill-[#3CC7A4]" />
          <span className="font-display text-[19px] font-semibold tracking-[-0.03em]">
            compound<span className="text-[#3CC7A4]">.</span>
          </span>
        </div>
        <div>
          <p className="font-serif text-[46px] leading-[1.1] tracking-[-0.015em]">
            “I opened it, read twelve things I actually cared about, and then it <span className="italic text-[#3CC7A4]">let me go.</span>”
          </p>
          <p className="mt-6 font-mono text-[12px] tracking-wider text-paper/50 uppercase">Pilot user · 2nd-year engineering</p>
        </div>
        <div className="grid grid-cols-3 gap-6 border-t border-paper/15 pt-8">
          {[
            ["12", "posts a day, then done"],
            ["0", "infinite scroll"],
            ["86%", "of reads rated worth it"],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="font-display text-[34px] font-semibold tracking-tight">{n}</p>
              <p className="mt-1 text-[13px] text-paper/55">{l}</p>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full border border-paper/10" />
        <div className="pointer-events-none absolute -right-8 -bottom-8 h-48 w-48 rounded-full border border-paper/10" />
      </aside>

      <main className="flex flex-col px-6 py-6 md:px-12">
        <div className="flex items-center justify-between">
          <div className="lg:invisible">
            <Logo />
          </div>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <p className="eyebrow mb-4 text-muted">Welcome</p>
                <h1 className="font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.035em] text-ink">
                  Sign in to a feed that ends.
                </h1>
                <p className="mt-4 text-[15px] text-body">New here? We&apos;ll set up your account in under a minute.</p>
                <button
                  onClick={proceed}
                  className="mt-10 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line-2 bg-card text-[14.5px] font-medium text-ink transition-colors hover:border-ink"
                >
                  <GoogleMark /> Continue with Google
                </button>
                <div className="my-6 flex items-center gap-4 text-[12px] text-muted">
                  <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
                </div>
                <form onSubmit={sendCode} className="space-y-3">
                  <label className="block">
                    <span className="mb-2 block text-[13px] font-medium text-ink">College or personal email</span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@college.edu"
                        className="h-12 w-full rounded-xl border border-line-2 bg-card pr-4 pl-11 text-[15px] text-ink outline-none placeholder:text-muted/70 focus:border-ink"
                      />
                    </div>
                  </label>
                  <Button type="submit" size="lg" className="w-full" disabled={busy}>
                    {busy ? "Sending…" : "Email me a sign-in code"} {!busy && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
                <p className="mt-8 text-[12.5px] leading-relaxed text-muted">
                  By continuing you agree to our community rules: posting is free, reach is earned, and clickbait costs you
                  posting privileges.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="code"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <button onClick={() => setStep("email")} className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
                  <ArrowLeft className="h-4 w-4" /> Use a different email
                </button>
                <h1 className="font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.035em] text-ink">Check your inbox.</h1>
                <p className="mt-4 text-[15px] text-body">
                  We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>.
                </p>
                <div className="mt-10 flex justify-between gap-2">
                  {code.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputs.current[i] = el;
                      }}
                      inputMode="numeric"
                      value={d}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !code[i] && i > 0) inputs.current[i - 1]?.focus();
                      }}
                      className="h-14 w-full rounded-xl border border-line-2 bg-card text-center font-mono text-[22px] text-ink outline-none focus:border-ink"
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
                <p className="mt-4 text-[12.5px] text-muted">Prototype: any six digits will sign you in.</p>
                {busy && <p className="mt-6 text-[14px] text-value">Signing you in…</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
