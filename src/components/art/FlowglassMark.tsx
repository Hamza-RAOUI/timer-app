import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

/** 4-point sparkle centred on (x, y). */
const sparkle = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;

/**
 * The Flowglass logo: the Timekeeper's head (wizard hat with a curled tip, gold ears,
 * diamond emblem, glowing eyes) on a midnight tile. Simplified from the stage-5
 * creature so it still reads at favicon size. Keep public/favicon.svg in sync.
 */
export const FlowglassMark: React.FC<{ size: number; tile?: boolean; label?: string }> = ({ size, tile = true, label }) => {
  // Unique gradient ids per instance (see Critter: hidden copies would break the fill).
  const id = useId().replace(/[^A-Za-z0-9_-]/g, '');
  return (
    // The label lives on a View: react-native-svg on web would forward `accessible` to the DOM.
    <View accessible={!!label} accessibilityRole={label ? 'image' : undefined} accessibilityLabel={label} aria-hidden={!label}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <LinearGradient id={`fgTile${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#33227A" />
            <Stop offset="1" stopColor="#0F0B2E" />
          </LinearGradient>
          <LinearGradient id={`fgHat${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#3A44A8" />
            <Stop offset="1" stopColor="#1A1E52" />
          </LinearGradient>
          <LinearGradient id={`fgFace${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFD27A" />
            <Stop offset="1" stopColor="#D9932F" />
          </LinearGradient>
        </Defs>
        {tile && <Rect x={0} y={0} width={64} height={64} rx={15} fill={`url(#fgTile${id})`} />}
        {tile && <Path d={sparkle(9, 52, 3)} fill="#C4B5FD" />}
        {tile && <Path d={sparkle(56, 48, 2.4)} fill="#F2C14E" />}
        {/* collar + face */}
        <Path d="M19 52 L45 52 L41 58 L32 61 L23 58 Z" fill="#5B3BC4" />
        <Polygon points="32,53 35,57 32,61 29,57" fill="#F2C14E" />
        <Ellipse cx={32} cy={42} rx={13.5} ry={11} fill={`url(#fgFace${id})`} />
        <Ellipse cx={32} cy={36} rx={12.5} ry={4} fill="#7A4A14" opacity={0.45} />
        <Path d="M22 41.5 Q26.5 39 31 43 Q26.5 46 22 44 Z" fill="#FFE08A" />
        <Path d="M42 41.5 Q37.5 39 33 43 Q37.5 46 42 44 Z" fill="#FFE08A" />
        <Circle cx={27} cy={42.9} r={1.4} fill="#1B1730" />
        <Circle cx={37} cy={42.9} r={1.4} fill="#1B1730" />
        <Path d="M21 39.8 L31 42 M43 39.8 L33 42" stroke="#1B1730" strokeWidth={1.5} strokeLinecap="round" />
        <Path d="M29.5 49.2 Q32 48.2 34.5 49.2" stroke="#8A5A1F" strokeWidth={1.2} strokeLinecap="round" fill="none" />
        {/* gold ears */}
        <Path d="M20 33 L3 21 L11 23 L7 15 L24 29 Z" fill="#F2C14E" />
        <Path d="M44 33 L61 21 L53 23 L57 15 L40 29 Z" fill="#F2C14E" />
        {/* hat: brim, curled cone, emblem */}
        <Path d="M8 35 C16 28 48 27 56 34 C51 39 13 40 8 35 Z" fill={`url(#fgHat${id})`} stroke="#5A64D8" strokeWidth={1} />
        <Path d="M20 33 C22 22 27 13 34 8 C39 5 46 3 52 5 C54 6 54 8 52 8.5 C46 8.5 42 12 40.5 17 C39 23 41 29 45 33 Z" fill={`url(#fgHat${id})`} />
        <Path d="M21.5 31 C23 22 27 15 33 10" stroke="#5A64D8" strokeWidth={1.4} strokeLinecap="round" fill="none" />
        <Polygon points="32,16 37,22.5 32,29 27,22.5" fill="#F2C14E" />
        <Polygon points="32,19 34.4,22.5 32,26 29.6,22.5" fill="#FFF3C4" />
      </Svg>
    </View>
  );
};
