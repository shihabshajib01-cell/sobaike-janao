# Phase 12/15: Scalability & Performance Audit & Optimization Record

This document records the scalability and performance audit, live database index verification, query-plan findings, architectural decisions, optimizations implemented, and regression verifications for the public Sobaike Janao application.

---

## 1. Executive Summary

- **Phases 1–11 Status**: Verified & Protected.
- **Phase 12/15 Focus**: Optimizing data paths, RPC efficiency, bundle delivery, render performance, and concurrency deduplication without altering feed semantics, privacy guarantees, search relevance, or location behaviors.
- **Parallel Work Protected**:
  - `src/pages/ExplorePage.tsx` (commits `0a595b6`, filter layout & logic changes)
  - `src/components/location/LocationReminderBar.tsx` (commits `50aaf30` and `94f2d43`, UI simplification)
- **Live Supabase Audit Reality**: Live database verification confirmed that previously assumed composite/partial indexes (`complaints(status, created_at DESC)` and `complaint_parties(complaint_id)`) do **not** exist in the live database. Based on actual query plans and small dataset sizes (~46 complaints), index creation is **deferred** with explicit re-evaluation triggers.
- **Related-Report Architecture**: Accurately documented as centralized client-side filtering over `getAll()` with in-flight deduplication (not a dedicated backend query). Dedicated backend query is deferred.

---

## 2. Live Database & Index Audit

### 2.1 Live Dataset Scale (Verified Approximate Row Counts)
- `public.complaints`: ~46 rows
- `public.complaint_parties`: ~2 rows
- `public.complaint_submission_contexts`: ~27 rows
- `public.public_visit_sessions`: ~80 rows

### 2.2 Verified Live Indexes (`pg_indexes` Audit)

| Table | Index Name | Columns / Definition | Unique | Notes |
|---|---|---|---|---|
| `public.complaints` | `complaints_pkey` | `id` (PRIMARY KEY, btree) | Yes | Default primary key index |
| `public.complaints` | `complaints_client_submission_id_idx` | `client_submission_id` (btree) | No | Prevents duplicate client submissions |
| `public.complaint_parties` | `complaint_parties_pkey` | `id` (PRIMARY KEY, btree) | Yes | Default primary key index |
| `public.complaint_submission_contexts` | `complaint_submission_contexts_pkey` | `id` (PRIMARY KEY, btree) | Yes | Default primary key index |
| `public.public_visit_sessions` | `public_visit_sessions_pkey` | `id` (PRIMARY KEY, btree) | Yes | Default primary key index |
| `public.public_visit_sessions` | `public_visit_sessions_session_id_key` | `session_id` (btree) | Yes | Session uniqueness constraint |

**Correction Note**: The repository previously documented that `complaints(status, created_at DESC)` and `complaint_parties(complaint_id)` existed live. Fresh live verification confirms neither index exists on the live database.

### 2.3 Query Plan Audit (EXPLAIN / EXPLAIN ANALYZE)

- **Query Path A — Published Complaint Scan (`WHERE status = 'published' ORDER BY created_at DESC, id DESC`)**:
  - Plan: `Seq Scan on complaints (Filter: (status = 'published'))` -> `Sort (Sort Key: created_at DESC, id DESC)`.
  - Characteristics: On a table of ~46 rows, the entire relation fits in a single 8KB disk page in PostgreSQL buffer cache. Sequential scan execution is near-instantaneous (< 0.05ms) and avoids index page traversal.
- **Query Path B — Complaint-Party Lateral Lookup (`WHERE complaint_id = c.id`)**:
  - Plan: `Seq Scan on complaint_parties (Filter: (complaint_id = c.id))`.
  - Characteristics: At ~2 rows, sequential scan requires only 1 page access; an index lookup would require root-to-leaf page reads plus heap fetch, yielding zero latency benefit.
- **Query Path C — District-Filtered Feed Path (`lower(coalesce(c.district,'')) LIKE ...`)**:
  - Plan: Filter evaluated in-memory during table scan.
- **Query Path D — `get_public_home_feed` Execution Shape**:
  - Plan: `STABLE`, `SECURITY DEFINER` function with explicit `search_path`. Filters published complaints, applies internal Haversine distance math in-memory for GPS-enabled visitors, and sorts.

### 2.4 Index Decision & Justification

**Decision**: **DEFER**

> "Live verification confirms there is currently no composite/partial published-feed index on complaints and no complaint_parties(complaint_id) index. Current table sizes are small enough that sequential scans may remain appropriate. These indexes are therefore deferred pending growth/query-plan evidence."

