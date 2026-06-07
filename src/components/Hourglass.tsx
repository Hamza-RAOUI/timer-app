import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface HourglassProps {
  /** 0 = full top (just started) · 1 = drained (finished). */
  progress: number;
  color?: string;
  running?: boolean;
  size?: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const Hourglass: React.FC<HourglassProps> = ({ progress, color = colors.accent, running = false, size = 64 }) => {
  const clipId = useRef(`hg-${Math.random().toString(36).slice(2, 8)}`).current;

  const TH = size;
  const W = size * 0.72;
  const capH = Math.max(4, size * 0.085);
  const cx = W / 2;
  const topY = capH;
  const botY = TH - capH;
  const neckY = TH / 2;
  const mx = W * 0.14;
  const nw = W * 0.16;
  const neckL = cx - nw / 2;
  const neckR = cx + nw / 2;
  const lx = mx;
  const rx = W - mx;
  const cyl = (neckY - topY) * 0.55;

  const d = [
    `M${lx},${topY}`,
    `L${rx},${topY}`,
    `C${rx},${topY + cyl} ${neckR},${neckY - cyl} ${neckR},${neckY}`,
    `C${neckR},${neckY + cyl} ${rx},${botY - cyl} ${rx},${botY}`,
    `L${lx},${botY}`,
    `C${lx},${botY - cyl} ${neckL},${neckY + cyl} ${neckL},${neckY}`,
    `C${neckL},${neckY - cyl} ${lx},${topY + cyl} ${lx},${topY}`,
    'Z',
  ].join(' ');

  // Smoothly follow the incoming progress instead of snapping every tick.
  const p = useSharedValue(clamp(progress, 0, 1));
  useEffect(() => {
    p.value = withTiming(clamp(progress, 0, 1), { duration: 260, easing: Easing.linear });
  }, [progress, p]);

  const topProps = useAnimatedProps(() => {
    const surfaceY = topY + p.value * (neckY - topY);
    return { y: surfaceY, height: Math.max(0, neckY - surfaceY + 0.5) };
  });
  const bottomProps = useAnimatedProps(() => {
    const fillY = botY - p.value * (botY - neckY);
    return { y: fillY, height: Math.max(0, botY - fillY + 0.5) };
  });
  const streamProps = useAnimatedProps(() => {
    const fillY = botY - p.value * (botY - neckY);
    return { height: Math.max(0, fillY - neckY) };
  });

  const capX = lx - 2;
  const capW = rx - lx + 4;
  const stroke = Math.max(2, size * 0.05);

  return (
    <View style={styles.wrap}>
      <Svg width={W} height={TH}>
        <Defs>
          <ClipPath id={clipId}>
            <Path d={d} />
          </ClipPath>
        </Defs>

        <Path d={d} fill="rgba(79,70,229,0.05)" />

        <G clipPath={`url(#${clipId})`}>
          <AnimatedRect x={0} width={W} fill={color} opacity={0.9} animatedProps={topProps} />
          <AnimatedRect x={0} width={W} fill={color} opacity={0.9} animatedProps={bottomProps} />
          {running && <AnimatedRect x={cx - 1} y={neckY} width={2} fill={color} animatedProps={streamProps} />}
        </G>

        <Path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
        <Rect x={capX} y={0} width={capW} height={capH} rx={capH / 2} fill={color} />
        <Rect x={capX} y={TH - capH} width={capW} height={capH} rx={capH / 2} fill={color} />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
