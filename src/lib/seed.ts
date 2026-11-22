import { STAGE_NAMES, STAGE_TARGETS, posteriorFor } from "./scoring";
import type {
  AiScores,
  Author,
  BaitPattern,
  Counts,
  DayStat,
  LedgerEntry,
  Media,
  Post,
  Stage,
  Topic,
  TopicId,
  Verdict,
  VerdictEvent,
} from "./types";

export const TOPICS: Topic[] = [
  { id: "coding", name: "Coding", blurb: "Algorithms, systems and the craft of building software." },
  { id: "careers", name: "Careers", blurb: "Placements, interviews, resumes and the first job." },
  { id: "design", name: "Design", blurb: "Typography, layout, colour and interfaces that work." },
  { id: "science", name: "Science", blurb: "Physics, biology and how the world actually works." },
  { id: "finance", name: "Money", blurb: "Budgeting, investing and making a salary go further." },
];

export const topicName = (id: TopicId) => TOPICS.find((t) => t.id === id)?.name ?? id;

export const AUTHORS: Author[] = [
  { handle: "meera.codes", name: "Meera Iyer", bio: "Teaching algorithms the way I wish I'd learned them.", tone: "value" },
  { handle: "dev.systems", name: "Dev Malhotra", bio: "Frontend engineer. Performance nerd. Writes short, useful things.", tone: "slate" },
  { handle: "kabir.builds", name: "Kabir Shah", bio: "Final-year engineering student. Physics explained from scratch.", tone: "ochre" },
  { handle: "zoya.lab", name: "Zoya Khan", bio: "Neuroscience grad student. Science without the jargon.", tone: "ember" },
  { handle: "ananya.design", name: "Ananya Rao", bio: "Product designer. Grids, type and the details that matter.", tone: "value" },
  { handle: "arjun.ux", name: "Arjun Nair", bio: "Accessibility advocate and UX researcher.", tone: "sky" },
  { handle: "rohan.money", name: "Rohan Mehta", bio: "CFA candidate. Personal finance for people with a first salary.", tone: "ochre" },
  { handle: "tara.careers", name: "Tara D'Souza", bio: "Placement mentor. Helped 200+ students land their first offer.", tone: "slate" },
  { handle: "ishaan.notes", name: "Ishaan Gupta", bio: "Product manager. Notes on work, careers and decisions.", tone: "plum" },
  { handle: "motivationking", name: "MotivationKing", bio: "🔥 Toppers' secrets daily 🔥 Follow for part 2", tone: "ember" },
  { handle: "viral.facts", name: "Viral Facts", bio: "Facts they don't want you to know 👀", tone: "ink" },
  { handle: "priya.s", name: "Priya Sharma", bio: "CS undergrad. One DSA problem a day, every day.", tone: "plum" },
  { handle: "rahul.dev", name: "Rahul Verma", bio: "Backend intern. Learning in public.", tone: "ink" },
  { handle: "sneha.reads", name: "Sneha Pillai", bio: "Biology student who reads everything.", tone: "sky" },
  { handle: "aditya.k", name: "Aditya Kulkarni", bio: "JEE 2027 aspirant. Physics first.", tone: "ochre" },
  { handle: "nisha.design", name: "Nisha Menon", bio: "Design student. Collecting good typography.", tone: "rose" },
];

export const PATTERN_LABELS: Record<BaitPattern, string> = {
  clickbait_mismatch: "Clickbait mismatch",
  engagement_bait: "Engagement bait",
  rage_bait: "Rage bait",
  hollow_motivation: "Hollow motivation",
  fake_urgency: "Fake urgency",
  withheld_payoff: "Withheld payoff",
  duplicate: "Near-duplicate",
};

const H = 3.6e6;

function ai(
  originality: number,
  promiseDelivery: number,
  infoDensity: number,
  explanation: string,
  baitPatterns: BaitPattern[] = [],
): AiScores {
  const base = 0.4 * promiseDelivery + 0.3 * infoDensity + 0.3 * originality;
  const aiQuality = Math.max(0.05, Math.min(0.95, base - Math.min(0.45, 0.15 * baitPatterns.length)));
  return {
    originality,
    promiseDelivery,
    infoDensity,
    baitPatterns,
    safetyFlag: false,
    aiQuality: Math.round(aiQuality * 100) / 100,
    explanation,
    engine: "Screening v0",
  };
}

const c = (worth: number, changed: number, meh: number, wasted: number): Counts => ({ worth, changed, meh, wasted });

function history(stage: Stage, verdict: Verdict, createdAt: number, counts: Counts, aiQ: number): VerdictEvent[] {
  const events: VerdictEvent[] = [
    { at: createdAt + 0.01 * H, from: "testing", to: "testing", fromStage: 0, toStage: 0, rule: "screened",
      message: "Passed screening. Shown to a fair first audience of ~20 readers." },
  ];
  const p = posteriorFor(counts, aiQ);
  const worth = Math.round(p.worthPct * 100);
  for (let s = 1; s <= stage; s++) {
    events.push({
      at: createdAt + s * 26 * H,
      from: s === 1 ? "testing" : "valuable",
      to: "valuable",
      fromStage: (s - 1) as Stage,
      toStage: s as Stage,
      rule: "confident_value",
      message: `${Math.min(97, worth + (stage - s) * 2)}% of readers found this worth their time. Now reaching ${s === 3 ? "the Canon" : STAGE_NAMES[s as Stage].toLowerCase()}.`,
    });
  }
  if (verdict === "stopped") {
    events.push({ at: createdAt + 30 * H, from: "testing", to: "stopped", fromStage: stage, toStage: stage, rule: "below_bar",
      message: `Stopped climbing: ${worth}% found it worth their time at this audience size. No penalty.` });
  }
  if (verdict === "junk") {
    events.push({ at: createdAt + 20 * H, from: "testing", to: "junk", fromStage: stage, toStage: stage, rule: "clear_negative",
      message: `Marked as junk: ${Math.round(p.regret * 100)}% said it wasted their time, and the title promised more than the post delivered.` });
  }
  return events;
}

interface PostSeed {
  id: string;
  author: string;
  topic: TopicId;
  title: string;
  body: string;
  ageH: number;
  stage: Stage;
  verdict: Verdict;
  counts: Counts;
  ai: AiScores;
  type?: Post["type"];
  media?: Media;
  url?: string;
  site?: string;
  status?: Post["status"];
  stageRatings?: number;
  stageShown?: number;
  saves?: number;
  reports?: number;
}

function build(s: PostSeed, now: number): Post {
  const createdAt = now - s.ageH * H;
  const words = s.body.split(/\s+/).length;
  const total = s.counts.wasted + s.counts.meh + s.counts.worth + s.counts.changed;
  const target = STAGE_TARGETS[s.stage];
  const type: Post["type"] =
    s.type ?? (s.media?.kind === "youtube" ? "video" : s.media?.kind === "image" ? "image" : s.media?.kind === "spark" ? "spark" : s.media?.kind === "poll" ? "note" : "text");
  return {
    id: s.id,
    authorHandle: s.author,
    topic: s.topic,
    type,
    media: s.media,
    replies: (REPLIES[s.id] ?? []).map(([authorHandle, body, offsetH, helpful], i) => ({
      id: `${s.id}-r${i}`,
      authorHandle,
      body,
      at: Math.min(now - 0.2 * H, createdAt + offsetH * H),
      helpful,
    })),
    title: s.title,
    body: s.body,
    url: s.url,
    site: s.site,
    createdAt,
    readMinutes: type === "spark" || type === "note" ? 1 : Math.max(2, Math.ceil(words / 85)),
    status: s.status ?? "screened",
    stage: s.stage,
    verdict: s.verdict,
    ai: s.ai,
    counts: s.counts,
    stageRatings: s.stageRatings ?? Math.min(total, Math.round(total * 0.4)),
    stageShown: s.stageShown ?? Math.round(target * 0.6),
    stageTarget: target,
    impressions: Math.round(total * 1.45) + 3,
    saves: s.saves ?? Math.round(total * 0.18),
    reports: s.reports ?? 0,
    events: history(s.stage, s.verdict, createdAt, s.counts, s.ai.aiQuality),
  };
}

