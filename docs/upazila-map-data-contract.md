# Upazila map drilldown — source control and limitations

Current source: user-uploaded `bd_district_map(1).html`; SHA-256 `03c58c72155b5911199be955186ae7c54316da7ea72d6ed057738e0dc2eb2805`. Its separate `UPAZILA_GEOJSON` contains **498 features spanning all 64 district P-codes**. The public map does not use its amCharts dependencies, sample `Math.random()` values, or UI styles. It reuses the existing Leaflet and current design system.

The existing deployed district dataset remains the canonical parent geography with 64 unique `ADM2_PCODE` values. Parent joins use explicit `BD` + first four characters of the uploaded six-digit upazila code. This was verified against every uploaded feature; no normalized-name geography joins are used.

Performance: exported eight static, compressed-friendly assets partitioned by the existing division, loaded only after selecting a district; no upazila geometry increases the initial app/map bundle.

**Critical taxonomy discrepancy:** The production `public.bangladesh_upazilas` table contains **601 rows**, whereas the uploaded file provides **498 polygons**. Exactly **351** source upazila names/aliases uniquely match an existing canonical SQL record within the correct district; those assets carry the verified canonical ID and existing Bengali name. The other **147** geometries have no independently confirmed SQL identity and remain geographic reference only. The dataset also has no independently verified upazila-specific publication date or reuse license. It must not replace, delete, or redefine the current 601-row SQL taxonomy.

**Geometry concern:** Shapely detected a self-intersection in the source's Mehendiganj MultiPolygon (source P-code 100662). It needs a separate source-verified geometry correction before any precise coordinate report attribution to that polygon is treated as authoritative.

**Product scope:** Selecting a district exposes the available upazila polygons, a dropdown, click/keyboard selection, a back action, and coordinate-confirmed public reports when available. Text-only district reports are never guessed into upazilas. Existing report filters, forms, publication, SQL, admin, mobile, EN/BN, theme modes, and density/point layers remain unchanged. For historical polygons without an independently verified Bengali label, retain the source English name rather than fabricate a translation.

**Not completed by the uploaded file:** Authoritative and current coverage for all 601 canonical upazilas, SQL-level location consistency for the 147 unmatched shapes, upazila attribution for location-text-only published reports, or full public/SQL/admin upazila filtering. Reconcile those separately with source-verified official geographic and report-location evidence before claiming complete upazila-level reporting.
