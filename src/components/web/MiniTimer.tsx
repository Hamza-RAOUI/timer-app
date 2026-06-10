import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fonts, tabular } from '../../theme/typography';
import { formatMsToClock } from '../../utils/timeFormatter';
import { Hourglass } from '../Hourglass';

interface MiniTimerProps {
  /** Focus length in minutes. */
  minutes?: number;
  accent?: string;
  compact?: boolean;
}

/**
 * A fully self-contained countdown — its own local state and ticking, no global
 * store or storage. Embeds on SEO pages and powers the /widget route, so it must
 * work standalone and render correctly during static export.
 */
export const MiniTimer: React.FC<MiniTimerProps> = ({ minutes = 25, accent = colors.accent, compact = false }) => {
  const durationMs = minutes * 60_000;
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [running, setRunning] = useState(false);
  const endAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    endAtRef.current = Date.now() + remainingMs;
    const id = setInterval(() => {
      const left = Math.max(0, (endAtRef.current ?? 0) - Date.now());
      setRemainingMs(left);
      if (left <= 0) {
        setRunning(false);
        clearInterval(id);
      }
    }, 200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const reset = () => {
    setRunning(false);
    setRemainingMs(durationMs);
    endAtRef.current = null;
  };

  const progress = durationMs > 0 ? 1 - remainingMs / durationMs : 0;
  const hgSize = compact ? 52 : 72;
  const digitSize = compact ? 44 : 64;
  const playSize = compact ? 48 : 60;

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Hourglass progress={progress} color={accent} running={running} size={hgSize} />
      <Text style={[styles.digits, tabular, { fontSize: digitSize, color: compact ? '#F8FAFC' : colors.text.primary }]}>
        {formatMsToClock(remainingMs)}
      </Text>
      <View style={styles.controls}>
        {!compact && (
          <Pressable onPress={reset} style={styles.secondary} accessibilityLabel="Reset timer">
            <Ionicons name="refresh" size={20} color={colors.text.secondary} />
          </Pressable>
        )}
        <Pressable
          onPress={() => setRunning((r) => !r)}
          style={[styles.play, { backgroundColor: accent, width: playSize, height: playSize, borderRadius: playSize / 2 }]}
          accessibilityLabel={running ? 'Pause timer' : 'Start timer'}
        >
          <Ionicons name={running ? 'pause' : 'play'} size={compact ? 20 : 24} color="#fff" style={!running ? { marginLeft: 2 } : undefined} />
        </Pressable>
        {compact && (
          <Pressable onPress={reset} style={styles.secondary} accessibilityLabel="Reset timer">
            <Ionicons name="refresh" size={18} color="#94A3B8" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  wrapCompact: { gap: 2, paddingVertical: 0 },
  digits: { fontFamily: fonts.headingBold, letterSpacing: -2, marginTop: 8 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  secondary: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  play: { alignItems: 'center', justifyContent: 'center' },
});
