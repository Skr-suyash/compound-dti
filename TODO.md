# Compound Prototype TODO

Build a convincing prototype of a content social platform that helps people find something worthwhile and leave when they choose. The next milestone is a complete reader and creator demo using seeded content and browser storage.

**Scope:** frontend prototype only. Keep Next.js, Zustand, localStorage, the existing scoring engine, and simulated readers. Real accounts, a database, paid services, and live AI are unnecessary for this milestone. This scope takes precedence over the broader infrastructure work in [the earlier implementation plan](../artifacts/Compound_Prototype_Implementation_Plan.md).

## Current project assessment

The app already has considerable breadth. Extend the existing flows before adding more content formats or dashboards.

| Area | Already implemented | Main gap for the prototype |
| --- | --- | --- |
| Entry | Landing page, simulated email and Google entry, topic onboarding | Make demo entry and fictional data clear |
| Daily experience | Finite daily feed, discovery slots, Following tab, caught-up screen | Session intention, time budget, and a clear way to stop early |
| Content | Articles, links, notes, images, YouTube embeds, polls, Sparks | Finish the core journey rather than adding formats |
| Feedback | Four reflective ratings, skip, saves, replies, helpful replies, reports | Saved posts have no library; scoring eligibility differs from the UI promise |
| Discovery | Search, topic filters, Canon shelves, suggested people | Feed generation can fall back to unselected topics |
| Creator experience | Composer, preview, quotas, Studio, reach ladder, simulated reader reactions | Draft recovery and predictable demo scenarios |
| Wellbeing | Reading minutes, worth-it rate, completion history | Completion rewards and streaks undermine the intended freedom to leave |
| Community | Follow controls, Circle membership toggles, activity list | Circles have no dedicated community experience |
| Moderation | Local review controls and algorithm settings | Screening is simulated; reporting and appeals need an honest demo outcome |

Source entry points: [store](src/lib/store.ts), [feed builder](src/lib/feed.ts), [scoring](src/lib/scoring.ts), [types](src/lib/types.ts), [daily feed](src/app/%28app%29/feed/page.tsx), [reader](src/app/%28app%29/p/%5Bid%5D/page.tsx), [Studio](src/app/%28app%29/studio/%5Bid%5D/page.tsx), and [wellbeing](src/app/%28app%29/wellbeing/page.tsx).

## P0 Build next

Complete these five items for the next prototype milestone. Each can work entirely with local state.

### 1 Intentional sessions and an early exit

- [ ] Let the reader choose an intention such as learn, relax, or find an answer, and an optional 5, 10, or 15 minute budget before starting.
- [ ] Use the selected topics and estimated content lengths to suggest a manageable session. Allow fewer posts when suitable content is scarce; never pad the feed with unrelated topics.
- [ ] Show a calm time reminder and an always available **Done for now** action. Preserve unfinished posts without marking them read or negatively rated.
- [ ] Track active session time across Today, Following, Explore, posts, and Sparks. Pause while the page is hidden or the session is explicitly paused; do not use duration as a ranking signal.
- [ ] Persist the session across navigation and reloads. Keep the daily feed stable; changing an intention must not generate unlimited fresh recommendations.

**Demo acceptance:** choose 5 minutes, read one item, stop early, reload, and resume the remaining items. Stopping early produces a neutral summary with no lost points or broken streak. A demo timer control can trigger the reminder without waiting.

**Start in:** `src/lib/types.ts`, `src/lib/store.ts`, `src/lib/feed.ts`, `src/components/app-shell.tsx`, feed and settings pages.

### 2 Saved content library

- [ ] Add a clearly discoverable **Saved** destination using the existing `saved` IDs and `toggleSave` action.
- [ ] List saved posts with topic, format, estimated reading time, and an unsave action. Include topic filtering and a useful empty state.
- [ ] Let readers reopen saved content directly, without regenerating the daily feed or changing its reach through a personal rating.
- [ ] Keep saved content after a reload and handle deleted or unavailable posts gracefully.

**Demo acceptance:** save an article from Today, find and read it in Saved, reload, then unsave it. No backend or collection hierarchy is needed.

**Start in:** `src/lib/store.ts`, `src/components/app-shell.tsx`, existing post cards; add a `/saved` page.

