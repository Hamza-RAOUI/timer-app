import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

interface ProgressDotsProps {
  total: number;
  filled: number;
  active?: number; // index currently in progress (elongated)
  color?: string;
}

export const ProgressDots: React.FC<ProgressDotsProps> = ({ total, filled, active, color = colors.accent }) => {
  if (total <= 0) return null;
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < filled;
        const isActive = i === active;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              isActive && styles.dotActive,
              { backgroundColor: isFilled || isActive ? color : colors.barIdle },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 22 },
});