const SEEDS: PostSeed[] = [
  {
    id: "dp-recursion-memory",
    author: "meera.codes",
    topic: "coding",
    title: "Dynamic programming is just recursion with a memory",
    ageH: 96,
    stage: 2,
    verdict: "valuable",
    counts: c(71, 24, 9, 4),
    saves: 41,
    ai: ai(0.92, 0.91, 0.84, "Delivers exactly what the title promises, with a worked example and a clear method."),
    body: `Most people meet dynamic programming as a wall of tables. Start somewhere else: **a recursive function that keeps repeating itself.**

## The Fibonacci tell

\`\`\`
fib(5) = fib(4) + fib(3)
fib(4) = fib(3) + fib(2)   ← fib(3) again
\`\`\`

Every repeated call is wasted work. Dynamic programming is simply the decision to stop wasting it.

## Three steps that work on almost every problem

1. **Write the plain recursion.** Don't optimise. Get a correct answer for small inputs.
2. **Add a memo.** Store each result the first time you compute it, keyed by the arguments.
3. **Flip it into a table (optional).** Fill answers from the smallest subproblem upward.

## How to spot a DP problem

- The question asks for a *best*, a *count* or *is it possible*.
- The choice at each step depends on a small state — an index, a remaining capacity, the last item.
- The brute-force tree has the same subtrees appearing again and again.

> If you can describe the state in one sentence, you can memoise it.

Try it on climbing stairs, then coin change, then longest common subsequence — in that order. Each one adds exactly one new idea.`,
  },
  {
    id: "react-rerenders",
    author: "dev.systems",
    topic: "coding",
    title: "Why your React app re-renders — and the three fixes that actually matter",
    ageH: 40,
    stage: 1,
    verdict: "valuable",
    counts: c(28, 8, 5, 2),
    stageShown: 31,
    ai: ai(0.81, 0.88, 0.79, "Specific, practical fixes ordered by impact; the title is accurate."),
    body: `Re-renders aren't bugs. React re-renders a component when its **state changes, its parent re-renders, or a context it reads changes.** Most slow apps suffer from the second one.

## 1. Move state down

If only a search box needs \`query\`, keep \`query\` inside the search box — not in the page. The rest of the page stops re-rendering on every keystroke.

## 2. Lift content up

Pass expensive children as \`children\`. A component that re-renders doesn't re-render the elements it was *given*, only the ones it *creates*.

## 3. Split your contexts

One giant \`AppContext\` means every consumer re-renders when anything changes. Split by how often values change: theme (rarely), user (sometimes), cart (often).

Only after these three should you reach for \`memo\` and \`useCallback\`. Measure first with the React Profiler — the flame chart tells you which component is actually expensive.`,
  },
  {
    id: "git-rebase-merge",
    author: "meera.codes",
    topic: "coding",
    title: "Git rebase vs merge, explained with one diagram you can draw",
    ageH: 7,
    stage: 0,
    verdict: "testing",
    counts: c(6, 2, 1, 0),
    stageRatings: 9,
    stageShown: 11,
    ai: ai(0.86, 0.87, 0.71, "Clear mental model with a concrete rule for when to use each."),
    body: `Draw two lines. The top one is \`main\`, the bottom one is your branch. Both have moved since you split.

**Merge** draws a new dot that joins the two lines. History stays honest: you can see that work happened in parallel.

**Rebase** lifts your bottom line and replays it on top of \`main\`, one commit at a time. History looks like it happened in a straight line.

## When to use which

- **Rebase** your own branch before opening a pull request, so reviewers see a clean story.
- **Merge** shared branches. Never rebase commits other people have already pulled.

## The one command worth memorising

\`\`\`
git pull --rebase
\`\`\`

It stops those pointless "Merge branch 'main' into main" commits from cluttering your feature branch.`,
  },
  {
    id: "big-o-shapes",
    author: "dev.systems",
    topic: "coding",
    title: "Big-O in plain English: the five shapes you'll meet 90% of the time",
    ageH: 720,
    stage: 3,
    verdict: "valuable",
    counts: c(212, 64, 21, 8),
    saves: 188,
    ai: ai(0.88, 0.93, 0.86, "Concise, accurate and immediately usable in interviews."),
    body: `Forget the formal definition for a minute. Big-O answers one question: **if the input doubles, what happens to the work?**

| Shape | Doubling the input… | Typical example |
|---|---|---|
| O(1) | changes nothing | reading an array index |
| O(log n) | adds one step | binary search |
| O(n) | doubles the work | one loop over a list |
| O(n log n) | a bit more than doubles | good sorting |
| O(n²) | quadruples the work | nested loops over the same list |

## Reading code for its shape

- One loop over the input → **O(n)**
- A loop that halves the input each time → **O(log n)**
- A loop inside a loop over the same input → **O(n²)**

Interviewers rarely want a proof. They want you to say *why* — "this inner loop runs once for every element of the outer one" is the whole answer.`,
  },
  {
    id: "torque-from-scratch",
    author: "kabir.builds",
    topic: "science",
    title: "Rotational motion in 9 minutes: torque, from scratch",
    ageH: 30,
    stage: 1,
    verdict: "valuable",
    counts: c(19, 7, 3, 1),
    stageShown: 26,
    ai: ai(0.91, 0.88, 0.82, "Builds intuition first, then the formula, then the exam pattern."),
    body: `Push a door near the hinge and it barely moves. Push at the handle and it swings open. That difference is **torque**.

## Torque is force times leverage

τ = r × F × sin θ

- **r** — distance from the pivot
- **F** — how hard you push
- **θ** — the angle between your push and the door

Push straight at the hinge (θ = 0) and nothing happens, however hard you push.

## The rotational twin of Newton's second law

Linear motion: F = m·a. Rotational motion: **τ = I·α**.

*I*, the moment of inertia, is "mass, but it cares where the mass is." Mass far from the axis is harder to spin — which is why a figure skater spins faster when they pull their arms in.

## The exam pattern

Almost every JEE torque question is three steps: pick the pivot, write τ for each force, and set the sum equal to I·α (or to zero for equilibrium). Pick the pivot where the unknown force acts and it disappears from the equation.`,
  },
  {
    id: "sky-blue-sunset-red",
    author: "zoya.lab",
    topic: "science",
    title: "Why the sky is blue but sunsets are red",
    ageH: 120,
    stage: 2,
    verdict: "valuable",
    counts: c(64, 19, 8, 3),
    ai: ai(0.79, 0.92, 0.77, "Answers the question fully, including the follow-up most people have."),
    body: `Sunlight contains every colour. On its way through the air it bumps into molecules far smaller than its wavelength — and **short wavelengths scatter far more than long ones** (around five times more for blue than for red).

## At midday

The sun is overhead, so its light crosses a thin slice of atmosphere. The blue that gets scattered sideways reaches your eyes from every direction, and the whole sky glows blue.

## At sunset

The sun sits near the horizon, so its light crosses up to forty times more air. By the time it reaches you, most of the blue has been scattered away. What survives the journey is orange and red.

## Why not violet?

Violet scatters even more than blue, but the sun emits less of it, some is absorbed high in the atmosphere, and our eyes are less sensitive to it. Blue wins the sum.`,
  },
  {
    id: "sleep-after-studying",
    author: "zoya.lab",
    topic: "science",
    title: "What actually happens in your brain when you sleep after studying",
    ageH: 5,
    stage: 0,
    verdict: "testing",
    counts: c(4, 3, 1, 0),
    stageRatings: 8,
    stageShown: 10,
    ai: ai(0.84, 0.89, 0.76, "Well-sourced explanation with practical takeaways for exam week."),
    body: `Studying writes memories into the hippocampus — a fast but fragile notepad. **Sleep is when the notes get copied into long-term storage.**

## Two kinds of sleep, two jobs

- **Deep (slow-wave) sleep** replays what you learned and strengthens facts and concepts. It's concentrated early in the night.
- **REM sleep** links new material to what you already know — the "oh, that's connected" feeling. It's concentrated late in the night.

## What this means for exam week

1. Cutting the *end* of your sleep cuts most of your REM.
2. An all-nighter skips the copy step entirely: you're studying into a notepad that gets wiped.
3. A 20-minute nap after a study block measurably improves recall.

Revising before bed and then sleeping a full night beats two extra hours of late-night scrolling — every time.`,
  },
  {
    id: "entropy-no-mysticism",
    author: "kabir.builds",
    topic: "science",
    title: "Entropy without the mysticism",
    ageH: 900,
    stage: 3,
    verdict: "valuable",
    counts: c(148, 52, 17, 6),
    saves: 131,
    ai: ai(0.9, 0.9, 0.81, "Replaces a vague metaphor with a precise, intuitive definition."),
    body: `Entropy isn't "disorder." It's a count: **how many microscopic arrangements look the same from the outside.**

## A deck of cards

There's exactly one arrangement that's perfectly sorted. There are billions upon billions we'd call "shuffled." Shuffle a sorted deck and it almost certainly becomes unsorted — not because nature prefers mess, but because there are vastly more ways to be shuffled.

## The second law, restated

Systems drift towards the states with the most arrangements, simply because those states are overwhelmingly likely. Heat flows from hot to cold for exactly the same reason.

## Why your room gets messy

Same maths. Countless positions for your books count as "messy"; very few count as "tidy." Keeping order costs energy — which is precisely what the second law says.`,
  },
  {
    id: "eight-point-grid",
    author: "ananya.design",
    topic: "design",
    title: "The 8-point grid: the one rule that cleans up any layout",
    ageH: 52,
    stage: 1,
    verdict: "valuable",
    counts: c(22, 6, 4, 1),
    stageShown: 34,
    ai: ai(0.77, 0.9, 0.74, "A single, clear rule with a step-by-step way to apply it."),
    body: `Pick one number and make every spacing a multiple of it. Most product teams pick **8**.

## Why 8

- It divides cleanly into common screen sizes.
- It halves nicely (4) for tight spots like icon padding.
- It's big enough that the steps are visibly different: 8, 16, 24, 32, 48, 64.

## How to apply it in an afternoon

1. Replace every margin and padding with the nearest step.
2. Use **smaller gaps inside a group and larger gaps between groups.** This alone fixes most "something feels off" layouts.
3. Set line heights so text baselines land on a 4-point rhythm.

Good design isn't about remembering hundreds of values. It's about limiting yourself to a few, on purpose.`,
  },
  {
    id: "contrast-is-a-number",
    author: "arjun.ux",
    topic: "design",
    title: "Contrast is a number, not a vibe",
    ageH: 9,
    stage: 0,
    verdict: "testing",
    counts: c(5, 1, 2, 0),
    stageRatings: 8,
    stageShown: 9,
    ai: ai(0.82, 0.86, 0.69, "Turns a subjective debate into three memorable thresholds."),
    body: `Light grey text on white looks elegant on your monitor and invisible on a phone in sunlight. Contrast can be measured, so measure it.

## The ratios to remember

- **4.5 : 1** for body text
- **3 : 1** for large text (24px and up) and icons
- **7 : 1** if you want comfortable reading for everyone

## A quick fix for "washed out" interfaces

Darken your secondary text until it passes 4.5 : 1, then create hierarchy with **size and weight** instead of paleness.

## Don't let colour do the job alone

Red and green status dots fail for roughly 1 in 12 men. Pair every colour with a word or an icon: "Failed", "Live", "Draft".`,
  },
  {
    id: "kerning-headlines",
    author: "ananya.design",
    topic: "design",
    title: "Kerning your headlines: a four-step checklist",
    ageH: 150,
    stage: 2,
    verdict: "valuable",
    counts: c(51, 13, 7, 2),
    ai: ai(0.85, 0.89, 0.72, "Short, actionable and specific to a real, common problem."),
    body: `Body text takes care of itself. Headlines don't — at 64px, a small gap between two letters becomes a hole.

1. **Flip it upside down.** Without reading the words, you see only the spacing. Holes jump out.
2. **Fix the classic pairs first:** AV, To, Wa, LT, ry. They almost always need tightening.
3. **Tighten the whole line slightly.** Large type looks loose at default tracking; −1% to −3% is typical.
4. **Squint.** The texture should look even, like a grey band, with no dark clumps or light gaps.

Ten minutes on one headline is the cheapest upgrade a design will ever get.`,
  },
  {
    id: "sip-vs-lump-sum",
    author: "rohan.money",
    topic: "finance",
    title: "SIP vs lump sum: what 20 years of Nifty data actually says",
    ageH: 60,
    stage: 1,
    verdict: "valuable",
    counts: c(24, 9, 5, 2),
    stageShown: 29,
    ai: ai(0.8, 0.86, 0.8, "Honest about the trade-off instead of repeating the usual advice."),
    body: `If you have the whole amount today, **lump sum wins roughly two-thirds of the time** over long periods. Markets rise more often than they fall, so money invested earlier usually has more time to grow.

## So why does everyone recommend SIPs?

Because most of us don't have the whole amount. We earn monthly. A SIP matches investing to the way a salary actually arrives.

## Where SIPs genuinely help

- **Behaviour.** Automatic investing removes the "is this a good time?" paralysis.
- **Regret.** Investing a bonus right before a 20% fall hurts. Spreading it over six to twelve months caps that regret.

## The practical rule

Salary → SIP, automatically, on the day after payday. Windfalls → invest within a year, in a few chunks if a single entry scares you. The worst option is cash that sits waiting for the "right time."`,
  },
  {
    id: "first-salary-budget",
    author: "rohan.money",
    topic: "finance",
    title: "Your first salary: a 50/30/20 budget that survives Indian rent",
    ageH: 4,
    stage: 0,
    verdict: "testing",
    counts: c(3, 2, 1, 0),
    stageRatings: 6,
    stageShown: 8,
    ai: ai(0.78, 0.88, 0.78, "Adapts a generic rule to a real situation with concrete numbers."),
    body: `The classic 50/30/20 rule breaks the moment you rent in Bengaluru or Mumbai. Adjust it instead of abandoning it.

## A realistic split for a ₹60,000 take-home

| Bucket | Share | Amount |
|---|---|---|
| Needs (rent, food, travel) | 55% | ₹33,000 |
| Wants | 20% | ₹12,000 |
| Savings & investing | 25% | ₹15,000 |

## Three rules that matter more than the split

1. **Emergency fund first:** three months of needs in a liquid fund before anything fancy.
2. **Automate the 25%** on salary day, so savings aren't whatever is left at month-end.
3. **Buy health insurance now,** even if your employer covers you. It's cheapest while you're young and healthy.`,
  },
  {
    id: "compound-22-vs-30",
    author: "rohan.money",
    topic: "finance",
    title: "Compound interest, visualised: why starting at 22 beats starting at 30",
    ageH: 1100,
    stage: 3,
    verdict: "valuable",
    counts: c(176, 58, 19, 7),
    saves: 204,
    ai: ai(0.83, 0.94, 0.8, "A memorable, numerically correct example that changes behaviour."),
    body: `Two friends invest ₹5,000 a month at 12% a year.

- **Asha** starts at 22 and stops at 30. She invests for eight years — ₹4.8 lakh in total — then never adds another rupee.
- **Vikram** starts at 30 and invests every month until he's 60. That's thirty years and ₹18 lakh.

At 60, **Asha has more** — roughly ₹2.9 crore against Vikram's ₹1.7 crore. Her early money had 38 years to compound.

## The lesson isn't "stop at 30"

It's that the first rupees you invest are the most powerful ones you'll ever have. Time does the heavy lifting; contributions just give it something to lift.

Start small. Start now. ₹1,000 a month at 22 is worth more than a perfect plan at 30.`,
  },
  {
    id: "placements-90-days",
    author: "tara.careers",
    topic: "careers",
    title: "How I'd prepare for placements in 90 days, week by week",
    ageH: 110,
    stage: 2,
    verdict: "valuable",
    counts: c(82, 27, 10, 4),
    saves: 96,
    ai: ai(0.84, 0.9, 0.85, "A complete, realistic plan with a clear structure and priorities."),
    body: `Ninety days is enough — if you stop trying to do everything.

## Weeks 1–4: foundations

- One language, deeply. Know its standard library for arrays, strings, hash maps and heaps.
- **Two problems a day** from arrays, strings, hashing and two pointers. Easy first, then medium.

## Weeks 5–8: patterns

- Trees, graphs (BFS and DFS), binary search on the answer, dynamic programming.
- After each problem, write one line: *which pattern was this?* That line is what you'll remember in the interview.

## Weeks 9–12: performance

- Two timed mock interviews a week, out loud. Silence is the most common reason good candidates fail.
- One project you can explain in depth: what you built, what broke, and what you'd change.

Track it on paper. Consistency beats intensity — two problems a day for ninety days is 180 problems, which is more than enough.`,
  },
  {
    id: "resume-bullets",
    author: "ishaan.notes",
    topic: "careers",
    title: "Writing a resume bullet that recruiters actually read",
    ageH: 34,
    stage: 1,
    verdict: "valuable",
    counts: c(21, 5, 4, 1),
    stageShown: 24,
    ai: ai(0.76, 0.89, 0.75, "Clear formula with before-and-after examples."),
    body: `Recruiters skim a resume in seconds. Every bullet has to survive that skim.

## The formula

**Action verb + what you did + measurable result.**

- Before: "Worked on the backend of the college fest website."
- After: "Built a ticketing API in Node.js that handled 4,000 registrations in 48 hours with zero downtime."

## Three edits that help every resume

1. Lead with the result if it's impressive: "Cut page load time by 60% by…"
2. Replace "responsible for" with what you actually did.
3. Keep one line per bullet. If it wraps, it's two bullets — or a few words too many.

No numbers? Use scale instead: users, teammates, deadlines, files, requests per second.`,
  },
  {
    id: "cold-email-template",
    author: "tara.careers",
    topic: "careers",
    title: "Cold emailing for internships: the five-line template",
    ageH: 6,
    stage: 0,
    verdict: "testing",
    counts: c(5, 1, 1, 1),
    stageRatings: 8,
    stageShown: 10,
    ai: ai(0.79, 0.9, 0.7, "Practical template with a specific example for each line."),
    body: `Long emails don't get read. Five lines do.

1. **Who you are, in one line:** "I'm a third-year CS student at VIT."
2. **Why them, specifically:** "Your team's post on reducing checkout latency…"
3. **What you can do:** "I built a caching layer for our college app that cut API calls by 40%."
4. **The ask:** "Would you be open to a 15-minute call about summer internships?"
5. **Proof:** one link to GitHub or a single project — not a ten-page portfolio.

Send it on a Tuesday, Wednesday or Thursday morning. Follow up once after five working days, then let it go.`,
  },
  {
    id: "pm-day",
    author: "ishaan.notes",
    topic: "careers",
    title: "What a product manager actually does all day",
    ageH: 11,
    stage: 0,
    verdict: "testing",
    counts: c(4, 1, 2, 1),
    stageRatings: 8,
    stageShown: 11,
    ai: ai(0.81, 0.85, 0.66, "Honest and specific; would be stronger with one real example."),
    body: `Less drawing roadmaps than you'd think. A typical day looks like this:

- **Morning:** read the overnight numbers and support tickets. Something always looks odd.
- **Midday:** unblock engineers — clarify edge cases, cut scope, make the call nobody else wants to make.
- **Afternoon:** talk to users or watch session recordings. This is where most good ideas actually come from.
- **Evening:** write — specs, updates, and the "why" behind each decision.

The job is deciding what *not* to build, and explaining that decision so clearly that the team agrees. If you enjoy writing, talking to people and making trade-offs with incomplete information, you'd probably enjoy it.`,
  },
  {
    id: "secret-trick-99",
    author: "motivationking",
    topic: "science",
    title: "1 secret trick to score 99% in JEE 🤯",
    ageH: 44,
    stage: 0,
    verdict: "junk",
    counts: c(3, 0, 4, 21),
    stageRatings: 28,
    stageShown: 20,
    reports: 4,
    ai: ai(0.34, 0.08, 0.06, "The title promises a trick that the post never reveals.", [
      "clickbait_mismatch",
      "withheld_payoff",
      "engagement_bait",
    ]),
    body: `Toppers don't want you to know this. 🤫

The difference between 60% and 99% is ONE habit that nobody talks about.

Most students will scroll past this. Winners won't.

Follow for part 2 where I reveal the trick. Comment YES if you're ready to change your life!! 🔥🔥`,
  },
  {
    id: "rich-by-25",
    author: "viral.facts",
    topic: "finance",
    title: "Comment YES if you want to be rich by 25",
    ageH: 3,
    stage: 0,
    verdict: "testing",
    status: "held",
    counts: c(0, 0, 0, 0),
    stageRatings: 0,
    stageShown: 0,
    reports: 6,
    ai: ai(0.41, 0.12, 0.09, "Asks readers to engage instead of giving them anything worth engaging with.", [
      "engagement_bait",
      "hollow_motivation",
    ]),
    body: `Rich people think differently. Poor people trade time for money. 💸

Most people will ignore this post and stay broke.

Comment YES and I'll send you my free guide. Like and share so your friends don't stay poor!`,
  },
  {
    id: "language-dead-2027",
    author: "viral.facts",
    topic: "coding",
    title: "This programming language will be DEAD in 2027 (watch till the end)",
    ageH: 8,
    stage: 0,
    verdict: "testing",
    status: "held",
    counts: c(0, 0, 0, 0),
    stageRatings: 0,
    stageShown: 0,
    reports: 2,
    ai: ai(0.52, 0.14, 0.11, "Teases information it never delivers and leans on fear to drive clicks.", [
      "clickbait_mismatch",
      "withheld_payoff",
    ]),
    body: `Everyone learning it right now is wasting their time. Companies are already quietly replacing it.

I can't say which one here because of the algorithm 👀 but if you watch till the end of my next post you'll know.

Don't say I didn't warn you.`,
  },
];

