import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import OnboardScreen from "../screens/OnboardScreen";

export type RootStackParamList = {
  Home: undefined;
  // Empty query = "everything within DEFAULT_RADIUS_KM". MapScreen does the fetch.
  Map: { query: string };
  Onboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Onboard" component={OnboardScreen} />
    </Stack.Navigator>
  );
}
