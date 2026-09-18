import fs from 'node:fs';
import path from 'node:path';

const PUBLIC_UI_ROOTS = [path.resolve('src/components'), path.resolve('src/pages')];
const PUBLIC_UI_FILES = new Set([path.resolve('src/App.tsx')]);
const EXTENSIONS = new Set(['.tsx']);

const RULES = [
  {
    id: 'raw-color-literal',
    pattern: /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\s*\(/g,
    message: 'Raw color literal outside the central design-system token source',
  },
  {
    id: 'tailwind-palette-color',
    pattern: /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d+)?\b/g,
    message: 'Tailwind palette color bypasses semantic UI/category tokens',
  },
  {
    id: 'arbitrary-color-class',
    pattern: /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to)-\[(?:#|rgb|rgba|hsl|hsla|oklch)[^\]]*\]/g,
    message: 'Arbitrary color class bypasses design-system tokens',
  },
  {
    id: 'font-family-inline',
    pattern: /\bfontFamily\s*:/g,
    message: 'Local font-family override bypasses the global language-aware font token',
  },
  {
    id: 'tailwind-font-family',
    pattern: /\bfont-(?:sans|serif|mono)\b/g,
    message: 'Tailwind font-family utility bypasses the global font token',
  },
  {
    id: 'tailwind-font-weight',
    pattern: /\bfont-(?:normal|medium|semibold|bold)\b/g,
    message: 'Framework font-weight utility bypasses central typography weight tokens',
  },
  {
    id: 'arbitrary-type-size',
    pattern: /\btext-\[\d+(?:\.\d+)?(?:px|rem)\]/g,
    message: 'Hardcoded font size bypasses semantic typography tokens',
  },
  {
    id: 'legacy-fixed-type-alias',
    pattern: /text-\[var\(--type-fixed-[^)]+\)\]/g,
    message: 'Legacy fixed typography aliases are compatibility-only; use semantic typography roles',
  },
  {
    id: 'tailwind-type-scale',
    pattern: /\btext-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g,
    message: 'Tailwind font-size utility bypasses semantic typography tokens',
  },
  {
    id: 'arbitrary-line-height',
    pattern: /\bleading-\[(?!var\()[^\]]+\]/g,
    message: 'Hardcoded line-height bypasses semantic typography tokens',
  },
  {
    id: 'arbitrary-font-weight',
    pattern: /\bfont-\[\d+\]/g,
    message: 'Arbitrary font weight bypasses typography tokens',
  },
  {
    id: 'tailwind-radius',
    pattern: /\brounded-(?:sm|md|lg|xl|2xl|3xl|full)\b/g,
    message: 'Tailwind radius utility bypasses central radius utilities',
  },
  {
    id: 'arbitrary-radius',
    pattern: /\brounded-\[(?!var\()[^\]]+\]/g,
    message: 'Hardcoded radius bypasses central radius tokens',
  },
  {
    id: 'tailwind-shadow',
    pattern: /\bshadow-(?:2xs|xs|sm|md|lg|xl|2xl)\b|\bshadow(?!-)\b/g,
    message: 'Tailwind shadow utility bypasses central elevation tokens',
  },
  {
    id: 'arbitrary-shadow',
    pattern: /\bshadow-\[(?!var\()[^\]]+\]/g,
    message: 'Hardcoded shadow bypasses central elevation tokens',
  },
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const files = [
  ...PUBLIC_UI_ROOTS.flatMap(walk),
  ...[...PUBLIC_UI_FILES].filter((file) => fs.existsSync(file)),
];

const findings = [];

const APPROVED_MATERIAL_CORE = {
  light: {
    '--md-primary': '#1B4D6B',
    '--md-primary-variant': '#163B52',
    '--md-primary-active': '#245F82',
    '--md-on-primary': '#FFFFFF',
    '--md-secondary': '#3A7CA5',
    '--md-secondary-variant': '#163B52',
    '--md-on-secondary': '#FFFFFF',
    '--md-on-secondary-container': '#163B52',
    '--md-background': '#F0F2F5',
    '--md-on-background': '#050505',
    '--md-surface': '#FFFFFF',
    '--md-surface-subtle': '#F0F2F5',
    '--md-surface-elevated': '#FFFFFF',
    '--md-surface-hover': '#E4E6EB',
    '--md-on-surface': '#050505',
    '--md-on-surface-secondary': '#4F5459',
    '--md-on-surface-muted': '#65676B',
    '--md-outline-subtle': '#E4E6EB',
    '--md-outline': '#85888C',
    '--md-outline-strong': '#65676B',
    '--md-disabled-container': '#E4E6EB',
    '--md-on-disabled': '#65676B',
  },
  dark: {
    '--md-primary': '#327DA8',
    '--md-primary-variant': '#3B7DA4',
    '--md-primary-active': '#2B79A4',
    '--md-on-primary': '#FFFFFF',
    '--md-secondary': '#3A7CA5',
    '--md-secondary-variant': '#245F82',
    '--md-on-secondary': '#FFFFFF',
    '--md-on-secondary-container': '#BFDBFE',
    '--md-background': '#18191A',
    '--md-on-background': '#E4E6EB',
    '--md-surface': '#242526',
    '--md-surface-subtle': '#202122',
    '--md-surface-elevated': '#2B2D2F',
    '--md-surface-hover': '#303234',
    '--md-on-surface': '#E4E6EB',
    '--md-on-surface-secondary': '#B0B3B8',
    '--md-on-surface-muted': '#9CA0A6',
    '--md-outline-subtle': '#4E4F50',
    '--md-outline': '#7C8086',
    '--md-outline-strong': '#B0B3B8',
    '--md-disabled-container': '#3A3B3C',
    '--md-on-disabled': '#B0B3B8',
  },
};

const parseVariables = (source) =>
  Object.fromEntries(
    [...source.matchAll(/(--[a-z0-9-_]+)\s*:\s*([^;]+);/gi)].map((match) => [
      match[1],
      match[2].trim(),
    ])
  );

const extractThemeBlock = (source, theme) => {
  const startMarker =
    theme === 'light'
      ? ':root,\nhtml[data-theme="light"] {'
      : 'html[data-theme="dark"],\n.dark {';
  const endMarker =
    theme === 'light'
      ? '\n}\n\nhtml[data-theme="dark"],'
      : '\n}\n\n/* Compatibility aliases';

  const blockStart = source.indexOf(startMarker);
  const blockEnd = source.indexOf(endMarker, blockStart + startMarker.length);
  if (blockStart < 0 || blockEnd < 0) return '';
  return source.slice(blockStart + startMarker.length, blockEnd);
};

const relativeLuminance = (hex) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrastRatio = (a, b) => {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
};

const addContrastFinding = (file, theme, token, foreground, background, minimum = 4.5) => {
  if (!/^#[0-9a-fA-F]{6}$/.test(foreground) || !/^#[0-9a-fA-F]{6}$/.test(background)) return;
  const ratio = contrastRatio(foreground, background);
  if (ratio < minimum) {
    findings.push({
      file,
      line: 1,
      rule: 'color-role-contrast',
      token,
      message: `${theme} ${token} contrast is ${ratio.toFixed(2)}:1; minimum is ${minimum}:1`,
      source: `${foreground} on ${background}`,
    });
  }
};

const colorSystemFile = 'src/theme/color-system.css';
if (!fs.existsSync(colorSystemFile)) {
  findings.push({
    file: colorSystemFile,
    line: 1,
    rule: 'missing-color-authority',
    token: colorSystemFile,
    message: 'Public color system must have one dedicated authority file',
    source: 'File not found',
  });
} else {
  const source = fs.readFileSync(colorSystemFile, 'utf8');

  for (const theme of ['light', 'dark']) {
    const values = parseVariables(extractThemeBlock(source, theme));

    for (const [token, expected] of Object.entries(APPROVED_MATERIAL_CORE[theme])) {
      const actual = values[token];
      if (actual !== expected) {
        findings.push({
          file: colorSystemFile,
          line: 1,
          rule: 'semantic-color-drift',
          token,
          message: `Approved ${theme} Material role changed from ${expected} to ${actual || 'missing'}`,
          source: `${token}: ${actual || 'missing'}`,
        });
      }
    }

    addContrastFinding(colorSystemFile, theme, 'on-primary', values['--md-on-primary'], values['--md-primary']);
    addContrastFinding(colorSystemFile, theme, 'on-secondary', values['--md-on-secondary'], values['--md-secondary']);
    if (values['--md-secondary-container']?.startsWith('color-mix')) {
      const secondaryContainer = theme === 'light' ? '#E7EFF4' : '#28353D';
      addContrastFinding(
        colorSystemFile,
        theme,
        'on-secondary-container',
        values['--md-on-secondary-container'],
        secondaryContainer
      );
    }
    addContrastFinding(colorSystemFile, theme, 'on-background', values['--md-on-background'], values['--md-background']);
    addContrastFinding(colorSystemFile, theme, 'on-surface', values['--md-on-surface'], values['--md-surface']);
    addContrastFinding(colorSystemFile, theme, 'on-surface-secondary', values['--md-on-surface-secondary'], values['--md-surface']);
    addContrastFinding(colorSystemFile, theme, 'on-surface-muted', values['--md-on-surface-muted'], values['--md-surface']);

    // WCAG non-text/UI contrast: control boundaries and focus indicators.
    addContrastFinding(
      colorSystemFile,
      theme,
      'outline-on-surface',
      values['--md-outline'],
      values['--md-surface'],
      3
    );
    addContrastFinding(
      colorSystemFile,
      theme,
      'outline-on-subtle-surface',
      values['--md-outline'],
      values['--md-surface-subtle'],
      3
    );
    addContrastFinding(
      colorSystemFile,
      theme,
      'focus-on-surface',
      values['--md-focus'],
      values['--md-surface'],
      3
    );
    addContrastFinding(
      colorSystemFile,
      theme,
      'focus-on-subtle-surface',
      values['--md-focus'],
      values['--md-surface-subtle'],
      3
    );
    addContrastFinding(
      colorSystemFile,
      theme,
      'focus-on-elevated-surface',
      values['--md-focus'],
      values['--md-surface-elevated'],
      3
    );
    addContrastFinding(
      colorSystemFile,
      theme,
      'primary-on-surface',
      values['--md-primary'],
      values['--md-surface'],
      3
    );

    if (
      values['--md-outline-subtle'] === values['--md-outline'] ||
      values['--md-outline'] === values['--md-outline-strong'] ||
      values['--md-outline-subtle'] === values['--md-outline-strong']
    ) {
      findings.push({
        file: colorSystemFile,
        line: 1,
        rule: 'outline-role-collapse',
        token: theme,
        message: 'Outline subtle/default/strong roles must remain visually distinct',
        source: `${values['--md-outline-subtle']} / ${values['--md-outline']} / ${values['--md-outline-strong']}`,
      });
    }

    if (values['--md-on-surface-secondary'] === values['--md-on-surface-muted']) {
      findings.push({
        file: colorSystemFile,
        line: 1,
        rule: 'content-role-collapse',
        token: theme,
        message: 'Secondary and muted content roles must remain visually distinct',
        source: values['--md-on-surface-secondary'],
      });
    }

    if (
      theme === 'dark' &&
      (values['--md-surface'] === values['--md-surface-subtle'] ||
        values['--md-surface'] === values['--md-surface-elevated'] ||
        values['--md-surface-subtle'] === values['--md-surface-elevated'])
    ) {
      findings.push({
        file: colorSystemFile,
        line: 1,
        rule: 'dark-surface-role-collapse',
        token: 'dark-surfaces',
        message: 'Dark surface, subtle and elevated roles must remain visually distinct',
        source: `${values['--md-surface']} / ${values['--md-surface-subtle']} / ${values['--md-surface-elevated']}`,
      });
    }

    for (const semantic of ['success', 'warning', 'error', 'info']) {
      addContrastFinding(
        colorSystemFile,
        theme,
        `on-${semantic}`,
        values[`--md-on-${semantic}`],
        values[`--md-${semantic}`]
      );
      addContrastFinding(
        colorSystemFile,
        theme,
        `on-${semantic}-container`,
        values[`--md-on-${semantic}-container`],
        values[`--md-${semantic}-container`]
      );
    }

    for (const category of [
      'harassment',
      'extortion',
      'public_safety',
      'road_transport',
      'load_shedding',
      'illegal_occupation',
      'rickshaw',
    ]) {
      addContrastFinding(
        colorSystemFile,
        theme,
        `${category}-on-primary`,
        values[`--category-${category}-on-primary`],
        values[`--category-${category}-primary`]
      );
      addContrastFinding(
        colorSystemFile,
        theme,
        `${category}-on-container`,
        values[`--category-${category}-on-container`],
        values[`--category-${category}-container`]
      );
    }
  }

  const lightValues = parseVariables(extractThemeBlock(source, 'light'));
  const darkValues = parseVariables(extractThemeBlock(source, 'dark'));

  for (const category of [
    'harassment',
    'extortion',
    'public-safety',
    'road-transport',
    'load-shedding',
    'illegal-occupation',
    'rickshaw',
  ]) {
    const heroToken = `--hero-${category}-container`;
    const lightHero = lightValues[heroToken];
    const darkHero = darkValues[heroToken];

    if (!lightHero || !darkHero || lightHero === darkHero) {
      findings.push({
        file: colorSystemFile,
        line: 1,
        rule: 'hero-theme-parity',
        token: heroToken,
        message: 'Built-in hero backgrounds must define distinct light and dark values',
        source: `light=${lightHero || 'missing'}, dark=${darkHero || 'missing'}`,
      });
    }

    addContrastFinding(
      colorSystemFile,
      'light',
      `${category}-hero-primary-text`,
      lightValues['--hero-text-primary'],
      lightHero
    );
    addContrastFinding(
      colorSystemFile,
      'light',
      `${category}-hero-secondary-text`,
      lightValues['--hero-text-secondary'],
      lightHero
    );
    addContrastFinding(
      colorSystemFile,
      'dark',
      `${category}-hero-primary-text`,
      darkValues['--hero-text-primary'],
      darkHero
    );
    addContrastFinding(
      colorSystemFile,
      'dark',
      `${category}-hero-secondary-text`,
      darkValues['--hero-text-secondary'],
      darkHero
    );
  }

  for (const preset of ['sky', 'indigo', 'emerald', 'amber', 'rose', 'violet', 'slate']) {
    for (const [theme, values] of [
      ['light', lightValues],
      ['dark', darkValues],
    ]) {
      const primary = values[`--theme-preset-${preset}-primary`];
      const onPrimary = values[`--theme-preset-${preset}-on-primary`];
      const container = values[`--theme-preset-${preset}-container`];
      const onContainer = values[`--theme-preset-${preset}-on-container`];

      addContrastFinding(
        colorSystemFile,
        theme,
        `${preset}-managed-on-primary`,
        onPrimary,
        primary
      );
      addContrastFinding(
        colorSystemFile,
        theme,
        `${preset}-managed-on-container`,
        onContainer,
        container
      );
      addContrastFinding(
        colorSystemFile,
        theme,
        `${preset}-managed-primary-on-surface`,
        primary,
        values['--md-surface'],
        3
      );
    }
  }

  const compatibilityBlock = source.slice(source.indexOf('/* Compatibility aliases'));
  if (/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch)\s*\(/.test(compatibilityBlock)) {
    findings.push({
      file: colorSystemFile,
      line: 1,
      rule: 'compatibility-alias-literal',
      token: 'compatibility-alias',
      message: 'Compatibility aliases must reference Material/category roles and contain no color literals',
      source: 'Literal color found after compatibility alias marker',
    });
  }
}

for (const legacyAuthorityFile of ['src/index.css', 'src/theme/design-system.css']) {
  if (!fs.existsSync(legacyAuthorityFile)) continue;
  const source = fs.readFileSync(legacyAuthorityFile, 'utf8');
  if (/--ui-(?:page|surface|text-primary|border|primary-action-bg)\s*:/.test(source)) {
    findings.push({
      file: legacyAuthorityFile,
      line: 1,
      rule: 'duplicate-color-authority',
      token: '--ui-*',
      message: 'Core public color values must be owned only by theme/color-system.css',
      source: 'Legacy core color assignment found',
    });
  }
}

const typographyFile = 'src/index.css';
if (fs.existsSync(typographyFile)) {
  const source = fs.readFileSync(typographyFile, 'utf8');
  const rootStart = source.indexOf('@layer base {');
  const englishStart = source.indexOf('  html[lang="en"] {', rootStart);
  const tabletStart = source.indexOf('  @media (min-width: 768px) {', englishStart);
  const mobileRoot = source.slice(rootStart, englishStart);
  const mobileEnglish = source.slice(englishStart, tabletStart);

  const requiredMobileRoot = [
    '--type-body-size: 16px;',
    '--type-body-line: 26px;',
    '--type-h1-size-mobile: 28px;',
    '--type-h2-size-mobile: 22px;',
    '--type-h3-size-mobile: 18px;',
    '--type-h4-size-mobile: 16px;',
    '--type-label-size: 16px;',
    '--type-meta-size: 14px;',
    '--type-helper-size: 14px;',
    '--type-compact-size: 14px;',
    '--type-compact-line-mobile: 20px;',
  ];

  for (const token of requiredMobileRoot) {
    if (!mobileRoot.includes(token)) {
      findings.push({
        file: typographyFile,
        line: 1,
        rule: 'mobile-typography-contract',
        token,
        message: 'Mobile typography tokens must preserve the approved public scale',
        source: 'Expected approved mobile typography token is missing',
      });
    }
  }

  const requiredDesktopRoot = [
    '--type-h1-size-desktop: 32px;',
    '--type-h2-size-desktop: 24px;',
    '--type-h3-size-desktop: 20px;',
    '--type-h4-size-desktop: 18px;',
  ];

  for (const token of requiredDesktopRoot) {
    if (!mobileRoot.includes(token)) {
      findings.push({
        file: typographyFile,
        line: 1,
        rule: 'desktop-typography-contract',
        token,
        message: 'Desktop typography tokens must preserve the approved public scale',
        source: 'Expected approved desktop typography token is missing',
      });
    }
  }

  const requiredEnglishDesktop = [
    '--type-h1-size-desktop: 32px;',
    '--type-h2-size-desktop: 24px;',
    '--type-h3-size-desktop: 20px;',
    '--type-h4-size-desktop: 18px;',
  ];

  for (const token of requiredEnglishDesktop) {
    if (!mobileEnglish.includes(token)) {
      findings.push({
        file: typographyFile,
        line: 1,
        rule: 'desktop-english-heading-contract',
        token,
        message: 'English desktop headings must preserve the approved H1-H4 scale',
        source: 'Expected approved English desktop heading token is missing',
      });
    }
  }

  const requiredEnglishMobile = [
    '--type-h1-size-mobile: 28px;',
    '--type-h2-size-mobile: 22px;',
    '--type-h3-size-mobile: 18px;',
    '--type-h4-size-mobile: 16px;',
  ];

  for (const token of requiredEnglishMobile) {
    if (!mobileEnglish.includes(token)) {
      findings.push({
        file: typographyFile,
        line: 1,
        rule: 'mobile-english-heading-contract',
        token,
        message: 'English mobile headings must preserve the approved H1-H4 scale',
        source: 'Expected approved English mobile heading token is missing',
      });
    }
  }

  if (!source.includes('html[lang="bn"] .tracking-tight') || !source.includes('letter-spacing: normal !important;')) {
    findings.push({
      file: typographyFile,
      line: 1,
      rule: 'bengali-tracking',
      token: 'tracking-*',
      message: 'Bengali typography must neutralize Latin-oriented tracking utilities at every breakpoint',
      source: 'Expected Bengali mobile tracking normalization is missing',
    });
  }
}

const mainFile = 'src/main.tsx';
if (fs.existsSync(mainFile)) {
  const source = fs.readFileSync(mainFile, 'utf8');
  if (!source.includes("import './theme/color-system.css';")) {
    findings.push({
      file: mainFile,
      line: 1,
      rule: 'missing-color-system-import',
      token: 'color-system.css',
      message: 'Public app must load the centralized color-system authority',
      source: 'Expected color-system.css import is missing',
    });
  }
}

const tokensFile = 'src/theme/tokens.ts';
if (fs.existsSync(tokensFile)) {
  const source = fs.readFileSync(tokensFile, 'utf8');
  if (/#[0-9a-fA-F]{3,8}\b/.test(source)) {
    findings.push({
      file: tokensFile,
      line: 1,
      rule: 'token-color-literal',
      token: '#...',
      message: 'Static category/hero color values must resolve through theme/color-system.css',
      source: 'Raw hex color found in theme/tokens.ts',
    });
  }
}

const roleMigratedPrimitives = [
  'src/components/ui/Button.tsx',
  'src/components/ui/IconButton.tsx',
  'src/components/ui/FilterChip.tsx',
  'src/components/ui/Modal.tsx',
  'src/components/ui/Drawer.tsx',
  'src/components/ui/SearchInput.tsx',
  'src/components/ui/SearchableSelect.tsx',
  'src/components/ui/Checkbox.tsx',
  'src/components/ui/Accordion.tsx',
  'src/components/ui/EmptyState.tsx',
  'src/components/ui/Select.tsx',
];

for (const file of roleMigratedPrimitives) {
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  const legacyColorUtility = source.match(/\b(?:bg|text|border|ring|outline|fill|stroke)-ui-[a-z0-9-]+\b/);
  if (legacyColorUtility) {
    findings.push({
      file,
      line: 1,
      rule: 'legacy-color-utility-in-primitive',
      token: legacyColorUtility[0],
      message: 'Migrated shared primitives must consume Material role utilities directly',
      source: legacyColorUtility[0],
    });
  }
}

const taxonomyFile = 'src/services/taxonomyService.ts';
if (fs.existsSync(taxonomyFile)) {
  const source = fs.readFileSync(taxonomyFile, 'utf8');

  if (!source.includes('if (legacy && !hasManagedTheme)')) {
    findings.push({
      file: taxonomyFile,
      line: 1,
      rule: 'legacy-theme-inline-override',
      token: 'legacy-category-runtime-theme',
      message: 'Built-in categories must not receive inline runtime colors that override dark-mode category roles',
      source: 'Expected legacy theme guard is missing',
    });
  }

  if (!source.includes('clearRuntimeSectionCssVariables(segment.id)')) {
    findings.push({
      file: taxonomyFile,
      line: 1,
      rule: 'stale-runtime-theme',
      token: 'clearRuntimeSectionCssVariables',
      message: 'Switching back to a built-in theme must clear stale inline category role variables',
      source: 'Expected runtime color cleanup is missing',
    });
  }

  for (const role of ['primary', 'container', 'on-container', 'outline', 'on-primary']) {
    if (!source.includes(`--category-${'${safeId}'}-${role}`)) {
      findings.push({
        file: taxonomyFile,
        line: 1,
        rule: 'dynamic-category-role-missing',
        token: role,
        message: 'Runtime categories must publish the complete category role contract',
        source: `Missing category role: ${role}`,
      });
    }
  }

  if (/#[0-9a-fA-F]{3,8}\b/.test(source)) {
    findings.push({
      file: taxonomyFile,
      line: 1,
      rule: 'managed-theme-literal',
      token: '#...',
      message: 'Managed theme values must resolve through light/dark preset roles in color-system.css',
      source: 'Raw theme color found in taxonomyService.ts',
    });
  }

  for (const role of ['primary', 'hover', 'on-primary', 'container', 'on-container', 'outline']) {
    if (!source.includes(`--theme-preset-${'${presetKey}'}-${role}`)) {
      findings.push({
        file: taxonomyFile,
        line: 1,
        rule: 'managed-theme-role-missing',
        token: role,
        message: 'Admin-managed themes must consume the complete light/dark preset role contract',
        source: `Missing managed preset role: ${role}`,
      });
    }
  }
}

const featureIconFile = 'src/components/branding/FeatureIcon.tsx';
if (fs.existsSync(featureIconFile)) {
  const source = fs.readFileSync(featureIconFile, 'utf8');
  if (!source.includes("color: config?.colors.filledText || 'var(--md-on-primary)'")) {
    findings.push({
      file: featureIconFile,
      line: 1,
      rule: 'category-marker-on-primary',
      token: 'filledText',
      message: 'Category markers must use the category on-primary role instead of generic inverse text',
      source: 'Expected category filledText marker color is missing',
    });
  }
}

const searchInputFile = 'src/components/ui/SearchInput.tsx';
if (fs.existsSync(searchInputFile)) {
  const source = fs.readFileSync(searchInputFile, 'utf8');
  if (!source.includes('border-role-outline hover:border-role-outline-strong')) {
    findings.push({
      file: searchInputFile,
      line: 1,
      rule: 'control-boundary-role',
      token: 'border-role-outline',
      message: 'Search input must use the default control outline, reserving subtle outline for separators',
      source: 'Expected default/strong outline recipe is missing',
    });
  }
}

for (const heroFile of [
  'src/components/category/CategoryHeroSlider.tsx',
  'src/components/home/ServiceHeroCarousel.tsx',
]) {
  if (!fs.existsSync(heroFile)) continue;
  const source = fs.readFileSync(heroFile, 'utf8');
  if (source.includes('var(--ui-surface-subtle)') || source.includes('ring-ui-focus')) {
    findings.push({
      file: heroFile,
      line: 1,
      rule: 'hero-legacy-color-role',
      token: 'ui-*',
      message: 'Hero rendering must consume Material roles so dark-mode parity is preserved',
      source: 'Legacy hero color role reference found',
    });
  }
}

for (const file of files) {
  const relative = path.relative(process.cwd(), file).replaceAll('\\', '/');
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.includes('design-system-audit-ignore')) continue;
    for (const rule of RULES) {
      rule.pattern.lastIndex = 0;
      const matches = [...line.matchAll(rule.pattern)];
      for (const match of matches) {
        findings.push({
          file: relative,
          line: index + 1,
          rule: rule.id,
          token: match[0],
          message: rule.message,
          source: line.trim(),
        });
      }
    }
  }
}

