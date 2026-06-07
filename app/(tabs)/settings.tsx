import { Redirect } from 'expo-router';
import React from 'react';

export default function SettingsRedirect() {
  return <Redirect href={{ pathname: '/', params: { view: 'settings' } }} />;
}
