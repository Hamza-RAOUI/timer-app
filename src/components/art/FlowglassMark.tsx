import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

/**
 * The Flowglass logo: the Flowkeeper's hooded head (gold gem, glowing eyes, a grain
 * of sand) on a midnight tile. Simplified from the stage-5 creature so it still reads
 * at favicon size. Keep public/favicon.svg in sync when this changes.
 */
export const FlowglassMark: React.FC<{ size: number; tile?: boolean; label?: string }> = ({ size, tile = true, label }) => (
  // The label lives on a View: react-native-svg on web would forward `accessible` to the DOM.
  <View accessible={!!label} accessibilityRole={label ? 'image' : undefined} accessibilityLabel={label} aria-hidden={!label}>
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="fgTile" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2E3786" />
          <Stop offset="1" stopColor="#12153A" />
        </LinearGradient>
        <LinearGradient id="fgHood" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4652C9" />
          <Stop offset="1" stopColor="#232A72" />
        </LinearGradient>
      </Defs>
      {tile && <Rect x={0} y={0} width={64} height={64} rx={15} fill="url(#fgTile)" />}
      {/* hood + swept points */}
      <Path d="M14 22 L5 10 L18 16 Z" fill="url(#fgHood)" />
      <Path d="M50 22 L59 10 L46 16 Z" fill="url(#fgHood)" />
      <Path d="M32 10 C44 10 52 20 53 33 C54 44 48 52 40 55 L24 55 C16 52 10 44 11 33 C12 20 20 10 32 10 Z" fill="url(#fgHood)" stroke="#F2C14E" strokeWidth={2} />
      {/* face shadow + eyes */}
      <Path d="M18 36 C18 28 24 24 32 24 C40 24 46 28 46 36 C46 44 40 48 32 48 C24 48 18 44 18 36 Z" fill="#0B0F2A" />
      <Polygon points="21,34 29,36 22,39" fill="#FFE08A" />
      <Polygon points="43,34 35,36 42,39" fill="#FFE08A" />
      {/* gem */}
      <Polygon points="32,12 37,18 32,24 27,18" fill="#F2C14E" />
      <Polygon points="32,15 34.5,18 32,21 29.5,18" fill="#FFF3C4" />
      {/* falling grain */}
      <Circle cx={32} cy={52} r={2.2} fill="#F2C14E" />
    </Svg>
  </View>
);
