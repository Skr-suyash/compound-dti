"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { buildFeed, buildSparks } from "./feed";
import { DEFAULT_CONFIG, STAGE_TARGETS, decide, type Decision } from "./scoring";
import { AUTHORS, seedHistory, seedLedger, seedOwnPosts, seedPosts } from "./seed";
import type {
  AiScores,
  AlgoConfig,
  Author,
  CurrentUser,
  DayFeed,
  DayStat,
  LedgerEntry,
  Media,
  Post,
  RatingValue,
  ReadState,
  Stage,
  TopicId,
} from "./types";
import { todayKey } from "./utils";

const KEY_OF: Record<RatingValue, keyof Post["counts"]> = { [-1]: "wasted", 0: "meh", 1: "worth", 2: "changed" };
const STAGE_MERIT: Record<number, number> = { 1: 10, 2: 15, 3: 25 };
const STAGE_CRED: Record<number, number> = { 1: 2, 2: 3, 3: 5 };

export interface Draft {
  type: Post["type"];
  topic: TopicId;
  title: string;
  body: string;
  url?: string;
  media?: Media;
}

interface Data {
  user: CurrentUser | null;
  posts: Post[];
  myRatings: Record<string, RatingValue>;
  reads: Record<string, ReadState>;
  saved: string[];
  reported: string[];
  seen: string[];
  helpful: string[];
  following: string[];
  watched: string[];
  activitySeenAt: number;
  votes: Record<string, number>;
  circles: string[];
  feed: DayFeed | null;
  history: DayStat[];
  ledger: LedgerEntry[];
  config: AlgoConfig;
}

interface Actions {
  completeOnboarding: (u: { name: string; handle: string; topics: TopicId[]; bio?: string }) => void;
  updateProfile: (u: Partial<Pick<CurrentUser, "name" | "bio" | "topics">>) => void;
  signOut: () => void;
  resetDemo: () => void;
  ensureFeed: () => void;
  startNewDay: () => void;
  completeFeed: () => void;
  openPost: (id: string) => void;
  addReadSeconds: (id: string, seconds: number) => void;
  skipPost: (id: string) => void;
  ratePost: (id: string, value: RatingValue) => Decision | null;
  simulateRating: (id: string, value: RatingValue) => Decision | null;
  createPost: (d: Draft) => string;
  finishScreening: (id: string) => void;
  toggleSave: (id: string) => void;
  addReply: (postId: string, body: string) => void;
  toggleHelpful: (postId: string, replyId: string) => void;
  toggleFollow: (handle: string) => void;
  markWatched: (id: string) => void;
  markActivitySeen: () => void;
  vote: (postId: string, option: number) => void;
  toggleCircle: (id: string) => void;
  reportPost: (id: string) => void;
  adminDecide: (id: string, action: "approve" | "remove" | "restore") => void;
  setConfig: (c: Partial<AlgoConfig>) => void;
}

export type StoreState = Data & Actions;

function initialData(): Data {
  return {
    user: null,
    posts: seedPosts(),
    myRatings: {},
    reads: {},
    saved: [],
    reported: [],
    seen: [],
    helpful: [],
    following: [],
    watched: [],
    activitySeenAt: 0,
    votes: {},
    circles: [],
    feed: null,
    history: seedHistory(),
    ledger: [],
    config: DEFAULT_CONFIG,
  };
}

const PLACEHOLDER_AI: AiScores = {
  originality: 0.5,
  promiseDelivery: 0.5,
  infoDensity: 0.5,
  baitPatterns: [],
  safetyFlag: false,
  aiQuality: 0.5,
  explanation: "AI quality review will appear here once the screening model is connected.",
  engine: "pending",
};

