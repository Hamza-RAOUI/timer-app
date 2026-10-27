import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useReducedMotionPref } from '../../lib/game';
import { useRewardStore } from '../../stores/rewardStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts, hardTextShadow, SLANT, UNSLANT } from '../../theme/typography';
import { Critter } from '../art/Critter';
import { GhostWord } from '../game/GhostWord';
import { SkewTag } from '../game/SkewTag';

/** A creature reached a new stage: the old form shrinks away, the new one pops in. */
export const EvolutionOverlay: React.FC = () => {
  const evo = useRewardStore((s) => s.evolution);
  if (!evo) return null;
  return <EvolutionContent key={evo.id} />;
};

const EvolutionContent: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotionPref();
  const evo = useRewardStore((s) => s.evolution)!;
  const dismiss = useRewardStore((s) => s.dismissEvolution);
  const setView = useUiStore((s) => s.setView);
  const btnRef = useRef<View>(null);

  const fade = useSharedValue(reduced ? 1 : 0);
  const oldOut = useSharedValue(reduced ? 1 : 0);
  const pop = useSharedValue(reduced ? 1 : 0.2);
  useEffect(() => {
    if (Platform.OS !== 'web' && useSettingsStore.getState().hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (reduced) return;
    fade.value = withTiming(1, { duration: 220 });
    oldOut.value = withDelay(500, withTiming(1, { duration: 380, easing: Easing.in(Easing.cubic) }));
    pop.value = withDelay(820, withSequence(withSpring(1.12, { damping: 7, stiffness: 160 }), withSpring(1, { damping: 10 })));
  }, [reduced, fade, oldOut, pop]);

  useEffect(() => {
    const id = setTimeout(() => (btnRef.current as unknown as { focus?: () => void } | null)?.focus?.(), 900);
    return () => clearTimeout(id);
  }, []);

  const backdrop = useAnimatedStyle(() => ({ opacity: fade.value }));
  const oldStyle = useAnimatedStyle(() => ({ opacity: 1 - oldOut.value * 0.75, transform: [{ scale: 1 - oldOut.value * 0.35 }, { translateX: -oldOut.value * 18 }] }));
  const newStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, pop.value * 1.4), transform: [{ scale: pop.value }] }));

  return (
    <View style={styles.root} accessibilityViewIsModal role="dialog" aria-modal aria-label={`${evo.fromName} evolved into ${evo.toName}`}>
      <Animated.View style={[styles.backdrop, backdrop]}>
        <Pressable style={{ flex: 1 }} onPress={dismiss} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View style={[styles.card, backdrop]}>
        <GhostWord word="EVOLVE" size={110} style={{ top: -26, left: -30 }} />
        <SkewTag label={evo.to === 5 ? 'Legendary!' : 'Evolution!'} size="lg" color={evo.to === 5 ? t.colors.gold : t.colors.highlight} textColor={evo.to === 5 ? '#3B2300' : undefined} shadowColor={t.colors.accent} style={{ alignSelf: 'center' }} />

        <View style={styles.stage}>
          <Animated.View style={oldStyle}>
            <Critter family={evo.family} stage={evo.from} size={96} blink={false} />
          </Animated.View>
          <Ionicons name="chevron-forward" size={26} color={t.colors.text.tertiary} />
          <Animated.View style={newStyle}>
            <Critter family={evo.family} stage={evo.to} size={150} />
          </Animated.View>
        </View>

        <Text style={styles.kicker}>
          {evo.skillLabel} · {evo.fromName} evolved into
        </Text>
        <Text style={styles.name}>{evo.toName}</Text>

        <View style={styles.actions}>
          <Pressable ref={btnRef} onPress={dismiss} style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]} accessibilityRole="button">
            <Text style={styles.primaryText}>Nice</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              dismiss();
              setView('character');
            }}
            style={styles.secondary}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryText}>See the evolution line</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  root: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 190, alignItems: 'center', justifyContent: 'center', padding: 20 },
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: t.isDark ? 'rgba(2,4,12,0.88)' : 'rgba(15,23,42,0.62)' },
  card: {
    width: '100%',
    maxWidth: 420,
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
  stage: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  kicker: { fontFamily: fonts.semibold, fontSize: 12, color: t.colors.text.tertiary, letterSpacing: 1.1, textTransform: 'uppercase', marginTop: 6, textAlign: 'center' },
  name: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: t.colors.text.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 4,
    transform: [{ skewX: SLANT }],
    ...hardTextShadow(t.colors.highlight, 3),
  },
  actions: { width: '100%', gap: 10, marginTop: 22 },
  primary: { height: 52, borderRadius: 12, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: SLANT }] },
  primaryText: { fontFamily: fonts.display, fontSize: 16, color: t.colors.text.onAccent, letterSpacing: 1.6, textTransform: 'uppercase', transform: [{ skewX: UNSLANT }] },
  secondary: { height: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 14, color: t.colors.accentText },
}));
