import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { PressableProps, ViewStyle } from "react-native";

import { colors, fonts, fontSize, radii, spacing } from "../theme";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "navy"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface PrimaryButtonProps extends Omit<PressableProps, "style" | "children"> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
}

const sizeStyles: Record<
  ButtonSize,
  { height: number; padX: number; fontSize: number }
> = {
  sm: { height: 32, padX: 14, fontSize: fontSize.xs },
  md: { height: 40, padX: 18, fontSize: fontSize.sm },
  lg: { height: 48, padX: 24, fontSize: fontSize.md },
};

const variantBg: Record<ButtonVariant, string> = {
  primary: colors.blue,
  secondary: colors.surface,
  ghost: "transparent",
  navy: colors.navy,
  danger: colors.danger500,
};

const variantPressedBg: Record<ButtonVariant, string> = {
  primary: colors.blue600,
  secondary: colors.blue050,
  ghost: colors.blue050,
  navy: colors.navy700,
  danger: colors.danger600,
};

const variantFg: Record<ButtonVariant, string> = {
  primary: colors.textOnBrand,
  secondary: colors.blue,
  ghost: colors.blue,
  navy: colors.textOnBrand,
  danger: colors.textOnBrand,
};

export function PrimaryButton({
  label,
  variant = "primary",
  size = "lg",
  block = false,
  loading = false,
  disabled,
  iconLeft,
  iconRight,
  style,
  ...rest
}: PrimaryButtonProps) {
  const sz = sizeStyles[size];
  const fg = variantFg[variant];
  const isOutlined = variant === "secondary";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          height: sz.height,
          paddingHorizontal: sz.padX,
          backgroundColor: pressed
            ? variantPressedBg[variant]
            : variantBg[variant],
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        isOutlined && {
          borderWidth: 1,
          borderColor: colors.blue,
        },
        block && { alignSelf: "stretch" },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {iconLeft}
          <Text
            style={[
              styles.label,
              { color: fg, fontSize: sz.fontSize },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {iconRight}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sp3,
  },
  label: {
    fontFamily: fonts.semibold,
  },
});
