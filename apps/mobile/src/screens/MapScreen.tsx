import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Map">;

// TODO (frontend owner): render react-native-maps <MapView> centered on the
// user, one <Marker> per route.params.result.vendors. Tap a marker -> Modal
// bottom sheet showing the vendor + a "Pay Now" button:
//   Linking.openURL(`paytm://pay?pa=${upi_id}&pn=${encodeURIComponent(title)}&cu=INR`)
//   fallback: `https://paytm.me/${upi_id}`
export default function MapScreen({ route }: Props) {
  const { result } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{result.total} vendors for "{result.interpreted_query}"</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  heading: { fontSize: 16, fontWeight: "600" },
});
