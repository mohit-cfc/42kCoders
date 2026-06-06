import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Picker } from "@react-native-picker/picker";
import {
  AtSign,
  FileText,
  MapPin,
  Store,
  Tag,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  IconCircle,
  PaytmHeader,
  PrimaryButton,
} from "../components";
import { useLocation } from "../hooks/useLocation";
import type { RootStackParamList } from "../navigation";
import * as api from "../services/api";
import {
  colors,
  elevation,
  fonts,
  fontSize,
  radii,
  spacing,
} from "../theme";
import type { Category } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Onboard">;

const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z]+$/;

export default function OnboardScreen({ navigation }: Props) {
  const { coords } = useLocation();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [upi, setUpi] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .getCategories()
      .then((list) => {
        if (!alive) return;
        setCategories(list);
        if (list.length > 0) setCategory(list[0].id);
      })
      .catch((err) => {
        if (!alive) return;
        Alert.alert(
          "Couldn't load categories",
          err instanceof Error ? err.message : String(err)
        );
        setCategories([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const canSubmit =
    !submitting &&
    !!coords &&
    name.trim().length > 0 &&
    name.length <= 100 &&
    category.length > 0 &&
    description.length <= 280 &&
    UPI_REGEX.test(upi);

  const submit = async () => {
    if (!coords) return;
    setSubmitting(true);
    try {
      await api.createVendor({
        title: name.trim(),
        category_id: category,
        description: description.trim() || null,
        upi_id: upi.trim(),
        lat: coords.lat,
        lng: coords.lng,
      });
      Alert.alert(
        "Shop registered",
        `${name.trim()} is now discoverable nearby.`,
        [{ text: "Done", onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert(
        "Couldn't register",
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.root}>
      <PaytmHeader title="Register your shop" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, elevation.hairline]}>
            <FormRow
              icon={<Store size={18} color={colors.navy800} strokeWidth={2} />}
              label="Shop name"
              divider
            >
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Anna's Pani Puri"
                placeholderTextColor={colors.ink500}
                maxLength={100}
                style={styles.input}
              />
            </FormRow>

            <FormRow
              icon={<Tag size={18} color={colors.navy800} strokeWidth={2} />}
              label="Category"
              divider
            >
              {categories === null ? (
                <View style={styles.pickerLoading}>
                  <ActivityIndicator color={colors.blue} />
                  <Text style={styles.locationHint}>Loading categories…</Text>
                </View>
              ) : (
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={category}
                    onValueChange={(v) => setCategory(String(v))}
                    style={styles.picker}
                    dropdownIconColor={colors.ink600}
                  >
                    {categories.map((c) => (
                      <Picker.Item key={c.id} label={c.name} value={c.id} />
                    ))}
                  </Picker>
                </View>
              )}
            </FormRow>

            <FormRow
              icon={<FileText size={18} color={colors.navy800} strokeWidth={2} />}
              label="Description"
              divider
            >
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What you sell, hours, anything else"
                placeholderTextColor={colors.ink500}
                multiline
                maxLength={280}
                style={[styles.input, styles.multiline]}
              />
              <Text style={styles.counter}>{description.length} / 280</Text>
            </FormRow>

            <FormRow
              icon={<AtSign size={18} color={colors.navy800} strokeWidth={2} />}
              label="UPI ID"
              divider
            >
              <TextInput
                value={upi}
                onChangeText={setUpi}
                placeholder="yourname@paytm"
                placeholderTextColor={colors.ink500}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
              />
              {upi.length > 0 && !UPI_REGEX.test(upi) && (
                <Text style={styles.error}>
                  Format must be name@bank, e.g. ravi@paytm
                </Text>
              )}
            </FormRow>

            <FormRow
              icon={<MapPin size={18} color={colors.navy800} strokeWidth={2} />}
              label="Location"
            >
              <Text style={styles.locationVal}>
                {coords
                  ? `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E`
                  : "Detecting…"}
              </Text>
              <Text style={styles.locationHint}>
                Auto-detected from your device. You can adjust it later.
              </Text>
            </FormRow>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="Register shop"
            variant="primary"
            size="lg"
            block
            disabled={!canSubmit}
            loading={submitting}
            onPress={submit}
            style={{ alignSelf: "stretch" }}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FormRowProps {
  icon: React.ReactNode;
  label: string;
  divider?: boolean;
  children: React.ReactNode;
}

function FormRow({ icon, label, divider, children }: FormRowProps) {
  return (
    <View style={[styles.row, divider && styles.rowDivider]}>
      <IconCircle size={36}>{icon}</IconCircle>
      <View style={styles.rowBody}>
        <Text style={styles.label}>{label}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPage },
  scroll: {
    padding: spacing.screenPad,
    paddingBottom: spacing.sp10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sp4,
    paddingHorizontal: spacing.cardPad,
    paddingVertical: spacing.sp4,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowBody: {
    flex: 1,
    gap: 6,
    paddingTop: 6,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  multiline: {
    minHeight: 56,
    textAlignVertical: "top",
  },
  counter: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs2,
    color: colors.textMuted,
    alignSelf: "flex-end",
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.danger,
  },
  pickerWrap: {
    marginLeft: -8,
  },
  pickerLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sp3,
    paddingVertical: spacing.sp3,
  },
  picker: {
    color: colors.textPrimary,
  },
  locationVal: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  locationHint: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  footer: {
    padding: spacing.screenPad,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
});
