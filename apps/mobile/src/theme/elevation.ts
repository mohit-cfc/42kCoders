// The Paytm DS signature elevation is a 1px hairline border, not a blurred
// drop-shadow. We use a border for the hairline (RN's shadow* props can't
// render a solid-color hairline cleanly on Android) and reserve real shadows
// for floating elements: the voice FAB and bottom sheets.
import type { ViewStyle } from "react-native";

import { colors } from "./colors";

export const elevation = {
  // Default flat card — hairline border, no shadow.
  hairline: {
    borderWidth: 1,
    borderColor: colors.borderCard,
  } satisfies ViewStyle,

  // Raised cards (e.g. floating preview cards on the map).
  raised: {
    shadowColor: "#14336A",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  } satisfies ViewStyle,

  // Bottom sheets, popovers.
  sheet: {
    shadowColor: "#14336A",
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  } satisfies ViewStyle,

  // Blue-tinted FAB shadow.
  fab: {
    shadowColor: "#2480D6",
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  } satisfies ViewStyle,
};
