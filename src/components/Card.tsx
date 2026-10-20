import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '../theme/ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  radius?: number;
  elevated?: boolean;
  /** Game accent: a slanted color notch in the top-left corner. */
  accent?: string;
}

export const Card: React.FC<CardProps> = ({ children, style, padding = 20, radius = 20, elevated = true, accent }) => {
  const t = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.card, elevated && t.shadow.sm, { padding, borderRadius: radius }, style]}>
      {accent && <View style={[styles.notch, { backgroundColor: accent, borderTopLeftRadius: radius }]} />}
      {children}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  card: {
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    overflow: 'hidden',
  },
  notch: { position: 'absolute', top: 0, left: 0, width: 56, height: 5, transform: [{ skewX: '-40deg' }, { translateX: -4 }] },
}));