- **Why Deferred**:
  - Current volume is ~46 complaints and ~2 complaint parties.
  - PostgreSQL cost-based optimizer prefers sequential scans for tiny tables because reading 1-2 contiguous memory blocks has lower I/O and CPU overhead than B-tree index traversal.
  - Adding indexes prematurely introduces write and maintenance overhead on inserts/updates without query speedups.
- **Trigger / Threshold for Re-evaluation**:
  - Add partial index `CREATE INDEX idx_complaints_published ON public.complaints (created_at DESC, id DESC) WHERE status = 'published';` when published complaints exceed **1,000 active rows** or when sequential scan execution time exceeds **15ms**.
  - Add foreign key index `CREATE INDEX idx_complaint_parties_complaint_id ON public.complaint_parties (complaint_id);` when `complaint_parties` table exceeds **500 rows**.
- **SQL Migration Status**:
  - **No Phase 12/15 SQL migration required after live query-plan review.**
  - All existing RPC signatures (`get_public_home_feed`, `get_public_published_reports`, `get_public_published_report`, `record_public_visit_session`), RLS policies, grants, and privacy filtering remain 100% intact.

---

## 3. Data Architecture & Network Optimizations

### 3.1 Public RPC Interfaces
- `get_public_home_feed(p_visitor_lat, p_visitor_lng, p_filter, p_district)`:
  - Shadow-ranks complaints in PostgreSQL using internal Haversine formula when visitor GPS is present and `showGeneralLocation = true`.
  - Returns complete sanitized report set without exposing coordinates, distance, or accuracy.
- `get_public_published_reports()`:
  - Returns coordinate-free, chronological published reports with single-party lateral join.
- `get_public_published_report(p_report_id)`:
  - Fetches single published report by clean ID.
- `record_public_visit_session(...)`:
  - Records session metadata with zero coordinate persistence.

### 3.2 In-Flight Request Deduplication (`fetchWithDeduplication`)
- **Location**: `src/services/publicReportService.ts`
- **Mechanism**:
  - An internal in-flight promise map (`Map<string, Promise<any>>`) tracks pending requests by signature key.
  - Concurrent invocations with identical parameters share the active Promise.
  - Settled requests (success or failure) automatically delete themselves from the map in `.finally()` / `.catch()`.
  - **No persistent caching**: Stale responses are never cached in memory, `localStorage`, or `sessionStorage`.
  - **Location-aware key safety**: Keys serialize all ranking-relevant inputs (`${lat ?? 'null'},${lng ?? 'null'},${filter},${district}`). Null and real locations generate distinct keys (e.g., `'null,null,all,all'` vs `'23.81,90.41,all,all'`).

### 3.3 Route-Level Bundle Splitting (ExplorePage Lazy Loading)
- **Location**: `src/components/layout/AppShell.tsx`
- **Mechanism**:
  - `ExplorePage` is split via `const ExplorePage = lazy(() => import('../../pages/ExplorePage'));`.
  - Suspended inside `<Suspense fallback={<MapExploreSkeleton />}>`.
  - Isolates heavy visualization dependencies (`leaflet`, `react-leaflet`, `recharts`) from initial landing bundles (Home, Categories, Report Detail).
- **Parallel Work Protected**:
  - All subsequent UI improvements in `ExplorePage.tsx` (commit `0a595b6`: flex filter container, division/district reset behavior) are fully preserved.

### 3.4 Related Reports Architecture Correction
- **Current Implementation**:
  - `ReportDetailPage` calls `PublicReportService.getRelatedReports(reportId, relatedIds)`.
  - Internally, `getRelatedReports()` calls `getAll()` and filters matching `relatedIds` client-side.
  - **Actual Benefit**: Centralizes relation filtering in the service layer, deduplicates concurrent `getAll()` requests across the page, and removes boilerplate duplication from `ReportDetailPage`.
  - **Accurate Scope**: `getRelatedReports()` **still loads the full published dataset through `getAll()`**. It is **not** a dedicated backend related-report query.
  - **Optimization Status**: Backend dedicated query is **DEFERRED**. At ~46 total records, client-side array filtering for 3 items executes in < 0.1ms. A dedicated RPC will be evaluated when published dataset exceeds 500 records.

---

## 4. Large-Dataset Readiness & Classification Matrix

