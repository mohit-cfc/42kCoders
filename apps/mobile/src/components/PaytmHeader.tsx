import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { colors, fonts, fontSize, spacing } from "../theme";

interface PaytmHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  // Rendered inside the gradient below the title row. Useful for a search bar
  // or filter chips that visually belong to the header chrome.
  bottomSlot?: React.ReactNode;
}

// App-bar gradient (vertical: headerFrom → headerTo) per the Paytm DS. The
// underlying Svg fills the full header area; content sits on top.
export function PaytmHeader({
  title,
  subtitle,
  onBack,
  rightSlot,
  bottomSlot,
}: PaytmHeaderProps) {
  const insets = useSafeAreaInsets();
  const topPad = insets.top + spacing.sp3;

  return (
    <View style={{ paddingTop: topPad, paddingBottom: spacing.sp5 }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id="paytmHeader" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.headerFrom} />
            <Stop offset="1" stopColor={colors.headerTo} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#paytmHeader)" />
      </Svg>
      <View style={styles.row}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <ArrowLeft size={22} color="#fff" strokeWidth={2} />
          </Pressable>
        )}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightSlot}
      </View>
      {bottomSlot ? <View style={styles.bottomSlot}>{bottomSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.screenPad,
    gap: spacing.sp3,
    minHeight: 48,
  },
  bottomSlot: {
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.sp4,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: "#fff",
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: "rgba(255,255,255,0.85)",
  },
});
