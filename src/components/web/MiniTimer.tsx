import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
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
export const MiniTimer: React.FC<MiniTimerProps> = ({ minutes = 25, accent, compact = false }) => {
  const t = useTheme();
  const styles = useStyles();
  const fill = accent ?? t.colors.accent;
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
  const hgSize = compact ? 52 : 84;
  const digitSize = compact ? 44 : 64;
  const playSize = compact ? 48 : 60;
  const clock = formatMsToClock(remainingMs);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <Hourglass
        progress={progress}
        color={compact ? fill : undefined}
        frame={compact ? fill : t.colors.text.primary}
        running={running}
        size={hgSize}
        glow={!compact}
        label={`Hourglass: ${clock} left`}
      />
      <Text style={[styles.digits, tabular, { fontSize: digitSize, color: compact ? '#F8FAFC' : t.colors.text.primary }]} accessibilityRole="timer">
        {clock}
      </Text>
      <View style={styles.controls}>
        {!compact && (
          <Pressable onPress={reset} style={styles.secondary} accessibilityRole="button" accessibilityLabel="Reset timer">
            <Ionicons name="refresh" size={20} color={t.colors.text.secondary} />
          </Pressable>
        )}
        <Pressable
          onPress={() => setRunning((r) => !r)}
          style={[styles.play, { backgroundColor: fill, width: playSize, height: playSize, borderRadius: playSize / 2 }]}
          accessibilityRole="button"
          accessibilityLabel={running ? 'Pause timer' : 'Start timer'}
        >
          <Ionicons name={running ? 'pause' : 'play'} size={compact ? 20 : 24} color="#fff" style={!running ? { marginLeft: 2 } : undefined} />
        </Pressable>
        {compact && (
          <Pressable onPress={reset} style={[styles.secondary, { borderColor: '#334155' }]} accessibilityRole="button" accessibilityLabel="Reset timer">
            <Ionicons name="refresh" size={18} color="#CBD5E1" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  wrap: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  wrapCompact: { gap: 2, paddingVertical: 0 },
  digits: { fontFamily: fonts.display, letterSpacing: -2, marginTop: 8, transform: [{ skewX: '-6deg' }] },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  secondary: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.borderStrong },
  play: { alignItems: 'center', justifyContent: 'center' },
}));
