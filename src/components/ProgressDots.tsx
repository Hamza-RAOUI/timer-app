import React from 'react';
import { View } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { SLANT } from '../theme/typography';

interface ProgressDotsProps {
  total: number;
  filled: number;
  active?: number; // index currently in progress (elongated)
  color?: string;
}

/** Cycle tracker — slanted pips, the active one stretched. */
export const ProgressDots: React.FC<ProgressDotsProps> = ({ total, filled, active, color }) => {
  const t = useTheme();
  const styles = useStyles();
  if (total <= 0) return null;
  const fill = color ?? t.colors.accent;
  return (
    <View style={styles.row} accessibilityRole="text" accessibilityLabel={`Cycle ${Math.min(filled + 1, total)} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < filled;
        const isActive = i === active;
        return <View key={i} style={[styles.dot, isActive && styles.dotActive, { backgroundColor: isFilled || isActive ? fill : t.colors.barIdle }]} />;
      })}
    </View>
  );
};

const useStyles = makeStyles(() => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  dot: { width: 10, height: 8, borderRadius: 2, transform: [{ skewX: SLANT }] },
  dotActive: { width: 26 },
}));
