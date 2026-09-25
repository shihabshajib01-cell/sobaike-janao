# Upazila / Thana map data contract — 2026-09-25

## Canonical hierarchy

Production SQL remains the taxonomy source of truth: **8 divisions, 64 districts, 601 combined upazila / metropolitan-thana records**. The 601 count is a product registry and must not be described as 601 government upazilas.

## Verified geometry coverage

The map publishes **544 canonical polygon matches** and explicitly marks **57 canonical records without a verified polygon**. Every one of the 601 records remains selectable in its correct district. Missing boundaries are never guessed, split, merged, or borrowed from a parent area.

Of the 544 published polygons:
- **542** come from geoBoundaries gbOpen BGD ADM3, crosswalked against the production registry using district-scoped names/aliases and conservative unique spelling matching.
- **2** previously verified polygons (Lakshmipur → Raipur and Dhaka → Tejgaon Industrial Area) are retained from the user-provided `bd_district_map(1).html`.
- Two legacy labels are explicitly source-verified: **Zianagar → Indurkani** and **Chittagong Port / Port Police Station → Bandar**.

The geoBoundaries geometry represents **2020** subdistrict boundaries. Current geoBoundaries metadata identifies Bangladesh Bureau of Statistics (BBS) / OCHA ROAP as the source and **CC BY 3.0 IGO** as the license. It is reference geometry; it is not presented as proof that every polygon is a legally current 2026 metropolitan jurisdiction.

## Product behavior

Public Explore keeps Bangladesh-only geography and Division → District → Upazila / Thana navigation. All **601** canonical records are listed. A polygon is drawn only for the **544** verified matches. Selecting one of the remaining **57** records keeps the correct district context and clearly states that a verified boundary is unavailable. Public report counts remain district-level unless privacy-safe precise coordinates are explicitly available; text-only locations are never silently assigned to polygons.

Admin continues to use the authenticated `admin_get_location_taxonomy()` contract and hard-validates **8 / 64 / 601**. Admin filters use canonical IDs/names, never geometry labels.

## Regression rules

A release must fail if SQL is not 8/64/601; if a polygon lacks a canonical ID/parent; if a canonical ID has duplicate polygons; if verified + unsupported statuses do not total 601; if unmatched historical polygons reappear as current locations; or if an unsupported boundary is fabricated.

Per-record status is in `docs/upazila-map-coverage-crosswalk.json`.
