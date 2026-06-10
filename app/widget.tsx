import { MiniTimer } from '@/src/components/web/MiniTimer';
import Head from 'expo-router/head';
import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Standalone compact timer for the Windows 11 widget / PWA widget surface.
 * Dark, no navigation chrome, works at 300×200. Not indexed.
 */
export default function WidgetScreen() {
  return (
    <>
      <Head>
        <title>Flowglass Timer</title>
        <meta name="robots" content="noindex" />
        <meta name="theme-color" content="#0d1117" />
      </Head>
      <View style={styles.root}>
        <MiniTimer minutes={25} accent="#818CF8" compact />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 200,
    backgroundColor: '#0d1117',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
