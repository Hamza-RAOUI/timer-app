import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { RPG_CONFIG, type Reward } from '../../lib/rpg';
import { XP_COUNT_MS, useReducedMotionPref } from '../../lib/game';
import { useAllSkills } from '../../hooks/useSkills';
import { skillFrom } from '../../constants/focus';
import { useRewardStore } from '../../stores/rewardStore';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts, hardTextShadow, tabular } from '../../theme/typography';
import { SkillCrest } from '../art/SkillCrest';
import { SkewTag } from '../game/SkewTag';
import { XpBar } from '../game/XpBar';

const VISIBLE_MS = 9000;

const headline = (r: Reward) => (r.completed ? 'Session complete' : r.xp?.reason === 'partial' ? 'Stopped early' : 'Session logged');

const detail = (r: Reward): string => {
  const mins = Math.floor(r.session.focusedMinutes);
  const x = r.xp;
  if (!x) return `${mins} min logged`;
  switch (x.reason) {
    case 'completed':
      return `${x.minutesXp} min focus · +${x.bonus} completion bonus`;
    case 'partial':
      return r.session.plannedMinutes
        ? `${mins} min · ${Math.round((r.session.focusedMinutes / r.session.plannedMinutes) * 100)}% of the block — no bonus`
        : `${mins} min · finish ${RPG_CONFIG.xp.openEndedCompleteMinutes}+ min for the bonus`;
    case 'under-half':
      return `${mins} min logged · under 50% of the block, no XP`;
    case 'too-short':
    default:
      return `${Math.max(0, mins)} min logged · under ${RPG_CONFIG.xp.minMinutes} min, no XP`;
  }
};