/* ------------------------------------------------------------------ */
/* Generated image assets (SVG infographics, so they work offline)      */
/* ------------------------------------------------------------------ */

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

function spacingScaleImage() {
  const steps = [8, 16, 24, 32, 48, 64];
  let x = 90;
  const blocks = steps
    .map((s) => {
      const size = s * 3.2;
      const out = `<rect x="${x}" y="${470 - size}" width="${size}" height="${size}" rx="10" fill="#0b7a63" opacity="${0.35 + steps.indexOf(s) * 0.13}"/>
<text x="${x + size / 2}" y="520" text-anchor="middle" font-family="ui-monospace,monospace" font-size="26" fill="#0f1b2a">${s}</text>`;
      x += size + 34;
      return out;
    })
    .join("");
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="720" viewBox="0 0 1200 720">
<rect width="1200" height="720" fill="#f4f1ea"/>
<text x="90" y="120" font-family="ui-sans-serif,system-ui,sans-serif" font-size="54" font-weight="700" fill="#0f1b2a" letter-spacing="-1.5">The 8-point spacing scale</text>
<text x="90" y="172" font-family="ui-sans-serif,system-ui,sans-serif" font-size="26" fill="#46505d">Every margin and padding is one of these six values.</text>
${blocks}
<line x1="90" y1="470" x2="1110" y2="470" stroke="#cfc6b4" stroke-width="2"/>
<text x="90" y="640" font-family="ui-sans-serif,system-ui,sans-serif" font-size="24" fill="#46505d">Small gaps inside a group · larger gaps between groups</text>
</svg>`);
}

function compoundChartImage() {
  const W = 1200;
  const H = 720;
  const L = 110;
  const R = 1110;
  const T = 190;
  const B = 600;
  const value = (start: number, stop: number) => {
    const pts: [number, number][] = [];
    let v = 0;
    for (let age = 22; age <= 60; age++) {
      if (age >= start && age < stop) v = (v + 60000) * 1.12;
      else v = v * 1.12;
      pts.push([age, v]);
    }
    return pts;
  };
  const asha = value(22, 30);
  const vikram = value(30, 60);
  const max = Math.max(asha[asha.length - 1]![1], vikram[vikram.length - 1]![1]);
  const X = (age: number) => L + ((age - 22) / 38) * (R - L);
  const Y = (v: number) => B - (v / max) * (B - T);
  const path = (pts: [number, number][]) => pts.map(([a, v], i) => `${i ? "L" : "M"}${X(a).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const crore = (v: number) => `₹${(v / 1e7).toFixed(1)} Cr`;
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#0f1b2a"/>
<text x="${L}" y="96" font-family="ui-sans-serif,system-ui,sans-serif" font-size="50" font-weight="700" fill="#f4f1ea" letter-spacing="-1.5">Starting at 22 beats starting at 30</text>
<text x="${L}" y="144" font-family="ui-sans-serif,system-ui,sans-serif" font-size="24" fill="#8592a3">₹5,000 a month at 12% a year</text>
${[22, 30, 40, 50, 60].map((a) => `<line x1="${X(a)}" y1="${T}" x2="${X(a)}" y2="${B}" stroke="#22324a" stroke-dasharray="4 8"/><text x="${X(a)}" y="${B + 40}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="22" fill="#8592a3">${a}</text>`).join("")}
<path d="${path(vikram)}" fill="none" stroke="#f08a4b" stroke-width="6" stroke-linecap="round"/>
<path d="${path(asha)}" fill="none" stroke="#3cc7a4" stroke-width="6" stroke-linecap="round"/>
<text x="${R - 10}" y="${Y(asha[asha.length - 1]![1]) - 18}" text-anchor="end" font-family="ui-sans-serif,system-ui,sans-serif" font-size="26" font-weight="700" fill="#3cc7a4">Asha · 8 years · ${crore(asha[asha.length - 1]![1])}</text>
<text x="${R - 10}" y="${Y(vikram[vikram.length - 1]![1]) + 44}" text-anchor="end" font-family="ui-sans-serif,system-ui,sans-serif" font-size="26" font-weight="700" fill="#f08a4b">Vikram · 30 years · ${crore(vikram[vikram.length - 1]![1])}</text>
<text x="${L}" y="${H - 40}" font-family="ui-sans-serif,system-ui,sans-serif" font-size="22" fill="#8592a3">Age →</text>
</svg>`);
}

/* ------------------------------------------------------------------ */
/* Video, image and Spark posts                                         */
/* ------------------------------------------------------------------ */

const MEDIA_SEEDS: PostSeed[] = [
  {
    id: "video-neural-networks",
    author: "meera.codes",
    topic: "coding",
    title: "The clearest introduction to neural networks I've ever found",
    ageH: 20,
    stage: 1,
    verdict: "valuable",
    counts: c(26, 11, 3, 1),
    stageShown: 30,
    media: { kind: "youtube", id: "aircAruvnKk", channel: "3Blue1Brown", title: "But what is a neural network? | Deep learning chapter 1" },
    ai: ai(0.72, 0.93, 0.86, "A well-chosen resource with a genuine take on why and how to watch it."),
    body: `If you've been nodding along to "neural networks" without really knowing what one is, watch this before anything else.

Grant builds the whole idea from a single example — recognising handwritten digits — and by the end the words **weights**, **biases** and **layers** actually mean something.

**Watch for:** the moment each neuron becomes "just a number between 0 and 1." That's the click.

**After watching:** go on to chapter 2 on gradient descent, then come back and re-watch this one. It lands differently the second time.`,
  },
  {
    id: "video-essence-calculus",
    author: "kabir.builds",
    topic: "science",
    title: "Calculus finally made sense to me after this video",
    ageH: 60,
    stage: 2,
    verdict: "valuable",
    counts: c(58, 21, 6, 2),
    media: { kind: "youtube", id: "WUvTyaaNkzM", channel: "3Blue1Brown", title: "The essence of calculus" },
    ai: ai(0.7, 0.9, 0.84, "Curated with a clear reason to watch and who it's for."),
    body: `Most of us learn calculus as a list of rules to memorise. This video starts from a single question — *what is the area of a circle?* — and lets derivatives and integrals appear on their own.

If JEE calculus feels like symbol-pushing, this is the fix. Watch it once for the story, then again with a notebook and pause every time a new idea appears.`,
  },
  {
    id: "video-git-100",
    author: "dev.systems",
    topic: "coding",
    title: "Git in 100 seconds — send this to every junior on your team",
    ageH: 8,
    stage: 0,
    verdict: "testing",
    counts: c(5, 1, 1, 0),
    stageRatings: 7,
    stageShown: 9,
    media: { kind: "youtube", id: "hwP7WQkmECE", channel: "Fireship", title: "Git Explained in 100 Seconds" },
    ai: ai(0.68, 0.88, 0.74, "Short, accurate primer; the take explains when to use it."),
    body: `The fastest accurate overview of Git I know. It won't make you an expert, but it gives you the mental model — commits, branches, merges — so the longer tutorials stop feeling like a wall of commands.

Pair it with my rebase-vs-merge post if you want the next step.`,
  },
  {
    id: "video-counting-pi",
    author: "zoya.lab",
    topic: "science",
    title: "Two blocks, one wall, and the digits of π",
    ageH: 34,
    stage: 1,
    verdict: "valuable",
    counts: c(19, 9, 2, 1),
    stageShown: 23,
    media: { kind: "youtube", id: "HEfHFsfGXjs", channel: "3Blue1Brown", title: "The most unexpected answer to a counting puzzle" },
    ai: ai(0.81, 0.92, 0.79, "A surprising, rigorous puzzle presented with a clear hook that the video delivers on."),
    body: `Slide one block into another next to a wall and count the collisions. Make one block 100 times heavier and you get 31 collisions. A million times heavier: 3,141.

This is one of those rare videos where the clickbait-sounding hook is completely true — and the explanation is better than the surprise.`,
  },
  {
    id: "video-oop-interviews",
    author: "tara.careers",
    topic: "careers",
    title: "OOP questions keep coming up in interviews — this video covers the basics simply",
    ageH: 15,
    stage: 0,
    verdict: "testing",
    counts: c(4, 1, 2, 0),
    stageRatings: 7,
    stageShown: 9,
    media: { kind: "youtube", id: "pTB0EiLXUC8", channel: "Programming with Mosh", title: "Object-Oriented Programming, Simplified" },
    ai: ai(0.7, 0.84, 0.7, "Relevant resource with practical framing for interview prep."),
    body: `Encapsulation, abstraction, inheritance, polymorphism — interviewers love asking you to explain these "in your own words." This video gives you clean, simple definitions with examples.

**Interview tip:** after each concept, be ready to give one example from a project you actually built.`,
  },
  {
    id: "image-spacing-scale",
    author: "ananya.design",
    topic: "design",
    title: "The spacing scale I use on every single project",
    ageH: 18,
    stage: 1,
    verdict: "valuable",
    counts: c(20, 7, 3, 1),
    stageShown: 24,
    media: { kind: "image", src: spacingScaleImage(), alt: "Six squares showing the spacing values 8, 16, 24, 32, 48 and 64" },
    ai: ai(0.79, 0.9, 0.72, "A clear visual reference that matches its title exactly."),
    body: `Six values. That's the whole system. Save this, pin it next to your monitor, and stop typing random margins like 13px and 27px.

Small gaps inside a group, larger gaps between groups — your layouts will instantly feel calmer.`,
  },
  {
    id: "image-compound-chart",
    author: "rohan.money",
    topic: "finance",
    title: "Asha vs Vikram, in one chart",
    ageH: 26,
    stage: 1,
    verdict: "valuable",
    counts: c(23, 10, 2, 1),
    stageShown: 27,
    media: { kind: "image", src: compoundChartImage(), alt: "Line chart: investing from 22 to 30 ends higher at 60 than investing from 30 to 60" },
    ai: ai(0.76, 0.93, 0.78, "Accurate, self-explanatory chart that makes a single point well."),
    body: `A few of you asked for the chart behind my compound interest post. Here it is.

Same ₹5,000 a month, same 12%. Asha invests for 8 years and stops. Vikram invests for 30. Asha still ends up ahead — because her money had more time.`,
  },
  {
    id: "spark-torque",
    author: "kabir.builds",
    topic: "science",
    title: "Torque in 30 seconds",
    ageH: 6,
    stage: 1,
    verdict: "valuable",
    counts: c(24, 8, 2, 1),
    stageShown: 28,
    media: {
      kind: "spark",
      theme: "ochre",
      scenes: [
        { kicker: "Physics in 30s", text: "Why is a door handle so far from the hinge?" },
        { kicker: "Leverage", text: "Same push. More distance. More turn.", visual: "lever" },
        { kicker: "The formula", text: "τ = r × F × sin θ", sub: "distance × force × angle" },
        { kicker: "Exam trick", text: "Take the pivot where the unknown force acts — it disappears from the equation.", visual: "steps" },
        { kicker: "Remember", text: "Torque is force with leverage.", sub: "Push at the handle." },
      ],
    },
    ai: ai(0.88, 0.92, 0.8, "Tight, accurate and delivers the promised concept in the time it claims."),
    body: "A 30-second visual explanation of torque, leverage and the one exam trick worth remembering.",
  },
  {
    id: "spark-budget",
    author: "rohan.money",
    topic: "finance",
    title: "Split your first salary in 4 slides",
    ageH: 10,
    stage: 1,
    verdict: "valuable",
    counts: c(21, 6, 3, 1),
    stageShown: 25,
    media: {
      kind: "spark",
      theme: "value",
      scenes: [
        { kicker: "First salary?", text: "Split it before you spend it." },
        { kicker: "₹60,000 take-home", text: "55 · 20 · 25", sub: "needs · wants · invest", visual: "bars" },
        { kicker: "Rule one", text: "Three months of needs in an emergency fund. First." },
        { kicker: "Rule two", text: "Automate the 25% on salary day.", visual: "steps" },
      ],
    },
    ai: ai(0.8, 0.9, 0.76, "Concrete numbers and two actionable rules; no hype."),
    body: "A realistic budget split for a first salary in an expensive Indian city, in four slides.",
  },
  {
    id: "spark-big-o",
    author: "dev.systems",
    topic: "coding",
    title: "Big-O in 20 seconds",
    ageH: 4,
    stage: 0,
    verdict: "testing",
    counts: c(6, 2, 1, 0),
    stageRatings: 9,
    stageShown: 11,
    media: {
      kind: "spark",
      theme: "ink",
      scenes: [
        { kicker: "Big-O in 20s", text: "If the input doubles, what happens to the work?" },
        { kicker: "The shapes", text: "1 · log n · n · n log n · n²", visual: "curves" },
        { kicker: "Spot it", text: "A loop inside a loop over the same list? That's n²." },
      ],
    },
    ai: ai(0.74, 0.9, 0.72, "Delivers a compact, correct mental model."),
    body: "The five growth shapes you'll meet in almost every interview, in twenty seconds.",
  },
  {
    id: "spark-contrast",
    author: "arjun.ux",
    topic: "design",
    title: "Contrast ratios you should know by heart",
    ageH: 12,
    stage: 0,
    verdict: "testing",
    counts: c(5, 2, 1, 0),
    stageRatings: 8,
    stageShown: 10,
    media: {
      kind: "spark",
      theme: "slate",
      scenes: [
        { kicker: "Design rule", text: "Contrast is a number, not a vibe." },
        { kicker: "Remember", text: "4.5 : 1 for body text", sub: "3 : 1 for large text and icons", visual: "swatches" },
        { kicker: "The fix", text: "Darken grey text. Use size and weight for hierarchy instead." },
      ],
    },
    ai: ai(0.78, 0.9, 0.7, "Accurate thresholds with an actionable fix."),
    body: "Three accessibility numbers every designer and developer should know.",
  },
  {
    id: "spark-sleep",
    author: "zoya.lab",
    topic: "science",
    title: "Your brain saves your notes while you sleep",
    ageH: 7,
    stage: 1,
    verdict: "valuable",
    counts: c(22, 9, 2, 1),
    stageShown: 26,
    media: {
      kind: "spark",
      theme: "ink",
      scenes: [
        { kicker: "Exam week", text: "Your brain saves what you studied — while you sleep.", visual: "waves" },
        { kicker: "Deep sleep", text: "Replays facts and concepts. Early in the night." },
        { kicker: "REM sleep", text: "Connects new ideas to old ones. Late in the night.", visual: "waves" },
        { kicker: "So", text: "An all-nighter skips the save button." },
      ],
    },
    ai: ai(0.82, 0.9, 0.74, "Accurate science summary with a clear practical takeaway."),
    body: "Why sleeping after studying matters more than two extra hours of revision.",
  },
  {
    id: "spark-resume",
    author: "ishaan.notes",
    topic: "careers",
    title: "The resume bullet formula",
    ageH: 9,
    stage: 0,
    verdict: "testing",
    counts: c(4, 1, 1, 0),
    stageRatings: 6,
    stageShown: 8,
    media: {
      kind: "spark",
      theme: "ember",
      scenes: [
        { kicker: "Resume tip", text: "Recruiters skim. Every bullet has to survive it." },
        { kicker: "The formula", text: "Verb + what you did + measurable result", visual: "checklist" },
        { kicker: "Example", text: "“Built a ticketing API that handled 4,000 sign-ups in 48 hours.”" },
      ],
    },
    ai: ai(0.72, 0.9, 0.7, "Clear, practical formula with a concrete example."),
    body: "A three-part formula for resume bullets that recruiters actually read.",
  },
];


function posterImage() {
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
<rect width="1200" height="760" fill="#ece7dc"/>
<g transform="translate(70,70)">
<rect width="500" height="620" rx="18" fill="#ffffff"/>
<text x="250" y="60" text-anchor="middle" font-family="cursive" font-size="44" fill="#d63384">TECHFEST!!!</text>
<text x="40" y="150" font-family="Impact,sans-serif" font-size="58" fill="#ff6600">CODE WARS</text>
<text x="300" y="230" font-family="serif" font-size="30" font-style="italic" fill="#3366ff">2026 edition</text>
<text x="40" y="330" font-family="Comic Sans MS,cursive" font-size="28" fill="#009933">Prizes worth 50K</text>
<text x="160" y="400" font-family="monospace" font-size="24" fill="#990099">Register NOW</text>
<text x="60" y="480" font-family="Arial Black,sans-serif" font-size="26" fill="#cc0000">Hall B · 10 AM</text>
<text x="250" y="590" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#888888">BEFORE</text>
</g>
<g transform="translate(630,70)">
<rect width="500" height="620" rx="18" fill="#0f1b2a"/>
<text x="48" y="96" font-family="ui-monospace,monospace" font-size="20" letter-spacing="4" fill="#3cc7a4">TECHFEST 2026</text>
<text x="48" y="230" font-family="ui-sans-serif,system-ui,sans-serif" font-size="92" font-weight="800" letter-spacing="-4" fill="#f4f1ea">Code</text>
<text x="48" y="322" font-family="ui-sans-serif,system-ui,sans-serif" font-size="92" font-weight="800" letter-spacing="-4" fill="#f4f1ea">Wars.</text>
<line x1="48" y1="380" x2="452" y2="380" stroke="#22324a" stroke-width="2"/>
<text x="48" y="430" font-family="ui-sans-serif,system-ui,sans-serif" font-size="24" fill="#b3bccb">Prizes worth ₹50,000</text>
<text x="48" y="470" font-family="ui-sans-serif,system-ui,sans-serif" font-size="24" fill="#b3bccb">Hall B · 10 AM · Saturday</text>
<rect x="48" y="512" width="200" height="52" rx="12" fill="#3cc7a4"/>
<text x="148" y="546" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="20" font-weight="700" fill="#0f1b2a">Register</text>
<text x="250" y="600" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#8592a3">AFTER</text>
</g>
</svg>`);
}

