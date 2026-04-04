# Proxy Hearts: Autonomous Agentic Dating Platform

> **"Your agent dates for you."**
> Each person is represented by an AI agent. The agent reads their LinkedIn and public Instagram, builds an evidence-grounded psychological profile, goes on real simulated dates with other agents, and ranks who fits that person best.

Built with **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS**, **Supabase Postgres & Storage**, **Google Gemini 2.5 Flash**, **Groq Llama 3**, and **Apify**.

---

## 1. System Architecture & The Two-Sources Rule

### Strict Evidentiary Grounding
- **Exactly Two Sources**: LinkedIn profile and public Instagram profile. No web search, no external lookups.
- **Auditable Evidence IDs**: Every insight synthesized by the agent carries an explicit citation (`LI-about`, `LI-exp-1`, `LI-edu-1`, `IG-bio`, `IG-post-3`).
- **Interactive Verification**: Users can click any evidence chip on the profile page (`/p/[slug]`) to view the exact underlying raw snippet from the original post or career entry.
- **Negative Constraints**: The agent never judges attractiveness, physical appearance, religion, ethnicity, health, or income.

```
LinkedIn URL ────> [Apify LinkedIn Actor] ────┐
                                             ├──> raw_scrapes (cached in Supabase)
Instagram URL ───> [Apify Instagram Actor] ───┘
                                             │
                                             ▼
                               normalize.ts ───> PersonDossier (with Evidence IDs)
                                             │
                                             ▼
                       [Gemini 2.5 Flash] ───> Profile Analysis + Agent Card
                                             │
                                             ▼
                            [Stage 0] Swiping ───> Baseline fit scores (0-100)
                                             │
                                             ▼
                          [Stage 1] Scheduler ───> Greedy mutual pairing (>=3 dates)
                                             │
                                             ▼
                       [Stage 2] Date Engine ───> 16-18 turn simulated date
                                                  (Opener -> Plan -> Twist -> Debrief)
                                             │
                                             ▼
                            Ranking Algorithm ───> Dual-perspective blended score
```

---

## 2. The Multi-Phase Dating Engine (Creative Core)

Dates are not single-shot numerical approximations; they are simulated conversations driven turn-by-turn:

1. **Phase 1: First Messages (4 turns)**: Agents exchange greetings using profile-specific conversation hooks.
2. **Phase 2: Planning & Outing Proposal (4 turns)**: Agents propose and agree upon a customized outing, generating an agreed **Date Card** ticket.
3. **Phase 3: Narrator Scene Setting (1 turn)**: A neutral narrator describes the setting and introduces an unexpected situational twist (e.g. sudden rain, crowded cafe, impromptu jazz busker).
4. **Phase 4: The Date (6 turns)**: Deep conversation testing values, humor, ambitions, and reaction to the twist.
5. **Phase 5: Goodbye (2 turns)**: Parting words signaling honest intention.
6. **Phase 6: Private Debriefs (2 turns)**: Independent, honest numerical scoring across shared interests, values, conversation flow, and lifestyle.
7. **Phase 7: Outcome Evaluation**: System marks date as **"It's a Match!"**, **"One-Sided"**, or **"Friendly Pass"**.

### Live Features
- **Private Thoughts Toggle**: Reveal each digital twin's internal reasoning behind each statement.
- **Chemistry Meter**: Real-time sliding window vibe meter reacting dynamically to conversational tone.
- **Variable-Speed Replay**: Playback completed dates at **1x**, **2x**, or **4x** speed.

---

## 3. Mathematical Ranking Algorithm

Each person $P$ receives an individualized ranking across all candidates $C$:

### For Dated Pairs:
$$\text{fit} = 0.55 \cdot \text{debrief}_{P \to C}^{\text{overall}} + 0.25 \cdot \text{debrief}_{C \to P}^{\text{overall}} + 0.20 \cdot \text{swipe}_{P \to C} + \Delta_{\text{mutual}}$$
* $+5$ point bonus awarded if both agents indicate `wouldSeeAgain: true`.

### For Undated Pairs (Fallback):
$$\text{fit} = 0.85 \cdot \big(0.70 \cdot \text{swipe}_{P \to C} + 0.30 \cdot \text{swipe}_{C \to P}\big)$$
* Undated candidate pairs carry a $15\%$ discount because conversational chemistry remains unverified by a simulated date.

---

## 4. 100% Free Tech Stack & Resilient LLM Router

| Role | Provider / Technology | Allowance / Configuration |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) + TypeScript | React 19, Tailwind CSS, shadcn/ui |
| **Database & Photos** | Supabase Postgres + Storage bucket `photos` | Accessed via `SUPABASE_SERVICE_ROLE_KEY` |
| **Scraping** | Apify REST API (`apify-client`) | Instagram & LinkedIn profile scrapers |
| **Smart LLM Tier** | Google AI Studio (`gemini-2.5-flash`) | Deep analysis, vision, post-date debriefs |
| **Fast LLM Tier** | Groq Cloud (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`) | Low-latency date turns and narrator scenes |
| **Deployment** | Vercel Hobby | API route `maxDuration = 60`, daily cron keepalive |

The LLM router (`lib/llm.ts`) automatically intercepts HTTP 429 rate limits, applies cooldown backoff windows, and falls back between providers seamlessly.

---

## 5. Local Setup & Execution

### 1. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your 4 free API keys:
```env
APIFY_TOKEN=apify_api_...
GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### 2. Run Database Migration
Execute `supabase/schema.sql` inside the **Supabase SQL Editor** to initialize the tables (`people`, `raw_scrapes`, `profiles`, `swipes`, `dates`, `date_messages`, `rankings`) and the `photos` storage bucket.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Seed the 25-Person Demo Season
```bash
npx tsx scripts/seed.ts scripts/people.csv
```

---

## 6. Route Sitemap
- `/`: Landing page, live counters, and 4-step interactive overview.
- `/demo`: Frozen 25-person season with Date Night Board and top couples.
- `/add`: Live onboarding pipeline with real-time status stepper.
- `/p/[slug]`: Profile analysis, reading log, and evidence popovers.
- `/dates/[id]`: Turn-by-turn Date Room with chemistry meter and replay.
- `/rankings`: Top 3 match cards, candidate table, and 25x25 compatibility heatmap.
- `/how-it-works`: Full architecture specification and prompt documentation.
