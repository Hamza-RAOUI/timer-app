import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';

/** One emblem per title tier (original vector art). */
export type RankTier = 'Grain' | 'Sandkeeper' | 'Flowwalker' | 'Timebender' | 'Hourmaster';

const TIERS: Record<RankTier, { from: string; to: string; ring: string; ink: string }> = {
  Grain: { from: '#A5B4FC', to: '#4F46E5', ring: '#C7D2FE', ink: '#FFFFFF' },
  Sandkeeper: { from: '#FCD34D', to: '#D97706', ring: '#FDE68A', ink: '#FFFFFF' },
  Flowwalker: { from: '#5EEAD4', to: '#0E7490', ring: '#99F6E4', ink: '#FFFFFF' },
  Timebender: { from: '#F0ABFC', to: '#7C3AED', ring: '#F5D0FE', ink: '#FFFFFF' },
  Hourmaster: { from: '#FDE68A', to: '#B45309', ring: '#4F46E5', ink: '#FFFFFF' },
};

export const tierFor = (title: string): RankTier => (title in TIERS ? (title as RankTier) : 'Grain');

const HEX = '50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5';
const HEX_INNER = '50,11 84,30.5 84,69.5 50,89 16,69.5 16,30.5';

const Glyph: React.FC<{ tier: RankTier; ink: string; deep: string }> = ({ tier, ink, deep }) => {
  switch (tier) {
    case 'Grain':
      return (
        <G>
          <Path d="M50 29 L63 50 L50 71 L37 50 Z" fill={ink} />
          <Path d="M50 29 L63 50 L50 50 Z" fill={deep} opacity={0.25} />
          <Path d="M67 27 L69 33 L75 35 L69 37 L67 43 L65 37 L59 35 L65 33 Z" fill={ink} opacity={0.9} />
          <Circle cx={34} cy={66} r={2.4} fill={ink} opacity={0.7} />
        </G>
      );
    case 'Sandkeeper':
      return (
        <G>
          <Rect x={35} y={26} width={30} height={5} rx={2.5} fill={ink} />
          <Rect x={35} y={69} width={30} height={5} rx={2.5} fill={ink} />
          <Path d="M39 31 L61 31 C61 43 52.5 46 52.5 50 C52.5 54 61 57 61 69 L39 69 C39 57 47.5 54 47.5 50 C47.5 46 39 43 39 31 Z" fill="none" stroke={ink} strokeWidth={3.2} strokeLinejoin="round" />
          <Path d="M43 36 L57 36 C56 42 52 44 50 47 C48 44 44 42 43 36 Z" fill={ink} />
          <Path d="M42 66 C44 60 47 58 50 58 C53 58 56 60 58 66 Z" fill={ink} />
          <Rect x={49.2} y={47} width={1.6} height={11} fill={ink} />
        </G>
      );
    case 'Flowwalker':
      return (
        <G fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round">
          <Path d="M27 39 Q35 31 43 39 T59 39 T75 39" />
          <Path d="M27 51 Q35 43 43 51 T59 51 T75 51" opacity={0.85} />
          <Path d="M27 63 Q35 55 43 63 T59 63 T75 63" opacity={0.7} />
        </G>
      );
    case 'Timebender':
      return (
        <G>
          <Path d="M50 28 A22 22 0 1 1 29.5 42" fill="none" stroke={ink} strokeWidth={4.5} strokeLinecap="round" />
          <Polygon points="23,40 34,36 31,47" fill={ink} />
          <Path d="M50 50 L50 37" stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <Path d="M50 50 L60 56" stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <Circle cx={50} cy={50} r={3.4} fill={ink} />
        </G>
      );
    case 'Hourmaster':
    default:
      return (
        <G>
          <Path d="M28 60 L32 34 L43 47 L50 28 L57 47 L68 34 L72 60 Z" fill={ink} strokeLinejoin="round" />
          <Rect x={28} y={63} width={44} height={7} rx={2} fill={ink} />
          <Circle cx={32} cy={33} r={3.2} fill={ink} />
          <Circle cx={50} cy={26} r={3.6} fill={ink} />
          <Circle cx={68} cy={33} r={3.2} fill={ink} />
          <Path d="M45 50 L55 50 L50 57 Z" fill={deep} opacity={0.55} />
        </G>
      );
  }
};

/** Hexagonal rank crest for a player title. Decorative unless `label` is given. */
export const RankEmblem: React.FC<{ title: string; size?: number; label?: string }> = ({ title, size = 64, label }) => {
  const tier = tierFor(title);
  const c = TIERS[tier];
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <View
      style={{ width: size, height: size }}
      accessible={!!label}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      aria-hidden={!label}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c.from} />
            <Stop offset="1" stopColor={c.to} />
          </LinearGradient>
          <LinearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.45} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Polygon points={HEX} fill={c.ring} />
        <Polygon points={HEX_INNER} fill={`url(#g${id})`} />
        <Path d="M50 11 L84 30.5 L84 44 L16 58 L16 30.5 Z" fill={`url(#s${id})`} />
        <Glyph tier={tier} ink={c.ink} deep={c.to} />
        <Polygon points="50,0 54,4 50,8 46,4" fill={c.ring} />
      </Svg>
    </View>
  );
};
