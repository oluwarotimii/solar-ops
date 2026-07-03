# Solar Ops Design System — Improvement Brief

**Purpose:** This is an implementation brief for an AI coding agent to upgrade an existing shadcn/ui + Tailwind design system for a field-technician solar operations app. It assumes the current stack (Tailwind 3.4, shadcn/ui, Radix, next/font Inter, Recharts, RHF+Zod, PWA) stays as-is. Everything below is additive or corrective, not a rewrite.

**Context that should drive every decision here:** the primary user is a technician standing on a roof or next to an inverter, in direct sunlight, often wearing work gloves, sometimes with wet or dirty hands, frequently on a phone in one hand, frequently on weak or no signal. Design decisions that are fine for an office SaaS dashboard (subtle contrast, 8px hit targets, hover-only affordances, spinner-and-hope loading states) actively fail this user. Treat "field-usable" as a hard constraint, not a nice-to-have.

---

## 1. Token System — Corrections

### 1.1 Contrast problem: gold-on-light-background

`--primary: 45 85% 45%` (a golden-yellow) on `--background: 210 20% 98%` (near-white) is a **known outdoor-readability failure**. Gold/yellow at 45% lightness against near-white background sits close to WCAG AA failure for text (~3.1:1), and gets meaningfully worse under direct sunlight glare on a phone screen, which is the exact condition your users are in.

**Fix — split "primary" into two roles:**

```css
/* Brand identity (logo, marketing, sidebar accents) — keep as-is */
--brand-gold: 45 85% 45%;
--brand-navy: 210 100% 12%;

/* Interactive primary — used for buttons, links, focus rings, active states */
--primary: 210 90% 32%;        /* a deepened navy-blue, NOT gold */
--primary-foreground: 0 0% 100%;

/* Gold becomes an ACCENT, used sparingly: badges, highlights, "needs attention" markers */
--accent: 45 90% 48%;
--accent-foreground: 210 100% 12%;
```

Gold-on-navy (in the sidebar, in badges) has great contrast and is genuinely your brand signature — keep using it there. Gold-on-white as a button/text color does not. Never use `--accent` for body text under 18px.

### 1.2 Add a status color system (this is missing and you need it)

Ops apps live and die by status color. Right now you have none. Add these as first-class tokens, not ad-hoc `text-red-500` scattered through components:

```css
--status-critical: 0 84% 42%;      /* system down, safety issue, fault */
--status-warning: 32 95% 44%;      /* degraded output, needs attention */
--status-success: 142 71% 30%;     /* online, healthy, complete */
--status-info: 210 90% 45%;        /* scheduled, informational */
--status-offline: 220 9% 46%;      /* no comms, unknown state */
```

Each needs a `-foreground` and a `-muted`/`-bg` pairing (e.g. `--status-critical-bg: 0 84% 96%`) so you can build solid badges (dark bg, light text — better sunlight visibility) *and* soft badges (light bg, dark text — better for dense tables) from the same source.

**Rule for the agent:** every inverter/site/ticket status in the app maps to exactly one of these five. Don't let new ad-hoc colors creep in per-feature.

### 1.3 Dark mode is not optional polish here — make it a real default choice

Techs are frequently outdoors where a bright white UI causes glare and battery drain, but also frequently in dim electrical rooms/enclosures where a bright screen is disruptive. Recommendation: **ship dark mode as equally first-class, default to system preference, and persist the user's choice per-device** (not just per-session). Audit every component for hardcoded `bg-white`/`text-black` — anything not using the CSS variables will break here.

### 1.4 Radius and density

`--radius: 0.5rem` is fine. But field data tables need a **density variant** (compact vs comfortable), because technicians scanning 40 inverters need more rows on screen, while a single-ticket detail view can afford to breathe. Add a `--table-row-h-compact: 2rem` / `--table-row-h-comfortable: 2.75rem` pairing and expose it as a per-table toggle, not a global setting.

---

## 2. Data Tables — Full Redesign Spec

This is the highest-leverage fix. Field ops apps are 70% tables (site lists, work orders, alarms, inverter fleets, ticket queues). A generic shadcn `<Table>` dropped onto a page will not hold up.

### 2.1 Core table component rules

