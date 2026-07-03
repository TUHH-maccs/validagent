# ValidAgent Repository

A curated collection of AI agents with diverse behavioral traits for research, development, and reproducible experimentation — with a focus on empirically validating agent behavior against real human data.

**Live Demo:** [https://www.validagent.org](https://www.validagent.org)

## Features

- **Agent Sets** — curated collections of behavioral agents, each with its own dedicated page, data pipeline, and card design suited to what that set actually needs.
- **Empirical Validation** — the flagship set (Honesty Pilot) models 931 real study participants and compares agent behavior against their actual recorded decisions, including Cohen's κ agreement statistics.
- **Interactive Visualizations** — Fischbacher distribution plots, honesty-by-human-status boxplots, and per-agent decision scatter charts, all responsive (`ResizeObserver`-based, no fixed pixel widths).
- **Configurable Prompts** — toggle which persona modules (demographics, personality, economic preferences, moral orientation) go into an agent's prompt, and see the generated text update live.
- **Search & Filtering** — full-text search plus tag/attribute filters on both the Agent Sets overview and within the Honesty Pilot agent list.
- **Export** — pick specific agents (or let the current filter selection decide) and export them; format selector is in place for future framework-specific export targets.
- **TUHH Color Scheme** for consistent branding.
- **Fully Static** — deploys to GitHub Pages without a backend; all per-set data is fetched client-side from static CSV/JSON files.

## Agent Sets

| Agent Set | Agents | Status | Description |
|-----------|--------|--------|-------------|
| **Honesty Pilot** | 931 | Validated | Real participants from the Die Roll Honesty Paradigm (Fischbacher & Föllmi-Heusi, 2013), across 25 prompt configurations covering demographics, personality, economic preferences, and moral orientation. |
| **Workplace** | 20 | Placeholder | Generic workplace personality archetypes, demonstrating trait-toggle prompt generation. Demo only — not tied to real people or any copyrighted material. |
| **Examples** | 20 | Placeholder | Small curated prompt/persona examples covering a mix of research topics (honesty, ethics, sustainability, etc.), used to illustrate the general agent-card concept. |

### Honesty Pilot

The most developed set, and the one the empirical-validation story is built around:

- **25 prompt configurations** — single-module conditions (Demographics / Personality Traits / Economic Preferences / Moral Orientation, each in Score / Percentile / Adjective / Descriptive style) plus 11 module-combination conditions.
- **Aggregate charts** — a Fischbacher plot (roll vs. human vs. agent report distribution) and a boxplot of agent honesty rate grouped by whether the human was honest or not, both driven by the currently selected configuration.
- **Cohen's κ** agreement statistic shown in the header for the current configuration, plus the best-aligned configuration overall.
- **Per-agent cards** — demographics, HEXACO personality badges, economic-preference/moral-orientation badges (shown only for active modules), the human's actual roll/report as ground truth, a behavioral-alignment scatter plot (agent decisions vs. human decision), reasoning alignment (only available for the Economic Preferences / Descriptive condition, where LLM-coded reasoning categories exist for both human and agent), and the exact rendered prompt text.
- **Search, tag filters (Human Honest/Dishonest, Agent honesty-rate buckets), "Show More" pagination, and export** with a checkbox-based selection that overrides the active filters when non-empty.

### Workplace / Examples

Simpler demo sets: a card per agent with toggleable trait categories and a live-generated persona prompt preview. No aggregate charts, no per-experiment configuration — these exist to show the underlying "toggle modules → generated prompt" mechanic on its own, independent of the Honesty Pilot's research-specific machinery.

## Tech Stack

- **Framework:** Next.js 16 (App Router), static export (`output: "export"`)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 with a TUHH color scheme (`lib/colors.ts`)
- **Charts:** hand-built SVG components (`components/charts/`) using `ResizeObserver` for responsive sizing — not a charting library, since axis/label alignment control turned out to matter more than a library's defaults could give us
- **CSV parsing:** Papaparse, client-side
- **Deployment:** GitHub Pages (static export), custom domain via `public/CNAME`

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm 10 or higher

### Installation

```bash
git clone https://github.com/TUHH-maccs/validagent.git
cd validagent
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

Static files are generated in the `out/` directory.

### Lint

```bash
npm run lint
```

## Project Structure

```
validagent/
├── app/
│   ├── page.tsx                        # Home
│   ├── sets/
│   │   ├── page.tsx                    # Agent Sets overview (search + tag filter)
│   │   ├── honesty-pilot/page.tsx
│   │   ├── workplace-personas/page.tsx
│   │   └── examples/page.tsx
│   ├── projects/                       # Projects page (+ simulation demo)
│   └── resources/                      # Resources page (+ EMAS 2026 presentation)
├── components/
│   ├── HonestyPilotSetClient.tsx        # Honesty Pilot page: config selector, charts, filters, list
│   ├── HonestyPilotAgentCard.tsx
│   ├── WorkplacePersonasSetClient.tsx / WorkplacePersonaCard.tsx
│   ├── ExamplesSetClient.tsx / ExampleAgentCard.tsx
│   └── charts/
│       ├── FischbacherPlot.tsx
│       ├── ValidationBoxplot.tsx
│       └── DecisionScatter.tsx
├── lib/
│   ├── colors.ts                       # TUHH color palette
│   ├── honestyPilotData.ts             # fetch/parse for public/data/honesty-pilot/
│   ├── workplacePersonasData.ts
│   ├── examplesData.ts
│   ├── promptTemplates.ts              # persona/task prompt template strings
│   ├── traitMapping.ts                 # trait value -> text bucket lookup
│   └── renderPrompt.ts                 # assembles a full agent prompt from active modules
├── types/
│   ├── honestyPilot.ts
│   ├── workplacePersonas.ts
│   └── examples.ts
├── public/
│   ├── CNAME                           # www.validagent.org
│   └── data/
│       ├── honesty-pilot/              # agents.csv, results/, stats_results/, stats_meta.json, mappings/
│       ├── workplace-personas/         # agents.csv, meta.json
│       └── examples/                   # agents.csv, meta.json
├── scripts/
│   └── build_pilot_v1.py               # Honesty Pilot data pipeline (raw study data -> public/data/honesty-pilot/)
└── .github/workflows/deploy.yml        # auto-deploy to GitHub Pages on push to main
```

## Data Architecture

Every agent set follows the same pattern, and none of them bundle their data into the JS build — everything lives under `public/data/<set>/` and is `fetch()`-ed at runtime (with cache-busting query params, since these files get iterated on a lot during development and browsers cache overly aggressively otherwise):

- `agents.csv` — one row per agent.
- `meta.json` — set-level metadata: name, description, domain, validation strength, tags, and (where relevant) prompt templates / trait categories.
- Larger sets split further where needed — Honesty Pilot's per-experiment results (`results/<experiment_id>.csv`, `stats_results/<experiment_id>.csv`) are split into one file per condition rather than one giant file, since the frontend only ever needs one condition's data at a time.

This intentionally replaced an earlier version of the app where each set's agents were embedded as one big static JSON import per set — fine for small demo sets, but Honesty Pilot's real data (116k+ result rows) made that approach bloat the JS bundle.

### Raw data governance

Raw/intermediate research data (survey exports, item-level responses, etc.) is **never committed to this repo** — only the derived, published CSVs under `public/data/` are. Any local raw-data staging should go in a `prepare/` folder, which is gitignored (`.gitignore` still has the `/prepare/` rule for this reason, even though nothing currently lives there).

## Adding a New Agent Set

There's no scaffolding CLI yet — follow the pattern the three existing sets use:

1. **Data:** `public/data/<set-slug>/agents.csv` + `meta.json` (name, description, domain, `validationStrength`, `tags`).
2. **Types:** `types/<setName>.ts` — one interface for an agent row, one for the meta shape.
3. **Fetch layer:** `lib/<setName>Data.ts` — `fetchXAgents()` / `fetchXMeta()`, parsed with Papaparse, using the same cache-busting `withCacheBust()` pattern as the existing `lib/*Data.ts` files.
4. **Card component:** `components/<SetName>Card.tsx` — how a single agent renders. Keep it self-contained (its own local types/props), not dependent on any other set's types.
5. **Page client:** `components/<SetName>SetClient.tsx` — fetches the data, renders the header + agent grid. Only add config selectors / aggregate charts / filters if the set actually needs them (Honesty Pilot does; Workplace and Examples deliberately don't).
6. **Route:** `app/sets/<set-slug>/page.tsx` — thin wrapper that just renders `<SetNameSetClient />`.
7. **Listing entry:** add an `AgentSetSummary` object for it in `app/sets/page.tsx`'s `agentSets` array so it shows up on the overview page.

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages automatically on every push to `main`. The site is served at the custom domain `www.validagent.org` (via `public/CNAME` + Cloudflare DNS, CNAME-flattened at the apex, DNS-only/grey-cloud to avoid Flexible-SSL redirect loops) — `next.config.ts` sets `basePath: ""` accordingly (no repo-name subpath).

## References

- Fischbacher, U., & Föllmi-Heusi, F. (2013). Lies in disguise - An experimental study on cheating. *Journal of the European Economic Association*, 11(3), 525-547.

## Acknowledgments

- TUHH (Technische Universität Hamburg)
- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- CSV parsing with [Papaparse](https://www.papaparse.com/)

## Notes / Open TODOs

- **Revert temporary combination-condition labels after paper screenshots are taken.** The 11 combination-experiment labels (e.g. "Demographics + Personality Traits") are spelled out in full for readability in paper figures; the original abbreviated form (e.g. "D + PT") should be restored afterward. Every spot touched is marked with the comment/grep marker `PAPER_SCREENSHOT_TEMP` (in `public/data/honesty-pilot/stats_meta.json` and `scripts/build_pilot_v1.py`) — grep for that string to find them all.
- **No LICENSE file exists yet** despite this having been referenced in an earlier draft of this README — add one (or confirm there isn't meant to be one yet) before treating this as public/reusable under any specific license.
- **`dem_industry` free-text values are intentionally left as-is** (typos and inconsistent casing included) — genuine open-ended survey responses, not a bug.
- **Known, accepted residual risk:** the git history (reachable via `main`'s own commit ancestry) still contains an early, now-superseded version of the Workplace set that used real "The Office" character names/traits/avatar images. The live site and current `main` no longer contain this — the underlying commit is just still technically reachable by cloning and walking history. A full history rewrite would remove it entirely but requires a force-push to `main` and rewrites all commit hashes from that point forward; the decision (2026-07-05) was to accept this residual risk rather than do that rewrite, since digging through commit history for a small academic-tool repo is realistically unlikely.

### Project history

- **2026-07-01** — Tagged the pre-rebuild state as `v1-legacy`, started the rebuild on a separate branch so `main` stayed untouched during the rework.
- **2026-07-03** — Migrated Workplace and Examples to the same `public/data/` + per-set fetch architecture as Honesty Pilot; genericized the Workplace set (no more recognizable copyrighted characters); removed the now-fully-replaced old shared `AgentSet`/`StructuredAgent` type system, the old placeholder "PreStudy2" Honesty Pilot Set (superseded by the real 931-participant set), and all infra that only existed to serve those.
- **2026-07-04** — Normalized inconsistent capitalization in Honesty Pilot's demographics data; corrected the combination-condition module styles (they weren't uniformly "Descriptive" as originally assumed — PT used Adjective, EP used Descriptive, MO used Percentile in the actual study) and fixed prompt module ordering to always render D → PT → EP → MO regardless of toggle order.
- README rewritten to describe the current system going forward instead of tracking rebuild-in-progress state, in preparation for merging `rebuild` into `main` (removing the `v1-legacy` tag and the now-redundant `rebuild` branch once that's done).
