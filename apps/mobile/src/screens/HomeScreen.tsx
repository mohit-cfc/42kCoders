import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Sparkles, Store } from "lucide-react-native";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CategoryChip,
  IconCircle,
  PaytmHeader,
  PrimaryButton,
  SearchBar,
  SectionHeader,
  VoiceButton,
} from "../components";
import { CATEGORIES } from "../data/mockCategories";
import { POPULAR_SEARCHES } from "../data/mockSearches";
import type { RootStackParamList } from "../navigation";
import { colors, elevation, fonts, fontSize, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [query, setQuery] = useState("");

  const goToMap = (q: string) => {
    navigation.navigate("Map", { query: q });
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.root}>
      <PaytmHeader
        title="Dhundho"
        subtitle="Find vendors near you"
        bottomSlot={
          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <SearchBar
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => goToMap(query.trim())}
                onClear={() => setQuery("")}
                placeholder="Search for chai, pani puri, repair…"
              />
            </View>
            <VoiceButton onPress={() => {
              // TODO: wire useAudioRecorder + api.searchVoice. For now a no-op.
            }} />
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Popular categories */}
        <View style={styles.section}>
          <SectionHeader title="Browse by category" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <CategoryChip
                  key={c.id}
                  label={c.name}
                  icon={<Icon size={16} color={colors.navy800} strokeWidth={2} />}
                  onPress={() => goToMap(c.name)}
                />
              );
            })}
          </ScrollView>
        </View>

        {/* Popular searches */}
        <View style={styles.section}>
          <SectionHeader title="Trending near you" />
          <View style={styles.wrap}>
            {POPULAR_SEARCHES.map((s) => (
              <CategoryChip
                key={s}
                label={s}
                icon={<Sparkles size={14} color={colors.blue} strokeWidth={2} />}
                onPress={() => goToMap(s)}
                style={styles.wrapChip}
              />
            ))}
          </View>
        </View>

        {/* Register My Shop CTA */}
        <View style={[styles.ctaCard, elevation.hairline]}>
          <IconCircle size={44} bg={colors.cyan100}>
            <Store size={22} color={colors.cyan600} strokeWidth={2} />
          </IconCircle>
          <View style={styles.ctaText}>
            <Text style={styles.ctaTitle}>Selling something?</Text>
            <Text style={styles.ctaBody}>
              Register your shop in 60 seconds and start receiving Paytm payments.
            </Text>
          </View>
          <PrimaryButton
            label="Register"
            size="md"
            variant="secondary"
            onPress={() => navigation.navigate("Onboard")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  scroll: {
    paddingHorizontal: spacing.screenPad,
    paddingTop: spacing.sp6,
    paddingBottom: spacing.sp8,
    gap: spacing.sp6,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sp3,
  },
  section: {
    gap: spacing.sp4,
  },
  chipScroll: {
    paddingRight: spacing.sp5,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sp3,
  },
  wrapChip: {
    marginRight: 0,
  },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sp4,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.cardPad,
  },
  ctaText: {
    flex: 1,
    gap: 4,
  },
  ctaTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  ctaBody: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});
