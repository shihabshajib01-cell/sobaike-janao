# Public Color System — Material Role Contract

The Public UI uses a Material Design 2 inspired color-role architecture while preserving the approved Sobaike Janao visual identity.

## Authority

`src/theme/color-system.css` is the only source of public color values.

Do not add product, surface, semantic, category, hero, or media color literals to page/component files, `src/index.css`, or `src/theme/design-system.css`.

## Layers

1. **Product roles** — primary, secondary, background, surface, outline, focus, disabled.
2. **Semantic roles** — success, warning, error, info, validation, destructive.
3. **Category roles** — primary, on-primary, container, on-container, outline, hover.
4. **Specialized roles** — hero and media-viewer roles where the experience needs a distinct canvas.

## Product roles

Use the Material-style CSS variables:

- `--md-primary`
- `--md-primary-variant`
- `--md-primary-active`
- `--md-on-primary`
- `--md-secondary`
- `--md-secondary-variant`
- `--md-on-secondary`
- `--md-background`
- `--md-on-background`
- `--md-surface`
- `--md-surface-subtle`
- `--md-surface-elevated`
- `--md-surface-hover`
- `--md-on-surface`
- `--md-on-surface-secondary`
- `--md-on-surface-muted`
- `--md-outline-subtle`
- `--md-outline`
- `--md-outline-strong`
- `--md-focus`

Tailwind utilities are exposed as `role-*`, for example:

- `bg-role-primary`
- `text-role-on-primary`
- `bg-role-surface`
- `text-role-on-surface`
- `border-role-outline`
- `ring-role-focus`

New shared primitives should use these role utilities directly.

## Semantic roles

Success, warning, error, and info each have:

- solid role
- on-solid role
- container
- on-container
- outline

Validation and destructive actions remain explicit semantic extensions because they have different interaction responsibilities.

Do not use category colors to represent success, warning, error, validation, or destructive actions.

## Category roles

Each category has:

- `primary`
- `on-primary`
- `container`
- `on-container`
- `outline`
- `hover`

Example:

```css
--category-harassment-primary
--category-harassment-on-primary
--category-harassment-container
--category-harassment-on-container
--category-harassment-outline
--category-harassment-hover
```

Category colors identify category context. They should not control generic buttons, navigation, forms, modals, validation, or global interaction states.

## Runtime/Admin categories

Admin-managed theme presets must produce the same category role contract.

Admin-managed presets define explicit light and dark `primary`, `hover`, `on-primary`, `container`, `on-container`, and `outline` roles in `color-system.css`. Runtime taxonomy only binds a category to those preset roles, so theme switching does not depend on stale inline light-mode values.

Existing built-in categories must never receive inline runtime overrides; their light/dark roles come from `color-system.css`.

## Compatibility

Legacy `ui-*` and `sec-*` variables remain as aliases while existing page code is migrated safely.

They must not contain independent color values.

Do not add new UI code using legacy color utilities when a `role-*` utility exists.

## Accessibility

Automated design-system checks enforce:

- normal text contrast of at least 4.5:1 for protected role pairs
- non-text/control and focus contrast of at least 3:1 where boundaries or indicators are required
- distinct outline subtle/default/strong roles
- distinct dark surface/subtle/elevated roles
- distinct secondary/muted content roles
- category on-primary contrast
- category on-container contrast
- semantic solid and container contrast
- managed Admin theme contrast in both light and dark themes
- hero light/dark parity and hero text contrast
- category marker use of the category `on-primary` role
- no duplicate core color authority
- no raw static category/hero hex values outside the color authority
- no legacy color utilities in migrated shared primitives

## Migration rule

Use the smallest safe change:

1. migrate shared primitive first;
2. preserve current behavior and appearance;
3. keep compatibility aliases for untouched pages;
4. verify light/dark and category states;
5. remove aliases only when no consumers remain.

This is a color-system rebuild, not a component-library or business-logic redesign.
