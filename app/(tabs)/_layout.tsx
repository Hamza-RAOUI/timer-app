import { useTheme } from '@/src/theme/ThemeProvider';
import { Stack } from 'expo-router';
import React from 'react';

export default function GroupLayout(): React.JSX.Element {
  const t = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pomodoro" />
      <Stack.Screen name="two" />
      <Stack.Screen name="stopwatch" />
      <Stack.Screen name="techniques" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
