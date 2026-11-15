# Namma Bengaluru Buddy — MVP Plan

> Hackathon scope · Static web app · HTML + JS · No backend · No API keys · Target build time: 20 min
> ⚠️ All rent and area data are **indicative**. This tool provides **guidance only, not legal advice**.

---

## 1. Problem Statement

People relocating to Bengaluru face a cluster of overlapping problems in their first 30 days:

- **Where to live?** — 100+ micro-areas, each with wildly different rent, commute, and vibe.
- **Is this rent fair?** — No quick benchmark without digging through listings.
- **Is my agreement safe?** — Hidden clauses around notice period, lock-in, and maintenance charges.
- **What do I do first?** — The dependency chain (agreement → address proof → Aadhaar update → bank/gas) is non-obvious.

This MVP gives a newcomer a single-page tool that answers all four questions in under 5 minutes.

---

## 2. Scope (MVP)

### In scope
| # | Feature | Description |
|---|---------|-------------|
| 1 | **Intake form** | Collects move-in date, join date, office location, budget, household size, vehicle, home state, diet, languages |
| 2 | **Week 1–4 personalised plan** | Deterministic task engine: filter → topo-sort → schedule with lag + dependency slip → persist tick state to localStorage |
| 3 | **Area finder** | Ranks Bengaluru neighbourhoods by commute score + rent fit + owner-rule fit |
| 4 | **Fair-rent check** | Multi-tier fallback lookup with 0–100 confidence score and fallback chain trace |
| 5 | **Agreement red-flag checker** | Regex + numeric checks → 0–100 risk score + drafted negotiation message |
| 6 | **Agent trace panel** | Plain-language reasoning steps per section, collapsible |

### Out of scope (post-hackathon)
- Real-time rent data API
- LLM-generated plans or summaries
- User accounts / server-side persistence
- Mobile-native app
- BBMP / government API integration

---

## 3. Data Loading Strategy

**Problem:** `fetch()` and ES modules (`<script type="module">`) both fail on `file://` URLs in most browsers due to CORS restrictions. The app must open directly by double-clicking `index.html`.

**Solution:** data files are plain `.js` files that assign to named globals on `window`:

```js
// data/tasks.js
window.DATA_TASKS = [ /* array of task objects */ ];

// data/areas.js
window.DATA_AREAS = [ /* array of area objects */ ];

// data/rent.js
window.DATA_RENT = { /* lookup object */ };

// data/redflags.js
window.DATA_REDFLAGS = [ /* array of rule objects */ ];
```

Loaded via ordinary `<script>` tags in `index.html` before `app.js`:

```html
<script src="data/tasks.js"></script>
<script src="data/areas.js"></script>
<script src="data/rent.js"></script>
<script src="data/redflags.js"></script>
<script src="modules/plan.js"></script>
<script src="modules/areas.js"></script>
<script src="modules/rent.js"></script>
<script src="modules/redflags.js"></script>
<script src="app.js"></script>
```

All module files also use plain globals / `window.*` — no `import`/`export`.

---

## 4. Features — Detailed Spec

### 4.1 Intake Form

Fields:
- `move_date` — date picker: when the user arrives in Bengaluru
- `join_date` — date picker: when the user starts their new job
- `office_area` — dropdown populated from `window.DATA_AREAS`
- `budget_rent` — number input (₹/month)
- `household` — select: Solo / Couple / Family
- `vehicle` — select: None / Two-wheeler / Car
- `home_state` — text input (used to flag vehicle re-registration and regional language tasks)
- `diet` — select: Veg / Non-veg / Vegan
- `languages` — checkboxes: Kannada / Hindi / English / Tamil / Telugu / Bengali

Output: a plain JS object (`profile`) passed to all other modules.

---

### 4.2 Week 1–4 Plan Engine

#### Task schema (`data/tasks.js` → `window.DATA_TASKS`)

```js
{
  id: "sign_agreement",
  title: "Sign rental agreement near {{office_area}}",   // {{tokens}} filled from profile
  defaultWeek: 1,
  lagDays: 2,          // estimated days this task takes
  category: "Housing",
  depends_on: [],      // array of task ids
  required_if: {},     // e.g. { vehicle: "Car" } or { household: "Family" }
  description: "...",
  tips: ["..."]
}
```

