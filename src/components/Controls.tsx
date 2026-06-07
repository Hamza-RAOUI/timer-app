import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, shadow } from '../theme/colors';
import { fonts } from '../theme/typography';

interface ControlsProps {
  isRunning: boolean;
  onPlayPause: () => void;
  onReset?: () => void;
  onSkip?: () => void;
  playLabel?: { running: string; paused: string };
  accent?: string;
}

const haptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS !== 'web') Haptics.impactAsync(style).catch(() => {});
};

const Springy: React.FC<{ children: React.ReactNode; onPress: () => void; style?: object; label?: string }> = ({ children, onPress, style, label }) => {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.94, { damping: 15 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
        onPress={onPress}
        style={style}
        accessibilityLabel={label}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

export const Controls: React.FC<ControlsProps> = ({ isRunning, onPlayPause, onReset, onSkip, playLabel, accent = colors.accent }) => {
  const label = isRunning ? playLabel?.running ?? 'Pause' : playLabel?.paused ?? 'Start';
  return (
    <View style={styles.row}>
      {onReset && (
        <Springy onPress={() => { haptic(Haptics.ImpactFeedbackStyle.Soft); onReset(); }} style={styles.circle} label="Reset">
          <Ionicons name="refresh" size={22} color={colors.text.secondary} />
        </Springy>
      )}
      <Springy
        onPress={() => { haptic(isRunning ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium); onPlayPause(); }}
        style={[styles.play, { backgroundColor: accent }, shadow.md]}
        label={isRunning ? 'Pause' : 'Start'}
      >
        <Ionicons name={isRunning ? 'pause' : 'play'} size={26} color="#fff" style={!isRunning && { marginLeft: 3 }} />
        <Text style={styles.playLabel}>{label}</Text>
      </Springy>
      {onSkip && (
        <Springy onPress={() => { haptic(Haptics.ImpactFeedbackStyle.Soft); onSkip(); }} style={styles.circle} label="Skip">
          <Ionicons name="play-skip-forward" size={20} color={colors.text.secondary} />
        </Springy>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  play: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 60,
    minWidth: 168,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  playLabel: { fontFamily: fonts.headingBold, fontSize: 17, color: '#fff', letterSpacing: 0.2 },
});
