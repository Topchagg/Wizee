# Wizee

> Learn concepts. Not endless lectures.

Wizee is a concept-based learning platform designed to make education structured, engaging and scalable.

Instead of forcing users through hours of lectures, Wizee breaks every subject into small independent concepts that can be learned in just a few minutes.

Content is short-form (30 seconds – 5 minutes per video), but sequential and gated, not a swipeable feed — each video is followed by practice before the next one unlocks, and progress is tracked against a structured curriculum underneath it.

---

# Vision

Knowledge should not depend on a single course, a single teacher or a single explanation.

Instead, knowledge should exist as a living library of concepts that anyone can explain, improve and organize.

The goal of Wizee is to build the world's largest structured knowledge graph for self-learning.

---

# The Problem

Today's learning platforms have fundamental problems.

## Courses

- Every course is created by one author.
- Authors skip topics they consider unimportant.
- Different courses contain different knowledge gaps.
- Users don't know what they don't know.

---

## YouTube

- Great explanations.
- Zero structure.
- Impossible to track progress.
- Impossible to know what to learn next.

---

## Universities

Universities provide structure but have their own limitations.

- Fixed curriculum
- Limited time
- Often outdated
- Multiple unnecessary subjects

---

# Wizee Solution

Instead of building courses,

Wizee builds **Concepts**.

Everything else is generated around them.

---

# Core Learning Unit

## Concept

A Concept represents exactly one idea.

Examples:

- Variables
- Newton's Second Law
- Cognitive Bias
- Derivative
- React Component

One concept should answer exactly one question.

Every concept contains:

- short explanation
- practice
- retrospective schedule
- alternative explanations

---

## Sub Concepts

Large concepts can be divided into multiple sub concepts.

Example:

React

↓

- JSX
- Components
- Props
- State
- Hooks

Learning a parent concept requires understanding all required sub concepts.

---

# Learning Experience

Every lesson consists of four parts.

## 1. Short Video

Length:

30 seconds — 5 minutes

Each video explains only one concept.

No long lectures.

No unnecessary information.

---

## 2. Practice

Immediately after watching:

- Quiz
- Fill the gap
- Calculations
- Code challenge
- Multiple choice

Each Sub-concept draws from its own **Practice Question Bank** — a pool of exam-style questions attached to that specific Sub-concept, not a single fixed question (see "Sub-concepts" in Features for detail). This is also what makes repeated review (see Retrospective) meaningful: each pass pulls a fresh question instead of repeating the same one.

The goal is understanding, not passive watching.

---

## 3. Another Explanation

Didn't understand?

Press:

**Another Explanation**

The platform instantly opens another video explaining the exact same concept from another creator.

No searching.

No leaving the app.

No buying another course.

Unlocking a new explanation requires submitting the Practice step first (even a failed attempt). This keeps the button from becoming a way to skip effort, and it forces a genuine attempt before offering a different angle on the same concept.

---

## 4. Retrospective

Users can add concepts into their review queue.

Wizee automatically schedules reviews using spaced repetition.

Creators can provide different quizzes for:

- Day 1
- Day 3
- Day 7
- Day 30

Each scheduled review pulls a **new question from that Sub-concept's Practice Question Bank** (see "Sub-concepts" below), not a repeat of the exact question already seen. This tests whether the underlying concept was retained, rather than whether a specific question was memorized.

This helps convert short-term memory into long-term knowledge.

---

# Knowledge Graph

The platform stores knowledge as Concepts.

Not videos.

Not courses.

Videos become explanations attached to concepts.

This enables:

- progress tracking
- missing knowledge detection
- alternative explanations
- recommendation engine
- reusable learning paths

---

# Learning Paths

Users don't have to learn entire subjects.

They can create or follow Learning Paths.

Examples:

Frontend Developer

↓

- HTML
- CSS
- JavaScript
- React
- Routing
- State Management

---

Psychology Basics

↓

- Memory
- Attention
- Learning
- Motivation
- Cognitive Biases

---

Mathematics for Machine Learning

↓

- Linear Algebra
- Calculus
- Probability
- Statistics

---

Learning Paths are collections of concepts.

Not separate copies of courses.

Multiple paths can reuse the same concepts.

---

# Tree Structure & Subject Growth

The knowledge graph is **auto-growing, but within borders.**

