import React from "react";
import { StyleSheet, Text, View } from "react-native";

// TODO (frontend owner): registration form — title (req, <=100), category
// (picker from api.getCategories), description (opt, <=280), UPI id
// (req, regex [a-zA-Z0-9._-]+@[a-zA-Z]+), GPS auto-captured (useLocation,
// read-only). Submit -> api.createVendor.
export default function OnboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register your shop</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 20, fontWeight: "700" },
});