**`{{token}}` substitution:** before rendering, replace `{{office_area}}`, `{{budget_rent}}`, `{{top_area_1}}`, `{{top_area_2}}` in `title` and `description` with values from `profile` and area finder results.

#### Engine algorithm (pure JS, no LLM)

1. **Filter** — remove tasks where any `required_if` key doesn't match `profile`.
2. **Topo-sort** — Kahn's algorithm on `depends_on` edges; stable (preserves library order within same level).
3. **Schedule** — for each task in topo order:
   ```
   week = max(task.defaultWeek, max(dep.scheduledWeek for dep in depends_on) + ceil(dep.lagDays / 7))
   ```
   Cap at week 4. If `week > 4`, flag task as "overflowed — may need Week 5".
4. **Week cap** — each week holds a maximum of **2 "joining week" tasks** (tasks with `category: "Admin"` or `category: "Paperwork"`). If the cap is hit, bump surplus tasks to the next week (re-trigger scheduling for their dependents).
5. **Personalise titles** — substitute `{{tokens}}` from profile + area finder output.
6. **Render** — accordion: one `<details>` per week, tasks as checklist items.

#### Persistence and slip propagation

- Each task checkbox has `id="task-{id}"`.
- On tick: save `{ id, done: true, doneDate: ISO }` to `localStorage["nbb_tasks"]`.
- On load: restore ticks from localStorage before rendering.
- **Slip detection:** if a task is ticked late (current date > end of its scheduled week), re-run scheduling from that task forward — all dependent tasks' `scheduledWeek` recalculates and the UI re-renders with a "⚠️ Slipped — updated schedule" banner.

#### Trace output (plain language)

One line per decision, e.g.:
> Skipped `school_search`: household is not Family  
> Moved `bank_address` to Week 4: waits on `aadhaar_update` (Week 3, 7-day lag)  
> Capped Week 2 Admin tasks at 2 — bumped `gas_connection` to Week 3  
> Filled title: "Sign rental agreement near Manyata Tech Park"

---

### 4.3 Area Finder

#### Area schema (`data/areas.js` → `window.DATA_AREAS`)

```js
{
  name: "Hebbal",
  commute_to: { "Manyata Tech Park": 10, "Whitefield": 55, "Electronic City": 50 },
  avg_rent_1bhk: 18000,
  avg_rent_2bhk: 28000,
  avg_rent_3bhk: 42000,
  owner_rules: {
    // share of listings (0.0–1.0) that allow each profile type
    solo: 0.9,
    couple: 0.8,
    family: 0.7,
    non_veg: 0.75,
    pet: 0.3,
    male_bachelor: 0.6,
    female_bachelor: 0.95
  },
  tags: ["IT hub", "lake view", "less traffic"]
}
```

#### Scoring algorithm

| Component | Weight | Calculation |
|-----------|--------|-------------|
| **Commute** | 40 | `commute_to[office_area]` → normalise: score = `100 × (1 − min(minutes, 90) / 90)` |
| **Rent** | 40 | `avg_rent_{bhkType}` vs `budget_rent`: if ≤ budget → 100; if > budget → `100 × (budget / rent)`, floored at 0 |
| **Fit** | 20 | Share of listings whose owner rules allow this user: average of relevant `owner_rules` keys for the profile (e.g. solo non-veg → average of `solo` and `non_veg`). Multiply by 100. |

**BHK type inference:** solo/couple → 1BHK default; family → 2BHK default; override available in form.

Output: ranked top 5 areas, each showing total score + a 3-segment bar (commute / rent / fit) and applicable tags.

#### Trace output

> Hebbal: commute 10 min → score 89 | rent ₹28k ≤ ₹30k budget → score 100 | fit (solo + non-veg): 82% → score 82 | total 91  
> Koramangala: commute 35 min → score 61 | rent ₹35k > ₹30k → score 86 | fit 70% → score 70 | total 74

---

### 4.4 Fair-Rent Check

#### Rent data schema (`data/rent.js` → `window.DATA_RENT`)