/* ------------------------------------------------------------------ */
/* Notes and polls — short posts from students                          */
/* ------------------------------------------------------------------ */

const note = (
  id: string,
  author: string,
  topic: TopicId,
  body: string,
  ageH: number,
  stage: Stage,
  counts: Counts,
  extra: Partial<PostSeed> = {},
): PostSeed => ({
  id,
  author,
  topic,
  title: body.split("\n")[0]!.slice(0, 90),
  body,
  ageH,
  stage,
  verdict: stage >= 1 ? "valuable" : "testing",
  counts,
  type: "note",
  stageShown: stage === 0 ? 10 : 30,
  stageRatings: stage === 0 ? Math.min(9, counts.worth + counts.changed + counts.meh + counts.wasted) : undefined,
  ai: ai(0.8, 0.88, 0.62, "Short, specific and honest — exactly what a note should be."),
  ...extra,
});

const NOTE_SEEDS: PostSeed[] = [
  note("note-dsa-day-112", "priya.s", "coding", "Day 112 of one DSA problem a day.\n\nToday's lesson: if the brute force has overlapping subproblems, stop and write the plain recursion first. Memoise after. It took me 100 days to actually believe this.", 3, 1, c(19, 6, 3, 1)),
  note("poll-jee-next", "aditya.k", "science", "Which chapter should I make a Spark on next for JEE Physics?", 5, 0, c(5, 1, 1, 0), {
    media: { kind: "poll", options: [{ label: "Rotational motion", votes: 41 }, { label: "Electrostatics", votes: 63 }, { label: "Thermodynamics", votes: 27 }, { label: "Optics", votes: 18 }] },
  }),
  note("note-explain-out-loud", "sneha.reads", "science", "Explaining a concept out loud — even to an empty room — is the fastest way I know to find the gaps in what I understand.\n\nTried it before my biology test. Found three gaps in ten minutes.", 9, 1, c(17, 7, 2, 1)),
  note("note-first-pr", "rahul.dev", "coding", "Got my first PR merged at my internship 🎉\n\nIt was a 6-line fix that took me 3 days to understand. Nobody tells you that reading code is most of the job.", 2, 0, c(6, 1, 1, 0)),
  note("note-poster-redesign", "nisha.design", "design", "Redesigned our college fest poster with two rules: one typeface family and an 8-point grid. Before → after.", 6, 1, c(22, 9, 2, 0), {
    type: "image",
    media: { kind: "image", src: posterImage(), alt: "A cluttered poster with six fonts beside a clean dark redesign using one typeface" },
  }),
  note("poll-placement-hours", "tara.careers", "careers", "Honest answer only: how many hours a day are you spending on placement prep right now?", 7, 0, c(4, 1, 2, 0), {
    media: { kind: "poll", options: [{ label: "Less than 1 hour", votes: 22 }, { label: "1–2 hours", votes: 48 }, { label: "2–4 hours", votes: 31 }, { label: "More than 4", votes: 9 }] },
  }),
  note("note-boring-applications", "ishaan.notes", "careers", "Unpopular opinion: the best internship applications I've reviewed were boring.\n\nClear, specific, short. Nobody was ever impressed by a “passionate, results-driven go-getter”.", 11, 1, c(18, 5, 4, 1)),
  note("note-office-hours", "kabir.builds", "science", "Doubt-clearing session tonight at 9 PM in the JEE Physics circle 🧲\n\nBring your torque questions — I'll solve five past-paper problems step by step, live.", 4, 0, c(6, 2, 0, 0)),
  note("note-phone-outside", "zoya.lab", "science", "Small win: my 2 AM scrolling went from five nights a week to one.\n\nWhat helped: charging my phone outside the bedroom. That's it. That's the post.", 13, 1, c(24, 8, 3, 1)),
  note("poll-dp-part-two", "meera.codes", "coding", "Part 2 of my dynamic programming series — which problem should I walk through step by step?", 8, 0, c(5, 2, 0, 0), {
    media: { kind: "poll", options: [{ label: "Coin change", votes: 52 }, { label: "Longest common subsequence", votes: 34 }, { label: "0/1 knapsack", votes: 47 }] },
  }),
  note("note-debugger", "dev.systems", "coding", "PSA: console.log debugging is fine.\n\nBut spend 20 minutes this week learning your browser's breakpoints and the step-over button. It will save you hours every month.", 15, 1, c(16, 6, 3, 1)),
  note("note-first-stipend", "rohan.money", "finance", "If you just got your first stipend: a ₹1,000 SIP started this month beats a perfect plan started next year.\n\nAutomate it today, then forget about it.", 10, 1, c(15, 5, 3, 1)),
];

