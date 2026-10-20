import React from 'react';
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts, SLANT, UNSLANT } from '../../theme/typography';

interface SkewTagProps {
  label: string;
  /** Fill color (defaults to the accent). */
  color?: string;
  textColor?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Hard offset shadow in a second color — the "game menu" look. */
  shadowColor?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const SIZES = {
  sm: { fontSize: 10, px: 8, py: 3, letter: 1.2, offset: 2 },
  md: { fontSize: 12, px: 11, py: 5, letter: 1.4, offset: 3 },
  lg: { fontSize: 15, px: 14, py: 7, letter: 1.6, offset: 4 },
};

/** A slanted parallelogram label (text counter-skewed so it stays upright). */
export const SkewTag: React.FC<SkewTagProps> = ({ label, color, textColor, size = 'md', shadowColor, style, textStyle }) => {
  const t = useTheme();
  const styles = useStyles();
  const s = SIZES[size];
  return (
    <View style={[styles.wrap, style]}>
      {shadowColor && <View style={[styles.box, styles.shadow, { backgroundColor: shadowColor, left: s.offset, top: s.offset, right: -s.offset, bottom: -s.offset }]} />}
      <View style={[styles.box, { backgroundColor: color ?? t.colors.accent, paddingHorizontal: s.px, paddingVertical: s.py }]}>
        <Text style={[styles.text, { fontSize: s.fontSize, letterSpacing: s.letter, color: textColor ?? t.colors.text.onAccent }, textStyle]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
};

const useStyles = makeStyles(() => ({
  wrap: { alignSelf: 'flex-start' },
  box: { transform: [{ skewX: SLANT }], borderRadius: 3 },
  shadow: { position: 'absolute' },
  text: { fontFamily: fonts.display, textTransform: 'uppercase', transform: [{ skewX: UNSLANT }] },
}));