/** Applies one reader's rating to a post, then runs the verdict engine. */
function applyRating(post: Post, value: RatingValue, cfg: AlgoConfig, previous?: RatingValue) {
  const counts = { ...post.counts };
  if (previous !== undefined) counts[KEY_OF[previous]] = Math.max(0, counts[KEY_OF[previous]] - 1);
  counts[KEY_OF[value]] += 1;
  let next: Post = {
    ...post,
    counts,
    stageRatings: previous === undefined ? post.stageRatings + 1 : post.stageRatings,
    stageShown: previous === undefined ? Math.min(post.stageTarget, post.stageShown + 1) : post.stageShown,
    impressions: previous === undefined ? post.impressions + 1 : post.impressions,
  };
  const decision = decide(next, cfg);
  if (decision.action !== "none" && decision.event) {
    next = { ...next, verdict: decision.verdict, events: [...next.events, decision.event] };
    if (decision.action === "promote") {
      next = {
        ...next,
        stage: decision.stage,
        stageTarget: STAGE_TARGETS[decision.stage],
        stageRatings: 0,
        stageShown: 0,
      };
    }
  }
  return { post: next, decision };
}

function ledgerFor(post: Post, decision: Decision, handle: string | undefined): LedgerEntry[] {
  if (!handle || post.authorHandle !== handle || decision.action === "none") return [];
  const at = Date.now();
  if (decision.action === "promote") {
    const s = decision.stage;
    const label = s === 3 ? "Post entered the Canon" : `Post reached Stage ${s}`;
    return [
      { id: `promote-${post.id}-${s}-merit`, at, currency: "merit", amount: STAGE_MERIT[s]!, reason: label, postId: post.id },
      { id: `promote-${post.id}-${s}-cred`, at, currency: "cred", amount: STAGE_CRED[s]!, reason: label, postId: post.id, topic: post.topic },
    ];
  }
  if (decision.action === "junk") {
    return [{ id: `junk-${post.id}`, at, currency: "cred", amount: -5, reason: "Post marked as junk", postId: post.id, topic: post.topic }];
  }
  return [];
}

const mergeLedger = (ledger: LedgerEntry[], add: LedgerEntry[]) => {
  const ids = new Set(ledger.map((e) => e.id));
  return [...ledger, ...add.filter((e) => !ids.has(e.id))];
};

