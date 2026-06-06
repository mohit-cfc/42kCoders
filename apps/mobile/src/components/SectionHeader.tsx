import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ViewStyle } from "react-native";

import { colors, fonts, fontSize } from "../theme";

interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
  style?: ViewStyle;
}

export function SectionHeader({ title, action, style }: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title}>{title}</Text>
      {action && (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={styles.action}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
  },
  action: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.xs,
    color: colors.blue,
  },
});
