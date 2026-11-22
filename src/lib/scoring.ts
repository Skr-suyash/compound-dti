import type { AlgoConfig, Counts, Post, Stage, Verdict, VerdictEvent } from "./types";

/* ------------------------------------------------------------------ */
/* Beta distribution maths                                              */
/* ------------------------------------------------------------------ */

function lgamma(x: number): number {
  // Lanczos approximation
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3e-12;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b) — the Beta CDF. */
export function betaCdf(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

export function betaPpf(q: number, a: number, b: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (betaCdf(mid, a, b) < q) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export function betaPdf(x: number, a: number, b: number): number {
  if (x <= 0 || x >= 1) return 0;
  return Math.exp(
    lgamma(a + b) - lgamma(a) - lgamma(b) + (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x),
  );
}

/* ------------------------------------------------------------------ */
/* Posterior for a post                                                 */
/* ------------------------------------------------------------------ */

export interface Posterior {
  alpha: number;
  beta: number;
  n: number;
  mean: number;
  lower: number;
  upper: number;
  worthPct: number;
  regret: number;
}

export const PRIOR_STRENGTH = 4;

/** Rating evidence: wasted (0,1) · meh (0.25,0.75) · worth (1,0) · changed (1,0). */
export function posteriorFor(counts: Counts, aiQuality: number, creatorRate = 0.5): Posterior {
  const m0 = 0.5 * aiQuality + 0.5 * creatorRate;
  const a0 = m0 * PRIOR_STRENGTH;
  const b0 = (1 - m0) * PRIOR_STRENGTH;
  const s = counts.worth + counts.changed + 0.25 * counts.meh;
  const f = counts.wasted + 0.75 * counts.meh;
  const alpha = a0 + s;
  const beta = b0 + f;
  const n = counts.wasted + counts.meh + counts.worth + counts.changed;
  return {
    alpha,
    beta,
    n,
    mean: alpha / (alpha + beta),
    lower: betaPpf(0.05, alpha, beta),
    upper: betaPpf(0.95, alpha, beta),
    worthPct: n ? (counts.worth + counts.changed) / n : 0,
    regret: n ? counts.wasted / n : 0,
  };
}

export function totalRatings(c: Counts) {
  return c.wasted + c.meh + c.worth + c.changed;
}

/* ------------------------------------------------------------------ */
/* Reach ladder + verdicts                                              */
/* ------------------------------------------------------------------ */

export const STAGE_TARGETS: Record<Stage, number> = { 0: 20, 1: 50, 2: 200, 3: 0 };
export const STAGE_QUORUM: Record<Stage, number> = { 0: 15, 1: 10, 2: 25, 3: 0 };
export const STAGE_NAMES: Record<Stage, string> = {
  0: "First audience",
  1: "Topic readers",
  2: "Wide reach",
  3: "Canon",
};

export const DEFAULT_CONFIG: AlgoConfig = {
  feedSize: 12,
  discoveryShare: 0.33,
  quorum: 15,
  promoteBar: 0.6,
  junkBar: 0.4,
  dailyQuota: 3,
};

export interface Decision {
  verdict: Verdict;
  stage: Stage;
  action: "none" | "promote" | "stop" | "junk" | "insufficient";
  event?: VerdictEvent;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

export function decide(post: Post, cfg: AlgoConfig, now = Date.now()): Decision {
  const none: Decision = { verdict: post.verdict, stage: post.stage, action: "none" };
  if (post.status !== "screened" || post.verdict === "junk" || post.verdict === "stopped" || post.stage === 3)
    return none;

  const p = posteriorFor(post.counts, post.ai.aiQuality);
  const ageH = (now - post.createdAt) / 3.6e6;
  const base = { at: now, from: post.verdict, fromStage: post.stage };

  if (p.n < cfg.quorum) {
    if (post.stage === 0 && post.verdict === "testing" && ageH >= 72) {
      return {
        verdict: "insufficient",
        stage: 0,
        action: "insufficient",
        event: { ...base, to: "insufficient", toStage: 0, rule: "below_quorum",
          message: "Not enough readers yet. We'll keep showing it — no penalty." },
      };
    }
    return none;
  }

  const bait = post.ai.baitPatterns.length > 0;
  if (p.upper < cfg.junkBar || (bait && p.upper < 0.55 && p.regret >= 0.3)) {
    return {
      verdict: "junk",
      stage: post.stage,
      action: "junk",
      event: { ...base, to: "junk", toStage: post.stage, rule: "clear_negative",
        message: `Marked as junk: ${pct(p.regret)} said it wasted their time${bait ? ", and the title promised more than the post delivered" : ""}. Posting limit reduced for 7 days.` },
    };
  }

  const stageQuorum = Math.min(STAGE_QUORUM[post.stage], cfg.quorum);
  const exposureOk = post.stageShown >= 0.8 * post.stageTarget;
  if (p.lower >= cfg.promoteBar && post.stageRatings >= stageQuorum && exposureOk) {
    const to = (post.stage + 1) as Stage;
    return {
      verdict: "valuable",
      stage: to,
      action: "promote",
      event: { ...base, to: "valuable", toStage: to, rule: "confident_value",
        message: `${pct(p.worthPct)} of readers found this worth their time. Now reaching ${to === 3 ? "the Canon" : `Stage ${to}`}.` },
    };
  }

  if (p.upper < cfg.promoteBar && post.stageRatings >= stageQuorum) {
    return {
      verdict: "stopped",
      stage: post.stage,
      action: "stop",
      event: { ...base, to: "stopped", toStage: post.stage, rule: "below_bar",
        message: `Stopped climbing: ${pct(p.worthPct)} found it worth their time at this audience size. No penalty.` },
    };
  }
  return none;
}

export function verdictMeta(v: Verdict) {
  switch (v) {
    case "valuable":
      return { label: "Valuable", tone: "value" as const };
    case "testing":
      return { label: "Testing", tone: "slate" as const };
    case "insufficient":
      return { label: "Not enough data", tone: "ochre" as const };
    case "stopped":
      return { label: "Stopped", tone: "muted" as const };
    case "junk":
      return { label: "Junk", tone: "ember" as const };
  }
}