function slug(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

function statFor(s: Data): DayStat | null {
  if (!s.feed) return null;
  const items = s.feed.items;
  const seconds = items.reduce((acc, it) => acc + (s.reads[it.postId]?.seconds ?? 0), 0);
  const rated = items.filter((it) => s.myRatings[it.postId] !== undefined);
  const worth = rated.filter((it) => (s.myRatings[it.postId] ?? -1) >= 1).length;
  const byTopic: DayStat["byTopic"] = {};
  for (const it of items) {
    const post = s.posts.find((p) => p.id === it.postId);
    const secs = s.reads[it.postId]?.seconds ?? 0;
    if (post && secs) byTopic[post.topic] = (byTopic[post.topic] ?? 0) + Math.round(secs / 60);
  }
  return {
    date: s.feed.date,
    minutes: Math.round(seconds / 60),
    worthRate: rated.length ? worth / rated.length : 0,
    caughtUp: !!s.feed.completedAt,
    byTopic,
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      completeOnboarding: ({ name, handle, topics, bio }) => {
        const now = Date.now();
        set({
          ...initialData(),
          user: { name, handle, topics, bio: bio ?? "Learning in public.", joinedAt: now - 9 * 864e5 },
          posts: [...seedPosts(now), ...seedOwnPosts(handle, now)],
          ledger: seedLedger(handle, now),
          history: seedHistory(now),
          activitySeenAt: now - 36 * 3.6e6,
        });
      },

      updateProfile: (u) => set((s) => (s.user ? { user: { ...s.user, ...u } } : {})),

      signOut: () => set({ user: null }),

      resetDemo: () => set(initialData()),

      ensureFeed: () => {
        const s = get();
        if (!s.user) return;
        const date = todayKey();
        if (s.feed?.date === date) return;
        const stat = statFor(s);
        const items = buildFeed({
          posts: s.posts,
          handle: s.user.handle,
          topics: s.user.topics,
          date,
          config: s.config,
          seen: new Set([...s.seen, ...Object.keys(s.myRatings)]),
        });
        const sparks = buildSparks({
          posts: s.posts,
          handle: s.user.handle,
          topics: s.user.topics,
          date,
          config: s.config,
          seen: new Set([...s.seen, ...s.watched]),
        });
        set({
          feed: { date, items, sparks },
          reads: {},
          history: stat ? [...s.history.filter((h) => h.date !== stat.date), stat] : s.history,
        });
      },

      startNewDay: () => {
        const s = get();
        if (!s.user || !s.feed) return;
        const stat = statFor(s);
        const seen = [...new Set([...s.seen, ...s.feed.items.map((i) => i.postId)])];
        const nextDate = new Date(new Date(`${s.feed.date}T12:00:00`).getTime() + 864e5);
        const date = todayKey(nextDate);
        const items = buildFeed({
          posts: s.posts,
          handle: s.user.handle,
          topics: s.user.topics,
          date,
          config: s.config,
          seen: new Set([...seen, ...Object.keys(s.myRatings)]),
        });
        const sparks = buildSparks({
          posts: s.posts,
          handle: s.user.handle,
          topics: s.user.topics,
          date,
          config: s.config,
          seen: new Set([...seen, ...s.watched, ...s.feed.sparks]),
        });
        set({
          seen,
          feed: { date, items, sparks },
          reads: {},
          history: stat ? [...s.history.filter((h) => h.date !== stat.date), stat] : s.history,
        });
      },

      completeFeed: () => {
        const s = get();
        if (!s.feed || s.feed.completedAt) return;
        const entry: LedgerEntry = {
          id: `caughtup-${s.feed.date}`,
          at: Date.now(),
          currency: "merit",
          amount: 1,
          reason: "Caught up for the day",
        };
        set({ feed: { ...s.feed, completedAt: Date.now() }, ledger: mergeLedger(s.ledger, [entry]) });
      },

      openPost: (id) =>
        set((s) => ({
          reads: { ...s.reads, [id]: { seconds: s.reads[id]?.seconds ?? 0, skipped: s.reads[id]?.skipped, opened: true } },
        })),

      addReadSeconds: (id, seconds) =>
        set((s) => {
          const r = s.reads[id] ?? { opened: true, seconds: 0 };
          return { reads: { ...s.reads, [id]: { ...r, seconds: r.seconds + seconds } } };
        }),

      skipPost: (id) =>
        set((s) => ({ reads: { ...s.reads, [id]: { opened: s.reads[id]?.opened ?? false, seconds: s.reads[id]?.seconds ?? 0, skipped: true } } })),

      ratePost: (id, value) => {
        const s = get();
        const post = s.posts.find((p) => p.id === id);
        if (!post || !s.user || post.authorHandle === s.user.handle) return null;
        const { post: next, decision } = applyRating(post, value, s.config, s.myRatings[id]);
        set({
          posts: s.posts.map((p) => (p.id === id ? next : p)),
          myRatings: { ...s.myRatings, [id]: value },
          ledger: mergeLedger(s.ledger, ledgerFor(next, decision, s.user.handle)),
        });
        return decision;
      },

      simulateRating: (id, value) => {
        const s = get();
        const post = s.posts.find((p) => p.id === id);
        if (!post) return null;
        const { post: next, decision } = applyRating(post, value, s.config);
        set({
          posts: s.posts.map((p) => (p.id === id ? next : p)),
          ledger: mergeLedger(s.ledger, ledgerFor(next, decision, s.user?.handle)),
        });
        return decision;
      },

      createPost: (d) => {
        const s = get();
        const id = slug(d.title);
        const now = Date.now();
        const words = d.body.split(/\s+/).filter(Boolean).length;
        const post: Post = {
          id,
          authorHandle: s.user?.handle ?? "you",
          topic: d.topic,
          type: d.type,
          media: d.media,
          replies: [],
          title: d.title.trim(),
          body: d.body.trim(),
          url: d.url,
          site: d.url ? safeHost(d.url) : undefined,
          createdAt: now,
          readMinutes: d.type === "spark" || d.type === "note" ? 1 : Math.max(1, Math.ceil(words / 85)),
          status: "screening",
          stage: 0 as Stage,
          verdict: "testing",
          ai: PLACEHOLDER_AI,
          counts: { wasted: 0, meh: 0, worth: 0, changed: 0 },
          stageRatings: 0,
          stageShown: 0,
          stageTarget: STAGE_TARGETS[0],
          impressions: 0,
          saves: 0,
          reports: 0,
          events: [],
        };
        set({ posts: [post, ...s.posts] });
        return id;
      },

      finishScreening: (id) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id && p.status === "screening"
              ? {
                  ...p,
                  status: "screened",
                  events: [
                    ...p.events,
                    { at: Date.now(), from: "testing", to: "testing", fromStage: 0, toStage: 0, rule: "screened",
                      message: "Passed screening. Shown to a fair first audience of ~20 readers." },
                  ],
                }
              : p,
          ),
        })),

      toggleSave: (id) =>
        set((s) => {
          const has = s.saved.includes(id);
          return {
            saved: has ? s.saved.filter((x) => x !== id) : [...s.saved, id],
            posts: s.posts.map((p) => (p.id === id ? { ...p, saves: Math.max(0, p.saves + (has ? -1 : 1)) } : p)),
          };
        }),

      addReply: (postId, body) =>
        set((s) => {
          if (!s.user || !body.trim()) return {};
          const reply = { id: `r-${Date.now().toString(36)}`, authorHandle: s.user.handle, body: body.trim(), at: Date.now(), helpful: 0 };
          return { posts: s.posts.map((p) => (p.id === postId ? { ...p, replies: [...p.replies, reply] } : p)) };
        }),

      toggleHelpful: (postId, replyId) =>
        set((s) => {
          const on = s.helpful.includes(replyId);
          return {
            helpful: on ? s.helpful.filter((x) => x !== replyId) : [...s.helpful, replyId],
            posts: s.posts.map((p) =>
              p.id === postId
                ? { ...p, replies: p.replies.map((r) => (r.id === replyId ? { ...r, helpful: Math.max(0, r.helpful + (on ? -1 : 1)) } : r)) }
                : p,
            ),
          };
        }),

      toggleFollow: (handle) =>
        set((s) => ({ following: s.following.includes(handle) ? s.following.filter((h) => h !== handle) : [...s.following, handle] })),

      markActivitySeen: () => set({ activitySeenAt: Date.now() }),

      vote: (postId, option) =>
        set((s) => {
          const prev = s.votes[postId];
          if (prev === option) return {};
          return {
            votes: { ...s.votes, [postId]: option },
            posts: s.posts.map((p) => {
              if (p.id !== postId || p.media?.kind !== "poll") return p;
              const options = p.media.options.map((o, i) => ({
                ...o,
                votes: o.votes + (i === option ? 1 : 0) - (i === prev ? 1 : 0),
              }));
              return { ...p, media: { ...p.media, options } };
            }),
          };
        }),

      toggleCircle: (id) => set((s) => ({ circles: s.circles.includes(id) ? s.circles.filter((c) => c !== id) : [...s.circles, id] })),

      markWatched: (id) => set((s) => (s.watched.includes(id) ? {} : { watched: [...s.watched, id] })),

      reportPost: (id) =>
        set((s) =>
          s.reported.includes(id)
            ? {}
            : {
                reported: [...s.reported, id],
                posts: s.posts.map((p) => (p.id === id ? { ...p, reports: p.reports + 1 } : p)),
              },
        ),

      adminDecide: (id, action) =>
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== id) return p;
            const at = Date.now();
            if (action === "approve")
              return { ...p, status: "screened", events: [...p.events, { at, from: p.verdict, to: p.verdict, fromStage: p.stage, toStage: p.stage, rule: "admin", message: "Reviewed and approved by the Compound team." }] };
            if (action === "remove")
              return { ...p, status: "removed", events: [...p.events, { at, from: p.verdict, to: p.verdict, fromStage: p.stage, toStage: p.stage, rule: "admin", message: "Removed by the Compound team for breaking community guidelines." }] };
            return { ...p, status: "held" };
          }),
        })),

      setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),
    }),
    {
      name: "compound-demo-v1",
      version: 3,
      // Earlier prototype data has no media/replies; start fresh rather than patching it.
      migrate: () => initialData() as unknown as StoreState,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        posts: s.posts,
        myRatings: s.myRatings,
        reads: s.reads,
        saved: s.saved,
        reported: s.reported,
        seen: s.seen,
        helpful: s.helpful,
        following: s.following,
        watched: s.watched,
        activitySeenAt: s.activitySeenAt,
        votes: s.votes,
        circles: s.circles,
        feed: s.feed,
        history: s.history,
        ledger: s.ledger,
        config: s.config,
      }),
    },
  ),
);

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}

