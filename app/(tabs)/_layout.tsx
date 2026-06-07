import { colors } from '@/src/theme/colors';
import { Stack } from 'expo-router';
import React from 'react';

export default function GroupLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pomodoro" />
      <Stack.Screen name="two" />
      <Stack.Screen name="stopwatch" />
      <Stack.Screen name="techniques" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
