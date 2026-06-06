import { Camera, MapView, MarkerView } from "@maplibre/maplibre-react-native";
import type { CameraRef } from "@maplibre/maplibre-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, MapPin, Navigation2 } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// OpenFreeMap "positron" — free OSM-backed vector tiles, no API key required.
// Attribution is rendered by the map view automatically.
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

import {
  Badge,
  BottomSheetContent,
  IconCircle,
  PrimaryButton,
  VendorCard,
} from "../components";
import { DEFAULT_RADIUS_KM } from "../config";
import { DEMO_CENTER } from "../constants";
import { findCategory } from "../data/mockCategories";
import { useLocation } from "../hooks/useLocation";
import type { RootStackParamList } from "../navigation";
import * as api from "../services/api";
import { colors, elevation, fonts, fontSize, radii, spacing } from "../theme";
import type { SearchResponse, Vendor } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

const CARD_WIDTH = 280;
const CARD_GAP = 12;

type FetchState =
  | { kind: "loading" }
  | { kind: "loaded"; result: SearchResponse }
  | { kind: "error"; message: string };

export default function MapScreen({ route, navigation }: Props) {
  const { query } = route.params;
  const insets = useSafeAreaInsets();
  const { coords } = useLocation();
  const cameraRef = useRef<CameraRef | null>(null);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [state, setState] = useState<FetchState>({ kind: "loading" });

  const center = coords ?? DEMO_CENTER;
  const initialCenter = useMemo<[number, number]>(
    () => [center.lng, center.lat],
    [center.lat, center.lng]
  );

  const focusVendor = useCallback((v: Vendor) => {
    cameraRef.current?.flyTo([v.lng, v.lat], 350);
  }, []);

  const runSearch = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const result = await api.searchText(
        query,
        center.lat,
        center.lng,
        DEFAULT_RADIUS_KM
      );
      setState({ kind: "loaded", result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ kind: "error", message });
    }
  }, [query, center.lat, center.lng]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  const vendors =
    state.kind === "loaded" ? state.result.vendors : ([] as Vendor[]);

  const backLabel = useMemo(() => {
    if (state.kind === "loading") return "Searching…";
    if (state.kind === "error") return "Couldn't reach backend";
    const { result } = state;
    const q = result.interpreted_query || query || "near me";
    return `${result.total} for "${q}"`;
  }, [state, query]);

  const openPaytm = async (v: Vendor) => {
    const deep = `paytm://pay?pa=${encodeURIComponent(
      v.upi_id
    )}&pn=${encodeURIComponent(v.title)}&cu=INR`;
    const fallback = `https://paytm.me/${encodeURIComponent(v.upi_id)}`;
    try {
      const ok = await Linking.canOpenURL(deep);
      await Linking.openURL(ok ? deep : fallback);
    } catch {
      Alert.alert(
        "Couldn't open Paytm",
        `Tried to pay ${v.upi_id}. Install Paytm and try again.`
      );
    }
  };

  const openNavigation = (v: Vendor) => {
    const url = `google.navigation:q=${v.lat},${v.lng}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`)
    );
  };

  return (
    <View style={styles.root}>
      <MapView
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE_URL}
        logoEnabled={false}
        compassEnabled={false}
        attributionPosition={{ bottom: 8, left: 8 }}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initialCenter,
            zoomLevel: 14,
          }}
        />
        {vendors.map((v) => {
          const cat = findCategory(v.category);
          const Icon = cat?.icon ?? MapPin;
          return (
            <MarkerView key={v.id} coordinate={[v.lng, v.lat]} anchor={{ x: 0.5, y: 1 }}>
              <Pressable
                onPress={() => {
                  setSelected(v);
                  focusVendor(v);
                }}
                style={styles.pin}
              >
                <IconCircle size={36} bg="#fff">
                  <Icon size={18} color={colors.navy800} strokeWidth={2} />
                </IconCircle>
                <View style={styles.pinTip} />
              </Pressable>
            </MarkerView>
          );
        })}
      </MapView>

      {/* Back pill — top-left, on top of the map */}
      <View style={[styles.topRow, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backPill,
            elevation.raised,
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <ArrowLeft size={18} color={colors.ink800} strokeWidth={2} />
          <Text style={styles.backLabel} numberOfLines={1}>
            {backLabel}
          </Text>
        </Pressable>
      </View>

      {/* Persistent bottom card carousel */}
      <View
        style={[
          styles.carouselWrap,
          { paddingBottom: insets.bottom + spacing.sp4 },
        ]}
      >
        {state.kind === "loading" ? (
          <View
            style={[styles.statusCard, elevation.raised, styles.statusInline]}
          >
            <ActivityIndicator color={colors.blue} />
            <Text style={styles.statusText}>Searching nearby vendors…</Text>
          </View>
        ) : state.kind === "error" ? (
          <View style={[styles.statusCard, elevation.raised]}>
            <Text style={styles.statusTitle}>Couldn't load vendors</Text>
            <Text style={styles.statusText} numberOfLines={2}>
              {state.message}
            </Text>
            <PrimaryButton
              label="Try again"
              size="md"
              variant="secondary"
              onPress={runSearch}
              style={{ alignSelf: "flex-start", marginTop: 8 }}
            />
          </View>
        ) : vendors.length === 0 ? (
          <View style={[styles.statusCard, elevation.raised]}>
            <Text style={styles.statusTitle}>
              No vendors for "{query || "near you"}" yet
            </Text>
            <Text style={styles.statusText}>
              Try a different search or widen your area.
            </Text>
          </View>
        ) : (
          <FlatList
            data={vendors}
            keyExtractor={(v) => v.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            decelerationRate="fast"
            renderItem={({ item }) => {
              const cat = findCategory(item.category);
              const Icon = cat?.icon ?? MapPin;
              return (
                <View style={{ width: CARD_WIDTH }}>
                  <VendorCard
                    title={item.title}
                    category={item.category}
                    distanceM={item.distance_m}
                    description={item.description}
                    icon={
                      <Icon size={20} color={colors.navy800} strokeWidth={2} />
                    }
                    raised
                    trailing="none"
                    onPress={() => {
                      setSelected(item);
                      focusVendor(item);
                    }}
                  />
                </View>
              );
            }}
          />
        )}
      </View>

      <BottomSheetContent
        visible={selected !== null}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <View style={sheetStyles.header}>
              <IconCircle size={48} bg={findCategory(selected.category)?.tint ?? colors.blue100}>
                {(() => {
                  const Icon = findCategory(selected.category)?.icon ?? MapPin;
                  return (
                    <Icon size={24} color={colors.navy800} strokeWidth={2} />
                  );
                })()}
              </IconCircle>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={sheetStyles.title} numberOfLines={2}>
                  {selected.title}
                </Text>
                <View style={sheetStyles.metaRow}>
                  <Badge label={selected.category} tone="info" />
                  <Badge label="Paytm accepted" tone="brand" dot />
                </View>
              </View>
            </View>

            {selected.description ? (
              <Text style={sheetStyles.desc}>{selected.description}</Text>
            ) : null}

            <View style={sheetStyles.distRow}>
              <Navigation2 size={16} color={colors.ink600} strokeWidth={2} />
              <Text style={sheetStyles.dist}>
                {selected.distance_m < 1000
                  ? `${Math.round(selected.distance_m)} m away`
                  : `${(selected.distance_m / 1000).toFixed(1)} km away`}
              </Text>
            </View>

            <View style={sheetStyles.actions}>
              <PrimaryButton
                label="Navigate"
                variant="secondary"
                size="lg"
                block
                onPress={() => openNavigation(selected)}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                label="Pay with Paytm"
                variant="primary"
                size="lg"
                block
                onPress={() => openPaytm(selected)}
                style={{ flex: 1.4 }}
              />
            </View>
          </>
        )}
      </BottomSheetContent>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPage },
  topRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.screenPad,
    flexDirection: "row",
  },
  backPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    maxWidth: "100%",
  },
  backLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  carouselWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  carouselContent: {
    paddingHorizontal: spacing.screenPad,
    gap: CARD_GAP,
  },
  statusCard: {
    marginHorizontal: spacing.screenPad,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.cardPad,
    gap: 4,
  },
  statusInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sp3,
  },
  statusTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  statusText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  pin: {
    alignItems: "center",
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
    marginTop: -2,
  },
});

const sheetStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sp4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  desc: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.45,
  },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dist: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sp3,
    marginTop: spacing.sp3,
  },
});
