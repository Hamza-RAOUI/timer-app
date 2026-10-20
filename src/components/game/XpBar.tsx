import React, { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useReducedMotionPref } from '../../lib/game';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';

interface XpBarProps {
  /** 0…1 */
  progress: number;
  /** Animate from this value on mount / when `replayKey` changes. */
  from?: number;
  color?: string;
  height?: number;
  /** Segment ticks across the track. */
  ticks?: number;
  delayMs?: number;
  durationMs?: number;
  replayKey?: string | number;
  style?: StyleProp<ViewStyle>;
  /** Accessible name, e.g. "Study XP". */
  label?: string;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

/** Game-style progress bar: slanted fill, tick marks, a bright leading edge. */
export const XpBar: React.FC<XpBarProps> = ({ progress, from, color, height = 10, ticks = 10, delayMs = 0, durationMs = 700, replayKey, style, label }) => {
  const t = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotionPref();
  const target = clamp01(progress);
  const w = useSharedValue(clamp01(from ?? target));

  useEffect(() => {
    if (reduced) {
      w.value = target;
      return;
    }
    if (from !== undefined) w.value = clamp01(from);
    w.value = withDelay(delayMs, withTiming(target, { duration: durationMs, easing: Easing.out(Easing.cubic) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, replayKey, reduced]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  const fill = color ?? t.colors.accent;

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2.5 }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(target * 100) }}
    >
      <Animated.View style={[styles.fill, { backgroundColor: fill, borderRadius: height / 2.5 }, fillStyle]}>
        <View style={[styles.edge, { width: Math.max(3, height * 0.45) }]} />
      </Animated.View>
      {ticks > 1 && (
        <View style={[styles.ticks, { pointerEvents: 'none' }]}>
          {Array.from({ length: ticks - 1 }).map((_, i) => (
            <View key={i} style={[styles.tick, { left: `${((i + 1) / ticks) * 100}%` }]} />
          ))}
        </View>
      )}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  track: { width: '100%', backgroundColor: t.colors.barIdle, overflow: 'hidden' },
  fill: { height: '100%', overflow: 'hidden', alignItems: 'flex-end' },
  edge: { height: '100%', backgroundColor: 'rgba(255,255,255,0.45)', transform: [{ skewX: '-20deg' }] },
  ticks: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  tick: { position: 'absolute', top: '20%', bottom: '20%', width: 1.5, backgroundColor: t.isDark ? 'rgba(7,10,24,0.55)' : 'rgba(255,255,255,0.75)', transform: [{ skewX: '-20deg' }] },
}));