- **Sticky header** always. Techs scroll long lists on a phone; losing the column headers is a real usability tax.
- **Status column always leftmost** (after an optional checkbox), rendered as a colored dot + label, using the status tokens from §1.2. Never bury status in the middle of a row.
- **Row click = navigate to detail**, not just row-select. Row-select (checkbox) is a separate, deliberate action for bulk operations only.
- **Sort indicators must be visible without hover** — hover states are meaningless on touch devices. Show the active sort arrow permanently on the sorted column.
- **Minimum row height 44px** in "comfortable" density, 36px in "compact" — below that, thumbs miss taps.
- **Zebra striping OFF by default in light mode** (too visually busy for a dashboard that's already color-coding by status); **on by default in dark mode** where row separation is harder to read.

### 2.2 Mobile behavior — do NOT horizontally scroll tables

Horizontal-scroll tables on mobile are the single most common way ops dashboards become unusable in the field. Instead:

- **Below `md` breakpoint, tables collapse into stacked cards**, one card per row, using the existing `Card` primitives you already have. Show: status badge, primary identifier (site name / ticket ID), 2–3 key fields as label/value pairs, and a chevron to view details.
- Preserve sort/filter controls above the card list, just not the tabular layout itself.
- This is a `<ResponsiveDataTable>` wrapper the agent should build once and reuse everywhere, not a per-page reimplementation.

### 2.3 Filtering and empty/loading/error states

- Filter bar: sticky below the table header, `flex-wrap` on mobile, each filter a `<Select>` or `<Popover>` with a badge count when active (e.g. "Status (2)").
- Loading: skeleton rows (matching real row height/columns), not a centered `Loader2` spinner that hides the table shape — users should see the structure appear, not blank-then-pop.
- Empty state: must be actionable, not just "No results." — e.g. "No open tickets for this site" + a clear CTA if one exists ("Create ticket").
- Error state: `AlertTriangle` + red text is fine, but **always pair with a retry button**, since field connectivity failures are common and "just refresh the page" is a bad ask on a ladder.

### 2.4 Offline/stale-data indicator (specific to this app)

Any table showing live telemetry (inverter output, site status) needs a **last-synced timestamp** and a visual "stale" treatment (dimmed row or a small clock icon) if data is older than an expected threshold. Silently showing possibly-stale data as if it's live is actively dangerous for an ops tool — a technician might trust a "healthy" status that's 40 minutes old.

---

## 3. Sidebar & Mobile Drawer

### 3.1 Sidebar (desktop)

Your navy sidebar with Overview/Operations/Analytics/System sections is a reasonable IA. Improvements:

- **Add a persistent status summary at the top of the sidebar** — small strip showing "X sites offline" / "Y critical alarms" in the status colors from §1.2. This is the single piece of info a tech wants before they even navigate anywhere.
- **Section headers should be collapsible**, remembered per-user (localStorage), since "System" is likely low-frequency for a field tech vs. an admin.
- **Active nav item**: use the gold accent as a left border + subtle bg tint on navy, not a full gold fill — full gold fill on a nav item competes with your status-color badges elsewhere and dilutes what gold *means* in the UI.
- **Badge counts on nav items** (e.g. "Tickets · 12") using the same status-color badge component as tables, so the vocabulary is consistent app-wide.

### 3.2 Mobile — Sheet/drawer specifics

- Trigger target must be ≥44×44px (glove-friendly), positioned top-left, always visible in the h-16 header — don't rely on swipe-to-open as the only method.
- Drawer should open to **full height, ~85% width**, not a narrow sliver — on a phone, a technician wants to see full labels, not truncated nav text.
- **Close on navigation**, always — never leave the drawer open after a route change.
- Put the same status summary strip (§3.1) at the top of the mobile drawer too — it's actually more valuable on mobile since there's no persistent sidebar to glance at.

---

## 4. Component Pattern Upgrades

Your existing pattern (`"use client"` → Loader2 → AlertTriangle/red → muted empty state → responsive grid → Card everywhere) is a solid skeleton. Specific upgrades:

| Pattern | Current | Upgrade |
|---|---|---|
| Loading | Centered `Loader2` spinner | Skeleton matching real layout shape (table rows, card grids) |
| Error | `AlertTriangle` + red text | Same, **+ retry action**, + human-readable cause if known ("Couldn't reach site controller") |
| Empty state | `text-muted-foreground` text only | Icon + one-line explanation + primary CTA when an action exists |
| Stat cards | `text-2xl font-bold` number | Add a status-colored delta/trend indicator + last-updated timestamp — a bare number with no freshness signal is a trap for ops data |
| Forms | RHF + Zod, standard | Add **inline field-level error persistence on blur, not just submit** — techs filling forms outdoors often lose focus (phone calls, glare) and need errors visible when they return, not just after they hit submit |
| Buttons (primary actions) | shadcn default sizing | Add a `size="touch"` variant at 48px height for any action a tech performs one-handed in the field (mark complete, upload photo, submit ticket) — the default shadcn `h-10` (40px) is borderline for gloved use |

---

## 5. Typography — Minor Refinements

Your scale is fine; two additions:

- **Add a numeric/tabular-figures utility** (`font-variant-numeric: tabular-nums`) for anything in a table or stat card showing changing numbers — inverter kW output, ticket counts. Without it, digits shift width as they update and rows visually jitter.
- **Increase minimum body text on mobile to 15px**, not 14px (`text-sm` = 14px). One extra pixel matters more than it sounds like when read at arm's length in sunlight. Consider a `--text-sm-mobile` override at the Tailwind config level rather than hand-editing every component.

---

## 6. Accessibility / Field-Use Checklist

Give this directly to the agent as acceptance criteria:

- [ ] All interactive targets ≥44px (48px for primary field actions)
- [ ] All status information conveyed by color also has a text label or icon (color-blind techs, and glare that washes out hue)
- [ ] Focus rings visible and using `--primary` (not `--accent`/gold, which fails contrast on light backgrounds per §1.1)
- [ ] Dark mode fully audited, no hardcoded colors
- [ ] Every data-fetching component has skeleton/error+retry/empty states — no bare spinners, no silent failures
- [ ] Tables collapse to cards below `md`, never horizontal-scroll
- [ ] Stale/offline data visually distinguished from live data
- [ ] Tap-and-hold or hover-only affordances have a touch-accessible equivalent

---

## 7. Suggested Rollout Order for the Agent

1. Token corrections (§1) — foundational, everything else depends on this
2. `<ResponsiveDataTable>` component + status badge component (§2, §1.2) — highest usage surface
3. Sidebar/drawer status strip + active-state fix (§3)
4. Loading/error/empty state components, reused everywhere (§4)
5. Touch-target and typography sweep (§4, §5)
6. Accessibility checklist pass (§6)

This order front-loads the changes with the widest blast radius (tokens, table, status badges) so later steps build on corrected primitives instead of needing rework.