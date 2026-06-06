import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import type { ViewStyle } from "react-native";

import { colors, fonts, fontSize, radii, spacing } from "../theme";

interface CategoryChipProps {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function CategoryChip({
  label,
  icon,
  active = false,
  onPress,
  style,
}: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active || pressed ? colors.blue050 : colors.surface,
          borderColor: active || pressed ? colors.blue : colors.line200,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.label,
          { color: active ? colors.blue600 : colors.ink800 },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 36,
    marginRight: spacing.sp3,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
  },
});