type ReplySeed = [author: string, body: string, offsetH: number, helpful: number];

const REPLIES: Record<string, ReplySeed[]> = {
  "dp-recursion-memory": [
    ["priya.s", "The “describe the state in one sentence” line is going on a sticky note. Coin change finally clicked once I wrote the plain recursion first.", 5, 24],
    ["rahul.dev", "Would love a follow-up on going from the memo to the bottom-up table — that flip is where I always get lost.", 9, 11],
    ["meera.codes", "Noted! Part two will do exactly that with coin change, step by step.", 10, 15],
  ],
  "torque-from-scratch": [
    ["aditya.k", "Taking the pivot at the unknown force saved me five minutes on a mock test today. Thank you!", 3, 18],
    ["sneha.reads", "The figure skater example is perfect. Moment of inertia never felt intuitive before this.", 6, 7],
  ],
  "placements-90-days": [
    ["priya.s", "The pattern journaling in weeks 5–8 is underrated. I started doing it and can actually recall approaches now.", 12, 31],
    ["rahul.dev", "Two mocks a week, out loud — the part everyone skips. Including me. Starting Monday.", 20, 14],
  ],
  "compound-22-vs-30": [
    ["nisha.design", "Showed this to my parents and they finally stopped saying “invest after you settle down.”", 30, 42],
    ["aditya.k", "Ran the numbers in a spreadsheet — it checks out. Wild.", 50, 19],
  ],
  "sleep-after-studying": [["aditya.k", "So the all-nighter before my physics test was basically studying into the void 😅", 1, 6]],
  "video-neural-networks": [
    ["rahul.dev", "Watched it twice like you said. The second time the weights-and-biases picture just clicked.", 7, 12],
    ["priya.s", "Chapter 2 next. Thanks for telling us how to watch it, not just what to watch.", 9, 8],
  ],
  "video-counting-pi": [["sneha.reads", "I refused to believe it until the end. Best 'wait, what?' moment I've had all week.", 6, 10]],
  "image-compound-chart": [["priya.s", "Saving this. A chart says it better than a thousand finance reels.", 4, 13]],
  "sky-blue-sunset-red": [["aditya.k", "Finally an answer to the 'why not violet' question. My teacher never explained that.", 30, 16]],
  "react-rerenders": [["rahul.dev", "Moving state down fixed a laggy search box in our internal dashboard. Ten-line change.", 10, 9]],
  "own-hackathon-notes": [
    ["priya.s", "“Assign a demo owner” — we lost our last hackathon because nobody owned the demo. Great list.", 20, 9],
    ["kabir.builds", "Sleeping in shifts is such good advice. All our 4 AM code was reverted the next morning.", 30, 6],
  ],
  "own-sql-joins": [["rahul.dev", "The WHERE vs ON bug got me in an interview last month. Wish I'd seen this earlier.", 6, 5]],
  "note-dsa-day-112": [
    ["meera.codes", "This is exactly the habit. 112 days is seriously impressive — keep going.", 1, 14],
    ["rahul.dev", "Stealing this rule for my practice sessions.", 2, 6],
  ],
  "note-first-pr": [["dev.systems", "Congrats! The 3-day, 6-line fix is a rite of passage. It gets faster.", 1, 9]],
  "note-poster-redesign": [
    ["ananya.design", "The 'after' is so much calmer. The single accent colour on the button does a lot of work.", 2, 17],
    ["arjun.ux", "Contrast checks out too. Lovely.", 3, 6],
  ],
  "note-phone-outside": [["sneha.reads", "Doing this starting tonight. Thank you for the least complicated advice I've ever received.", 4, 21]],
  "note-boring-applications": [["tara.careers", "Can confirm from the other side of the table. Specific beats impressive every time.", 3, 12]],
  "note-explain-out-loud": [["aditya.k", "The rubber duck method, but for physics. Trying it tonight.", 2, 7]],
  "poll-jee-next": [["kabir.builds", "Electrostatics please — field lines are where most people get lost.", 2, 11]],
};

