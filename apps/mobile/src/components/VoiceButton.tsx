import { Mic } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { colors, elevation } from "../theme";

interface VoiceButtonProps {
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

// Round FAB clad in the DS "AI sheen" gradient (cyan → blue → navy). UI-only:
// no recording wired up yet.
export function VoiceButton({ size = 48, onPress, style }: VoiceButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Voice search"
      style={({ pressed }) => [
        styles.wrap,
        elevation.fab,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        style,
      ]}
    >
      <Svg
        width={size}
        height={size}
        style={StyleSheet.absoluteFill}
        viewBox="0 0 100 100"
      >
        <Defs>
          <LinearGradient id="aiSheen" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.aiSheen[0]} />
            <Stop offset="0.5" stopColor={colors.aiSheen[1]} />
            <Stop offset="1" stopColor={colors.aiSheen[2]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" rx="50" fill="url(#aiSheen)" />
      </Svg>
      <View style={styles.icon}>
        <Mic size={size * 0.45} color="#fff" strokeWidth={2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
});
