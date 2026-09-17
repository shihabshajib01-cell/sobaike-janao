# Public design-system 100% match contract

This release consolidates the Public UI onto one semantic design system without changing routes, APIs, reporting logic, taxonomy IDs, SQL contracts, or Admin workflows.

## Acceptance contract

- Semantic light/dark surfaces, text, borders, actions, feedback and category colors resolve through the shared design-system layer.
- Shared UI primitives own buttons, icon buttons, chips, badges, cards, controls, radius and elevation behavior.
- Public page gutters and desktop rail/workspace sizing resolve from central variables.
- Typography uses the existing role tokens (`type-h1`…`type-h4`, body, label, action, meta/helper) instead of page-specific sizing where a semantic role exists.
- Minimum interactive control height is 44px.
- EN/BN, light/dark, mobile/tablet/desktop and accessibility behavior are preserved.
- No data-contract or business-logic changes are part of this release.

## Regression protection

The release is merged only after exact-head CI and production smoke tests pass. Any page-specific visual differences must still resolve from the shared semantic tokens rather than new hard-coded colors.
