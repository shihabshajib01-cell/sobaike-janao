# Phase 10/11: Public Report-List Feed Classification & Location Inventory

This document tracks the verified inventory and explicit architectural decisions for all public surfaces rendering report lists across the Sobaike Janao application.

---

## 1. Executive Summary

- **Phases 1–9**: Verified & Complete.
- **Phase 10/11 Core Objective**: Systematically classify all public report-list surfaces as either **LOCATION-AWARE** or **LOCATION-NEUTRAL**, ensuring user intent, search relevance, and relational links remain uncompromised while preserving server-side shadow-ranking and strict privacy guarantees.
- **Privacy Guarantees**:
  - Zero exposure of raw complaint coordinates, reporter coordinates, or visitor GPS.
  - Zero exposure of calculated distance values (`distance_km`, `distance_m`, `proximity`).
  - Zero persistence of visitor browse coordinates in `localStorage`, `sessionStorage`, database, or analytics.
  - All location-aware ordering remains strictly server-side within trusted Supabase RPCs (`rpc/get_public_home_feed`).
  - Location is never an availability gate: failure states (`not_asked`, `not_now`, `denied`, `unavailable`, `error`) gracefully fall back to default chronological feeds.

---

## 2. Complete Public Report-List Surface Inventory

| Surface Name | Route | Primary Component | Service Method | Backend/RPC/API Source | Current Filters | Current Sorting | Primary Semantic Meaning | Pagination / Load More | Location Dependency | Final Classification | Classification Rationale |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Home Feed** | `/` | `HomePage` | `PublicReportService.getHomeFeed` | `rpc/get_public_home_feed` | `feedFilter`, `district` | Shadow-ranked proximity + recency | Community relevance & nearby recency | Progressive reveal (`10 + 10`) | `browseLocation` (transient in-memory) | **LOCATION-AWARE** | Primary landing feed where visitor proximity naturally enhances community awareness. |
| **Harassment Feed** | `/harassment` | `HarassmentPage` | `PublicReportService.getBySegment` | `rpc/get_public_home_feed` (when loc available) / `rpc/get_public_published_reports` | `subcategoryId`, `district` | Proximity within category (when loc available) / Chronological | Category safety constraint is primary | Single view with district/subcat filters | `browseLocation` (transient in-memory) | **LOCATION-AWARE** | Browsing harassment incidents benefits from viewing closest local incidents first without relaxing category constraints. |
| **Rickshaw Charging Feed** | `/rickshaw` | `RickshawPage` | `PublicReportService.getBySegment` | `rpc/get_public_home_feed` (when loc available) / `rpc/get_public_published_reports` | `district` | Proximity within category (when loc available) / Chronological | Category safety constraint is primary | Single view with district filter | `browseLocation` (transient in-memory) | **LOCATION-AWARE** | Unsafe charging setups are hyper-local risks where proximity ordering directly assists neighborhood vigilance. |
| **Extortion Feed** | `/extortion` | `ExtortionPage` | `PublicReportService.getBySegment` | `rpc/get_public_home_feed` (when loc available) / `rpc/get_public_published_reports` | `subcategoryId`, `district` | Proximity within category (when loc available) / Chronological | Category extortion constraint is primary | Single view with district/subcat filters | `browseLocation` (transient in-memory) | **LOCATION-AWARE** | Localized extortion/toll problems benefit from geographic relevance within the category filter. |
| **Utility Issues Feed** | `/load-shedding` | `UtilityPage` | `PublicReportService.getBySegment` | `rpc/get_public_home_feed` (when loc available) / `rpc/get_public_published_reports` | `subcategoryId`, `district` | Proximity within category (when loc available) / Chronological | Category utility constraint is primary | Single view with district/subcat filters | `browseLocation` (transient in-memory) | **LOCATION-AWARE** | Power outages and load shedding reports are strongly localized to civic grids and benefit from proximity ordering. |
| **Search Results** | `/search` | `SearchPage` | `PublicReportService.getAll` | `rpc/get_public_published_reports` | Keyword query (`title`, `desc`, `location`, `subject`, `id`) | Query match relevance / Chronological fallback | Keyword relevance is absolute primary | Single view with category tabs | None | **LOCATION-NEUTRAL** | Search relevance must beat location. Proximity must not distort or override explicit keyword query intent. |
| **Search Modal Dialog** | Global Dialog | `SearchModal` | N/A (Navigation helper) | N/A | Category quick-links | N/A | Navigation intent | Modal | None | **LOCATION-NEUTRAL** | Lightweight navigation launcher; does not render report feeds. |
| **Location / District Feed** | `/location/:id` | `LocationPage` | `PublicReportService.getByLocation` | `rpc/get_public_published_reports` | `districtEn`/`districtBn` match | Chronological within explicit district | Explicit selected district is absolute primary | Single view with segment tabs | None | **LOCATION-NEUTRAL** | When a user explicitly chooses a district, that selection is the primary filter. Visitor GPS must never override or reshuffle an explicit choice. |
| **Subject Profile Feed** | `/subject/:id` | `SubjectPage` | `PublicReportService.getBySubject` | `rpc/get_public_published_reports` | `reportedSubject` match | Chronological within subject | Subject entity identity is absolute primary | Single view with response drawer | None | **LOCATION-NEUTRAL** | User is investigating a specific person/institution; visitor GPS must not suppress or alter report order. |
| **Report Detail Related Reports** | `/report-detail/:id` | `ReportDetailPage` | `PublicReportService.getById` + `getRelatedReports` | `rpc/get_public_published_report` + `rpc/get_public_published_reports` | `relatedReportIds` explicit array match | Explicit relational order | Topical & incident relatedness is absolute primary | Top 3 related cards | None | **LOCATION-NEUTRAL** | Relational linkage defined by report metadata takes precedence over proximity. |
| **Explore Analytics & Reports** | `/explore` | `ExplorePage` (incl. `RecentAreaReports`, `DistrictRankingPanel`, `PublicIncidentMap`) | `PublicReportService.getAll` | `rpc/get_public_published_reports` | `segment`, `subcategory`, `division`, `district`, `timeframe`, `hasEvidence`, `hasResponses` | User-selected sorting (Recent, District Rank) | Objective analytical & multi-filter exploration | Comprehensive multi-panel layout | None | **LOCATION-NEUTRAL** | Explore is an objective nationwide analytical portal; visitor location must not bias map bounds, rankings, or aggregated analytics. |
| **More / Knowledge Hub** | `/more` | `MorePage` | Static informational | N/A | Tab selection (`about`, `guide`, `helplines`, `principles`, `response`, `faq`) | Static | Informational / Educational / Safety guidance | Tabbed knowledge base | None | **LOCATION-NEUTRAL** | Contains zero dynamic report list feeds. |
| **Coming Soon (Illegal Occupation)** | `/illegal-occupation` | `ComingSoonPage` | Static configuration | N/A | N/A | N/A | Placeholder for unlaunched taxonomy segment | Single view | None | **LOCATION-NEUTRAL** | Unlaunched category placeholder; contains no active report feed. |
| **Report Composer Launcher** | `/report` | `ReportPage` | N/A (Modal launcher) | N/A | N/A | N/A | Complaint filing initiation | Single view | None | **LOCATION-NEUTRAL** | Submission workflow entry point; contains no public report feed. |