/* ------------------------------------------------------------------ */
/* Selectors                                                            */
/* ------------------------------------------------------------------ */

export function authorFor(handle: string, user: CurrentUser | null): Author {
  if (user && handle === user.handle) return { handle, name: user.name, bio: user.bio, tone: "value" };
  return AUTHORS.find((a) => a.handle === handle) ?? { handle, name: handle, bio: "", tone: "ink" };
}

export function quotaFor(s: Pick<Data, "posts" | "user" | "config">) {
  const handle = s.user?.handle;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const mine = s.posts.filter((p) => p.authorHandle === handle);
  const used = mine.filter((p) => p.createdAt >= start.getTime() && p.status !== "removed").length;
  const recentJunk = mine.some(
    (p) => p.verdict === "junk" && p.events.some((e) => e.to === "junk" && Date.now() - e.at < 7 * 864e5),
  );
  const valuable = mine.filter((p) => p.stage >= 1).length;
  const limit = Math.max(1, Math.min(10, s.config.dailyQuota + Math.floor(valuable / 3)) - (recentJunk ? 2 : 0));
  return { used, limit, left: Math.max(0, limit - used), penalised: recentJunk };
}

export function balances(ledger: LedgerEntry[]) {
  const merit = ledger.filter((e) => e.currency === "merit").reduce((a, e) => a + e.amount, 0);
  const cred: Partial<Record<TopicId, number>> = {};
  for (const e of ledger) if (e.currency === "cred" && e.topic) cred[e.topic] = (cred[e.topic] ?? 0) + e.amount;
  return { merit, cred };
}

