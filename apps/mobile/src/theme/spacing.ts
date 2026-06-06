// Translated from ~/Downloads/Paytm AI Design System/tokens/spacing.css.
// 4px-based scale, screen gutter 14, card pad 16, card gap 12. Radii follow
// the DS: chips 5, default card 10, AI cards 14, bottom sheets 20, pill 999.

export const spacing = {
  sp0: 0,
  sp1: 2,
  sp2: 4,
  sp3: 8,
  sp4: 12,
  sp5: 16,
  sp6: 20,
  sp7: 24,
  sp8: 32,
  sp9: 40,
  sp10: 48,
  sp12: 64,

  screenPad: 14,
  cardPad: 16,
  cardGap: 12,
} as const;

export const radii = {
  xs: 4,
  sm: 5,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const motion = {
  fast: 140,
  normal: 220,
  slow: 320,
} as const;
