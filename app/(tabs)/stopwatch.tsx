import { Redirect } from 'expo-router';
import React from 'react';

export default function StopwatchRedirect() {
  return <Redirect href={{ pathname: '/', params: { technique: 'stopwatch', view: 'timer' } }} />;
}
