import { Search, X } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { TextInputProps, ViewStyle } from "react-native";

import { colors, elevation, fonts, fontSize, radii, spacing } from "../theme";

interface SearchBarProps {
  // Used as a read-only tap target: tapping fires onPress, the field never
  // receives focus. Lets HomeScreen show a "search bar" without wiring real
  // text submission yet.
  asButton?: boolean;
  onPress?: () => void;

  value?: string;
  onChangeText?: (next: string) => void;
  onSubmitEditing?: () => void;
  onClear?: () => void;
  placeholder?: string;
  style?: ViewStyle;
  textInputProps?: Omit<
    TextInputProps,
    "value" | "onChangeText" | "onSubmitEditing" | "placeholder" | "style"
  >;
}

export function SearchBar({
  asButton = false,
  onPress,
  value,
  onChangeText,
  onSubmitEditing,
  onClear,
  placeholder = "Search for chai, pani puri, repair…",
  style,
  textInputProps,
}: SearchBarProps) {
  const content = (
    <View style={styles.row}>
      <Search size={18} color={colors.ink600} strokeWidth={2} />
      {asButton ? (
        <Text style={styles.placeholder} numberOfLines={1}>
          {placeholder}
        </Text>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor={colors.ink500}
          style={styles.input}
          returnKeyType="search"
          {...textInputProps}
        />
      )}
      {!asButton && value && value.length > 0 && (
        <Pressable onPress={onClear} hitSlop={8} style={styles.clearBtn}>
          <X size={16} color={colors.ink500} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );

  if (asButton) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.field,
          elevation.hairline,
          {
            backgroundColor: pressed ? colors.blue050 : colors.surface,
          },
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.field, elevation.hairline, style]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    height: 48,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sp3,
  },
  placeholder: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.ink500,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  clearBtn: {
    padding: 4,
  },
});
