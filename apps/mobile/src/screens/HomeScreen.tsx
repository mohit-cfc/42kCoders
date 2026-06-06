import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";

import type { RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

// TODO (frontend owner): search bar + mic button (useAudioRecorder) +
// "Register my shop" link. On submit: read GPS (useLocation), call
// api.searchText, then navigation.navigate("Map", { result }).
export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dhundho</Text>
      <Text style={styles.subtitle}>Find street vendors near you.</Text>
      <Button title="Register my shop" onPress={() => navigation.navigate("Onboard")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 24 },
});