export function todayStat(s: Data) {
  return statFor(s);
}

export interface ActivityItem {
  id: string;
  at: number;
  kind: "reply" | "reward" | "verdict" | "penalty";
  actor?: string;
  title: string;
  body?: string;
  href: string;
}

/** Notifications derived from replies to your posts, verdicts and ledger entries. */
export function activityFor(s: Pick<Data, "posts" | "user" | "ledger">): ActivityItem[] {
  const handle = s.user?.handle;
  if (!handle) return [];
  const mine = s.posts.filter((p) => p.authorHandle === handle);
  const items: ActivityItem[] = [];
  for (const p of mine) {
    for (const r of p.replies) {
      if (r.authorHandle === handle) continue;
      items.push({ id: `reply-${r.id}`, at: r.at, kind: "reply", actor: r.authorHandle, title: `replied to “${p.title}”`, body: r.body, href: `/p/${p.id}#replies` });
    }
    for (const e of p.events) {
      if (e.rule === "confident_value" || e.rule === "below_bar" || e.rule === "clear_negative" || e.rule === "admin") {
        items.push({
          id: `ev-${p.id}-${e.at}`,
          at: e.at,
          kind: e.to === "junk" ? "penalty" : "verdict",
          title: e.to === "junk" ? `“${p.title}” was marked as junk` : e.to === "stopped" ? `“${p.title}” stopped climbing` : `“${p.title}” is climbing`,
          body: e.message,
          href: `/studio/${p.id}`,
        });
      }
    }
  }
  for (const e of s.ledger) {
    if (e.postId) continue;
    items.push({ id: `led-${e.id}`, at: e.at, kind: e.amount < 0 ? "penalty" : "reward", title: e.reason, body: `${e.amount > 0 ? "+" : ""}${e.amount} ${e.currency}`, href: "/rewards" });
  }
  return items.sort((a, b) => b.at - a.at);
}