/** Count from 0 to `to` once `startAt` (wall clock) is reached. */
const useCountUp = (to: number, startAt: number, key: number, reduced: boolean) => {
  const [n, setN] = useState(reduced ? to : 0);
  useEffect(() => {
    if (reduced) {
      setN(to);
      return;
    }
    setN(0);
    let raf = 0;
    const wait = setTimeout(() => {
      const t0 = Date.now();
      const step = () => {
        const p = Math.min(1, (Date.now() - t0) / XP_COUNT_MS);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, Math.max(0, startAt - Date.now()));
    return () => {
      clearTimeout(wait);
      cancelAnimationFrame(raf);
    };
  }, [to, startAt, key, reduced]);
  return n;
};

/** The "+N XP" moment under the timer: count-up, breakdown, skill bar fill. */
export const RewardPanel: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotionPref();
  const reward = useRewardStore((s) => s.current);
  const seq = useRewardStore((s) => s.seq);
  const revealAt = useRewardStore((s) => s.revealAt);
  const clear = useRewardStore((s) => s.clearCurrent);
  const skills = useAllSkills();
  const lastSeq = useRef(seq);

  const shown = useSharedValue(0);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Replays once per new reward (keyed on `seq` only so re-renders can't cancel the auto-hide).
  useEffect(() => {
    if (!reward || seq === lastSeq.current) return;
    lastSeq.current = seq;
    const delay = Math.max(0, revealAt - Date.now());
    setVisible(true);
    shown.value = 0;
    shown.value = reduced ? withDelay(delay, withTiming(1, { duration: 1 })) : withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.back(1.4)) }));
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      shown.value = withTiming(0, { duration: reduced ? 1 : 260 });
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        clear();
      }, reduced ? 10 : 280);
    }, delay + VISIBLE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seq]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const xp = useCountUp(reward?.gained ?? 0, revealAt, seq, reduced);
  const aStyle = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateY: (1 - shown.value) * 24 }, { scale: 0.96 + shown.value * 0.04 }] }));

  if (!reward || !visible) return null;

  const skill = skillFrom(skills, reward.session.skill);
  const sw = t.colors.swatch[skill.swatch] ?? t.colors.swatch.violet;
  const questXp = reward.questsCompleted.reduce((s, q) => s + q.reward, 0);
  const skillFrom01 = reward.skillLeveledUp ? 0 : reward.skillBefore.progress;
  const earned = reward.gained > 0;

  return (
    <Animated.View style={[styles.wrap, aStyle]} accessibilityLiveRegion="polite" role="status">
      <View style={styles.card}>
        <View style={[styles.stripe, { backgroundColor: earned ? t.colors.gold : t.colors.barIdle }]} />
        <View style={styles.topRow}>
          <SkewTag label={headline(reward)} size="sm" color={reward.completed ? t.colors.accent : t.colors.surfaceRaised} textColor={reward.completed ? t.colors.text.onAccent : t.colors.text.secondary} />
          <Pressable onPress={() => { setVisible(false); clear(); }} hitSlop={10} accessibilityRole="button" accessibilityLabel="Dismiss">
            <Ionicons name="close" size={18} color={t.colors.text.tertiary} />
          </Pressable>
        </View>

        <View style={styles.xpRow}>
          <Text style={[styles.xp, tabular, !earned && { color: t.colors.text.tertiary }]} accessibilityLabel={`plus ${reward.gained} XP`}>
            +{xp}
          </Text>
          <Text style={[styles.xpUnit, !earned && { color: t.colors.text.tertiary }]}>XP</Text>
        </View>
        <Text style={styles.detail}>{detail(reward)}</Text>
        {questXp > 0 && <Text style={styles.bonus}>+{questXp} XP quest reward</Text>}
        {reward.xp?.capped && <Text style={styles.cap}>Daily XP cap reached ({RPG_CONFIG.xp.dailyCap}) — focus still counts in stats.</Text>}

        {earned && (
          <View style={styles.skillRow}>
            <SkillCrest swatch={skill.swatch} icon={skill.icon} size={30} />
            <View style={{ flex: 1, gap: 5 }}>
              <View style={styles.skillHead}>
                <Text style={[styles.skillName, { color: sw.text }]}>{skill.label}</Text>
                <Text style={[styles.skillLv, tabular]}>
                  LV {reward.skillAfter.level}
                  {reward.skillLeveledUp ? '  ▲' : ''}
                </Text>
              </View>
              <XpBar
                progress={reward.skillAfter.progress}
                from={skillFrom01}
                replayKey={seq}
                delayMs={Math.max(0, revealAt - Date.now()) + (reduced ? 0 : 200)}
                durationMs={XP_COUNT_MS}
                color={sw.fill}
                height={8}
                label={`${skill.label} XP`}
              />
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const useStyles = makeStyles((t) => ({
  wrap: { width: '100%', maxWidth: 420, marginTop: 18 },
  card: { backgroundColor: t.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: t.colors.border, padding: 16, paddingTop: 14, overflow: 'hidden', ...t.shadow.md },
  stripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  xpRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 8 },
  xp: {
    fontFamily: fonts.display,
    fontSize: 46,
    lineHeight: 50,
    color: t.colors.goldText,
    letterSpacing: -1,
    transform: [{ skewX: '-8deg' }],
    ...hardTextShadow(t.isDark ? 'rgba(244,114,182,0.55)' : 'rgba(219,39,119,0.25)', 3),
  },
  xpUnit: { fontFamily: fonts.display, fontSize: 20, color: t.colors.goldText, marginBottom: 7, letterSpacing: 1 },
  detail: { fontFamily: fonts.medium, fontSize: 13, color: t.colors.text.secondary, marginTop: 2 },
  bonus: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.successText, marginTop: 4 },
  cap: { fontFamily: fonts.medium, fontSize: 12, color: t.colors.text.tertiary, marginTop: 4 },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  skillHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  skillName: { fontFamily: fonts.display, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' },
  skillLv: { fontFamily: fonts.display, fontSize: 12, color: t.colors.text.primary, letterSpacing: 0.6 },
}));