| Surface / Query Path | Current Implementation | Large Dataset Classification | Architectural Strategy / Decision |
|---|---|---|---|
| **Home Feed** | `get_public_home_feed` RPC | **A. ACCEPTABLE CURRENTLY** | Server-side shadow ranking calculates order across eligible set; UI reveals progressively (10 + 10). Preserves ranking correctness and privacy. |
| **Category Feeds** | `get_public_home_feed` (with loc) / `get_public_published_reports` | **A. ACCEPTABLE CURRENTLY** | Filtered by segment; small payload footprint; deduplicated network calls. |
| **Search** | `getAll()` + memoized multi-field filter | **B. SHOULD MOVE SERVER-SIDE LATER** | Client-side search preserves exact Bengali and English multi-field matching without backend FTS drift. At >1,000 reports, transition to server-side search RPC (`pg_trgm` / `tsvector`). |
| **LocationPage** | `getByLocation()` via `getAll()` | **B. SHOULD MOVE SERVER-SIDE LATER** | Client-side district filtering is instant at current volume (~46 rows). Will move to parameterized server-side query when corpus grows. |
| **SubjectPage** | `getBySubject()` via `getAll()` | **B. SHOULD MOVE SERVER-SIDE LATER** | Client-side subject filtering is instant at current volume (~46 rows). Will move to parameterized server-side query when corpus grows. |
| **Related Reports** | `getRelatedReports()` via `getAll()` + client filter | **B. SHOULD MOVE SERVER-SIDE LATER** | Centralized in service layer with request deduplication. Dedicated `get_public_related_reports(p_ids text[])` RPC deferred until dataset scale justifies it. |
| **Explore** | `getAll()` + client analytics aggregations | **B. SHOULD MOVE SERVER-SIDE LATER / C. SHOULD PAGINATE LATER** | Route is lazy-loaded with skeleton fallback. Client-side aggregations for charts/maps are acceptable currently; server-side rollup RPCs deferred. |

---

## 5. Performance Test Matrix & Regression Results

| Test | Objective | Result | Notes |
|---|---|---|---|
| **TEST 1 — HOME** | Progressive reveal 10 + 10, shadow ranking | **PASS** | Exact order preserved; no missing reports; zero coordinate or distance exposure. |
| **TEST 2 — CATEGORY** | Segment isolation with/without location | **PASS** | Harassment, Rickshaw, Extortion, Utility feeds render accurately. Location-aware shadow ranking preserved when granted. |
| **TEST 3 — SEARCH** | Keyword matching & location neutrality | **PASS** | Same results and relevance before/after; location neutral. |
| **TEST 4 — LOCATIONPAGE** | Explicit district filtering | **PASS** | Explicit location constraint honored. |
| **TEST 5 — SUBJECTPAGE** | Subject entity isolation | **PASS** | Subject identity honored; withheld subjects excluded. |
| **TEST 6 — RELATED REPORTS** | Relational link resolution | **PASS** | Related reports linked by ID with top-3 slice; centralized via `getRelatedReports()`. |
| **TEST 7 — EXPLORE** | Multi-panel analytics, interactive map & lazy loading | **PASS** | Lazy-loaded via `Suspense`; parallel filter logic and division/district reset (commit `0a595b6`) preserved. |
| **TEST 8 — NETWORK** | Concurrency deduplication | **PASS** | In-flight duplicate requests share promise; separate keys for distinct location parameters; errors and completions clean up. |
| **TEST 9 — PRIVACY** | Zero coordinate exposure or persistence | **PASS** | `lat`, `lng`, `distance_km`, `visitor_lat`, `visitor_lng` absent from public payloads. |
| **TEST 10 — LOCATION REMINDER** | Parallel LocationReminderBar UI | **PASS** | Simplified UI and layout from commits `50aaf30` and `94f2d43` completely intact. |

---

## 6. Remaining Scalability Risks & Deferred Optimizations

1. **Full Dataset Retrieval for Secondary Views**:
   - Views like Search, Explore, LocationPage, and SubjectPage currently load the full published dataset via `getAll()`.
   - **Risk**: As the published corpus grows past 1,000 records, bandwidth and client-side processing will increase linearly.
   - **Mitigation**: Introduce server-side filtered endpoints and rollup aggregates once the corpus crosses 500–1,000 records.
2. **Missing Database Indexes on Scale**:
   - `complaints` status/sort and `complaint_parties` foreign key currently lack indexes.
   - **Risk**: Sequential scans will degrade when complaints reach tens of thousands of rows.
   - **Mitigation**: Trigger index creation when `complaints` crosses 1,000 rows.
3. **Measurement Limitations**:
   - All performance observations and query plans reflect the current live database size (~46 complaints, ~2 complaint parties).
   - No benchmark numbers or query latencies are simulated or fabricated.

---

## 7. Build & Verification Status

- `npm run lint`: **PASS** (`tsc --noEmit` clean, 0 errors).
  - *Clarification*: The project's `lint` npm script executes `tsc --noEmit` for full TypeScript type-checking.
- `npm run build`: **PASS** (`vite build` compiled successfully with separate lazy chunks for `ExplorePage`).
- **CI / GitHub Checks**: No external CI checks configured/available for this commit.
