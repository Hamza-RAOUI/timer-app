import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { TECHNIQUES, type Skill, type TechniqueKey } from '../constants/focus';
import { useSkills } from '../hooks/useSkills';
import { useProgress, useReducedMotionPref } from '../lib/game';
import { useSettingsStore } from '../stores/settingsStore';
import { useStatsStore } from '../stores/statsStore';
import { useUiStore, type AppView } from '../stores/uiStore';
import { makeStyles, useTheme } from '../theme/ThemeProvider';
import { fonts, SLANT, tabular, UNSLANT } from '../theme/typography';
import { formatMsHuman } from '../utils/timeFormatter';
import { RankEmblem } from './art/RankEmblem';
import { SkillCrest } from './art/SkillCrest';
import { Dropdown } from './Dropdown';
import { XpBar } from './game/XpBar';

const NAV: { key: AppView; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'timer', label: 'Timer', icon: 'hourglass-outline' },
  { key: 'character', label: 'Character', icon: 'shield-half-outline' },
  { key: 'stats', label: 'Statistics', icon: 'stats-chart-outline' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline' },
];

const EASE = Easing.bezier(0.22, 1, 0.36, 1);

/** Menu row: a slanted highlight bar scales in from the left behind the active item. */
const NavItem: React.FC<{ item: (typeof NAV)[number]; index: number; active: boolean; onPress: () => void }> = ({ item, index, active, onPress }) => {
  const t = useTheme();
  const styles = useStyles();
  const reduced = useReducedMotionPref();
  const sel = useSharedValue(active ? 1 : 0);
  const enter = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    sel.value = withTiming(active ? 1 : 0, { duration: reduced ? 0 : 220, easing: EASE });
  }, [active, reduced, sel]);
  useEffect(() => {
    if (!reduced) enter.value = withDelay(80 + index * 70, withTiming(1, { duration: 380, easing: EASE }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bar = useAnimatedStyle(() => ({ transform: [{ skewX: '-16deg' }, { scaleX: sel.value }] }));
  const rowIn = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ translateX: (1 - enter.value) * -28 }] }));

  return (
    <Animated.View style={rowIn}>
      <Pressable
        onPress={onPress}
        style={styles.navItem}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={item.label}
      >
        {(state) => {
          const hovered = (state as { hovered?: boolean }).hovered;
          return (
            <>
              <Animated.View style={[styles.navBar, bar]} />
              {active && <View style={styles.navTick} />}
              <Text style={[styles.navIndex, tabular, active && styles.navTextActive]}>{String(index + 1).padStart(2, '0')}</Text>
              <Ionicons name={item.icon} size={18} color={active ? t.colors.text.onAccent : hovered ? t.colors.accentText : t.colors.text.secondary} />
              <Text style={[styles.navLabel, active ? styles.navTextActive : hovered ? styles.navLabelHover : null]}>{item.label}</Text>
            </>
          );
        }}
      </Pressable>
    </Animated.View>
  );
};

