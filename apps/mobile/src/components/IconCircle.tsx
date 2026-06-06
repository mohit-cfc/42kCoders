import React from "react";
import { StyleSheet, View } from "react-native";
import type { ViewStyle } from "react-native";

import { colors } from "../theme";

interface IconCircleProps {
  children: React.ReactNode;
  size?: number;
  bg?: string;
  style?: ViewStyle;
}

export function IconCircle({
  children,
  size = 36,
  bg = colors.blue100,
  style,
}: IconCircleProps) {
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
