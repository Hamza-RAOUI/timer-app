import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

// Deep-link shim → opens the Pomodoro technique in the single-window app.
export default function PomodoroRedirect() {
  const { start } = useLocalSearchParams<{ start?: string }>();
  return <Redirect href={{ pathname: '/', params: { technique: 'pomodoro', view: 'timer', start: start ?? '' } }} />;
}
