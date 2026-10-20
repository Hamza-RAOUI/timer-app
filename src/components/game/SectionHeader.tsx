import React from 'react';
import { Text, View, type StyleProp, type TextProps, type ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts, SLANT } from '../../theme/typography';

/** Game-menu section heading: two slanted bars + heavy caps label. Renders an <h2> (or `level`) on web. */
export const SectionHeader: React.FC<{ title: string; right?: React.ReactNode; style?: StyleProp<ViewStyle>; color?: string; level?: 2 | 3 }> = ({
  title,
  right,
  style,
  color,
  level = 2,
}) => {
  const t = useTheme();
  const styles = useStyles();
  const headingProps = { 'aria-level': level } as unknown as TextProps;
  return (
    <View style={[styles.row, style]}>
      <View style={styles.left}>
        <View style={[styles.bar, { backgroundColor: color ?? t.colors.accent }]} />
        <View style={[styles.bar, styles.barThin, { backgroundColor: t.colors.highlight }]} />
        <Text style={styles.title} accessibilityRole="header" {...headingProps}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  bar: { width: 6, height: 16, transform: [{ skewX: SLANT }], borderRadius: 1 },
  barThin: { width: 3, marginRight: 6 },
  title: { fontFamily: fonts.display, fontSize: 13, letterSpacing: 1.6, color: t.colors.text.primary, textTransform: 'uppercase', flexShrink: 1 },
}));