---

## 3. Surface-Specific Deep-Dive Decisions

### 3.1 Search
- **Classification**: `LOCATION-NEUTRAL`
- **Reasoning**: Search remains location-neutral because search relevance/current search semantics are primary and no trustworthy location-safe tie-break model exists. Passing visitor coordinates could artificially elevate geographically closer but textually irrelevant reports.

### 3.2 LocationPage (`/location/:id`)
- **Classification**: `LOCATION-NEUTRAL`
- **Reasoning**: User intent is explicit. When inspecting a specific district (e.g., Sylhet or Rajshahi), the visitor's current GPS location (e.g., Dhaka) must not bias or reorder the district's published reports.

### 3.3 Report Detail Related Reports
- **Classification**: `LOCATION-NEUTRAL`
- **Reasoning**: Incident continuity and shared case linkage take precedence over physical proximity to the visitor reading the screen.

### 3.4 MorePage
- **Classification**: `LOCATION-NEUTRAL` across all 6 sections (`about`, `guide`, `helplines`, `principles`, `response`, `faq`).

---

## 4. Backend & Database Audit

- **SQL Migrations**: No Phase 10/11 SQL migration required. Existing backend RPCs (`get_public_home_feed`, `get_public_published_reports`, `get_public_published_report`) satisfy all location and filter criteria with strict column sanitization.
- **Fail-Closed States**: In all failure conditions (`not_asked`, `not_now`, `denied`, `unavailable`, `error`), feeds query `get_public_published_reports` without coordinates, guaranteeing 100% feed availability and chronological accuracy.
