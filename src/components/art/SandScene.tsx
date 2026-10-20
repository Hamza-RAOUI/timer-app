import React, { useId, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';

interface SandSceneProps {
  height?: number;
  /** Sand gradient (e.g. the player's hourglass theme). */
  sand?: [string, string];
  style?: StyleProp<ViewStyle>;
  /** Hide the hourglass monument (e.g. when an emblem sits on top). */
  plain?: boolean;
  label?: string;
}

// Deterministic star field.
const STARS = Array.from({ length: 34 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 97.13 + n * 13.7) * 10000;
    return x - Math.floor(x);
  };
  return { x: r(1) * 400, y: r(2) * 110, s: 0.6 + r(3) * 1.5, o: 0.35 + r(4) * 0.6 };
});

/**
 * Original illustration: dunes under a sky, a lone hourglass monument and
 * slanted light beams. Night sky in dark mode, dawn in light mode.
 */
export const SandScene: React.FC<SandSceneProps> = ({ height = 180, sand, style, plain, label }) => {
  const t = useTheme();
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (k: string) => `${k}${raw}`;
  const dark = t.isDark;
  const [s1, s2] = sand ?? ['#FCD34D', '#F59E0B'];

  const sky = dark ? ['#04060F', '#141B4A', '#2E1A5C'] : ['#E0E7FF', '#F5F3FF', '#FCE7F3'];
  const dunes = dark
    ? [['#1B2150', '#10153A'], ['#262C66', '#161B47'], ['#343A82', '#1C2256']]
    : [['#C7D2FE', '#A5B4FC'], ['#DDD6FE', '#C4B5FD'], ['#FBCFE8', '#F9A8D4']];

  const stars = useMemo(() => (dark ? STARS : STARS.slice(0, 0)), [dark]);

  return (
    <View
      style={[{ height, width: '100%', overflow: 'hidden' }, style]}
      accessible={!!label}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      aria-hidden={!label}
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky[0]} />
            <Stop offset="0.6" stopColor={sky[1]} />
            <Stop offset="1" stopColor={sky[2]} />
          </LinearGradient>
          {dunes.map(([a, b], i) => (
            <LinearGradient key={i} id={id(`d${i}`)} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={a} />
              <Stop offset="1" stopColor={b} />
            </LinearGradient>
          ))}
          <LinearGradient id={id('sand')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={s1} />
            <Stop offset="1" stopColor={s2} />
          </LinearGradient>
          <LinearGradient id={id('beam')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={dark ? 0.1 : 0.55} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x={0} y={0} width={400} height={200} fill={`url(#${id('sky')})`} />

        {stars.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#E0E7FF" opacity={s.o} />
        ))}

        {/* Moon / sun */}
        <Circle cx={318} cy={52} r={26} fill={dark ? '#E0E7FF' : '#FFFFFF'} opacity={dark ? 0.9 : 0.85} />
        {dark ? <Circle cx={330} cy={45} r={23} fill={sky[1]} opacity={0.95} /> : <Circle cx={318} cy={52} r={36} fill="#FFFFFF" opacity={0.35} />}

        {/* Slanted light beams */}
        <Polygon points="60,0 96,0 36,200 0,200" fill={`url(#${id('beam')})`} />
        <Polygon points="118,0 132,0 72,200 58,200" fill={`url(#${id('beam')})`} />

        {/* Dunes, back to front */}
        <Path d="M0 128 C70 98 130 104 200 122 C270 140 330 104 400 112 L400 200 L0 200 Z" fill={`url(#${id('d0')})`} />
        <Path d="M0 152 C60 130 140 128 210 146 C280 164 340 138 400 146 L400 200 L0 200 Z" fill={`url(#${id('d1')})`} />

        {!plain && (
          <G>
            {/* Hourglass monument on the middle dune */}
            <Rect x={252} y={92} width={34} height={5} rx={2} fill={dark ? '#C7D2FE' : '#4F46E5'} />
            <Rect x={252} y={139} width={34} height={5} rx={2} fill={dark ? '#C7D2FE' : '#4F46E5'} />
            <Path
              d="M256 97 L282 97 C282 110 272 114 272 118.5 C272 123 282 127 282 139 L256 139 C256 127 266 123 266 118.5 C266 114 256 110 256 97 Z"
              fill={dark ? 'rgba(199,210,254,0.12)' : 'rgba(255,255,255,0.55)'}
              stroke={dark ? '#C7D2FE' : '#4F46E5'}
              strokeWidth={2}
            />
            <Path d="M259.5 102 L278.5 102 C277 109 271 112 269 116 C267 112 261 109 259.5 102 Z" fill={`url(#${id('sand')})`} />
            <Path d="M258 137 C261 129 265 126 269 126 C273 126 277 129 280 137 Z" fill={`url(#${id('sand')})`} />
            <Rect x={268.3} y={116} width={1.4} height={11} fill={s2} />
          </G>
        )}

        <Path d="M0 176 C80 160 150 164 220 174 C290 184 350 166 400 170 L400 200 L0 200 Z" fill={`url(#${id('d2')})`} />
        {/* Sand ripples */}
        <Path d="M40 186 C70 180 100 180 130 186" stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)'} strokeWidth={2} fill="none" />
        <Path d="M250 190 C280 184 310 184 340 190" stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)'} strokeWidth={2} fill="none" />
      </Svg>
    </View>
  );
};
