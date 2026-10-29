import React from 'react';
import { Image, View } from 'react-native';

const LOGO = require('../../../assets/images/logo.png');

/**
 * The Flowglass logo: the Timekeeper (hooded mage holding the hourglass) on its own
 * midnight tile. App icons, favicon and splash are cut from the same art.
 */
export const FlowglassMark: React.FC<{ size: number; label?: string }> = ({ size, label }) => (
  <View accessible={!!label} accessibilityRole={label ? 'image' : undefined} accessibilityLabel={label} aria-hidden={!label}>
    <Image source={LOGO} style={{ width: size, height: size, borderRadius: size * 0.22 }} accessibilityIgnoresInvertColors />
  </View>
);
