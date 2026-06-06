import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { colors, elevation, motion, radii, spacing } from "../theme";

interface BottomSheetContentProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// Slide-up sheet built from Modal + Animated.View. Backdrop press dismisses;
// no swipe gestures (would require react-native-gesture-handler).
export function BottomSheetContent({
  visible,
  onClose,
  children,
}: BottomSheetContentProps) {
  const translate = useRef(new Animated.Value(0)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translate, {
          toValue: 1,
          duration: motion.normal,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 1,
          duration: motion.normal,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translate.setValue(0);
      backdrop.setValue(0);
    }
  }, [visible, translate, backdrop]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdrop.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          elevation.sheet,
          {
            transform: [
              {
                translateY: translate.interpolate({
                  inputRange: [0, 1],
                  outputRange: [600, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.body}>{children}</View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 14, 26, 0.4)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sp3,
    paddingBottom: spacing.sp7,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line200,
    marginBottom: spacing.sp4,
  },
  body: {
    paddingHorizontal: spacing.sp6,
    gap: spacing.sp4,
  },
});
