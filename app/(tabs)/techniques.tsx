import { Redirect } from 'expo-router';
import React from 'react';

export default function MethodsRedirect() {
  return <Redirect href={{ pathname: '/', params: { view: 'timer' } }} />;
}
