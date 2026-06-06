import { ChevronRight, MapPin } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ViewStyle } from "react-native";

import { colors, elevation, fonts, fontSize, radii, spacing } from "../theme";
import { Badge } from "./Badge";
import { IconCircle } from "./IconCircle";

interface VendorCardProps {
  title: string;
  category: string;
  distanceM: number;
  acceptsPaytm?: boolean;
  // Lucide icon component — drawn inside the leading IconCircle.
  icon?: React.ReactNode;
  description?: string | null;
  raised?: boolean;
  trailing?: "chevron" | "none";
  onPress?: () => void;
  style?: ViewStyle;
}

function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function VendorCard({
  title,
  category,
  distanceM,
  acceptsPaytm = true,
  icon,
  description,
  raised = false,
  trailing = "chevron",
  onPress,
  style,
}: VendorCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        raised ? elevation.raised : elevation.hairline,
        {
          backgroundColor: pressed ? colors.blue050 : colors.surface,
        },
        style,
      ]}
    >
      <IconCircle size={40}>
        {icon ?? <MapPin size={20} color={colors.navy800} strokeWidth={2} />}
      </IconCircle>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {category} · {formatDistance(distanceM)} away
        </Text>
        {description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        {acceptsPaytm && (
          <View style={styles.badgeRow}>
            <Badge label="Paytm accepted" tone="brand" dot />
          </View>
        )}
      </View>
      {trailing === "chevron" && (
        <ChevronRight size={20} color={colors.ink500} strokeWidth={2} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sp4,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.cardPad,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  desc: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badgeRow: {
    marginTop: 6,
  },
});
