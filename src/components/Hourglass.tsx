import React, { useEffect, useId, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { FLIP_MS, useReducedMotionPref } from '../lib/game';
import { useTheme } from '../theme/ThemeProvider';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface HourglassProps {
  /** 0 = full top (just started) · 1 = drained (finished). */
  progress: number;
  /** Single sand color (shorthand for `sand={[color, color]}`). */
  color?: string;
  /** Sand gradient, top → bottom. */
  sand?: [string, string];
  /** Frame / caps color. */
  frame?: string;
  running?: boolean;
  size?: number;
  /** Change this number to play the flip-and-refill animation. */
  flipKey?: number;
  /** Soft glow behind the glass. */
  glow?: boolean;
  /** Accessible description; decorative when omitted. */
  label?: string;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const Hourglass: React.FC<HourglassProps> = ({ progress, color, sand, frame, running = false, size = 64, flipKey, glow = false, label }) => {
  const t = useTheme();
  const reduced = useReducedMotionPref();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const clipId = `hg-clip-${uid}`;
  const sandId = `hg-sand-${uid}`;
  const glowId = `hg-glow-${uid}`;
  const glassId = `hg-glass-${uid}`;

  const [sandTop, sandBottom] = sand ?? (color ? [color, color] : [t.colors.accentText, t.colors.accent]);
  const frameColor = frame ?? (color ?? t.colors.accent);

  const TH = size;
  const W = size * 0.72;
  const pad = glow ? size * 0.22 : 0;
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
  const rot = useSharedValue(0);
  const pop = useSharedValue(1);
  const latest = useRef(progress);
  const flipping = useRef(false);
  const lastFlip = useRef(flipKey);

  useEffect(() => {
    latest.current = progress;
    if (!flipping.current) p.value = withTiming(clamp(progress, 0, 1), { duration: 260, easing: Easing.linear });
  }, [progress, p]);

  // Flip: hold the drained glass, rotate 180° (the sand lands on top), then
  // swap back to 0° with the fresh progress — the two frames look identical.
  useEffect(() => {
    if (flipKey === undefined || flipKey === lastFlip.current) return;
    lastFlip.current = flipKey;
    if (reduced) {
      p.value = clamp(latest.current, 0, 1);
      return;
    }
    flipping.current = true;
    cancelAnimation(p);
    // Let the last grains fall, then turn the glass over.
    p.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) });
    rot.value = 0;
    rot.value = withDelay(120, withTiming(180, { duration: FLIP_MS - 180, easing: Easing.bezier(0.65, 0, 0.35, 1) }));
    pop.value = withSequence(withTiming(0.9, { duration: FLIP_MS / 2 }), withSpring(1, { damping: 9, stiffness: 180 }));
    const done = setTimeout(() => {
      rot.value = 0;
      p.value = clamp(latest.current, 0, 1);
      flipping.current = false;
    }, FLIP_MS);
    return () => {
      clearTimeout(done);
      flipping.current = false;
    };
  }, [flipKey, reduced, p, rot, pop]);

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
  const flipStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }, { scale: pop.value }] }));

  const capX = lx - 2;
  const capW = rx - lx + 4;
  const stroke = Math.max(2, size * 0.045);

  return (
    <View
      style={[styles.wrap, { width: W, height: TH }]}
      accessible={!!label}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      aria-hidden={!label}
    >
      {glow && (
        // The glow bleeds past the glass without taking up layout space.
        <Svg width={W + pad * 2} height={TH + pad * 2} style={{ position: 'absolute', left: -pad, top: -pad }}>
          <Defs>
            <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={sandBottom} stopOpacity={running ? 0.32 : 0.18} />
              <Stop offset="1" stopColor={sandBottom} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={W + pad * 2} height={TH + pad * 2} fill={`url(#${glowId})`} />
        </Svg>
      )}
      <Animated.View style={flipStyle}>
        <Svg width={W} height={TH}>
          <Defs>
            <ClipPath id={clipId}>
              <Path d={d} />
            </ClipPath>
            <LinearGradient id={sandId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={sandTop} />
              <Stop offset="1" stopColor={sandBottom} />
            </LinearGradient>
            <LinearGradient id={glassId} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={t.isDark ? 0.1 : 0.7} />
              <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>

          <Path d={d} fill={t.isDark ? 'rgba(165,180,252,0.07)' : 'rgba(79,70,229,0.05)'} />

          <G clipPath={`url(#${clipId})`}>
            <AnimatedRect x={0} width={W} fill={`url(#${sandId})`} animatedProps={topProps} />
            <AnimatedRect x={0} width={W} fill={`url(#${sandId})`} animatedProps={bottomProps} />
            {running && <AnimatedRect x={cx - 1} y={neckY} width={2} fill={sandBottom} animatedProps={streamProps} />}
            <Rect x={0} y={0} width={W} height={TH} fill={`url(#${glassId})`} />
          </G>

          <Path d={d} fill="none" stroke={frameColor} strokeWidth={stroke} strokeLinejoin="round" />
          <Rect x={capX} y={0} width={capW} height={capH} rx={capH / 2} fill={frameColor} />
          <Rect x={capX} y={TH - capH} width={capW} height={capH} rx={capH / 2} fill={frameColor} />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
});
