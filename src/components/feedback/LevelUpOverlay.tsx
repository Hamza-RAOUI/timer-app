import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions, type DimensionValue } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { SAND_THEMES } from '../../constants/focus';
import { useReducedMotionPref } from '../../lib/game';
import { titleForLevel } from '../../lib/rpg';
import { useRewardStore } from '../../stores/rewardStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts, hardTextShadow, SLANT, tabular, UNSLANT } from '../../theme/typography';
import { RankEmblem } from '../art/RankEmblem';
import { GhostWord } from '../game/GhostWord';
import { SkewTag } from '../game/SkewTag';

/** Slanted color band that sweeps across the screen (the menu-transition look). */
const Band: React.FC<{ color: string; top: DimensionValue; height: number; delay: number; reduced: boolean; screenW: number }> = ({
  color,
  top,
  height,
  delay,
  reduced,
  screenW,
}) => {
  const x = useSharedValue(reduced ? 0 : -1.4);
  useEffect(() => {
    if (!reduced) x.value = withDelay(delay, withTiming(0, { duration: 420, easing: Easing.bezier(0.22, 1, 0.36, 1) }));
  }, [delay, reduced, x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * screenW }, { skewY: '-8deg' }] }));
  return <Animated.View style={[{ position: 'absolute', left: '-10%', right: '-10%', top, height, backgroundColor: color }, style]} />;
};

/** Celebration when the player levels up: bands sweep in, the new rank emblem pops. */
export const LevelUpOverlay: React.FC = () => {
  const reward = useRewardStore((s) => s.levelUp);
  if (!reward) return null;
  return <LevelUpContent key={`${reward.session.id}`} />;
};

const LevelUpContent: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotionPref();
  const reward = useRewardStore((s) => s.levelUp)!;
  const dismiss = useRewardStore((s) => s.dismissLevelUp);
  const setView = useUiStore((s) => s.setView);
  const isPro = useSettingsStore((s) => s.isPro);
  const { width } = useWindowDimensions();
  const btnRef = useRef<View>(null);

  const from = reward.levelBefore.level;
  const to = reward.levelAfter.level;
  const title = titleForLevel(to).title;
  const unlockedSand = useMemo(() => (isPro ? [] : SAND_THEMES.filter((s) => s.unlockLevel > from && s.unlockLevel <= to)), [from, to, isPro]);

  const fade = useSharedValue(reduced ? 1 : 0);
  const pop = useSharedValue(reduced ? 1 : 0.3);
  const rise = useSharedValue(reduced ? 0 : 30);
  useEffect(() => {
    if (Platform.OS !== 'web' && useSettingsStore.getState().hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (reduced) return;
    fade.value = withTiming(1, { duration: 220 });
    pop.value = withDelay(260, withSpring(1, { damping: 8, stiffness: 140 }));
    rise.value = withDelay(180, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [reduced, fade, pop, rise]);

  // Move keyboard focus into the dialog (web).
  useEffect(() => {
    const id = setTimeout(() => (btnRef.current as unknown as { focus?: () => void } | null)?.focus?.(), 450);
    return () => clearTimeout(id);
  }, []);

  const backdrop = useAnimatedStyle(() => ({ opacity: fade.value }));
  const emblem = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }, { rotate: `${(1 - pop.value) * -25}deg` }] }));
  const content = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ translateY: rise.value }] }));

  return (
    <View style={styles.root} accessibilityViewIsModal role="dialog" aria-modal aria-label={`Level up: level ${to}`}>
      <Animated.View style={[styles.backdrop, backdrop]}>
        <Pressable style={styles.fill} onPress={dismiss} accessibilityLabel="Close" />
      </Animated.View>
      <View style={[styles.bands, { pointerEvents: 'none' }]}>
        <Band color={t.colors.accent} top="16%" height={90} delay={0} reduced={reduced} screenW={width} />
        <Band color={t.colors.highlight} top="27%" height={14} delay={90} reduced={reduced} screenW={width} />
        <Band color={t.isDark ? '#1E1B4B' : '#312E81'} top="64%" height={120} delay={160} reduced={reduced} screenW={width} />
      </View>

      <Animated.View style={[styles.card, content]}>
        <GhostWord word="LEVEL UP" size={120} style={{ top: -30, left: -40 }} />
        <SkewTag label="Level up!" size="lg" color={t.colors.highlight} shadowColor={t.colors.accent} style={{ alignSelf: 'center' }} />

        <Animated.View style={[styles.emblem, emblem]}>
          <RankEmblem title={title} size={132} label={`${title} rank emblem`} />
        </Animated.View>

        <View style={styles.levels}>
          <Text style={[styles.lvOld, tabular]}>LV {from}</Text>
          <Ionicons name="chevron-forward" size={22} color={t.colors.text.tertiary} />
          <Text style={[styles.lvNew, tabular]}>LV {to}</Text>
        </View>

        {reward.newTitle ? (
          <View style={styles.titleBox}>
            <Text style={styles.kicker}>New title unlocked</Text>
            <Text style={styles.title}>{reward.newTitle}</Text>
          </View>
        ) : (
          <Text style={styles.sub}>{title} · keep the sand flowing</Text>
        )}

        {unlockedSand.length > 0 && (
          <View style={styles.unlock}>
            <View style={[styles.swatch, { backgroundColor: unlockedSand[0].colors[1] }]} />
            <Text style={styles.unlockText}>New hourglass sand: {unlockedSand.map((s) => s.label).join(', ')}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            ref={btnRef}
            onPress={dismiss}
            style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>Continue</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              dismiss();
              setView('character');
            }}
            style={styles.secondary}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>View character</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  root: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 180, alignItems: 'center', justifyContent: 'center', padding: 20 },
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: t.isDark ? 'rgba(2,4,12,0.86)' : 'rgba(15,23,42,0.6)' },
  fill: { flex: 1 },
  bands: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden', opacity: 0.9 },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: t.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 22,
    overflow: 'hidden',
    ...t.shadow.lg,
  },
  emblem: { marginTop: 18, marginBottom: 6 },
  levels: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  lvOld: { fontFamily: fonts.display, fontSize: 22, color: t.colors.text.tertiary, transform: [{ skewX: SLANT }] },
  lvNew: {
    fontFamily: fonts.display,
    fontSize: 54,
    lineHeight: 60,
    color: t.colors.text.primary,
    letterSpacing: -1.5,
    transform: [{ skewX: SLANT }],
    ...hardTextShadow(t.colors.highlight, 4),
  },
  titleBox: { alignItems: 'center', marginTop: 6 },
  kicker: { fontFamily: fonts.semibold, fontSize: 12, color: t.colors.text.tertiary, letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { fontFamily: fonts.display, fontSize: 28, color: t.colors.accentText, letterSpacing: 3, textTransform: 'uppercase', marginTop: 2, transform: [{ skewX: SLANT }] },
  sub: { fontFamily: fonts.medium, fontSize: 14, color: t.colors.text.secondary, marginTop: 6 },
  unlock: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: t.colors.goldSoft },
  swatch: { width: 14, height: 14, borderRadius: 3, transform: [{ rotate: '45deg' }] },
  unlockText: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.goldText },
  actions: { width: '100%', gap: 10, marginTop: 22 },
  primary: { height: 52, borderRadius: 12, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: SLANT }] },
  primaryText: { fontFamily: fonts.display, fontSize: 16, color: t.colors.text.onAccent, letterSpacing: 1.6, textTransform: 'uppercase', transform: [{ skewX: UNSLANT }] },
  secondary: { height: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 14, color: t.colors.accentText },
}));