The shape of the tree (Subject → Theme → Concept → Sub-concept) is pre-built and centrally curated. Filling that shape with actual video content stays fully open and community-driven.

This solves the biggest risk to a shared knowledge graph: **inconsistent granularity.** If thousands of independent creators each decided where a Concept ends and a Sub-concept begins, the graph would fragment into incompatible pieces and paths would stop composing cleanly. By fixing the tree shape centrally, creators are never asked to make that judgment call — they just fill an existing slot with a good video.

## How it works

- The team pre-builds the full tree for one Subject at a time (Themes → Concepts → Sub-concepts), before any outside creator uploads to it.
- Rollout is sequential, not parallel: **Math first**, then Biology, History, etc. Each subject is a real curriculum-design effort in its own right, not something built incrementally alongside the app.
- Creators upload videos into existing Sub-concept slots. They do not invent new Sub-concepts, Concepts, Themes, or Subjects directly.
- If a creator or student believes a slot is missing, or a Sub-concept should be split (e.g. it's really covering two separate claims), they submit a **request**. Requests go to a review queue; the team (or, later, a subject's revenue-share holder — see below) either adds/splits the slot or explains why not.

## Subject Creator Program (future phase)

Once the founder-curated model has proven itself on a handful of subjects, users will be able to **propose a new Subject** rather than wait for the team to build one.

- A proposed subject goes through review, ideally with a partial tree already populated (e.g. a table of contents plus a first batch of filled Sub-concepts) as proof the structure holds together before full approval.
- If approved, the proposer earns **1–3% of all monetization generated within that subject**, ongoing.
- The proposer does **not own the subject.** Ownership and final authority over the tree always stay with the platform. What the proposer gets is:
  - a standing revenue share tied to the subject, and
  - priority in the review queue for their suggestions (their proposed changes get looked at first — not auto-applied).
- Revenue share follows the subject itself, not a frozen snapshot of it — if the team later restructures the tree (splits/merges concepts), the original proposer's share continues on the subject as a whole.
- This is a Phase 2 mechanism, intentionally deferred until the founder-curated tree model has track record and real revenue to share.

---

# Monetization

Every layer of the platform earns from a *different* source, so nothing stacks or cannibalizes another layer's cut of the same transaction. Content access sells the subscription, retention features keep it renewed, the Sub-concept pool pays for what's actually watched, Subject/Path royalties reward structure and curation from platform margin, and teacher booking is its own marketplace entirely.

## 1. Content access — the 60% rule (universal)

Free users get the first 60% of any entity, in prerequisite order — the rule applies uniformly whether someone is browsing a Concept directly or following a Path. One rule, no special cases per content type. The remaining 40% requires a subscription.

- Only applies to nodes with enough children for a partial slice to be meaningful (e.g. 7+ sub-concepts). Smaller nodes are either fully free or fully gated.
- The free portion is always the *first* 60% in prerequisite/logical order — foundational material stays free, the advanced/final stretch is paywalled, so the cutoff naturally lands near where a learner is most invested.
- Fixed and consistent per entity (not randomized or usage-based), so the free portion is predictable.

## 2. Subscription — the recurring engine

The 60% rule gets people to subscribe once. Subscription needs to also give a reason to *stay* subscribed, so it bundles things whose value is ongoing rather than "finished" the moment one path is done:

- Remaining 40% of every Concept/Path
- Full retrospective / spaced repetition scheduling
- Unlimited access to each Sub-concept's Practice Question Bank (free tier gets one practice question per Sub-concept; see "Sub-concepts" → Practice Question Bank)
- Cross-path progress tracking & gap detection (e.g. "you know 78% of Frontend Development")
- Unlimited "Another Explanation" (first alternate stays free; further alternates are subscription-gated)
- Certificates of completion (bundled, or offered as a standalone a-la-carte purchase)

## 3. Verified-expert paths — sell the map, not a lock-in

A named, credentialed creator (e.g. an actual university admissions tutor) can build and price a Path independently, bypassing the 60% rule, purchasable even by non-subscribers. What's being sold is **curation and sequencing** — "I know exactly what N University's Faculty of Y actually tests, and in what order" — not exclusive access to explanations.

