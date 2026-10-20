import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/typography';

/** Oversized, barely-there background word (decorative, hidden from screen readers). */
export const GhostWord: React.FC<{ word: string; size?: number; style?: StyleProp<ViewStyle> }> = ({ word, size = 180, style }) => {
  const styles = useStyles();
  return (
    <View style={[styles.wrap, { pointerEvents: 'none' }, style]} aria-hidden importantForAccessibility="no-hide-descendants">
      <Text style={[styles.word, { fontSize: size, lineHeight: size * 1.02 }]} numberOfLines={1} selectable={false}>
        {word}
      </Text>
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  wrap: { position: 'absolute', overflow: 'visible', transform: [{ rotate: '-8deg' }] },
  word: { fontFamily: fonts.display, color: t.colors.ghost, letterSpacing: -6, textTransform: 'uppercase' },
}));
