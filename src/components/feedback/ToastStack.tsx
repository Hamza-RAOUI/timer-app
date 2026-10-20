import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { IconName, SwatchKey } from '../../constants/focus';
import { useReducedMotionPref } from '../../lib/game';
import { useRewardStore, type Toast } from '../../stores/rewardStore';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/typography';
import { SkillCrest } from '../art/SkillCrest';

const TOAST_MS = 3800;

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const t = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotionPref();
  const drop = useRewardStore((s) => s.dropToast);
  const v = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!reduced) v.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.back(1.3)) });
    const id = setTimeout(() => {
      v.value = withTiming(0, { duration: reduced ? 1 : 220 });
      setTimeout(() => drop(toast.id), reduced ? 10 : 240);
    }, TOAST_MS);
    return () => clearTimeout(id);
  }, [toast.id, reduced, v, drop]);

  const style = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: (1 - v.value) * -16 }] }));
  const isSkill = toast.kind === 'skill' && toast.swatch;

  return (
    <Animated.View style={style}>
      <Pressable onPress={() => drop(toast.id)} style={styles.toast} accessibilityRole="alert" accessibilityLabel={`${toast.title}. ${toast.body ?? ''}`}>
        <View style={[styles.edge, { backgroundColor: toast.kind === 'quest' ? t.colors.gold : isSkill ? t.colors.swatch[toast.swatch as SwatchKey].fill : t.colors.accent }]} />
        {isSkill ? (
          <SkillCrest swatch={toast.swatch as SwatchKey} icon={(toast.icon as IconName) ?? 'star'} size={30} />
        ) : (
          <View style={[styles.icon, { backgroundColor: t.colors.goldSoft }]}>
            <Ionicons name={(toast.icon as IconName) ?? 'trophy'} size={16} color={t.colors.goldText} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {toast.title}
          </Text>
          {toast.body ? (
            <Text style={styles.body} numberOfLines={2}>
              {toast.body}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
};

/** Lightweight notifications for quest completions and skill level-ups. */
export const ToastStack: React.FC = () => {
  const toasts = useRewardStore((s) => s.toasts);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const styles = useStyles();
  if (toasts.length === 0) return null;
  const wide = width >= 900;
  return (
    <View style={[styles.stack, wide ? styles.stackWide : styles.stackNarrow, { top: insets.top + 12, pointerEvents: 'box-none' }]} aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  stack: { position: 'absolute', zIndex: 200, gap: 8 },
  stackWide: { right: 20, width: 340 },
  stackNarrow: { left: 12, right: 12 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 14,
    borderRadius: 14,
    backgroundColor: t.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
    overflow: 'hidden',
    ...t.shadow.lg,
  },
  edge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  icon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: 13, color: t.colors.text.primary, letterSpacing: 0.6, textTransform: 'uppercase' },
  body: { fontFamily: fonts.medium, fontSize: 12.5, color: t.colors.text.secondary, marginTop: 2 },
}));