- The expert can assemble the Path entirely from existing tree content, and/or record their own signature videos for specific Sub-concepts.
- **"Another Explanation" stays fully available inside a paid Path**, including on the expert's own videos. If their explanation doesn't click, the student can pull any other creator's explanation from the public pool, exactly like a free user would. The Path's value is the map, not a guaranteed-to-work explanation — nobody can promise that, so the product doesn't pretend to.
- A purchased Path is fully unlocked on its own; the 60% subscription gate doesn't reapply inside something already bought separately.
- Underlying Sub-concept creators (whoever's videos actually get watched, expert or otherwise) still earn through the normal watch-time-weighted pool (#4), funded from platform margin on the Path sale — the expert is paid for curation, not for owning the underlying content's earnings.
- This design keeps regular Sub-concept creators' value intact even inside paid Paths: an expert Path drives traffic into the same shared pool everyone contributes to, rather than displacing it.

## 4. Institutional licensing — schools, universities, companies

A separate buyer entirely from individual subscribers, sold through **Wizee for Schools & Universities** (see below) — a private, institution-scoped application built on the same content engine.

- **Schools** license per-seat access, primarily for the pacing and safe-failure benefits described in the Kids & Emotional Design section below.
- **Universities** license per-cohort access with a curriculum mapped onto the existing tree, giving faculty early, granular visibility into class-wide strengths and gaps — catching problems in week 2 instead of at the midterm.
- **Companies** license paths for employee upskilling, generally at higher per-seat pricing than consumer subscription.
- **University-sponsored official Paths** are a related but distinct product: a university pays for prominent, verified placement of an "Official Entrance Prep" Path, functioning as applicant-funnel marketing rather than a purchase by students. Sponsored/official Paths must be clearly labeled as such, so trust in the free "Another Explanation" pool being neutral is never in question.
- Institutional usage still feeds the shared, anonymized pass-rate/quality data at the content level (helping the creator pool and content-quality signals) even while individual student data stays private to their own institution.

## 5. Sub-concept creator pool — watch-time-weighted

Once subscription revenue exists, a pool of it is distributed across Sub-concept videos proportional to watch-time / completion — optionally weighted by pass-rate, to reward *effective* teaching over merely popular content. This is the base creator-payout layer; every other creator incentive is funded from platform margin on top of it, never carved out of it.

## 6. Subject Creator royalty — infrastructure tier

1–3% of revenue attributed to a Subject (same watch-time-weighted mechanism as #5, aggregated one level up), paid from platform margin. Ownership and final authority over the tree always stay with the platform — the Subject creator gets a durable royalty plus priority in the suggestion/review queue, not equity or control over the tree. Revenue share follows the subject itself, not a frozen snapshot, so it survives later restructuring.

## 7. Path fulfillment — bounty, not royalty

Community members who fulfill a requested Path (e.g. "N University — Faculty of X") earn a flat/tiered bounty, weighted by request demand (vote count), paid from platform margin. Curation is rewarded per-contribution here, not as an ongoing percentage — that structural royalty is reserved for Subjects, which underlie everything built on top of them.

## 8. Teacher booking — phased rollout

- **Phase 1 (now):** Fully free discovery and booking, no commission. At this stage the platform's only value-add is the creator's profile and pass-rate stats — a plain directory, not a differentiated matching tool.
- **Phase 2 (once Trace-path / struggle-data is live and populated):** Commission-based booking. By this point the platform delivers genuinely qualified leads — students pre-diagnosed with specific gaps — which justifies taking a cut.

## 9. Small in-app currency — tipping & à la carte, not a primary engine

A lightweight currency ("Wizee Coins") isn't a new revenue source on its own — it's a UX wrapper around real money, useful for small, low-friction purchases where a full checkout flow would be overkill:

- **Tipping individual Sub-concept creators** directly, on top of the normal pool split — a trust/goodwill mechanic, not a replacement for it.
- **À la carte unlocking** of a single Concept's remaining 40% without a full subscription.
- Not used for subscription or expert-Path purchases — those stay big, deliberate, real-money transactions where a currency layer would only add friction.

## 10. Standalone certification

A verified, shareable certificate tied to a specific Path, backed by real pass-rate-based rigor (not just "watched the videos"). Available bundled with subscription or sellable a la carte to non-subscribers who just want proof of a specific skill — this pairs especially well with university-sponsored official Paths, where a credible certificate has real signaling value to an actual admissions committee.

## 11. Bootstrap-phase creator incentive — temporary, not structural

Before real subscriber volume exists, a percentage-based pool pays out fractions of a cent and motivates no one. Founding creators are instead paid a fixed stipend per approved, quality-reviewed video, plus "founding creator" status and priority once the real revenue-share pool (see #5) launches. This is a bridge, not a permanent mechanism — founding creators transition onto the watch-time-weighted pool once subscriber volume makes it meaningful; creators who join afterward enter directly into the pool model.

---

# Wizee for Schools & Universities

A separate, institution-scoped application — not a mode inside the main consumer app — built on the same content engine (tree, videos, "Another Explanation," pass-rate data) but wrapped in a different, private information architecture.

## Why it has to be a separate app

The core Wizee app's value depends on being judgment-free — failure is private, there's no public leaderboard of who struggled, no audience for a wrong answer. Bolting grade/cohort management onto that same app risks leaking exactly the kind of visibility the product is designed to remove — even a theoretical chance of being seen changes how a kid behaves. A separate app makes the privacy boundary structural, not just a setting someone could get wrong.

## What it includes

- **Private cohorts.** A student's progress and struggle data are visible only to their own teacher/institution — never to other students, never in any public leaderboard or pool.
- **Curriculum mapping.** The institution's real syllabus is mapped onto the existing Subject/Theme/Concept/Sub-concept tree, so "Wizee-School Algebra II" reflects their actual course, not a generic path.
- **Teacher dashboard.** Per-student and per-class struggle heatmaps (the same Trace-path data, aggregated privately to a classroom) — a teacher sees where a class is stuck without any student being singled out publicly.
- **No peer-visible scores or leaderboards.** Kids see only their own progress.
- **Homework verification, not behavioral surveillance.** The platform already logs watch-time, attempts, and pass/fail — enough for a teacher to confirm homework was actually done. Reporting stays at the level of *completion and mastery* (did they watch it, did they pass, how many attempts) — not inferred attentiveness (pausing, distraction signals), which is both unreliable and a step into surveillance the platform shouldn't take.
- **Content and payouts stay shared.** "Another Explanation" still pulls from the same public creator pool, and institutional watch-time still feeds the same anonymized, content-level pass-rate data (helping the creator pool and quality signals) — only the *student's identity and personal data* stay private to their institution.

## Parent visibility — quarterly summary, not a live dashboard

Parents will consistently ask for a live dashboard. It should not be built — a real-time, granular view recreates the exact social-pressure problem the product exists to remove, and puts sensitive data directly into unpredictable hands, including from parents who may react punitively.

Instead:

- **Once every ~90 days**, parents receive a **summary**: concepts mastered, engagement trend, homework completion. Framed around growth and persistence, not a raw score.
- **No live access, no per-attempt logs, no granular struggle data** — even at the quarterly reveal. The moment-to-moment learning process (repeated attempts, "Another Explanation" usage) stays permanently private; only outcomes are shared.
- **The student sees their own summary first (or simultaneously)**, so the reveal doesn't feel like being watched without control.
- **The teacher remains the default buffer** for anything beyond the digest — a parent wanting more detail goes through the teacher (e.g. a parent-teacher conference), not a raw feed. This mirrors the same role a teacher already plays as the buffer between a student's private struggle and any external visibility of it.

---

# Kids & Emotional Design

Wizee's primary audience is roughly 14–18 years old — the age range where identity formation and peer comparison peak, and where how failure is framed matters more than almost any other design decision in the product.

## The self-handicapping pattern

After failing a test once or twice, a common response isn't disengagement from lack of interest — it's a defense mechanism. Continuing to try and failing again threatens a kid's sense of ability ("I'm not good at this"); disengaging lets them pre-explain future failure as "I just didn't try," which is psychologically cheaper to live with. The dropout often isn't boredom — it's avoidance of what another honest attempt might mean about them.

This means the platform's job isn't just to make failure low-social-cost (which "Another Explanation" and private progress already do) — it also needs to shape the *internal story* a kid tells themselves about a failed attempt, since that damage can happen even with nobody watching at all.

## Design principle: failure is attributed to the explanation, never to the learner

This should hold everywhere in the product — UI copy, teacher-facing data, parent summaries:

- After a failed attempt, framing should point at the content, not the learner — e.g. *"That explanation didn't click — let's try a different one,"* never *"Incorrect"* alone or anything scored/compared.
- No streaks-broken shame mechanics, no "you're behind" framing, no pace comparisons to peers.
- Re-engagement after failure (did they retry, or quietly stop) is a more useful signal for a teacher to see than raw pass/fail — it shows *when* to step in emotionally, not just academically.

## Platform voice

The product's language should give permission to not understand immediately, without asking anyone to embrace failure as an identity or strategy — "fail fast, fail often" works in cultures that already treat failure as low-stakes experimentation, but lands very differently across many families and cultures where failure carries real shame. The actual promise worth making is narrower and more universal: **nobody's stuck, and nobody's watching.**

Candidate directions:

- *"Wrong answers are just directions."*
- *"Nobody understands everything the first time."*
- *"You didn't fail — that explanation did."*
- *"Struggle in private. Succeed in public."*

## Why this compounds with the rest of the product

This isn't a separate feature — it's the verbal and behavioral layer sitting on top of decisions already made elsewhere in this document: no public pass-rate visible to peers, no live parent dashboard, gated "Another Explanation" instead of a visible wrong answer. The tone of the product needs to stay consistent with what it already structurally protects, especially for a 14–18 year old audience that is unusually sensitive to what failure implies about who they are.

---

# Community Generated Content

Creators upload:

- video (into an existing Sub-concept slot)
- optional quiz verification

The platform automatically generates:

- practice questions
- quizzes
- fill-the-gap exercises

Creators only review generated content.

This dramatically lowers content creation effort. Note: auto-generation is most reliable for quiz/fill-the-gap style practice; code challenges and calculation tasks are higher-risk to generate automatically and should be creator-supplied at MVP.

---

# Progress Tracking

Unlike traditional courses,

progress is measured by concepts.

User profile shows:

✔ Learned Concepts

🟡 Needs Review

🔴 Missing Concepts

Instead of:

"Completed Course"

users see:

"You know 78% of Frontend Development"

---

# Why Concepts?

Traditional learning:

Course

↓

Video

↓

Video

↓

Video

↓

Finished

Knowledge gaps remain hidden.

---

Wizee:

Knowledge Domain

↓

Concept Graph

↓

Learning Paths

↓

Videos

↓

Practice

↓

Review

↓

Mastery

Knowledge becomes reusable.

---

# Platform Architecture

Domain

↓

Concepts

↓

Sub Concepts

↓

Videos

↓

Practice

↓

Retrospective

↓

Learning Paths

---

# Creator Experience

Instead of creating:

40-hour course

Creators create:

one great explanation.

Advantages:

- lower barrier
- reusable content
- multiple audiences
- no need to build entire curriculum

---

# User Experience

Traditional platforms ask:

"What course do you want?"

Wizee asks:

"What do you want to become?"

Then builds the learning path automatically.

---

# Future Features

- AI-generated quizzes
- AI-generated summaries
- AI tutor
- Gap detection
- Skill maps
- Personalized learning paths
- Knowledge graph visualization
- Concept recommendations
- Community ratings
- Creator monetization
- Subject Creator Program (propose new subjects, earn revenue share)
- Wizee for Schools & Universities (private cohorts, institutional licensing)

---

# Long-Term Vision

Wizee is not another course platform.

It is an educational infrastructure.

Courses become temporary.

Concepts become permanent.

Knowledge becomes reusable.

Learning becomes structured.

Everyone contributes.

Everyone benefits.

---

# Mission

Build the world's most complete structured library of human knowledge.

One concept at a time.

---

# Features (Detailed Spec)

## 1. Education tree based on different entities

1.1 - Subject (Math / Physics / Biology etc.)
1.2 - Theme (Trigonometry / Logical Math / Linear Algebra)
1.3 - Concept (Matrix, Functions etc.)
1.4 - Sub-concept, needed if a Concept can't be explained in one sitting. It is the smallest possible entity — everything else builds on top of it like a pyramid.

Subject (Many) ← Theme (Many) ← Concept (Many) ← Sub-Concepts (Many)

The tree itself (Subject → Theme → Concept → Sub-concept) is pre-built centrally, one Subject at a time, and only extended via request. See "Tree Structure & Subject Growth" above.

## 2. Learning Paths

2.1 Users can build their own public education path (e.g. "Get ready for ZNO").
2.2 Users can choose whole Subjects, Themes, or Concepts to build a path. They cannot choose individual Sub-concepts or Subjects directly when building a path — only Themes and Concepts — because doing so wouldn't constitute proper education. Paths built only from Concepts should be rated higher by the system at MVP, since choosing precise Concepts signals the user likely knows exactly what's needed. Post-MVP, this will be replaced by a smarter algorithm that checks real connections between Concepts and Themes.
2.3 Anyone can follow a published path. Regardless of how the path was built, what the learner actually sees are Sub-concept videos — that's the only entity that exists physically; everything above it is an organizational/architectural layer.

## 3. Sub-concepts

A Sub-concept is a small video that explains a Concept when the Concept itself is too wide to cover in one video (e.g. "Matrix" is a Concept; "Matrix multiplication" is a Sub-concept).

3.1 A creator uploads one video into an existing Sub-concept slot, and it goes live on students' screens.
3.2 If a student doesn't like the video, they can press **Another Explanation**, which surfaces a different video for the exact same Sub-concept. (Gated behind submitting the Practice step first — see "Another Explanation" above.)
3.3 Every video has a test/task after it.
3.4 Every video has a short (~15 second) preview explaining its real-world use case, to avoid the frustration of learning something without knowing why. Example: *"You know how LLMs work? They're based on matrices — today we're going to discuss..."*

### 3.5 Practice Question Bank

Each Sub-concept holds its own pool of practice questions, not a single fixed quiz item — modeled directly on how real exam-prep books work (short theory, then many example problems), but attached to the exact Sub-concept they test, which a physical book can't do.

- **Why this matters:** research talking to real NMT-prep students surfaced a recurring pattern — the books they already use give a short, formula-only theory block, then jump straight into practice problems with no explanation of *why* the formula works. Students hit a wall exactly there: they either memorize the formula without understanding it, or go looking for an explanation elsewhere. Wizee's video already supplies that missing "why" — the Question Bank supplies the same real-exam-style practice students already trust, now correctly addressed to the concept that's actually being tested.
- **A new question each time**, not a repeated one — this is what powers the Retrospective mechanic (Day 1/3/7/30 reviews pull a fresh question from the same bank) and avoids testing "do I remember this exact question" instead of "do I understand this concept."
- **Question format should mirror the real exam** (e.g. NMT-style phrasing and difficulty), not a generic comprehension check — this is a direct, deliberate response to what students already expect from exam prep, and it's a sharper point of differentiation from a generic "quiz app" than an abstract multiple-choice question would be.
- **Source of questions:** either creator-submitted (a video creator can attach several practice questions, not just one, when filling a Sub-concept slot) or generated in an exam-appropriate style/difficulty as a small, bounded task — consistent with using AI only for small, well-scoped jobs rather than core content creation. Reusing real past exam questions verbatim needs a legal check before relying on it as a source.
- **Same pass-rate tracking applies to individual questions**, not just to videos — a question that's frequently missed, or worded confusingly, is a signal to review or replace it, independent of whether the video explanation itself is good.
- **Monetization tie-in:** one free practice question per Sub-concept, unlimited bank access as part of Subscription (see Monetization → Subscription) — a clean, concrete premium hook that maps directly onto something students already pay for today (a sborník/exam-prep book), rather than an abstract "unlock more content" pitch.

## 4. Trace-path

4.1 Students can see what's hard vs. easy for them directly in the UI tree — hard Themes are highlighted red, passed ones blue.
4.2 *(Future)* Different types of "fail" should be distinguished, not just pass/fail.
4.3 Trace data should include:
   - 4.3.1 Number of attempts
   - 4.3.2 Which videos were watched for a given Sub-concept
   - 4.3.3 *(open — struggle signals such as time-on-task and "Another Explanation" requests are worth including here; see discussion notes)*

## 5. Teacher connection

5.1 If a user likes a particular video-creator's explanation style (typically a teacher), they should be able to contact that creator and book an appointment for real lessons.
5.2 The teacher should be able to see exactly where that student struggled, so they can start teaching immediately instead of guessing where to begin.

---

# Product Summary

- A huge library of small "books," each explaining one specific topic.
- Users don't learn everything — they choose their own path, or follow a path others have already used.

**Value proposition:** learn exactly what's needed right now, without wondering why — because the real-world use case is shown before the concept is taught.

Because of this, users following a common goal (e.g. university entrance exams) tend to converge on largely the same set of Math/Biology/etc. Concepts, regardless of which path they started from.

---

# MVP Implementation — Core Loop

Everything in this document — monetization, Subject Creator Program, Path requests, teacher booking — is irrelevant until the core learning loop is proven: **watch a short video → practice → get stuck → get another explanation → retain it over time.** The MVP should build and test that loop alone, with real students, before investing further in the systems around it.

## Step 1 — Hand-build one small tree, not the whole subject

Don't start with "all of Math." Pick a single Theme (e.g. Linear Algebra) and manually build its Concepts and Sub-concepts — Subject → Theme → Concept → Sub-concept, four fixed levels. This should be small enough for one person to reason about end-to-end (roughly 15–30 Sub-concepts), not an attempt at a complete curriculum.

## Step 2 — Fill it yourself or with 2–3 founding creators

Don't open uploads broadly yet. Either record the first batch of Sub-concept videos yourself, or recruit a tiny founding cohort (2–3 people) to fill the tree. The goal is a coherent, complete slice of content to test against — not volume.

## Step 3 — Build the smallest app that supports the actual loop

The MVP app needs exactly four things, nothing more:

1. **Video playback** for a Sub-concept, with the ~15s real-world-use preview.
2. **Practice** immediately after (a single quiz question is enough at this stage).
3. **Another Explanation**, gated behind submitting Practice — even a failed attempt unlocks it.
4. **Basic sequencing** through the tree (next Sub-concept, simple progress indicator).

No subscription, no paywall, no Path requests, no teacher booking, no Subject Creator Program at this stage — all of that is explicitly out of scope until the loop itself is validated.

## Step 4 — Instrument everything from day one

Even though nothing is monetized yet, log the data the rest of the system will eventually depend on:

- Watch time / completion per video
- Practice pass/fail per attempt
- Whether "Another Explanation" was requested, and the outcome afterward (did they pass on retry?)
- Per-video pass-rate (the "Video A: 90%, Video B: 60%" metric)

This is cheap to build now and expensive to reconstruct later — and it's what tells you whether the loop is actually working, not just whether people click through it.

## Step 5 — Test with a small group of real learners

Recruit a handful of real students (not just friends validating the idea) to go through the tree end-to-end. Watch for the signals that actually matter at this stage:

- Do they finish Sub-concepts, or drop off mid-video?
- Does "Another Explanation" actually resolve confusion (pass-rate improves on retry), or do people bounce between videos without engaging?
- Do they come back on their own, or does the loop only work with prompting?

## Step 6 — Add retrospective / spaced repetition only after the base loop holds up

This is the first "recurring value" feature, and it's worth adding early — even before monetization — because it's the mechanism most likely to show whether people retain what they learn, which is the actual thesis of the product. Simple Day 1 / Day 3 / Day 7 review prompts are enough to start.

## Step 7 — Only then layer in the rest

Once the core loop is validated with real usage data (not assumption), extend outward in this order:

1. Trace-path / struggle visualization (UI tree, red/blue) — now there's real data to show.
2. Open uploads to a wider founding-creator cohort, still within the hand-built tree.
3. Path building (manual, by you/the team) once there's enough tree filled to assemble one.
4. Subscription + the 60% content rule.
5. Path requests, Subject Creator Program, teacher-booking commission — all deferred until there's real volume and revenue to justify the added complexity.

**The discipline to hold onto:** every feature in the rest of this document was designed to solve a problem that only exists at scale. Building them before the core loop is proven means solving problems you don't have yet, on top of a loop you haven't yet confirmed actually helps anyone learn.

---

# Do Not Forget

- Every Sub-concept video should track a pass-rate: e.g. Sub-concept A / Video A passed by 90% of viewers, Sub-concept A / Video B passed by only 60%. This is the core data signal for surfacing weak explanations and improving the graph over time.
- The same pass-rate tracking applies at the individual practice-question level within each Sub-concept's Practice Question Bank, not just at the video level — a confusing or too-easy/too-hard question is a separate signal from a weak video explanation.
