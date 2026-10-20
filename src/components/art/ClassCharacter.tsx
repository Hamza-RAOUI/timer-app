import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Platform, Text, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { useReducedMotionPref } from '../../lib/game';
import { useTheme } from '../../theme/ThemeProvider';
import { fonts, hardTextShadow } from '../../theme/typography';

/**
 * One "class" per skill: tinted art that bleeds into the background, with the
 * class name set huge and slanted across it (game-menu style).
 * Art: Pixabay Content License images, recolored — see assets/images/classes/CREDITS.md.
 */
export type ClassVariant = 'scholar' | 'striker' | 'artisan' | 'wanderer';

export interface ClassInfo {
  variant: ClassVariant;
  name: string;
}

const BY_SKILL: Record<string, ClassInfo> = {
  study: { variant: 'scholar', name: 'The Scholar' },
  work: { variant: 'striker', name: 'The Vanguard' },
  hobby: { variant: 'artisan', name: 'The Archer' },
  personal: { variant: 'wanderer', name: 'The Dreamer' },
};
const ROTATION: ClassInfo[] = [BY_SKILL.personal, BY_SKILL.hobby, BY_SKILL.work, BY_SKILL.study];

/** Built-in skills have a fixed class; custom skills get a stable one from their key. */
export const classForSkill = (key: string): ClassInfo => {
  if (BY_SKILL[key]) return BY_SKILL[key];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return ROTATION[Math.abs(h) % ROTATION.length];
};

const ART: Record<ClassVariant, ImageSourcePropType> = {
  scholar: require('../../../assets/images/classes/study.jpg'),
  striker: require('../../../assets/images/classes/work.jpg'),
  artisan: require('../../../assets/images/classes/hobby.jpg'),
  wanderer: require('../../../assets/images/classes/personal.jpg'),
};

/** `#RRGGBB` → `rgba(r,g,b,a)` (gradients need the same hue at 0 alpha, not `transparent`). */
const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

/** Gentle mouse parallax (web only): -1…1 on each axis. */
const usePointer = (enabled: boolean) => {
  const px = useSharedValue(0);
  const py = useSharedValue(0);
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onMove = (e: MouseEvent) => {
      px.value = withTiming((e.clientX / window.innerWidth) * 2 - 1, { duration: 600 });
      py.value = withTiming((e.clientY / window.innerHeight) * 2 - 1, { duration: 600 });
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [enabled, px, py]);
  return { px, py };
};

interface ClassCharacterProps {
  skillKey: string;
  width: number;
  height: number;
  /** Background color (#RRGGBB) the art fades into on its left and bottom edges. */
  fadeTo: string;
  /** Set the class name across the art. */
  showName?: boolean;
  /** Width the name may use (it's right-aligned); defaults to most of the art. */
  nameMaxWidth?: number;
  style?: StyleProp<ViewStyle>;
  label?: string;
}

export const ClassCharacter: React.FC<ClassCharacterProps> = ({ skillKey, width, height, fadeTo, showName = true, nameMaxWidth, style, label }) => {
  const t = useTheme();
  const reduced = useReducedMotionPref();
  const cls = classForSkill(skillKey);
  const [first, ...rest] = cls.name.toLowerCase().split(' ');
  const longest = Math.max(4, rest.join(' ').length);
  const room = nameMaxWidth ?? width * 0.85;
  // Inter Black runs ~0.62em per lowercase letter.
  const nameSize = Math.max(34, Math.min(room / (longest * 0.62), height * 0.16, 130));

  // Art slides in, then the name sweeps in after it — replayed when the class changes.
  const enter = useSharedValue(reduced ? 1 : 0);
  const word = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) {
      enter.value = 1;
      word.value = 1;
      return;
    }
    enter.value = 0;
    word.value = 0;
    enter.value = withTiming(1, { duration: 650, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    word.value = withDelay(180, withTiming(1, { duration: 520, easing: Easing.bezier(0.22, 1, 0.36, 1) }));
  }, [cls.variant, reduced, enter, word]);

  // Slow idle drift.
  const idle = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      cancelAnimation(idle);
      idle.value = 0;
      return;
    }
    idle.value = withRepeat(withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(idle);
  }, [reduced, idle]);

  const { px, py } = usePointer(!reduced);

  const artIn = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ translateX: (1 - enter.value) * width * 0.18 }] }));
  const artMove = useAnimatedStyle(() => ({
    transform: [{ scale: 1.05 + idle.value * 0.05 }, { translateX: -px.value * 12 }, { translateY: -py.value * 8 + (idle.value - 0.5) * 12 }],
  }));
  const nameIn = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateX: (1 - word.value) * 80 }, { rotate: '-9deg' }, { skewX: '-8deg' }],
  }));

  // The name always sits on the blue art, so it's light in both themes.
  const ink = '#F2F4FF';
  const shadowCol = t.colors.highlight;
  const fill = { position: 'absolute' as const, left: 0, top: 0, width, height };

  return (
    <View
      style={[{ width, height, overflow: 'hidden' }, style]}
      accessible={!!label}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      aria-hidden={!label}
    >
      <Animated.View style={[fill, artIn]}>
        <Animated.Image source={ART[cls.variant]} resizeMode="cover" style={[fill, artMove]} />
        {/* Deep-blue wash in both themes — the art stays a rich panel, never a pale one. */}
        <View style={[fill, { backgroundColor: t.isDark ? 'rgba(4,6,15,0.30)' : 'rgba(11,16,48,0.22)' }]} />
        {/* Left edge: fully page-colored, then a slanted fade into the art (no seam). */}
        <LinearGradient colors={[rgba(fadeTo, 1), rgba(fadeTo, 1), rgba(fadeTo, 0)]} locations={[0, 0.1, 0.5]} start={{ x: 0, y: 0.45 }} end={{ x: 1, y: 0.55 }} style={fill} />
        <LinearGradient colors={[rgba(fadeTo, 0.9), rgba(fadeTo, 0)]} locations={[0, 0.42]} start={{ x: 0, y: 0.15 }} end={{ x: 1, y: 0.85 }} style={fill} />
        {/* Soft top/bottom — lighter in light mode so the panel doesn't go pale. */}
        <LinearGradient colors={[rgba(fadeTo, 0), rgba(fadeTo, t.isDark ? 0.9 : 0.6)]} locations={[t.isDark ? 0.65 : 0.8, 1]} style={fill} />
        {t.isDark && <LinearGradient colors={[rgba(fadeTo, 0.7), rgba(fadeTo, 0)]} locations={[0, 0.18]} style={fill} />}
      </Animated.View>

      {showName && (
        <Animated.View style={[{ position: 'absolute', right: width * 0.06, top: height * 0.07, alignItems: 'flex-end' }, nameIn]}>
          <Text style={{ fontFamily: fonts.display, fontSize: nameSize * 0.42, lineHeight: nameSize * 0.48, color: ink, letterSpacing: 1, ...hardTextShadow(shadowCol, 3) }}>{first}</Text>
          <Text
            style={{ fontFamily: fonts.display, fontSize: nameSize, lineHeight: nameSize * 0.98, color: ink, letterSpacing: -2, ...hardTextShadow(shadowCol, Math.round(nameSize / 22)) }}
            numberOfLines={1}
          >
            {rest.join(' ')}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};
