# Phase 12/15: Scalability & Performance Audit & Optimization Record

This document records the scalability and performance audit, architectural decisions, optimizations implemented, and regression verifications for the public Sobaike Janao application.

---

## 1. Executive Summary

- **Phases 1–11 Status**: Verified & Protected.
- **Phase 12/15 Focus**: Optimizing data paths, RPC efficiency, bundle delivery, render performance, and concurrency deduplication without altering feed semantics, privacy guarantees, search relevance, or location behaviors.
- **Architectural Scope**:
  1. Database and RPC execution paths
  2. PublicReportService data fetching & concurrency deduplication
  3. Route-level bundle splitting (lazy-loading heavy analytical routes)
  4. Client-side query and relation resolution efficiency
  5. Privacy and location lifecycle protection

---

## 2. Current Data Architecture & Network Audit

### 2.1 Public RPC Interfaces
- `get_public_home_feed(p_visitor_lat, p_visitor_lng, p_filter, p_district)`:
  - Shadow-ranks complaints in PostgreSQL using internal Haversine formula when visitor GPS is present and `showGeneralLocation = true`.
  - Returns complete sanitized report set without exposing coordinates, distance, or accuracy.
- `get_public_published_reports()`:
  - Returns coordinate-free, chronological published reports with single-party lateral join.
- `get_public_published_report(p_report_id)`:
  - Fetches single published report by clean ID.
- `record_public_visit_session(...)`:
  - Records session metadata with zero coordinate persistence.

### 2.2 Network Duplication & Concurrency Audit
- **Identified Risk**: When multiple components or rapid route changes trigger concurrent fetches to the same public endpoints, redundant HTTP/RPC roundtrips were dispatched.
- **Optimization Applied**: Implemented an in-flight request deduplication map in `PublicReportService` (`fetchWithDeduplication`). Simultaneous calls to identical RPC signatures share a single network promise that cleans up automatically upon settlement.

### 2.3 Route & Bundle Audit
- **Identified Risk**: `ExplorePage` contains rich map components (`leaflet`, `react-leaflet`), charting components (`recharts`), and analytical breakdown algorithms. Bundling it synchronously inside the main entry bundle inflated the initial bundle for all visitors landing on Home or Category feeds.
- **Optimization Applied**: Converted `ExplorePage` to route-level code splitting using `React.lazy()` and `React.Suspense` with `MapExploreSkeleton`. Initial critical path bundle size is significantly reduced.

### 2.4 Related Reports Resolution
- **Identified Risk**: `ReportDetailPage` previously executed a manual `getAll()` and filtered client-side for related reports.
- **Optimization Applied**: Standardized on `PublicReportService.getRelatedReports()` with in-flight deduplication, preventing duplicate unshared fetches.

---

## 3. Large-Dataset Readiness & Classification Matrix

| Surface / Query Path | Current Implementation | Large Dataset Classification | Architectural Strategy / Decision |
|---|---|---|---|
| **Home Feed** | `get_public_home_feed` | **A. ACCEPTABLE CURRENTLY** | Server-side shadow ranking calculates order across eligible set, frontend reveals progressively (10 + 10). Preserves ranking correctness. |
| **Category Feeds** | `get_public_home_feed` (with loc) / `get_public_published_reports` | **A. ACCEPTABLE CURRENTLY** | Filtered by segment; small payload footprint; deduplicated network calls. |
| **Search** | `getAll()` + memoized multi-field filter | **A. ACCEPTABLE CURRENTLY** | Client-side fuzzy substring search preserves exact Bengali and English multi-field matching without complex backend FTS drift. |
| **LocationPage** | `getByLocation()` | **A. ACCEPTABLE CURRENTLY** | Sanitized, prevents withheld location leakage. |
| **SubjectPage** | `getBySubject()` | **A. ACCEPTABLE CURRENTLY** | Sanitized, prevents withheld subject leakage. |
| **ReportDetail** | `getById()` + `getRelatedReports()` | **A. ACCEPTABLE CURRENTLY** | Direct ID lookup via dedicated RPC + deduplicated related batch fetch. |
| **Explore** | `getAll()` + memoized analytics aggregations | **A. ACCEPTABLE CURRENTLY** | Dynamic multi-panel analytics computed from deduplicated feed; route is lazy-loaded. |

---

## 4. Database & Index Evaluation

- **Table `complaints`**:
  - Filter: `status = 'published'`
  - Sort: `created_at DESC`, `id DESC`
  - Existing index on `(status, created_at DESC)` and primary key `id` adequately covers all public RPC paths.
- **Table `complaint_parties`**:
  - Foreign key `complaint_id` with index covers the lateral join in `get_public_published_reports` and `get_public_home_feed`.
- **SQL Changes**: No new SQL migration required for Phase 12/15. Existing stored procedures in `phase8_shadow_location_ranking_privacy.sql` already enforce optimal security, volatile immutability (`STABLE`), explicit `search_path`, and coordinate sanitization.

---

## 5. Performance Test Matrix & Regression Results

| Test | Objective | Result | Notes |
|---|---|---|---|
| **TEST 1 — HOME** | Progressive reveal 10 + 10, shadow ranking | **PASS** | Exact order preserved; no missing reports; no distance exposure. |
| **TEST 2 — CATEGORY** | Segment isolation with/without location | **PASS** | Harassment, Rickshaw, Extortion, Utility feeds render accurately. |
| **TEST 3 — SEARCH** | Keyword matching & location neutrality | **PASS** | Same results and relevance; zero coordinate interference. |
| **TEST 4 — LOCATIONPAGE** | Explicit district filtering | **PASS** | Explicit location constraint honored. |
| **TEST 5 — SUBJECTPAGE** | Subject entity isolation | **PASS** | Subject identity honored; withheld subjects excluded. |
| **TEST 6 — RELATED REPORTS** | Relational link resolution | **PASS** | Related reports linked by ID with top-3 slice. |
| **TEST 7 — EXPLORE** | Multi-panel analytics & interactive map | **PASS** | Route code-split; analytics and rankings identical. |
| **TEST 8 — NETWORK** | Concurrency deduplication | **PASS** | In-flight duplicate requests consolidated. |
| **TEST 9 — PRIVACY** | Zero coordinate exposure or persistence | **PASS** | `lat`, `lng`, `distance_km` absent from public payloads. |
| **TEST 10 — MOBILE** | Responsive layouts & drawer performance | **PASS** | No layout shifts or performance regressions. |

---

## 6. Deferred Optimizations

- **Server-Side Full-Text Search (pg_trgm / tsvector)**: Deferred until report corpus exceeds several thousand records, to avoid divergent ranking semantics between Bengali unicode normalization and English terms.
- **Server-Side Group By / Rollup RPCs for Explore**: Deferred until dataset size makes client-side array aggregation exceed frame budgets.

---

## 7. Build & Verification Status

- `npm run lint`: **PASS** (`tsc --noEmit` clean, 0 errors).
- `npm run build`: **PASS** (`vite build` compiled successfully with route code-splitting).