### 3 Make reflective feedback match the product promise

- [ ] Distinguish personal feedback from ratings eligible to affect reach. Only the reader's assigned daily items, including its bounded Sparks selection, can supply reach evidence after an explicit read or watch action. Feedback on other posts stays personal.
- [ ] Enforce eligibility in the store, including keyboard and quick-rating paths. Update the reader's explanatory copy and confirmation message to reflect whether the rating counts.
- [ ] Record an assigned item's exposure once when opened, separately from its rating. Today, `applyRating` also increments impressions and `stageShown`, which conflates being shown with being rated.
- [ ] Keep rating changes idempotent: one reader cannot create extra votes, exposures, promotion rewards, or quota penalties by changing a rating or reopening a post.
- [ ] Offer an optional reason for negative feedback, such as misleading promise, repetition, or simply not relevant. Personal taste alone must not become a moderation violation.
- [ ] Keep insufficient evidence distinct from confirmed junk. Preserve the existing rule that low traction alone brings no penalty.

**Demo acceptance:** rate an unassigned post from Explore and show that its reach evidence stays unchanged. Open and rate an assigned post, change the rating, and show exactly one exposure and one current vote. A below-quorum post receives no penalty.

**Start in:** `src/lib/store.ts` (`ratePost`, `applyRating`, `openPost`), `src/lib/scoring.ts`, `src/components/social.tsx`, reader and Spark components.

### 4 Make leaving feel like success

- [ ] Remove the wellbeing streak and the Merit reward for consuming the entire feed. Retain creator rewards for valuable content if useful to the demo.
- [ ] Give **Done for now** and the caught-up state a clear stopping action, a brief summary, and optional private reflection. Keep further browsing secondary.
- [ ] Move **Jump to tomorrow**, reset, simulation, and moderation controls into a labelled demo area. They should not appear as ordinary ways to keep consuming.
- [ ] Keep Sparks bounded and require a deliberate action to start another Spark. Offer manual scene advancement, persistent pause, and pause when the page is hidden. The current player already stops between Sparks; preserve that behavior.
- [ ] Let users hide public rating totals and social proof while reading. Use private feedback rather than popularity pressure as the main interaction.

**Demo acceptance:** leave after one post or finish the selection; both paths feel complete. No streak, completion points, automatic next Spark, or prominent new-feed action pulls the reader back in.

**Start in:** `src/app/(app)/feed/page.tsx`, wellbeing and rewards pages, `src/components/spark-player.tsx`, `src/components/social.tsx`, `src/lib/store.ts`.

### 5 Repeatable and honest demo scenarios

- [ ] Add a labelled demo panel with reset and reproducible scenarios: valuable content earns reach, low traction stays unpenalized, confirmed bait receives a penalty, and a reader stops early.
- [ ] Use one shared demo date for feed generation, posting quotas, history, and simulated time changes. Currently `startNewDay` advances the feed date while other code still uses the real clock.
- [ ] Reuse Studio's simulated readers with fixed scenario inputs so the same actions reliably demonstrate the same outcome.
- [ ] Show screening results from explicit canned scenarios. Label them as simulated; do not claim duplicate detection, topic checks, live readers, or AI review happened when they did not.
- [ ] Mark seeded statistics, testimonials, and social proof as illustrative demo data. Provide one-click demo entry without implying that an email was sent or a real Google account was authenticated.
- [ ] Handle localStorage failures and large image uploads with a visible message rather than losing work. Include an offline fallback for remote media used in the presentation.

**Demo acceptance:** reset and complete the reader and creator walkthrough twice with consistent results and no external account, API key, email, or live AI dependency.

**Start in:** `src/lib/seed.ts`, `src/lib/store.ts`, `src/lib/utils.ts`, login, composer, settings, and Studio pages.

## P1 Add after the core demo works

These are optional extensions. Choose the one that best supports the presentation rather than building all of them.

### 6 Private takeaways and delayed reflection

- [ ] Let a reader save a short private takeaway with a post and optionally mark **Tried this** later.
- [ ] Surface one dismissible **Still glad you read this?** card from previously saved or positively rated content. Use the demo clock to demonstrate a later visit.
- [ ] Show takeaways and reflections in Saved or wellbeing. Skip points, mandatory journaling, and push reminders.

