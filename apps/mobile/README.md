# Dhundho Mobile (bare React Native)

This folder holds the JS/TS starting point (`src/`). The **native Android project
is not generated yet** — the frontend owner runs the one-time eject below.

## One-time native setup (run these yourself)

1. Generate a bare RN project in a scratch dir **outside** this repo and copy the
   native + entry files in:
   ```
   npx @react-native-community/cli init DhundhoTmp --version 0.74.1
   ```
   Copy into `apps/mobile/`: `android/`, `index.js`, `metro.config.js`,
   `babel.config.js`, `.watchmanconfig`. Do **not** copy its `package.json` or
   `node_modules`. Point `index.js` at `./src/App`.

2. From the repo root: `pnpm install` (the root `.npmrc` sets
   `node-linker=hoisted`, required for RN autolinking under pnpm).

3. In `android/app/src/main/AndroidManifest.xml`:
   - permissions: `INTERNET`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `RECORD_AUDIO`
   - Google Maps key: `<meta-data android:name="com.google.android.geo.API_KEY" android:value="..."/>`
   - Paytm deep link visibility (Android 11+): `<queries><package android:name="net.one97.paytm"/></queries>`
   - dev only: `android:usesCleartextTraffic="true"` (so `http://<LAN-IP>:8000` works)

4. Run:
   ```
   pnpm --filter mobile start          # Metro
   pnpm --filter mobile android        # build + install
   ```

Set `API_BASE_URL` and `GOOGLE_MAPS_API_KEY` in `src/config.ts` (use your LAN IP
on a physical device, not `localhost`).

## What's here

- `src/services/api.ts`, `src/types.ts` — the backend contract (ready to use).
- `src/navigation`, `src/App.tsx` — React Navigation v6 stack.
- `src/screens/*`, `src/hooks/*` — placeholders with TODOs to build out.
