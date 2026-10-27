import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(routes)/login/index" />
      <Stack.Screen name="(routes)/area-selection/index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