**Done when:** one post can be read, annotated, revisited, and reflectively endorsed across a simulated week. This demonstrates lasting value beyond an immediate reaction.

### 7 One functioning Circle

- [ ] Turn one existing Circle into a page with a purpose, community rules, a small seeded post list, a discussion prompt, and join or leave behavior.
- [ ] Connect its posts and replies to existing components. Keep a finite list with a visible end.
- [ ] Describe membership and activity counts as demo data; skip live chat, presence, and member administration.

**Done when:** joining a Circle leads to a usable content and conversation experience, rather than just toggling membership.

### 8 Creator drafts and improvement feedback

- [ ] Autosave a text or link draft locally and restore it after navigation or reload.
- [ ] Add a simple **What will the reader get from this?** prompt and a plain preview of the title, promised value, source, and content.
- [ ] Use a canned bait example to demonstrate a concrete improvement suggestion and revised preview. Keep any AI explanation labelled as simulated.

**Done when:** a creator can recover unfinished writing and improve a misleading title before publishing. No live AI integration or new editor framework is required.

### 9 Personal content controls and a visible report outcome

- [ ] Add **Less like this** and mute-author actions, with undo and a settings list. Keep these separate from reporting harmful content.
- [ ] Make reports collect a reason and appear in the existing local moderation queue. Demonstrate one review decision and a creator explanation.
- [ ] Filter held or removed posts consistently from Today, Following, Explore, and saved-content views, while explaining unavailable items.
- [ ] Honor topic selections consistently: the current `buildFeed` falls back to every topic when the selected-topic pool is smaller than the feed size.

**Done when:** muting changes the reader's experience without penalizing the author, and a report has a traceable simulated outcome.

### 10 Calm activity preferences

- [ ] Add local preferences for reply activity, creator decisions, and reward activity, including an option to hide unread badges.
- [ ] Preview an optional digest inside the app using existing activity data. Keep push, email delivery, and background scheduling out of the prototype.

**Done when:** preferences visibly change the activity list and badges, without generating new alerts to reengage the user.

## Defer beyond this prototype

- Real authentication, multiuser sync, databases, API services, workers, and hosting infrastructure changes.
- Live AI moderation, embeddings, originality detection, transcription, and automated fact checking.
- Payments, subscriptions, creator cash payouts, paid reach, staking, and confidence bets.
- Native mobile apps, live chat, DMs, realtime presence, and large community administration.
- More post formats, recommendation models, complex learning tracks, leaderboards, streaks, and referral rewards.

The existing startup and technical plans remain reference material; they are not the build checklist for this frontend milestone.

## Prototype completion checklist

- [ ] Reader journey: enter demo, choose topics and session intention, read, rate, save, stop early, and revisit Saved.
- [ ] Creator journey: compose, see simulated screening, open Studio, run a repeatable audience scenario, and inspect the reach explanation.
- [ ] Fairness journey: an unassigned personal rating cannot change reach, repeated actions do not duplicate evidence or rewards, and insufficient ratings cause no penalty.
- [ ] Healthy-use journey: stop at any point, retain unfinished content, pause Sparks, and use Explore without bypassing session reminders.
- [ ] Sparse and empty states: too few posts in selected topics, empty Saved, no followed authors, unavailable content, and no search results remain usable.
- [ ] Check the main journeys at mobile and desktop widths, with light and dark themes, keyboard navigation, visible focus, and reduced motion.
- [ ] Confirm prototype claims match simulated behavior and distinguish seeded history from the current user's activity.
- [ ] Rerun lint and TypeScript checks after implementation. Add focused checks for rating eligibility, duplicate effects, session persistence, and demo-clock behavior as those features are built.

Baseline on 22 November 2026: `npm run lint` and `tsc --noEmit --incremental false` pass. This assessment used source inspection and those checks; the browser journeys above still need visual verification.

## Design references

The priorities above are product recommendations for this prototype, not evidence that its design prevents addiction. The [Center for Humane Technology's discussion of attention incentives](https://www.humanetech.com/the-cht-perspective) informs the review of stopping cues and rewards. [W3C guidance on pausing moving and updating content](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) supports giving readers control over timed content; it does not establish that the app is accessible or non-addictive.
