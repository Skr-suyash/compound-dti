import { ArrowRight, ArrowUpRight, Check, Gem, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { LadderMark, Logo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui";

const HARMS = [
  { n: "4.8", unit: "hrs", label: "a day on social media for the average teen", src: "Gallup, 2023" },
  { n: "47", unit: "sec", label: "average attention on a screen before switching", src: "G. Mark, 2023" },
  { n: "2×", unit: "", label: "risk of depression & anxiety symptoms at 3+ hrs/day", src: "US Surgeon General, 2023" },
  { n: "1 in 2", unit: "", label: "people projected to be short-sighted by 2050", src: "Holden et al., 2016" },
];

function HeroPreview() {
  const rows = [
    { n: "01", topic: "Coding", title: "Dynamic programming is just recursion with a memory", worth: 92, rated: "worth" },
    { n: "02", topic: "Coding · Video", title: "The clearest introduction to neural networks I've found", worth: 89, rated: "changed" },
    { n: "03", topic: "Careers", title: "Cold emailing for internships: the five-line template", worth: 0, rated: null, fresh: true },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      <div className="absolute -inset-x-6 -top-6 -bottom-10 -z-10 rounded-[36px] rule-dots opacity-70" />
      <div className="absolute top-8 -right-3 left-3 -z-10 h-full rounded-[28px] border border-line bg-paper-2" />
      <div className="overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_40px_80px_-40px_rgba(15,27,42,0.45)]">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <p className="eyebrow text-muted">Tuesday · 20 October</p>
            <p className="mt-1 font-display text-[22px] font-semibold tracking-tight text-ink">Today&apos;s twelve</p>
          </div>
          <span className="font-mono text-[12px] text-ink">9/12</span>
        </div>
        <div className="flex gap-[3px] px-6 pt-4">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i < 9 ? "bg-value" : "bg-paper-2"}`} />
          ))}
        </div>
        <div className="flex gap-2 px-6 pt-4">
          {[
            ["#7a5714", "#b8892f", "Torque in 30s"],
            ["#0a5e4d", "#13896f", "Split your salary"],
            ["#0f1b2a", "#22405e", "Big-O in 20s"],
            ["#2e4566", "#4a6a96", "Contrast ratios"],
          ].map(([bg, glow, t], i) => (
            <div key={t} className={`rounded-[12px] p-[2px] ${i < 2 ? "bg-line-2" : "bg-gradient-to-br from-ochre via-ember to-value"}`}>
              <div className="flex aspect-[9/14] w-[78px] flex-col justify-end rounded-[10px] p-2" style={{ background: `radial-gradient(120% 80% at 20% 0%, ${glow}, ${bg} 60%)` }}>
                <span className="text-[9.5px] leading-tight font-semibold text-white">{t}</span>
              </div>
            </div>
          ))}
        </div>
        <ul className="divide-y divide-line px-6">
          {rows.map((r) => (
            <li key={r.n} className="flex gap-4 py-4">
              <span className="pt-0.5 font-mono text-[12px] text-muted">{r.n}</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="eyebrow text-muted">{r.topic}</span>
                  {r.fresh && (
                    <span className="rounded-full bg-ochre-soft px-1.5 py-px font-mono text-[9.5px] tracking-widest text-ochre uppercase">
                      New voice
                    </span>
                  )}
                </div>
                <p className="font-serif text-[17px] leading-snug font-medium text-ink">{r.title}</p>
                {r.rated ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-value">
                    {r.rated === "changed" ? <Gem className="h-3.5 w-3.5" /> : <ThumbsUp className="h-3.5 w-3.5" />}
                    {r.rated === "changed" ? "Changed something" : "Worth it"} · {r.worth}% agree
                  </p>
                ) : (
                  <p className="mt-2 text-[12px] text-muted">Your rating decides if it climbs</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="m-4 rounded-2xl bg-ink px-5 py-4 text-paper">
          <p className="font-display text-[17px] font-semibold">You&apos;re caught up.</p>
          <p className="mt-0.5 text-[12.5px] text-paper/60">18 minutes · 100% worth it · see you tomorrow</p>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-8 hidden rotate-[-4deg] rounded-2xl border border-line bg-card px-4 py-3 shadow-[0_20px_40px_-20px_rgba(15,27,42,0.4)] sm:block">
        <p className="eyebrow text-muted">Your post</p>
        <p className="mt-1 flex items-center gap-2 text-[13px] font-medium text-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-value" /> Reached Stage 1 · +10 merit
        </p>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="overflow-x-clip">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-transparent bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 md:px-8">
          <Logo />
          <nav className="hidden items-center gap-8 text-[14px] text-body md:flex">
            <a href="#problem" className="hover:text-ink">The problem</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#ladder" className="hover:text-ink">The reach ladder</a>
            <a href="#creators" className="hover:text-ink">For creators</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="hidden h-9 items-center px-3 text-[14px] text-body hover:text-ink sm:inline-flex">
              Sign in
            </Link>
            <ButtonLink href="/login" size="sm" className="h-9 px-4">
              Join the pilot
            </ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-[1240px] items-center gap-16 px-5 pt-14 pb-24 md:px-8 lg:grid-cols-[1.15fr_1fr] lg:pt-20 lg:pb-32">
        <div>
          <p className="eyebrow mb-7 inline-flex items-center gap-2 text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-value" />
            A social platform for students · Pilot 2026
          </p>
          <h1 className="font-display text-[62px] leading-[0.92] font-semibold tracking-[-0.045em] text-ink sm:text-[84px] lg:text-[104px]">
            Your feed
            <br />
            should{" "}
            <span className="font-serif font-normal tracking-[-0.03em] text-value italic">end.</span>
          </h1>
          <p className="mt-8 max-w-[520px] text-[18px] leading-relaxed text-body">
            Compound is social media where posts spread because readers found them{" "}
            <em className="font-serif text-[19px] text-ink">worth their time</em> — not because they grabbed
            attention in the first second. Twelve posts a day. Then you&apos;re done.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <ButtonLink href="/login" size="lg">
              Start your first day <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="#how" variant="outline" size="lg">
              See how it works
            </ButtonLink>
          </div>
          <ul className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-[13.5px] text-body">
            {["No infinite scroll", "No likes or follower counts", "No engagement algorithm"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-value" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <HeroPreview />
      </section>

      {/* Problem */}
      <section id="problem" className="bg-ink text-paper">
        <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 lg:py-32">
          <p className="eyebrow mb-6 text-paper/50">01 — The problem</p>
          <h2 className="max-w-4xl font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.035em] md:text-[64px]">
            It isn&apos;t a willpower problem.{" "}
            <span className="font-serif font-normal text-paper/55 italic">It&apos;s the business model.</span>
          </h2>
          <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-paper/10 bg-paper/10 md:grid-cols-3">
            {[
              ["Revenue = ads × time spent", "Every extra minute you scroll is money. So the system is built to keep you there."],
              ["The algorithm rewards attention", "Whatever stops your thumb fastest wins — decided in the first second, on impulse."],
              ["Outrage, clickbait and loops win", "A 15-second ‘secret trick’ gets 2.1M views. A clear 9-minute explainer gets 312."],
            ].map(([t, d], i) => (
              <div key={t} className="bg-ink p-8 md:p-10">
                <p className="font-mono text-[12px] text-paper/40">0{i + 1}</p>
                <p className="mt-6 font-display text-[24px] leading-tight font-semibold tracking-tight">{t}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-paper/60">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-20 grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
            {HARMS.map((h) => (
              <div key={h.label} className="border-t border-paper/15 pt-6">
                <p className="font-display text-[56px] leading-none font-semibold tracking-[-0.04em] text-[#F5A877]">
                  {h.n}
                  {h.unit && <span className="ml-1 text-[22px] tracking-normal text-paper/50">{h.unit}</span>}
                </p>
                <p className="mt-4 max-w-[240px] text-[14.5px] leading-snug text-paper/75">{h.label}</p>
                <p className="mt-3 font-mono text-[10.5px] tracking-wider text-paper/35 uppercase">{h.src}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wrong moment */}
      <section className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 lg:py-32">
        <p className="eyebrow mb-6 text-muted">02 — The insight</p>
        <h2 className="max-w-3xl font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.035em] text-ink md:text-[60px]">
          Today&apos;s platforms measure the <span className="font-serif font-normal text-ember italic">wrong moment.</span>
        </h2>
        <div className="relative mt-20">
          <div className="absolute top-[18px] right-0 left-0 h-[2px] bg-line" />
          <div className="grid gap-12 md:grid-cols-3">
            {[
              { t: "The first second", d: "Others decide reach here — on a hook, an emoji, a promise.", tone: "ember" },
              { t: "While you watch", d: "Value is being delivered (or not). Nobody is measuring yet.", tone: "muted" },
              { t: "After you finish", d: "Compound decides here: “Was this worth your time?”", tone: "value" },
            ].map((s) => (
              <div key={s.t} className="relative">
                <span
                  className={`relative block h-9 w-9 rounded-full border-4 border-paper ${
                    s.tone === "ember" ? "bg-ember" : s.tone === "value" ? "bg-value ring-8 ring-value/15" : "bg-line-2"
                  }`}
                />
                <p className="mt-6 font-display text-[24px] font-semibold tracking-tight text-ink">{s.t}</p>
                <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-body">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y border-line bg-paper-2/60">
        <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 lg:py-32">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-6 text-muted">03 — How it works</p>
              <h2 className="max-w-2xl font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.035em] text-ink md:text-[60px]">
                Three rules. No dark patterns.
              </h2>
            </div>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <article className="rounded-3xl border border-line bg-card p-8">
              <p className="font-mono text-[12px] text-muted">01</p>
              <h3 className="mt-5 font-display text-[26px] leading-tight font-semibold tracking-tight text-ink">
                “Worth your time?”
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-body">
                After you read, one tap replaces the like. Readers judge with hindsight, not impulse.
              </p>
              <div className="mt-8 grid grid-cols-4 gap-1.5">
                {[
                  [ThumbsDown, "Wasted", "text-ember"],
                  [ThumbsUp, "Meh", "text-muted"],
                  [ThumbsUp, "Worth it", "text-ink"],
                  [Gem, "Changed", "text-value"],
                ].map(([Icon, l, c], i) => {
                  const I = Icon as typeof Gem;
                  return (
                    <div key={i} className={`flex flex-col items-center gap-1.5 rounded-xl border border-line bg-paper py-3 ${i === 3 ? "border-value bg-value-soft" : ""}`}>
                      <I className={`h-4 w-4 ${c}`} />
                      <span className="text-[11px] text-body">{l as string}</span>
                    </div>
                  );
                })}
              </div>
            </article>
            <article className="rounded-3xl border border-line bg-card p-8">
              <p className="font-mono text-[12px] text-muted">02</p>
              <h3 className="mt-5 font-display text-[26px] leading-tight font-semibold tracking-tight text-ink">Earned reach</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-body">
                Every post gets a fair first audience. It climbs only when readers say it was worth it.
              </p>
              <div className="mt-8 flex h-[74px] items-end gap-2">
                {[30, 50, 70, 100].map((h, i) => (
                  <div key={h} className="flex-1 rounded-t-lg bg-value" style={{ height: `${h}%`, opacity: 0.35 + i * 0.22 }} />
                ))}
              </div>
            </article>
            <article className="rounded-3xl border border-line bg-card p-8">
              <p className="font-mono text-[12px] text-muted">03</p>
              <h3 className="mt-5 font-display text-[26px] leading-tight font-semibold tracking-tight text-ink">
                Free to post. Costly to bait.
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-body">
                Anyone can post. Clickbait loses posting privileges — never because of low traction.
              </p>
              <div className="mt-8 space-y-2 text-[13px]">
                <div className="flex items-center justify-between rounded-xl bg-value-soft px-3 py-2.5 text-value">
                  <span>Valuable post</span>
                  <span className="font-mono">+10 merit</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-paper-2 px-3 py-2.5 text-body">
                  <span>Not enough readers yet</span>
                  <span className="font-mono">no penalty</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-ember-soft px-3 py-2.5 text-ember">
                  <span>Clickbait</span>
                  <span className="font-mono">limit −2</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Ladder */}
      <section id="ladder" className="mx-auto grid max-w-[1240px] items-center gap-16 px-5 py-24 md:px-8 lg:grid-cols-2 lg:py-32">
        <div>
          <p className="eyebrow mb-6 text-muted">04 — The reach ladder</p>
          <h2 className="font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.035em] text-ink md:text-[56px]">
            Spreading without <span className="font-serif font-normal italic">going viral.</span>
          </h2>
          <p className="mt-6 max-w-lg text-[16.5px] leading-relaxed text-body">
            Virality is exponential and emotional. Compound&apos;s reach is gated by confidence: a post moves up a rung only
            when even our <strong className="font-semibold text-ink">pessimistic estimate</strong> of its worth-it rate
            clears the bar.
          </p>
          <div className="mt-8 grid max-w-md grid-cols-2 gap-4">
            <div className="rounded-2xl border border-line bg-card p-5">
              <p className="eyebrow text-muted">17 of 20 worth it</p>
              <p className="mt-2 font-display text-[30px] font-semibold text-value">65% ≥ 60%</p>
              <p className="mt-1 text-[13px] text-body">Promoted to Stage 1</p>
            </div>
            <div className="rounded-2xl border border-line bg-card p-5">
              <p className="eyebrow text-muted">6 of 20 + clickbait</p>
              <p className="mt-2 font-display text-[30px] font-semibold text-ember">50% &lt; 60%</p>
              <p className="mt-1 text-[13px] text-body">Stops spreading</p>
            </div>
          </div>
        </div>
        <div className="rounded-[32px] border border-line bg-card p-8 md:p-10">
          <div className="flex h-[300px] items-end gap-4">
            {[
              ["Stage 0", "~20 readers", 32],
              ["Stage 1", "5% of topic", 52],
              ["Stage 2", "20% of topic", 74],
              ["Canon", "evergreen", 100],
            ].map(([s, d, h], i) => (
              <div key={s as string} className="flex h-full flex-1 flex-col justify-end gap-3">
                <div
                  className={`relative rounded-2xl ${i === 3 ? "bg-value" : "bg-paper-2"} border border-line`}
                  style={{ height: `${h}%` }}
                >
                  {i === 3 && <LadderMark size={22} className="absolute top-3 left-3 [&_rect]:fill-on-ink" />}
                </div>
                <div>
                  <p className="font-mono text-[10.5px] tracking-widest text-ink uppercase">{s}</p>
                  <p className="text-[12.5px] text-muted">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formats */}
      <section className="border-t border-line bg-paper-2/60">
        <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 lg:py-32">
          <p className="eyebrow mb-6 text-muted">05 — Every format, one standard</p>
          <h2 className="max-w-3xl font-display text-[40px] leading-[1.02] font-semibold tracking-[-0.035em] text-ink md:text-[60px]">
            Posts, videos, sparks and images. <span className="font-serif font-normal italic">All judged by whether they were worth it.</span>
          </h2>
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Posts", "Essays, explainers and notes with real structure.", "bg-card", "text-ink"],
              ["Videos", "Creators share videos with a take on why they're worth watching.", "bg-ink", "text-paper"],
              ["Sparks", "Vertical lessons under a minute. Five a day, then they're gone.", "bg-[radial-gradient(120%_80%_at_20%_0%,#b8892f,#7a5714_60%)]", "text-white"],
              ["Images", "Diagrams, charts and notes — with alt text, always.", "bg-value", "text-on-ink"],
            ].map(([t, d, bg, fg]) => (
              <div key={t} className={`flex min-h-[260px] flex-col justify-between rounded-3xl border border-line p-7 ${bg} ${fg}`}>
                <p className="font-display text-[30px] font-semibold tracking-tight">{t}</p>
                <p className="text-[14.5px] leading-relaxed opacity-75">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creators */}
      <section id="creators" className="border-t border-line">
        <div className="mx-auto max-w-[1240px] px-5 py-24 md:px-8 lg:py-32">
          <p className="eyebrow mb-8 text-muted">06 — For creators</p>
          <blockquote className="max-w-5xl font-serif text-[38px] leading-[1.12] tracking-[-0.015em] text-ink md:text-[60px]">
            “The explainer with 312 views?
            <span className="text-value italic"> On Compound, that&apos;s the post that wins.”</span>
          </blockquote>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              ["A guaranteed first audience", "Every post — from anyone — is shown to ~20 interested readers before any verdict."],
              ["Feedback you can act on", "See exactly why a post climbed or stopped. No shadowbans. No hidden penalties."],
              ["Reach that compounds", "Valuable posts keep being discovered for months, not 24 hours."],
            ].map(([t, d]) => (
              <div key={t} className="border-t-2 border-ink pt-5">
                <p className="font-display text-[20px] font-semibold tracking-tight text-ink">{t}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-body">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[36px] bg-value px-8 py-20 text-center text-on-ink md:py-28">
          <p className="eyebrow text-on-ink/60">Every social network asks how to keep you longer</p>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-[44px] leading-[1] font-semibold tracking-[-0.04em] md:text-[76px]">
            We ask: was it <span className="font-serif font-normal italic">worth your time?</span>
          </h2>
          <Link
            href="/login"
            className="mt-12 inline-flex h-13 items-center gap-2 rounded-xl bg-on-ink px-7 text-[15px] font-medium text-value transition-transform hover:-translate-y-0.5"
          >
            Join the pilot <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-6 px-5 py-10 text-[13px] text-muted md:flex-row md:items-center md:px-8">
          <Logo />
          <p>Made for people who would rather learn than scroll. © 2026 Compound.</p>
        </div>
      </footer>
    </div>
  );
}
