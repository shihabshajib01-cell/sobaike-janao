# Public technical-quality 100% closure contract

This contract defines the engineering-quality gates required in addition to the existing design-system and UI-uniformity contracts. It does not mean software can never contain a future bug; it means the current Public release satisfies every explicit acceptance gate below and future changes are prevented from silently regressing them.

## Scope protection

The closure phase must not intentionally change:

- visual design, typography, spacing, colors, or established component behavior
- complaint taxonomy IDs or backend-owned labels
- report payloads, validation rules, submission semantics, or moderation workflow
- public RPC contracts, privacy guarantees, or location-ranking semantics
- Admin functionality or Supabase schema unless a verified regression requires it
- navigation IA, mobile navigation contract, EN/BN meaning, engagement/view/share semantics

## Required engineering gates

1. **Real source linting**
   - ESLint runs separately from TypeScript type checking.
   - React Hooks rules are enforced.
   - TypeScript remains a dedicated `typecheck` step.

2. **Focused executable unit tests**
   - Domain utilities and formatting rules have executable tests.
   - Tests run on every PR and `main` build.

3. **Automated accessibility regression**
   - Playwright + axe scans core routes in light and dark themes.
   - The report composer is included.
   - Third-party map internals may be excluded only when the exclusion is scoped to the Leaflet container.
   - Production smoke repeats the accessibility gate after deployment.

4. **Bundle regression protection**
   - Optional heavy workflows are code-split.
   - Report Composer must not return to the initial application bundle.
   - Main entry, per-chunk, CSS, and total-JS budgets are enforced after the production build.

5. **Architecture/complexity protection**
   - Optional secondary routes and the Report Composer remain lazy-loaded.
   - Existing large workflow files have explicit upper bounds so future changes cannot silently grow them.
   - New extraction/refactoring must preserve current data/state contracts and pass the full browser regression suite.

6. **Existing quality contracts remain mandatory**
   - dependency/security checks
   - design-system source audit
   - UI-uniformity source audit
   - TypeScript check
   - production build
   - Public Functional Smoke
   - Public UI 100% regression closure smoke
   - Pages deployment and Production Smoke

## Release closure

The technical-quality phase is eligible to close only when all pre-merge gates pass on the exact PR head and all post-merge production gates pass on the exact merged SHA.
