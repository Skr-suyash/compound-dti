import { posteriorFor } from "./scoring";
import type { AlgoConfig, FeedItem, Post, TopicId } from "./types";
import { hashString, mulberry32 } from "./utils";

/* Marsaglia–Tsang gamma sampler; Beta(a, b) = X / (X + Y). */
function normal(rnd: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function gamma(shape: number, rnd: () => number): number {
  if (shape < 1) return gamma(shape + 1, rnd) * Math.pow(rnd(), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      x = normal(rnd);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rnd();
    if (u < 1 - 0.0331 * x ** 4) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

export function betaSample(a: number, b: number, rnd: () => number) {
  const x = gamma(a, rnd);
  return x / (x + gamma(b, rnd));
}

interface BuildArgs {
  posts: Post[];
  handle: string;
  topics: TopicId[];
  date: string;
  config: AlgoConfig;
  seen: Set<string>;
}

/**
 * Builds today's finite feed: discovery slots (Thompson sampling over untested posts,
 * with a boost for new voices) interleaved with ranked posts that have earned reach.
 */
export function buildFeed({ posts, handle, topics, date, config, seen }: BuildArgs): FeedItem[] {
  const rnd = mulberry32(hashString(`${handle}:${date}`));
  const eligible = posts.filter(
    (p) =>
      p.type !== "spark" &&
      p.status === "screened" &&
      p.authorHandle !== handle &&
      !seen.has(p.id) &&
      (p.verdict === "testing" || p.verdict === "valuable" || p.verdict === "insufficient"),
  );
  const inTopics = eligible.filter((p) => topics.includes(p.topic));
  const pool = inTopics.length >= config.feedSize ? inTopics : eligible;

  const postsByAuthor = new Map<string, number>();
  for (const p of posts) postsByAuthor.set(p.authorHandle, (postsByAuthor.get(p.authorHandle) ?? 0) + 1);

  const k = Math.round(config.feedSize * config.discoveryShare);
  const discovery = pool
    .filter((p) => p.stage === 0)
    .map((p) => {
      const post = posteriorFor(p.counts, p.ai.aiQuality);
      const newVoice = (postsByAuthor.get(p.authorHandle) ?? 0) < 3 ? 1 : 0;
      const pollBoost = p.media?.kind === "poll" ? 1.25 : 1;
      return { p, score: betaSample(post.alpha + newVoice, post.beta, rnd) * pollBoost };
    })
    .sort((a, b) => b.score - a.score);

  const now = Date.now();
  const decay = [48, 72, 120, 720];
  const ranked = pool
    .filter((p) => p.stage >= 1)
    .map((p) => {
      const post = posteriorFor(p.counts, p.ai.aiQuality);
      const ageH = (now - p.createdAt) / 3.6e6;
      return { p, score: post.mean * Math.exp(-ageH / decay[p.stage]!) + rnd() * 0.05 };
    })
    .sort((a, b) => b.score - a.score);

  const picked: FeedItem[] = [];
  const perAuthor = new Map<string, number>();
  const take = (p: Post, slot: FeedItem["slot"]) => {
    if (picked.some((x) => x.postId === p.id)) return false;
    if ((perAuthor.get(p.authorHandle) ?? 0) >= 2) return false;
    const typeOf = (id: string) => posts.find((q) => q.id === id)?.type;
    const sameKind = picked.filter((x) => {
      const t = typeOf(x.postId);
      return p.type === "video" ? t === "video" : p.type === "text" || p.type === "link" ? t === "text" || t === "link" : false;
    }).length;
    if (p.type === "video" && sameKind >= 3) return false;
    if ((p.type === "text" || p.type === "link") && sameKind >= 4) return false;
    perAuthor.set(p.authorHandle, (perAuthor.get(p.authorHandle) ?? 0) + 1);
    picked.push({ postId: p.id, slot });
    return true;
  };

  const disc: FeedItem[] = [];
  for (const d of discovery) {
    if (disc.length >= k) break;
    if (take(d.p, "discovery")) disc.push(picked[picked.length - 1]!);
  }
  const rest: FeedItem[] = [];
  for (const r of ranked) {
    if (rest.length >= config.feedSize - disc.length) break;
    if (take(r.p, r.p.stage === 3 ? "canon" : "ranked")) rest.push(picked[picked.length - 1]!);
  }
  for (const d of discovery) {
    if (disc.length + rest.length >= config.feedSize) break;
    if (take(d.p, "discovery")) disc.push(picked[picked.length - 1]!);
  }

  // Spread discovery items evenly through the ranked list.
  const total = disc.length + rest.length;
  const out: FeedItem[] = [];
  const every = disc.length ? Math.max(2, Math.floor(total / disc.length)) : Infinity;
  let di = 0;
  let ri = 0;
  for (let i = 0; i < total; i++) {
    if ((i + 1) % every === 0 && di < disc.length) out.push(disc[di++]!);
    else if (ri < rest.length) out.push(rest[ri++]!);
    else out.push(disc[di++]!);
  }
  return out;
}

/** Today's Sparks: a short, finite strip of vertical micro-lessons (max 5). */
export function buildSparks({ posts, handle, topics, date, seen }: BuildArgs): string[] {
  const rnd = mulberry32(hashString(`sparks:${handle}:${date}`));
  const sparks = posts.filter(
    (p) => p.type === "spark" && p.status === "screened" && p.authorHandle !== handle && !seen.has(p.id) && p.verdict !== "junk" && p.verdict !== "stopped",
  );
  const preferred = sparks.filter((p) => topics.includes(p.topic));
  const pool = preferred.length >= 4 ? preferred : sparks;
  return pool
    .map((p) => {
      const post = posteriorFor(p.counts, p.ai.aiQuality);
      return { id: p.id, score: betaSample(post.alpha + (p.stage === 0 ? 1 : 0), post.beta, rnd) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((x) => x.id);
}
