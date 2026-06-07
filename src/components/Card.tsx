import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, shadow } from '../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  padding?: number;
  radius?: number;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, style, padding = 20, radius = 20, elevated = true }) => (
  <View style={[styles.card, elevated && shadow.sm, { padding, borderRadius: radius }, style]}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
