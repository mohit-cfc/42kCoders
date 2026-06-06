import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ViewStyle } from "react-native";

import { colors, fonts, fontSize, radii } from "../theme";

export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "brand"
  | "ai";

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
  style?: ViewStyle;
}

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.line100, fg: colors.ink700 },
  info: { bg: colors.infoTint, fg: colors.info },
  success: { bg: colors.successTint, fg: colors.success },
  warning: { bg: colors.warningTint, fg: colors.warning },
  danger: { bg: colors.dangerTint, fg: colors.danger },
  brand: { bg: colors.cyan100, fg: colors.cyan600 },
  ai: { bg: colors.aiSurfaceStrong, fg: colors.blue },
};

export function Badge({ label, tone = "neutral", dot = false, style }: BadgeProps) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: t.fg }]} />}
      <Text style={[styles.label, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.pill,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.xs2,
    lineHeight: fontSize.xs2 * 1.2,
  },
});
