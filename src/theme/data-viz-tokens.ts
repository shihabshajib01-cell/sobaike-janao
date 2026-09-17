const HEATMAP_COLORS = {
  low: '#2563EB',
  lowMedium: '#06B6D4',
  medium: '#10B981',
  mediumHigh: '#F59E0B',
  high: '#EF4444',
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
