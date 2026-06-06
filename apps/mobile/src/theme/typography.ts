// Translated from ~/Downloads/Paytm AI Design System/tokens/typography.css.
// Inter shipped as a native asset; fontFamily matches the TTF stem.
import type { TextStyle } from "react-native";

import { colors } from "./colors";

export const fonts = {
  regular: "Inter-Regular",
  medium: "Inter-Medium",
  semibold: "Inter-SemiBold",
  bold: "Inter-Bold",
} as const;

// 10 / 12 / 13 / 15 / 16 / 20 / 24 / 32 — mobile-first ramp.
export const fontSize = {
  xs2: 10,
  xs: 12,
  sm: 13,
  md: 15,
  lg: 16,
  xl: 20,
  xl2: 24,
  xl3: 32,
} as const;

export const text = {
  display: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl3,
    lineHeight: fontSize.xl3 * 1.1,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  } satisfies TextStyle,
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * 1.25,
    color: colors.textPrimary,
  } satisfies TextStyle,
  // Section title in cards.
  section: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.25,
    color: colors.textPrimary,
  } satisfies TextStyle,
  body: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.45,
    color: colors.textPrimary,
  } satisfies TextStyle,
  bodySm: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.45,
    color: colors.textSecondary,
  } satisfies TextStyle,
  meta: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.45,
    color: colors.textMuted,
  } satisfies TextStyle,
  caps: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xs2,
    lineHeight: fontSize.xs2 * 1.1,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textMuted,
  } satisfies TextStyle,
};
