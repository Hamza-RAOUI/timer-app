import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import type { IconName, SwatchKey } from '../../constants/focus';
import { useTheme } from '../../theme/ThemeProvider';

/** Diamond crest in a skill's color with its icon (decorative — the label sits next to it). */
export const SkillCrest: React.FC<{ swatch: SwatchKey; icon: IconName; size?: number; dim?: boolean }> = ({ swatch, icon, size = 28, dim }) => {
  const t = useTheme();
  const s = t.colors.swatch[swatch] ?? t.colors.swatch.violet;
  const d = size * 0.74;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', opacity: dim ? 0.55 : 1 }} aria-hidden>
      <View
        style={{
          position: 'absolute',
          width: d,
          height: d,
          borderRadius: size * 0.16,
          backgroundColor: s.fill,
          transform: [{ rotate: '45deg' }],
          borderWidth: Math.max(1, size * 0.05),
          borderColor: t.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.6)',
        }}
      />
      <Ionicons name={icon} size={size * 0.44} color={s.onFill} />
    </View>
  );
};