export function seedPosts(now = Date.now()): Post[] {
  return [...SEEDS, ...MEDIA_SEEDS, ...NOTE_SEEDS].map((s) => build(s, now));
}

/** Starter posts that belong to the signed-in user, so Studio is never empty. */
export function seedOwnPosts(handle: string, now = Date.now()): Post[] {
  const own: PostSeed[] = [
    {
      id: "own-hackathon-notes",
      author: handle,
      topic: "careers",
      title: "Notes from my first hackathon: what I'd do differently",
      ageH: 70,
      stage: 1,
      verdict: "valuable",
      counts: c(18, 5, 3, 1),
      stageShown: 22,
      stageRatings: 7,
      ai: ai(0.88, 0.86, 0.72, "Specific lessons drawn from real experience, each with a clear action."),
      body: `We had 36 hours, four people and a very ambitious idea. Here's what I'd change.

## Scope on the first night, not the last

We spent hours on login screens nobody looked at. The judges saw a demo of one flow. **Build that one flow first.**

## Assign a demo owner

One person's only job in the last six hours: make the demo work every single time, with backup screenshots.

## Sleep in shifts

Our best code was written by whoever had slept. Our worst bug was written at 4 AM.

## Talk to mentors early

The mentor who fixed our deployment problem in ten minutes had been sitting free since hour two.`,
    },
    {
      id: "own-sql-joins",
      author: handle,
      topic: "coding",
      title: "A one-page cheat sheet for SQL joins",
      ageH: 14,
      stage: 0,
      verdict: "testing",
      counts: c(5, 1, 1, 0),
      stageRatings: 7,
      stageShown: 9,
      ai: ai(0.74, 0.9, 0.7, "Compact reference that also explains the most common bug."),
      body: `| Join | Returns |
|---|---|
| INNER | rows that match in both tables |
| LEFT | every row from the left table, plus matches from the right (or NULL) |
| RIGHT | the mirror image of LEFT |
| FULL OUTER | everything from both tables, matched where possible |

## The mental model

Draw both tables as circles. INNER is the overlap. LEFT is the whole left circle.

## The bug everyone hits once

Filtering the right-hand table in \`WHERE\` quietly turns a LEFT JOIN back into an INNER JOIN. Put that condition in the \`ON\` clause instead:

\`\`\`
LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'paid'
\`\`\``,
    },
    {
      id: "own-bootcamps",
      author: handle,
      topic: "careers",
      title: "Are coding bootcamps worth it?",
      ageH: 130,
      stage: 0,
      verdict: "stopped",
      counts: c(6, 0, 7, 4),
      stageRatings: 17,
      stageShown: 20,
      ai: ai(0.69, 0.55, 0.31, "Honest, but thin — one concrete example or data point would help a lot."),
      body: `I asked five friends who did bootcamps. Two got jobs quickly, two are still looking, and one went back to college.

Honestly, it depends on you. Some people love them, some don't. Do your research before paying.`,
    },
  ];
  return own.map((s) => build(s, now));
}