```js
{
  "Hebbal_1BHK": {
    median: 18000, low: 14000, high: 23000,
    n: 35, months_old_p50: 2, iqr: 4000
  },
  "Koramangala_2BHK": {
    median: 32000, low: 25000, high: 42000,
    n: 40, months_old_p50: 3, iqr: 7000
  }
}
```

Fields: `n` = number of data points, `months_old_p50` = median age of data points in months, `iqr` = interquartile range.

#### Fallback chain (in order)

1. **Direct lookup** — key `{area}_{BHK}` exists in `DATA_RENT` with `n ≥ 1`.
2. **BHK ratio** — if direct key missing, derive from another BHK in same area:
   - 1BHK = 0.6 × 2BHK median; 3BHK = 1.5 × 2BHK median
3. **Nearby areas** — weighted average of areas in same zone, weighted by `1 / distance_rank`.
4. **Zone median** — average of all area medians in the same city zone (North / South / East / West / Central).

The trace shows which tier was used and why each tier above it was skipped.

#### Confidence score (0–100)

```
confidence =
  40 × min(1, n / 20)                        // sample size
+ 25 × max(0, 1 − months_old_p50 / 6)        // recency (0 if data > 6 months old)
+ 20 × max(0, 1 − iqr / median)              // spread tightness
+ 15 × proxy_weight                           // 1.0 direct | 0.7 BHK ratio | 0.5 nearby | 0.3 zone
```

Bands: **High** ≥ 70 · **Medium** 40–69 · **Low** < 40.

**Output line:**
> Your quoted rent of ₹38,000 is **above market** for a 2BHK in Koramangala.  
> Median ₹32,000 · Range ₹25,000–₹42,000 · **Confidence: High (82)** · Based on 40 data points.

---

### 4.5 Agreement Red-Flag Checker

#### Rule schema (`data/redflags.js` → `window.DATA_REDFLAGS`)

```js
{
  id: "long_lockin",
  label: "Long lock-in period",
  severity: "high",           // "high" | "medium" | "low"
  type: "regex",              // "regex" | "numeric"
  patterns: ["lock.in period.{0,20}(12|18|24) month", "lock.in.{0,10}year"],
  explanation: "Lock-in beyond 11 months means you can't vacate without penalty. Negotiate to 11 months.",
  riskPoints: 25
}
```

For `type: "numeric"` rules, the engine extracts numbers from the matched clause and applies a comparison:

```js
{
  id: "excess_deposit",
  label: "Deposit exceeds 6 months' rent",
  severity: "high",
  type: "numeric",
  extractPattern: "deposit.{0,30}(\\d[\\d,]+)",
  condition: "extractedAmount > rentAmount * 6",
  explanation: "Standard deposit is 2–3 months' rent. Anything beyond 6 months is atypical.",
  riskPoints: 20
}
```

#### Numeric checks required

| Check | Trigger | Severity |
|-------|---------|---------|
| Deposit > 6× monthly rent | extracted deposit amount vs user-entered rent | 🔴 High |
| Annual increase > 10% | extracted % from increment clause | 🔴 High |
| Annual increase 5–10% | extracted % from increment clause | 🟡 Medium |
| Lock-in binds only tenant | asymmetric termination clause regex | 🔴 High |
| Agreement term ≥ 12 months without registration mention | term length + absence of "registered"/"registration" | 🟡 Medium |

#### Risk score

```
riskScore = min(100, sum of riskPoints for all triggered rules)
```

Bands: **High risk** ≥ 60 · **Medium risk** 30–59 · **Low risk** < 30.

#### Negotiation message

After scan, the engine generates a plain-text negotiation draft:

```
Dear [Landlord],

I have reviewed the draft agreement and would like to request the following changes 
before signing:

1. [Triggered rule label]: [one-sentence ask, e.g. "Please reduce the lock-in period 
   from 12 months to 11 months."]
2. ...

I am very interested in the property and hope we can agree on these points.

Warm regards,
[Your name]
```

One bullet per triggered High/Medium flag. The user can copy and edit it.

#### Trace output

> Fired `long_lockin`: matched "lock-in period of 12 months" (regex: `lock.in period.{0,20}(12|18|24) month`) → +25 risk points  
> Fired `excess_deposit`: extracted ₹1,80,000 deposit vs ₹25,000 rent × 6 = ₹1,50,000 → deposit exceeds limit → +20 risk points  
> Skipped `high_increase`: no increment clause found  
> Risk score: 45 → Medium risk

