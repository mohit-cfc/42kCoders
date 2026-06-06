// Translated 1:1 from ~/Downloads/Paytm AI Design System/tokens/colors.css.
// Anchored on the Paytm wordmark (navy #002970 + cyan #00BAF2) and reconciled
// with working UI blues measured from the source Figma file.

export const colors = {
  // Brand — blue family
  cyan: "#00BAF2",
  cyan600: "#03A1D6",
  cyan100: "#DDF4FC",
  cyan050: "#EEFAFE",

  blue: "#3199E4",
  blue600: "#2480D6",
  blue100: "#E2F0FC",
  blue050: "#F2F8FE",

  navy: "#002970",
  navy800: "#0E467A",
  navy700: "#132256",
  periwinkle: "#577FCB",
  periwinkle300: "#859DD9",
  sky: "#B0CFEB",
  sky100: "#EAF2FB",

  // Header gradient endpoints
  headerFrom: "#98B9D8",
  headerTo: "#2480D6",

  // Neutral ink ramp
  ink900: "#0A0E1A",
  ink800: "#1A2233",
  ink700: "#36404F",
  ink600: "#5A6473",
  ink500: "#7E8794",
  ink300: "#C2C8D0",
  line200: "#E6E9EE",
  line100: "#F0F2F5",
  bgPage: "#F5F7FA",
  bgSubtle: "#FAFBFC",
  surface: "#FFFFFF",

  // Semantic
  success: "#1F8A4C",
  success500: "#2BA45C",
  successTint: "#E4F6EC",

  warning: "#C77A12",
  warning500: "#E8990F",
  warningTint: "#FCF1DD",

  danger: "#D63B3B",
  danger500: "#E75555",
  danger600: "#C32C2C",
  dangerTint: "#FCE7E7",

  info: "#2480D6",
  infoTint: "#E2F0FC",

  // AI surfaces (sparingly used)
  aiSurface: "#F4F9FE",
  aiSurfaceStrong: "#E8F1FB",
  aiBorder: "rgba(49, 153, 228, 0.30)",
  // AI sheen gradient stops — cyan → blue → navy
  aiSheen: ["#00BAF2", "#3199E4", "#002970"] as const,

  // Semantic aliases
  textPrimary: "#0A0E1A",
  textSecondary: "#5A6473",
  textMuted: "#7E8794",
  textDisabled: "#C2C8D0",
  textOnBrand: "#FFFFFF",
  textLink: "#3199E4",

  borderCard: "rgba(0, 0, 0, 0.10)", // signature hairline
  divider: "rgba(0, 0, 0, 0.08)",
} as const;

export type ColorKey = keyof typeof colors;