const PlayerCard: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const progress = useProgress();
  const setView = useUiStore((s) => s.setView);
  const { level, title, streak } = progress;
  return (
    <Pressable
      onPress={() => setView('character')}
      style={({ pressed }) => [styles.player, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
      accessibilityLabel={`Level ${level.level}, ${title.title}. ${level.xpIntoLevel} of ${level.xpForNext} XP. ${streak.current} day streak. Open character.`}
    >
      <View style={styles.playerTop}>
        <RankEmblem title={title.title} size={46} />
        <View style={{ flex: 1 }}>
          <View style={styles.playerHead}>
            <Text style={[styles.playerLv, tabular]}>LV {level.level}</Text>
            <View style={styles.streak}>
              <Ionicons name="flame" size={14} color={streak.current > 0 ? t.colors.highlight : t.colors.text.tertiary} />
              <Text style={[styles.streakText, tabular]}>{streak.current}</Text>
            </View>
          </View>
          <Text style={styles.playerTitle} numberOfLines={1}>
            {title.title}
          </Text>
        </View>
      </View>
      <XpBar progress={level.progress} height={8} ticks={10} style={{ marginTop: 10 }} label="Player XP" />
      <Text style={[styles.playerXp, tabular]}>
        {level.xpIntoLevel} / {level.xpForNext} XP
      </Text>
    </Pressable>
  );
};

const SkillPill: React.FC<{ skill: Skill; active: boolean; level: number; onPress: () => void }> = ({ skill, active, level, onPress }) => {
  const t = useTheme();
  const styles = useStyles();
  const sw = t.colors.swatch[skill.swatch];
  return (
    <Pressable
      onPress={onPress}
      style={[styles.catChip, active && { borderColor: sw.fill, backgroundColor: sw.soft }]}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      accessibilityLabel={`${skill.label}, level ${level}`}
    >
      <SkillCrest swatch={skill.swatch} icon={skill.icon} size={22} />
      <View style={{ flexShrink: 1 }}>
        <Text style={[styles.catLabel, active && { color: t.colors.text.primary }]} numberOfLines={1}>
          {skill.label}
        </Text>
        <Text style={[styles.catLv, tabular, active && { color: sw.text }]}>LV {level}</Text>
      </View>
    </Pressable>
  );
};

export const Sidebar: React.FC<{ onCollapse?: () => void }> = ({ onCollapse }) => {
  const t = useTheme();
  const styles = useStyles();
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  const openPro = useUiStore((s) => s.openPro);
  const technique = useSettingsStore((s) => s.lastTechnique);
  const setTechnique = useSettingsStore((s) => s.setTechnique);
  const category = useSettingsStore((s) => s.lastCategory);
  const setCategory = useSettingsStore((s) => s.setCategory);
  const isPro = useSettingsStore((s) => s.isPro);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const skills = useSkills();
  const progress = useProgress();

  // Subscribe to the stable `sessions` array; derive objects with useMemo so
  // selectors never return a fresh reference each render (avoids update loops).
  const sessions = useStatsStore((s) => s.sessions);
  const todayMin = useMemo(() => useStatsStore.getState().todayMinutes(), [sessions]);
  const bySkill = useMemo(() => useStatsStore.getState().minutesBySkill('D'), [sessions]);
  const totalToday = Math.max(1, todayMin);

  return (
    <View style={styles.root}>
      <View style={styles.brandRow}>
        <Pressable onPress={() => setView('timer')} style={styles.brandPress} accessibilityRole="link" accessibilityLabel="Flowglass — go to timer">
          <View style={styles.logo}>
            <View style={styles.logoInner}>
              <Ionicons name="hourglass" size={17} color={t.colors.text.onAccent} />
            </View>
          </View>
          <Text style={styles.brand}>Flowglass</Text>
        </Pressable>
        {onCollapse && (
          <Pressable onPress={onCollapse} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Collapse sidebar">
            <Ionicons name="chevron-back" size={18} color={t.colors.text.secondary} />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <PlayerCard />

        {/* Today */}
        <View style={styles.todayCard}>
          <View style={styles.todayHead}>
            <Text style={styles.kicker}>Today</Text>
            <Text style={[styles.todayQuest, progress.today.quest.done && { color: t.colors.successText }]} numberOfLines={1}>
              {progress.today.quest.done ? '✓ Quest done' : `Quest ${progress.today.quest.progress}/${progress.today.quest.target}`}
            </Text>
          </View>
          <Text style={[styles.todayValue, tabular]}>{formatMsHuman(todayMin * 60000)}</Text>
          <View style={styles.stackBar}>
            {skills.map((c) => {
              const w = ((bySkill[c.key] ?? 0) / totalToday) * 100;
              if (w <= 0) return null;
              return <View key={c.key} style={{ width: `${w}%`, backgroundColor: t.colors.swatch[c.swatch].fill }} />;
            })}
            {todayMin === 0 && <View style={styles.stackEmpty} />}
          </View>
        </View>

        {/* Technique */}
        <View style={styles.field}>
          <Dropdown<TechniqueKey>
            label="Technique"
            value={technique}
            options={TECHNIQUES.map((x) => ({ key: x.key, label: x.label, sub: x.sub, icon: 'hourglass-outline' }))}
            onChange={(x) => {
              setTechnique(x);
              setView('timer');
            }}
          />
        </View>

        {/* Skill */}
        <View style={styles.field}>
          <View style={styles.fieldHead}>
            <Text style={styles.kicker}>Skill</Text>
            <Pressable
              onPress={() => (isPro ? setView('character') : openPro('skills'))}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isPro ? 'Edit skills' : 'Add skills — Pro'}
            >
              <Text style={styles.fieldAction}>{isPro ? 'Edit' : '+ Add'}</Text>
            </Pressable>
          </View>
          <View style={styles.catGrid} accessibilityRole="radiogroup" accessibilityLabel="Skill for the next session">
            {skills.map((c) => (
              <SkillPill key={c.key} skill={c} active={category === c.key} level={progress.skills[c.key]?.level.level ?? 1} onPress={() => setCategory(c.key)} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Menu */}
      <View style={styles.nav} accessibilityRole="menu">
        {NAV.map((n, i) => (
          <NavItem key={n.key} item={n} index={i} active={view === n.key} onPress={() => setView(n.key)} />
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={() => setThemeMode(t.isDark ? 'light' : 'dark')}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={t.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Ionicons name={t.isDark ? 'sunny' : 'moon'} size={17} color={t.colors.text.secondary} />
        </Pressable>
        {isPro ? (
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        ) : (
          <Pressable onPress={() => openPro('sidebar')} style={styles.proLink} accessibilityRole="button">
            <Ionicons name="sparkles" size={14} color={t.colors.highlightText} />
            <Text style={styles.proLinkText}>Founding Pro</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  root: { flex: 1, paddingHorizontal: 16, paddingTop: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 },
  brandPress: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surfaceAlt, borderWidth: 1, borderColor: t.colors.border },
  logo: { width: 34, height: 34, borderRadius: 9, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: SLANT }] },
  logoInner: { transform: [{ skewX: UNSLANT }] },
  brand: { fontFamily: fonts.display, fontSize: 19, color: t.colors.text.primary, letterSpacing: 1.6, textTransform: 'uppercase', transform: [{ skewX: '-8deg' }] },

  player: { backgroundColor: t.colors.surfaceAlt, borderRadius: 16, borderWidth: 1, borderColor: t.colors.border, padding: 12, marginBottom: 12 },
  playerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  playerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerLv: { fontFamily: fonts.display, fontSize: 20, color: t.colors.text.primary, transform: [{ skewX: '-8deg' }] },
  playerTitle: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 1.6, color: t.colors.accentText, textTransform: 'uppercase', marginTop: 1 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: t.colors.highlightSoft },
  streakText: { fontFamily: fonts.display, fontSize: 12, color: t.colors.text.primary },
  playerXp: { fontFamily: fonts.semibold, fontSize: 11, color: t.colors.text.tertiary, marginTop: 6 },

  todayCard: { backgroundColor: t.colors.surfaceAlt, borderRadius: 16, borderWidth: 1, borderColor: t.colors.border, padding: 12, marginBottom: 16 },
  todayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  todayQuest: { fontFamily: fonts.semibold, fontSize: 11, color: t.colors.text.tertiary, flexShrink: 1 },
  kicker: { fontFamily: fonts.display, fontSize: 11, color: t.colors.text.tertiary, letterSpacing: 1.4, textTransform: 'uppercase' },
  todayValue: { fontFamily: fonts.display, fontSize: 24, color: t.colors.text.primary, marginTop: 2, marginBottom: 10, transform: [{ skewX: '-6deg' }] },
  stackBar: { flexDirection: 'row', height: 8, borderRadius: 3, overflow: 'hidden', backgroundColor: t.colors.barIdle },
  stackEmpty: { flex: 1, backgroundColor: t.colors.barIdle },

  field: { marginBottom: 16 },
  fieldHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  fieldAction: { fontFamily: fonts.semibold, fontSize: 12, color: t.colors.accentText },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
    width: '47.5%',
  },
  catLabel: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.text.secondary },
  catLv: { fontFamily: fonts.display, fontSize: 10, letterSpacing: 0.6, color: t.colors.text.tertiary },

  nav: { gap: 2, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.colors.border },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 4 },
  navBar: { position: 'absolute', left: 2, right: 6, top: 3, bottom: 3, backgroundColor: t.colors.accent, borderRadius: 3, transformOrigin: 'left center' },
  navTick: { position: 'absolute', left: 12, right: 30, bottom: -1, height: 3, backgroundColor: t.colors.highlight, transform: [{ skewX: '-16deg' }] },
  navIndex: { fontFamily: fonts.display, fontSize: 10, color: t.colors.text.tertiary, width: 16 },
  navLabel: { fontFamily: fonts.display, fontSize: 14, letterSpacing: 1.4, color: t.colors.text.secondary, textTransform: 'uppercase', transform: [{ skewX: '-8deg' }] },
  navLabelHover: { color: t.colors.accentText },
  navTextActive: { color: t.colors.text.onAccent },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 14, borderTopWidth: 1, borderTopColor: t.colors.border },
  proLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 34, borderRadius: 10, backgroundColor: t.colors.highlightSoft },
  proLinkText: { fontFamily: fonts.display, fontSize: 11.5, letterSpacing: 1.1, color: t.colors.highlightText, textTransform: 'uppercase' },
  proBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, backgroundColor: t.colors.gold, transform: [{ skewX: SLANT }] },
  proBadgeText: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 1.4, color: '#3B2300', transform: [{ skewX: UNSLANT }] },
}));