---

### 4.6 Agent Trace Panel

A collapsible `<details><summary>▸ Agent Trace</summary>…</details>` block at the bottom of each result section.

**Format:** plain-language bullet list. No jargon, no raw JSON. Each line explains one decision:

- Plan: "Skipped `school_search`: household is Solo, not Family"
- Plan: "Moved `bank_address` to Week 4: waits on `aadhaar_update` (Week 3, lag 7 days)"
- Areas: "Dropped Whitefield from top 5: commute 65 min → score 28 (below threshold)"
- Rent: "Direct lookup missing for Hebbal 1BHK — applied BHK ratio: 0.6 × Hebbal 2BHK median ₹28,000 = ₹16,800"
- Redflags: "Fired `tenant_only_lockin`: found 'tenant shall not vacate' but no reciprocal landlord clause"

---

## 5. Data Files

| File | Global | Purpose | Approx. size |
|------|--------|---------|-------------|
| `data/tasks.js` | `window.DATA_TASKS` | ~25–30 task definitions with deps, filters, `{{tokens}}` | ~5 KB |
| `data/areas.js` | `window.DATA_AREAS` | ~15 Bengaluru areas with rent, commute, owner_rules | ~4 KB |
| `data/rent.js` | `window.DATA_RENT` | Rent benchmarks keyed by `{area}_{BHK}` with n/iqr/age | ~3 KB |
| `data/redflags.js` | `window.DATA_REDFLAGS` | ~12–15 rules (regex + numeric) with risk points | ~3 KB |

All data marked **"indicative — based on public listings, not live data"** in-UI.

---

## 6. File Structure

```
namma-buddy/
├── index.html            # Single page — all 5 sections + script tags
├── style.css             # ~120 lines, mobile-first, dark mode via prefers-color-scheme
├── app.js                # Orchestrator: wires form submit → modules → renders results
├── modules/
│   ├── plan.js           # Filter + topo-sort + schedule + slip detection + render
│   ├── areas.js          # Commute/rent/fit scorer + ranked list render
│   ├── rent.js           # Fallback chain + confidence formula + output render
│   └── redflags.js       # Regex + numeric checks + risk score + negotiation draft
├── data/
│   ├── tasks.js          # window.DATA_TASKS
│   ├── areas.js          # window.DATA_AREAS
│   ├── rent.js           # window.DATA_RENT
│   └── redflags.js       # window.DATA_REDFLAGS
└── docs/
    └── PLAN.md
```

No build tool. No bundler. Plain `<script>` tags. Opens from `file://` with zero setup.

---

## 7. UI Layout (Single Page)

```
┌──────────────────────────────────────────────┐
│  🏙️  Namma Bengaluru Buddy                    │
│  Your first 30 days in Bengaluru, sorted.    │
│  ⚠️ Indicative data · Not legal advice        │
├──────────────────────────────────────────────┤
│  [Step 1: About You]                         │
│  Arrives __ Joins __ Office area __          │
│  Budget __ Household __ Vehicle __           │
│  Home state __ Diet __ Languages __          │
│  [ Generate My Plan → ]                      │
├──────────────────────────────────────────────┤
│  [Step 2: Your Week 1–4 Plan]  ⚠️ 1 slip     │
│  ▾ Week 1  ▾ Week 2  ▾ Week 3  ▾ Week 4     │
│    ☐ Sign rental agreement near Manyata      │
│    ☐ ...                                     │
│  ▸ Agent Trace                               │
├──────────────────────────────────────────────┤
│  [Step 3: Best Areas for You]                │
│  #1 Hebbal        ████████░ 91               │
│  #2 Yelahanka     ███████░░ 83               │
│  ▸ Agent Trace                               │
├──────────────────────────────────────────────┤
│  [Step 4: Fair-Rent Check]                   │
│  Area __ BHK __ Quoted rent ₹__              │
│  [ Check → ]                                 │
│  → Above market · Median ₹32k · High (82)   │
├──────────────────────────────────────────────┤
│  [Step 5: Agreement Checker]                 │
│  Monthly rent ₹__ [Paste agreement text…]   │
│  [ Scan → ]                                  │
│  Risk score: 45 🟡 Medium                    │
│  🔴 Long lock-in  🟡 High deposit            │
│  [ Copy Negotiation Message ]                │
│  ▸ Agent Trace                               │
└──────────────────────────────────────────────┘
```

