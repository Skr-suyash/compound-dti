export type TopicId = "coding" | "careers" | "design" | "science" | "finance";
export type Verdict = "testing" | "valuable" | "stopped" | "insufficient" | "junk";
export type PostStatus = "screening" | "screened" | "held" | "removed";
export type Slot = "ranked" | "discovery" | "canon";
export type Stage = 0 | 1 | 2 | 3;
/** -1 wasted · 0 meh · 1 worth it · 2 changed something */
export type RatingValue = -1 | 0 | 1 | 2;

export interface Topic {
  id: TopicId;
  name: string;
  blurb: string;
}

export interface Author {
  handle: string;
  name: string;
  bio: string;
  tone: AvatarTone;
}

export type AvatarTone = "value" | "ember" | "ochre" | "slate" | "ink" | "plum" | "sky" | "rose";

export type BaitPattern =
  | "clickbait_mismatch"
  | "engagement_bait"
  | "rage_bait"
  | "hollow_motivation"
  | "fake_urgency"
  | "withheld_payoff"
  | "duplicate";

export interface AiScores {
  originality: number;
  promiseDelivery: number;
  infoDensity: number;
  baitPatterns: BaitPattern[];
  safetyFlag: boolean;
  aiQuality: number;
  explanation: string;
  engine: string;
}

export interface Counts {
  wasted: number;
  meh: number;
  worth: number;
  changed: number;
}

export interface VerdictEvent {
  at: number;
  from: Verdict;
  to: Verdict;
  fromStage: Stage;
  toStage: Stage;
  rule: "confident_value" | "below_bar" | "clear_negative" | "below_quorum" | "admin" | "screened";
  message: string;
}

export type SparkVisual = "lever" | "bars" | "curves" | "swatches" | "waves" | "checklist" | "steps" | "none";
export type SparkTheme = "ink" | "value" | "ember" | "ochre" | "slate";

export interface SparkScene {
  kicker?: string;
  text: string;
  sub?: string;
  visual?: SparkVisual;
}

export type Media =
  | { kind: "youtube"; id: string; channel: string; title: string }
  | { kind: "image"; src: string; alt: string }
  | { kind: "spark"; scenes: SparkScene[]; theme: SparkTheme }
  | { kind: "poll"; options: { label: string; votes: number }[] };

export interface Reply {
  id: string;
  authorHandle: string;
  body: string;
  at: number;
  helpful: number;
}

export type PostType = "text" | "link" | "video" | "image" | "spark" | "note";

export interface Post {
  id: string;
  authorHandle: string;
  topic: TopicId;
  type: PostType;
  media?: Media;
  replies: Reply[];
  title: string;
  body: string;
  url?: string;
  site?: string;
  createdAt: number;
  readMinutes: number;
  status: PostStatus;
  stage: Stage;
  verdict: Verdict;
  ai: AiScores;
  counts: Counts;
  stageRatings: number;
  stageShown: number;
  stageTarget: number;
  impressions: number;
  saves: number;
  reports: number;
  events: VerdictEvent[];
}

export interface LedgerEntry {
  id: string;
  at: number;
  currency: "merit" | "cred";
  topic?: TopicId;
  amount: number;
  reason: string;
  postId?: string;
}

export interface FeedItem {
  postId: string;
  slot: Slot;
}

export interface DayFeed {
  date: string;
  items: FeedItem[];
  sparks: string[];
  completedAt?: number;
}

export interface ReadState {
  opened: boolean;
  seconds: number;
  skipped?: boolean;
}

export interface DayStat {
  date: string;
  minutes: number;
  worthRate: number;
  caughtUp: boolean;
  byTopic: Partial<Record<TopicId, number>>;
}

export interface CurrentUser {
  handle: string;
  name: string;
  bio: string;
  topics: TopicId[];
  joinedAt: number;
}

export interface AlgoConfig {
  feedSize: number;
  discoveryShare: number;
  quorum: number;
  promoteBar: number;
  junkBar: number;
  dailyQuota: number;
}
