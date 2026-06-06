import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import OnboardScreen from "../screens/OnboardScreen";
import type { SearchResponse } from "../types";

export type RootStackParamList = {
  Home: undefined;
  Map: { result: SearchResponse };
  Onboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Dhundho" }} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Onboard" component={OnboardScreen} options={{ title: "Register Shop" }} />
    </Stack.Navigator>
  );
}
