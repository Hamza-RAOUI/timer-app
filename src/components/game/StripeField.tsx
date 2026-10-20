import React, { useId } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';

/** Diagonal stripe texture that fills its parent (decorative). */
export const StripeField: React.FC<{ color?: string; gap?: number; width?: number; style?: StyleProp<ViewStyle> }> = ({ color, gap = 14, width = 2, style }) => {
  const t = useTheme();
  const id = `stripes-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }, style]} aria-hidden>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id={id} patternUnits="userSpaceOnUse" width={gap} height={gap} patternTransform="rotate(-35)">
            <Line x1={0} y1={0} x2={0} y2={gap} stroke={color ?? t.colors.stripe} strokeWidth={width} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
};
