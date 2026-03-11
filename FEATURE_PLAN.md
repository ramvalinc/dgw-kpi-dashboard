# DGW KPI Dashboard — Feature Plan

> **STATUS: PLANNING ONLY — Do not implement until explicitly instructed.**

---

## Feature 1 — Employees Cannot Edit Submitted Entries

### Problem
Currently employees can freely edit any field on any day at any time, including past days they already submitted.

### Proposed Solution
**"Lock on Submit" mechanism with a daily submission flow:**

1. Add a **"Submit Day"** button on the Daily Entry view.
2. Once submitted, that day's data is **locked** — all input fields become `readOnly` / `disabled`.
3. A clear visual indicator (e.g. green "SUBMITTED" badge) appears on locked days in the day selector.
4. A new `locked: true` flag is stored alongside each day's data in both localStorage and Google Sheets.
5. The day selector shows:
   - Blue dot = has data, not yet submitted
   - Green dot = submitted & locked
   - No dot = empty

**Optional admin override:** Admin (authenticated with the existing password) can unlock a specific day if a correction is needed.

### Files to change
- `index.html` — Add `locked` flag to `eD()` default data, modify `uD / uR / uN` update functions to check lock, disable `IG` and `NI` inputs when `dd.locked === true`, add "Submit Day" button, add "Unlock (Admin)" flow.

---

## Feature 2 — Disable the "Clear" Button for Employees

### Problem
Employees can accidentally (or intentionally) erase an entire day's data with the "Clear" button.

### Proposed Solution
**Two-layer protection:**

**Option A (Recommended) — Remove the button entirely for non-admins:**
- The "Clear" button is only shown when the user has already authenticated into a protected view (Staffing / Dashboard).
- Since employees never unlock those views, they never see the button.
- Implementation: wrap the `<button onClick={clr}>Clear</button>` in `{sOK && ...}` or `{dOK && ...}`.

**Option B — Password-gate the Clear action:**
- Clicking "Clear" prompts for the admin password before proceeding.
- More visible but adds friction.

**Recommendation:** Option A is simpler and provides zero chance of accidental clearing.

### Files to change
- `index.html` — Wrap or remove Clear button render based on admin auth state.

---

## Feature 3 — Google Drive/Sheets as Database: Current Setup Evaluation

### Current Architecture
```
Browser (React)  →  localStorage (primary)
                 →  Google Apps Script Web App (secondary sync)
                         ↓
                   Google Sheets (single cell stores entire JSON)
```

### Problems Identified

| Issue | Severity | Detail |
|-------|----------|--------|
| **Single-cell JSON storage** | High | Entire dataset stored as one JSON blob in cell B1. Google Sheets has a cell character limit (~50,000 chars). A full month of data could exceed this. |
| **No real-time sync** | High | Sync only fires on save; no live updates between devices. Two employees entering data simultaneously will overwrite each other. |
| **no-cors blind POST** | Medium | Browser can't confirm the write succeeded — silent data loss is possible. |
| **Apps Script quotas** | Medium | Free Google accounts: 6 min/day execution, 20,000 UrlFetch calls/day. Could hit limits under heavy use. |
| **Single point of failure** | Medium | If the Apps Script deployment goes stale or Google revokes access, all cross-device sync breaks silently. |
| **No versioning / history** | Medium | Overwriting the single cell means no undo or audit trail. |
| **Hardcoded admin password in source code** | High | `const PW = 'm16177581'` is visible to anyone who views page source. |
| **Data not encrypted** | Low | Sensitive business data in plain JSON in a Google Sheet. |

### Verdict
Google Sheets via Apps Script is **not ideal for production**. It's a good MVP/prototype solution, but has real risks around data capacity, concurrency, and reliability at scale.

---

## Feature 4 — Proposed Improvements to the Database

### Recommended Stack: Supabase (free tier)

**Why Supabase:**
- PostgreSQL database (no cell size limits)
- Real-time subscriptions (live updates across devices)
- Built-in authentication (replace hardcoded password)
- Row-level security (employees see only their location's data)
- Free tier: 500MB storage, 50,000 MAU, unlimited API calls
- REST + WebSocket API — works perfectly from a static HTML app

**Migration Plan:**

#### Phase 1 — Keep current Google Sheets sync, add Supabase as primary
1. Create a Supabase project.
2. Create a `kpi_entries` table:
   ```sql
   create table kpi_entries (
     id uuid primary key default gen_random_uuid(),
     location text not null,        -- 'doral', 'location2', 'location3'
     entry_date date not null,
     data jsonb not null,
     locked boolean default false,
     submitted_by text,
     submitted_at timestamptz,
     updated_at timestamptz default now(),
     unique(location, entry_date)
   );
   ```
3. Replace `localStorage` + Apps Script calls with Supabase JS client.
4. Add proper auth (Supabase Auth with email/password or magic link).

#### Phase 2 — Real auth instead of hardcoded password
- Use Supabase Auth roles:
  - `employee` role: can INSERT/UPDATE only today's unlocked entries for their location
  - `manager` role: can unlock days, view staffing, view fixed expenses
  - `owner` role: full dashboard access across all locations

#### Phase 3 — Optional: keep Google Sheets as read-only export
- Supabase Edge Function runs nightly, pushes daily summary to Google Sheet for accounting/reporting.

---

## Feature 5 — Multi-Location Support (3 Locations, One Codebase)

### Goal
Deploy one application that supports 3 different business locations, each with isolated data.

### Architecture Options

#### Option A — URL-based location routing (Recommended)
Each location gets a subdirectory or subdomain on Netlify:
```
https://darling-elf-6f21db.netlify.app/          → redirect to /doral
https://darling-elf-6f21db.netlify.app/doral/    → Doral location
https://darling-elf-6f21db.netlify.app/location2/ → Location 2
https://darling-elf-6f21db.netlify.app/location3/ → Location 3
```

**Or with Netlify branch deploys / custom domains:**
```
doral.doggiesgonewild.com
westmia.doggiesgonewild.com
hialeah.doggiesgonewild.com
```

**How it works:**
1. The app reads `window.location.pathname` (or hostname) on startup to determine the active `location`.
2. The `location` value is passed in every data read/write call.
3. In Supabase, the `kpi_entries.location` column acts as the data partition.
4. All three locations share the same codebase — no duplication.

#### Option B — Separate Netlify sites per location
- Each location is a separate Netlify deploy of the same repo.
- A `LOCATION_ID` environment variable (set in Netlify UI) controls which location is active.
- Simpler to set up; harder to maintain as one grows.

#### Implementation Steps for Option A
1. Add a `LOCATION` constant read from `window.location.pathname` or a `<meta>` tag.
2. Change `netlify.toml` to include location-based rewrites.
3. Update Supabase queries to filter by `location`.
4. Header UI shows which location is active.
5. Dashboard view (owner-only) can toggle between locations or show combined view.

### Netlify `netlify.toml` for multi-location
```toml
[build]
  publish = "."

[[redirects]]
  from = "/doral/*"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/location2/*"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/location3/*"
  to = "/index.html"
  status = 200

[[redirects]]
  from = "/"
  to = "/doral/"
  status = 301
```

---

## Summary Priority Matrix

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Disable Clear button | Low | High | **Do first** |
| Lock submitted entries | Medium | High | **Do second** |
| Multi-location support | Medium | High | **Do third** |
| Replace Google Sheets with Supabase | High | Very High | **Do fourth** |
| Real auth (replace hardcoded password) | Medium | High | **Do with Supabase** |

---

*This plan was prepared on 2026-03-09. No code changes were made.*