Sections 2–5 are hidden until the intake form is submitted. Each section fades in on first render.

**Dark mode:** `style.css` uses `@media (prefers-color-scheme: dark)` to invert surface/text colours. No JS toggle required.

---

## 8. Build Steps (20-minute plan)

| Time | Task |
|------|------|
| 0–2 min | `index.html`: shell with all 5 sections, all `<script>` tags in correct load order |
| 2–3 min | `style.css`: base styles + dark mode media query |
| 3–6 min | `data/tasks.js`: ~28 tasks covering Housing, Admin, Paperwork, Food, Commute |
| 6–8 min | `data/areas.js` (~15 areas) + `data/rent.js` |
| 8–9 min | `data/redflags.js`: ~13 rules (regex + 5 numeric checks) |
| 9–12 min | `modules/plan.js`: filter + Kahn topo-sort + schedule algo + slip + render + localStorage |
| 12–14 min | `modules/areas.js`: score formula + top-5 render + trace |
| 14–16 min | `modules/rent.js`: fallback chain + confidence formula + output |
| 16–18 min | `modules/redflags.js`: regex engine + numeric checks + risk score + negotiation draft |
| 18–19 min | `app.js`: wire form → modules, token substitution, slip listener |
| 19–20 min | Smoke test: open `index.html` from filesystem, run demo profile end-to-end |

---

## 9. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `.js` globals instead of JSON + fetch | Works on `file://` without a local server or CORS hacks |
| No ES modules | `<script type="module">` also fails on `file://` in Chrome/Safari |
| Deterministic plan engine | Predictable, fully traceable — the "agent reasoning" is real, not theatre |
| Multi-tier rent fallback | Avoids "no data" dead-ends; confidence score communicates uncertainty honestly |
| Numeric checks alongside regex | Catches deposit/increment abuse that text patterns miss |
| localStorage for tick state | Zero backend; plan survives browser refresh; slip detection is live |
| Dark mode via CSS media query | Zero JS, works automatically with OS setting |
| `{{token}}` in task titles | Makes the plan feel personal without an LLM |

---

## 10. Demo Script (2 minutes)

**Profile:**
- Arrives: Mon 30 Nov 2026
- Joins: Mon 7 Dec 2026
- Office: Manyata Tech Park
- Budget: ₹30,000/month
- Household: Solo
- Vehicle: Two-wheeler (registered in West Bengal)
- From: outside Karnataka
- Diet: Non-veg
- Languages: Bengali, Hindi, English

**Script:**

1. Fill intake form with the profile above. Click **Generate My Plan**.
2. **Plan:** Week 1 accordion opens. Show "Sign rental agreement near Manyata Tech Park" (token filled). Open trace — "Skipped `school_search`: not Family" and "Included `vehicle_re_registration`: bike registered outside Karnataka".
3. **Area Finder:** Top results are Hebbal (#1) and Yelahanka (#2) — close to Manyata, within ₹30k, high fit for solo non-veg. Show score breakdown bars. Open trace to show Koramangala penalised (₹35k > budget, 35-min commute).
4. **Rent Check:** Enter Koramangala / 2BHK / ₹38,000 → "Above market · Median ₹32,000 · High (82) · 40 data points."
5. **Agreement Checker:** Enter ₹30,000 as rent. Paste sample agreement (pre-prepared with 12-month lock-in, ₹2,10,000 deposit, 10% yearly increase). Click Scan.
   - 🔴 Long lock-in (+25), 🔴 Deposit exceeds 6× rent (₹2.1L > ₹1.8L) (+20), 🟡 Increase at 10% boundary (+10) → Risk score 55 🟡 Medium.
   - Click **Copy Negotiation Message** — show drafted landlord message on screen.
   - Open trace — show which regex fired and deposit arithmetic.

---

*Plan complete. No code written yet.*