export function seedLedger(handle: string, now = Date.now()): LedgerEntry[] {
  const e = (daysAgo: number, currency: "merit" | "cred", amount: number, reason: string, extra: Partial<LedgerEntry> = {}) => ({
    id: `seed-${daysAgo}-${reason}-${currency}`,
    at: now - daysAgo * 24 * H,
    currency,
    amount,
    reason,
    ...extra,
  });
  void handle;
  return [
    e(9, "merit", 5, "Welcome to Compound"),
    e(8, "merit", 1, "Caught up for the day"),
    e(7, "merit", 1, "Caught up for the day"),
    e(6, "merit", 1, "Caught up for the day"),
    e(5, "merit", 1, "Your ratings matched the community (10 calibrated)"),
    e(4, "merit", 1, "Caught up for the day"),
    e(2, "merit", 10, "Post reached Stage 1", { postId: "own-hackathon-notes" }),
    e(2, "cred", 2, "Post reached Stage 1", { postId: "own-hackathon-notes", topic: "careers" }),
    e(1, "merit", 1, "Caught up for the day"),
  ] as LedgerEntry[];
}

export function seedHistory(now = Date.now()): DayStat[] {
  const days: DayStat[] = [];
  for (let i = 27; i >= 1; i--) {
    const d = new Date(now - i * 24 * H);
    const r = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const rand = Math.abs(r);
    const minutes = Math.round(14 + rand * 26 + (i % 7 === 0 ? -8 : 0));
    days.push({
      date: d.toISOString().slice(0, 10),
      minutes,
      worthRate: Math.round((0.72 + rand * 0.24) * 100) / 100,
      caughtUp: rand > 0.22,
      byTopic: {
        coding: Math.round(minutes * 0.38),
        careers: Math.round(minutes * 0.27),
        science: Math.round(minutes * 0.2),
        finance: Math.round(minutes * 0.15),
      },
    });
  }
  return days;
}

export const CIRCLES = [
  { id: "jee-physics", name: "JEE Physics", short: "JP", topic: "science" as TopicId, members: 2841, active: 37, cls: "bg-ochre-soft text-ochre" },
  { id: "dsa-daily", name: "DSA Daily", short: "DS", topic: "coding" as TopicId, members: 5120, active: 64, cls: "bg-value-soft text-value" },
  { id: "placement-prep", name: "Placement Prep '27", short: "PP", topic: "careers" as TopicId, members: 3964, active: 51, cls: "bg-slate-soft text-slate" },
  { id: "design-crit", name: "Design Crit", short: "DC", topic: "design" as TopicId, members: 1207, active: 12, cls: "bg-ember-soft text-ember" },
  { id: "first-salary", name: "First Salary Club", short: "FS", topic: "finance" as TopicId, members: 1876, active: 19, cls: "bg-paper-2 text-ink" },
];
