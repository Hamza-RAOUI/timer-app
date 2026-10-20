import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSettingsStore } from '../stores/settingsStore';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { fonts, SLANT, UNSLANT } from '../theme/typography';

interface ControlsProps {
  isRunning: boolean;
  onPlayPause: () => void;
  onReset?: () => void;
  onSkip?: () => void;
  playLabel?: { running: string; paused: string };
  resetLabel?: string;
  skipLabel?: string;
  accent?: string;
}

const haptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web' && useSettingsStore.getState().hapticsEnabled) Haptics.impactAsync(style).catch(() => {});
};

const Springy: React.FC<{ children: React.ReactNode; onPress: () => void; style?: object; label?: string; hint?: string }> = ({ children, onPress, style, label, hint }) => {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.94, { damping: 15 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
        onPress={onPress}
        style={style}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

/** Start/pause plus optional reset/skip — slanted game-menu buttons. */
export const Controls: React.FC<ControlsProps> = ({ isRunning, onPlayPause, onReset, onSkip, playLabel, resetLabel = 'Reset', skipLabel = 'Skip', accent }) => {
  const t = useTheme();
  const styles = useStyles();
  const fill = accent ?? t.colors.accent;
  const label = isRunning ? (playLabel?.running ?? 'Pause') : (playLabel?.paused ?? 'Start');
  return (
    <View style={styles.row}>
      {onReset && (
        <Springy onPress={() => { haptic(Haptics.ImpactFeedbackStyle.Soft); onReset(); }} style={styles.side} label={resetLabel}>
          <View style={styles.unslant}>
            <Ionicons name="refresh" size={22} color={t.colors.text.secondary} />
          </View>
        </Springy>
      )}
      <View>
        <View style={[styles.playShadow, { backgroundColor: t.colors.highlight }]} />
        <Springy
          onPress={() => { haptic(isRunning ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium); onPlayPause(); }}
          style={[styles.play, { backgroundColor: fill }]}
          label={isRunning ? 'Pause' : 'Start'}
        >
          <View style={[styles.unslant, styles.playInner]}>
            <Ionicons name={isRunning ? 'pause' : 'play'} size={24} color={t.colors.text.onAccent} />
            <Text style={styles.playLabel}>{label}</Text>
          </View>
        </Springy>
      </View>
      {onSkip && (
        <Springy onPress={() => { haptic(Haptics.ImpactFeedbackStyle.Soft); onSkip(); }} style={styles.side} label={skipLabel}>
          <View style={styles.unslant}>
            <Ionicons name="play-skip-forward" size={20} color={t.colors.text.secondary} />
          </View>
        </Springy>
      )}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  side: {
    width: 56,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
    transform: [{ skewX: SLANT }],
  },
  unslant: { transform: [{ skewX: UNSLANT }] },
  playShadow: { position: 'absolute', left: 5, top: 5, right: -5, bottom: -5, borderRadius: 14, transform: [{ skewX: SLANT }] },
  play: {
    height: 60,
    minWidth: 176,
    paddingHorizontal: 30,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ skewX: SLANT }],
  },
  playInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playLabel: { fontFamily: fonts.display, fontSize: 17, color: t.colors.text.onAccent, letterSpacing: 1.6, textTransform: 'uppercase' },
}));