if (findings.length) {
  const byRule = new Map();
  const byFile = new Map();
  const byRuleToken = new Map();
  for (const finding of findings) {
    byRule.set(finding.rule, (byRule.get(finding.rule) || 0) + 1);
    byFile.set(finding.file, (byFile.get(finding.file) || 0) + 1);
    const key = `${finding.rule}::${finding.token}`;
    byRuleToken.set(key, (byRuleToken.get(key) || 0) + 1);
  }

  console.error(`Public design-system audit found ${findings.length} violation(s) across ${byFile.size} UI file(s).`);
  console.error('\nBy rule:');
  for (const [rule, count] of [...byRule.entries()].sort((a, b) => b[1] - a[1])) {
    console.error(`  ${rule}: ${count}`);
    const tokens = [...byRuleToken.entries()]
      .filter(([key]) => key.startsWith(`${rule}::`))
      .map(([key, tokenCount]) => [key.slice(rule.length + 2), tokenCount])
      .sort((a, b) => b[1] - a[1]);
    console.error(`    ${tokens.map(([token, tokenCount]) => `${token}=${tokenCount}`).join(', ')}`);
  }
  console.error('\nBy file:');
  for (const [file, count] of [...byFile.entries()].sort((a, b) => b[1] - a[1])) {
    console.error(`  ${file}: ${count}`);
  }

  const verbose = process.env.AUDIT_VERBOSE === '1';
  const visibleFindings = verbose ? findings : findings.slice(0, 240);
  console.error(`\nDetails${verbose ? '' : ' (first 240; set AUDIT_VERBOSE=1 for all)'}:`);
  for (const item of visibleFindings) {
    console.error(`${item.file}:${item.line} [${item.rule}] ${item.token} — ${item.message}`);
    console.error(`  ${item.source}`);
  }
  process.exit(1);
}

console.log(`Public design-system audit passed across ${files.length} UI source file(s).`);
