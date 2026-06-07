import { Redirect } from 'expo-router';
import React from 'react';

// Deep-link shim → opens the Custom (countdown) technique.
export default function TimerRedirect() {
  return <Redirect href={{ pathname: '/', params: { technique: 'custom', view: 'timer' } }} />;
}
