const HEATMAP_COLORS = {
  // Sequential density scale: lower concentration -> higher concentration.
  // Brand-aligned and intentionally avoids red/green severity semantics.
  low: '#BDE8DB',
  lowMedium: '#7FD0B7',
  medium: '#38AD8C',
  mediumHigh: '#287B65',
  high: '#1B4D6B',
} as const;

export const HEATMAP_TOKENS = {
  colors: HEATMAP_COLORS,
  cssGradient: `linear-gradient(to right, ${HEATMAP_COLORS.low} 0%, ${HEATMAP_COLORS.lowMedium} 30%, ${HEATMAP_COLORS.medium} 55%, ${HEATMAP_COLORS.mediumHigh} 80%, ${HEATMAP_COLORS.high} 100%)`,
  leafletGradient: {
    0.2: HEATMAP_COLORS.low,
    0.4: HEATMAP_COLORS.lowMedium,
    0.6: HEATMAP_COLORS.medium,
    0.8: HEATMAP_COLORS.mediumHigh,
    1.0: HEATMAP_COLORS.high,
  },
} as const;
