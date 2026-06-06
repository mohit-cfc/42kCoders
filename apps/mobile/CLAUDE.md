# Dhundho Mobile — CLAUDE.md
> Bare React Native (no Expo) app for street-vendor discovery: search → map pins → Paytm UPI pay.
> Scoped to `apps/mobile`. The root `../../CLAUDE.md` covers the whole product — read it for context.

> **Native setup:** the Android project is not generated yet. See `README.md` for the one-time
> Expo→bare-RN eject (CLI init, AndroidManifest perms, Maps key). Don't duplicate those steps here.

---

## Structure
```
src/
├── App.tsx                # SafeAreaProvider + NavigationContainer + stack
├── config.ts              # API_BASE_URL, GOOGLE_MAPS_API_KEY, DEFAULT_RADIUS_KM
├── types.ts               # Vendor, SearchResponse, Category, CreateVendorRequest — mirrors backend
├── navigation/index.tsx   # React Navigation v6 native-stack: Home, Map, Onboard
├── services/api.ts        # axios client: searchText, getCategories, createVendor, getVendor
├── hooks/
│   ├── useLocation.ts     # device GPS (@react-native-community/geolocation)
│   └── useAudioRecorder.ts# voice capture (react-native-audio-recorder-player)
└── screens/
    ├── HomeScreen.tsx     # search bar + mic + "Register my shop"
    ├── MapScreen.tsx      # react-native-maps pins + bottom sheet w/ "Pay Now"
    └── OnboardScreen.tsx  # vendor registration form
```

---

## Conventions
- **No Expo.** Bare RN + React Navigation v6 (native-stack).
- **All backend I/O goes through `src/services/api.ts`**, typed against `src/types.ts`. `types.ts` mirrors the backend's `app/schemas.py` — keep them in sync; don't scatter raw `axios`/`fetch` calls in screens.
- **Device GPS only.** Get coordinates from `useLocation` — never hardcode lat/lng.
- **Map-first UX**, not chat. Search returns vendors → render as map pins; tapping a pin opens a sheet with "Pay Now".
- **Paytm deep link**: `paytm://pay?pa={upi_id}&pn={vendor_name}&cu=INR` via `Linking`, with `https://paytm.me/{upi_id}` fallback when the app isn't installed.
- Set `API_BASE_URL` / `GOOGLE_MAPS_API_KEY` in `src/config.ts`. On a physical device use your machine's **LAN IP**, not `localhost`.

---

## Current state
- **Ready to use:** `src/services/api.ts` and `src/types.ts` are real and match the backend contract.
- **Placeholders with TODOs:** all three screens and both hooks — these are yours to build out.
- **Not generated yet:** the native `android/` project, `index.js`, `metro.config.js`, `babel.config.js` (see `README.md`).

---

## Running (after the native eject in README.md)
```bash
pnpm --filter mobile start      # Metro
pnpm --filter mobile android    # build + install on device/emulator
pnpm --filter mobile typecheck  # tsc --noEmit (works now, before the eject)
```

---

## Do NOT
- Use Expo or expo-* packages.
- Call Sarvam / any AI directly from the app — record audio and POST it to the backend; AI lives on the backend only.
- Hardcode coordinates — always use `useLocation`.
