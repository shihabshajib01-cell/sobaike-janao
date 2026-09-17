# Public UI uniformity 100% match contract

This contract defines the product-wide UI patterns that must remain shared after the design-system consolidation.

## Required shared patterns

- All category feeds use the same `CategoryFeedView` for the report heading, published count, subcategory rail, loading state, retry state, empty state, and report-card list.
- Horizontal navigation rails use `HorizontalScrollRail`; desktop arrows are state-aware and cross-browser while touch, trackpad, wheel, keyboard, and direct scrolling remain available.
- Search uses the shared `SearchInput`, `Button`, `Select`, and horizontal rail primitives.
- Information & Support tabs use the same shared horizontal rail and button primitives.
- Category-specific business rules remain in their owning page/filter logic and are injected into the shared presentation rather than copied into a new visual shell.
- Shared semantic typography, surfaces, borders, radius, elevation, focus and 44px interaction rules remain mandatory.

## Scope protection

This consolidation must not change:

- report payloads or validation rules
- taxonomy IDs or labels sourced from the backend
- location ranking or privacy behavior
- moderation or publication workflow
- engagement/view/share behavior
- routes or public RPC contracts
- mobile navigation behavior
- EN/BN business copy meaning

## Regression gates

A release is eligible to merge only when all of the following pass on the exact PR head:

1. dependency/security checks
2. design-system source audit
3. UI uniformity source audit
4. TypeScript check
5. production build
6. branch browser regression where required
7. post-merge Pages deployment, Production Smoke, and Public Functional Smoke
