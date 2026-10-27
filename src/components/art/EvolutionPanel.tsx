import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useEvolution, useReducedMotionPref } from '../../lib/game';
import { ROCK_JOKES, type Stage } from '../../lib/rpg';
import { useRewardStore } from '../../stores/rewardStore';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, hardTextShadow } from '../../theme/typography';
import { Critter, FAMILY_ACCENT } from './Critter';

/** `#RRGGBB` → `rgba()` (gradients need the same hue at 0 alpha, not `transparent`). */
const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

/** Gentle mouse parallax (web only): -1…1 on each axis. */
const usePointer = (enabled: boolean) => {
  const px = useSharedValue(0);
  const py = useSharedValue(0);
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onMove = (e: MouseEvent) => {
      px.value = withTiming((e.clientX / window.innerWidth) * 2 - 1, { duration: 600 });
      py.value = withTiming((e.clientY / window.innerHeight) * 2 - 1, { duration: 600 });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [enabled, px, py]);
  return { px, py };
};

/**
 * Easter egg: tap a Rock (or Monolith) five times quickly and it raises one eyebrow
 * and drops a line. Original jokes only — no real person's face or catchphrase.
 */
export const useRockEasterEgg = (stage: Stage) => {
  const [browRaise, setBrowRaise] = useState(false);
  const taps = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const joke = useRef(Math.floor(Math.random() * ROCK_JOKES.length));
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const onTap = useCallback(() => {
    if (stage !== 3 && stage !== 4) return false;
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2000), now];
    if (taps.current.length < 5) return false;
    taps.current = [];
    joke.current = (joke.current + 1) % ROCK_JOKES.length;
    setBrowRaise(true);
    useRewardStore.getState().pushToast({ kind: 'info', title: 'Mike the Rock says', body: ROCK_JOKES[joke.current], icon: 'happy' });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setBrowRaise(false), 2600);
    return true;
  }, [stage]);
  return { browRaise, onTap };
};

interface EvolutionPanelProps {
  skillKey: string;
  width: number;
  height: number;
  /** Background color (#RRGGBB) the panel fades into on its left edge. */
  fadeTo: string;
  /** Set the stage name across the panel. */
  showName?: boolean;
  /** Width the name may use (it's right-aligned); defaults to most of the panel. */
  nameMaxWidth?: number;
  /** Tappable creature (Character view) — enables the easter egg. */
  interactive?: boolean;
  /** Largest creature size (px) — keeps it clear of the timer column. */
  maxCreature?: number;
  style?: StyleProp<ViewStyle>;
}

export const EvolutionPanel: React.FC<EvolutionPanelProps> = ({ skillKey, width, height, fadeTo, showName = true, nameMaxWidth, interactive = false, maxCreature, style }) => {
  const t = useTheme();
  const reduced = useReducedMotionPref();
  const evo = useEvolution(skillKey);
  const acc = evo.stage === 5 ? { main: t.colors.gold, dark: t.colors.gold } : FAMILY_ACCENT[evo.family.key];
  const { browRaise, onTap } = useRockEasterEgg(evo.stage);

  const size = Math.max(120, Math.min(height * 0.66, width * 0.82, maxCreature ?? Infinity));
  const nameRoom = nameMaxWidth ?? width * 0.8;
  const nameSize = Math.max(28, Math.min(nameRoom / (evo.name.length * 0.62), height * 0.11, 96));

  // Slide in on mount and whenever the creature changes; then idle bob.
  const enter = useSharedValue(reduced ? 1 : 0);
  const idle = useSharedValue(0);
  const hop = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      enter.value = 1;
      return;
    }
    enter.value = 0;
    enter.value = withTiming(1, { duration: 650, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  }, [evo.family.key, evo.stage, reduced, enter]);
  useEffect(() => {
    if (reduced) {
      cancelAnimation(idle);
      idle.value = 0;
      return;
    }
    idle.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(idle);
  }, [reduced, idle]);
  const { px, py } = usePointer(!reduced);

  const panelIn = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ translateX: (1 - enter.value) * width * 0.15 }] }));
  const creature = useAnimatedStyle(() => ({
    transform: [{ translateX: -px.value * 10 }, { translateY: -py.value * 6 + (idle.value - 0.5) * 10 - hop.value * 18 }, { scale: 1 + hop.value * 0.04 }],
  }));
  const nameIn = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ translateX: (1 - enter.value) * 60 }, { rotate: '-9deg' }, { skewX: '-8deg' }] }));

  const press = () => {
    const egg = onTap();
    if (!reduced) hop.value = withSequence(withSpring(egg ? 1.4 : 1, { damping: 6, stiffness: 300 }), withDelay(60, withSpring(0, { damping: 9 })));
  };

  const ink = t.isDark ? '#F2F4FF' : '#14112B';
  const creatureNode = <Critter family={evo.family.key} stage={evo.stage} size={size} browRaise={browRaise} blink={!reduced} />;
  const fill = { position: 'absolute' as const, left: 0, top: 0, width, height };

  return (
    <View style={[{ width, height, overflow: 'hidden' }, style]} aria-hidden={!interactive}>
      <Animated.View style={[fill, panelIn]}>
        {/* family glow + slanted band */}
        <LinearGradient colors={[rgba(acc.main, t.isDark ? 0.28 : 0.2), rgba(acc.main, 0)]} start={{ x: 0.8, y: 0.3 }} end={{ x: 0.1, y: 1 }} style={fill} />
        <View
          style={{
            position: 'absolute',
            right: -width * 0.1,
            top: height * 0.34,
            width: width * 0.9,
            height: height * 0.22,
            backgroundColor: rgba(acc.main, t.isDark ? 0.16 : 0.12),
            transform: [{ skewY: '-9deg' }],
          }}
        />
        <LinearGradient colors={[rgba(fadeTo, 1), rgba(fadeTo, 0)]} locations={[0, 0.45]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={fill} />
        <Animated.View style={[{ position: 'absolute', right: Math.min(width * 0.08, 48), bottom: height * 0.1 }, creature]}>
          {interactive ? (
            <Pressable onPress={press} accessibilityRole="button" accessibilityLabel={`${evo.name}, your ${evo.family.line.toLowerCase()} creature. Tap it.`}>
              {creatureNode}
            </Pressable>
          ) : (
            creatureNode
          )}
        </Animated.View>
      </Animated.View>

      {showName && (
        <Animated.View style={[{ position: 'absolute', right: width * 0.06, top: height * 0.07, alignItems: 'flex-end', maxWidth: nameRoom, pointerEvents: 'none' }, nameIn]}>
          <Text style={{ fontFamily: fonts.display, fontSize: nameSize * 0.34, color: acc.main === t.colors.gold ? t.colors.goldText : ink, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85 }}>
            {evo.family.line} · {evo.species} {evo.stage}/5
          </Text>
          <Text
            style={{ fontFamily: fonts.display, fontSize: nameSize, lineHeight: nameSize * 1.02, color: ink, letterSpacing: -1, textAlign: 'right', ...hardTextShadow(t.colors.highlight, Math.max(2, Math.round(nameSize / 24))) }}
            numberOfLines={2}
          >
            {evo.name.toLowerCase()}
          </Text>
          <Text style={{ fontFamily: fonts.semibold, fontSize: Math.max(12, nameSize * 0.24), color: ink, opacity: 0.75, marginTop: 4, fontStyle: 'italic' }}>“{evo.quip}”</Text>
        </Animated.View>
      )}
    </View>
  );
};
