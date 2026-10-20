import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useAllSkills } from '../../hooks/useSkills';
import { useProgress } from '../../lib/game';
import { RPG_CONFIG } from '../../lib/rpg';
import { rangeStart, useStatsStore, type RangeKey } from '../../stores/statsStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts, SLANT, tabular } from '../../theme/typography';
import { formatMsHuman } from '../../utils/timeFormatter';
import { SandScene } from '../art/SandScene';
import { SkillCrest } from '../art/SkillCrest';
import { Card } from '../Card';
import { SectionHeader } from '../game/SectionHeader';

/** Free keeps the last 7 days (Day + Week); Month / Year are Pro. */
const RANGES: { key: RangeKey; label: string; pro: boolean }[] = [
  { key: 'D', label: 'Day', pro: false },
  { key: 'W', label: 'Week', pro: false },
  { key: 'M', label: 'Month', pro: true },
  { key: 'Y', label: 'Year', pro: true },
];

export const StatisticsView: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<RangeKey>('W');
  const isPro = useSettingsStore((s) => s.isPro);
  const openPro = useUiStore((s) => s.openPro);
  const skills = useAllSkills();
  const progress = useProgress();

  // Subscribe to the stable `sessions` array, derive everything with useMemo so
  // object/array-returning selectors never trigger an update loop (zustand v5).
  const sessions = useStatsStore((s) => s.sessions);
  const minutes = useMemo(() => useStatsStore.getState().minutesInRange(range), [sessions, range]);
  const count = useMemo(() => useStatsStore.getState().countInRange(range), [sessions, range]);
  const bySkill = useMemo(() => useStatsStore.getState().minutesBySkill(range), [sessions, range]);
  const series = useMemo(() => useStatsStore.getState().series(range), [sessions, range]);
  const xp = useMemo(() => {
    const from = rangeStart(range);
    return sessions.filter((s) => s.endedAt >= from).reduce((sum, s) => sum + (progress.awards.get(s.id)?.awarded ?? 0), 0);
  }, [sessions, range, progress]);

  const maxBar = Math.max(30, ...series.map((d) => d.minutes));
  const totalBySkill = Math.max(1, Object.values(bySkill).reduce((a, b) => a + b, 0));
  const rows = skills.filter((s) => !s.archived || (bySkill[s.key] ?? 0) > 0);
  const wide = width >= 900;

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <ScrollView contentContainerStyle={[styles.scroll, wide && styles.scrollWide]} showsVerticalScrollIndicator={false}>
        {wide && (
          <Text style={styles.h1} accessibilityRole="header">
            Statistics
          </Text>
        )}

        {/* Range segmented control */}
        <View style={styles.segment} accessibilityRole="tablist">
          {RANGES.map((r) => {
            const active = range === r.key;
            const locked = r.pro && !isPro;
            return (
              <Pressable
                key={r.key}
                onPress={() => (locked ? openPro('stats') : setRange(r.key))}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={locked ? `${r.label}, Pro` : r.label}
              >
                {locked && <Ionicons name="lock-closed" size={11} color={t.colors.text.tertiary} />}
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {!isPro && (
          <Pressable onPress={() => openPro('stats')} style={styles.freeNote} accessibilityRole="button">
            <Ionicons name="time-outline" size={14} color={t.colors.text.tertiary} />
            <Text style={styles.freeNoteText}>
              Free shows your last {RPG_CONFIG.freeStatsDays} days. Full history (Month, Year) comes with Founding Pro — your sessions are all kept.
            </Text>
          </Pressable>
        )}

        <View style={[styles.grid, wide && styles.gridWide]}>
          {/* Summary + chart */}
          <Card style={wide ? styles.colMain : undefined} padding={20} accent={t.colors.accent}>
            <View style={styles.summaryRow}>
              <Summary value={formatMsHuman(minutes * 60000)} label="Focused" />
              <View style={styles.vline} />
              <Summary value={String(count)} label="Sessions" />
              <View style={styles.vline} />
              <Summary value={xp.toLocaleString()} label="XP" />
              <View style={styles.vline} />
              <Summary value={`${progress.streak.current}d`} label="Streak" />
            </View>

            <View style={styles.chart} accessibilityLabel={`Focus minutes chart: ${series.map((d) => `${d.label} ${Math.round(d.minutes)} minutes`).join(', ')}`}>
              {series.map((d, i) => {
                const h = Math.max(4, (d.minutes / maxBar) * 150);
                return (
                  <View key={i} style={styles.chartCol}>
                    <View style={styles.barTrack}>
                      <View style={[styles.bar, { height: h, backgroundColor: d.highlight ? t.colors.accent : t.colors.barIdle }]}>
                        {d.highlight && d.minutes > 0 && <View style={[styles.barCap, { backgroundColor: t.colors.highlight }]} />}
                      </View>
                    </View>
                    <Text style={[styles.barLabel, d.highlight && { color: t.colors.accentText, fontFamily: fonts.display }]} numberOfLines={1}>
                      {d.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Skill breakdown */}
          <Card style={wide ? styles.colSide : { marginTop: 16 }} padding={20}>
            <SectionHeader title="By skill" />
            <View style={{ gap: 14 }}>
              {rows.map((c) => {
                const mins = bySkill[c.key] ?? 0;
                const pct = Math.round((mins / totalBySkill) * 100);
                const sw = t.colors.swatch[c.swatch];
                return (
                  <View key={c.key} accessible accessibilityLabel={`${c.label}: ${formatMsHuman(mins * 60000)}, ${pct}%`}>
                    <View style={styles.catHead}>
                      <View style={styles.catLeft}>
                        <SkillCrest swatch={c.swatch} icon={c.icon} size={22} />
                        <Text style={styles.catName}>{c.label}</Text>
                        <Text style={[styles.catLv, tabular, { color: sw.text }]}>LV {progress.skills[c.key]?.level.level ?? 1}</Text>
                      </View>
                      <Text style={[styles.catMins, tabular]}>{formatMsHuman(mins * 60000)}</Text>
                    </View>
                    <View style={styles.catTrack}>
                      <View style={[styles.catFill, { width: `${mins === 0 ? 0 : Math.max(4, pct)}%`, backgroundColor: sw.fill }]} />
                    </View>
                  </View>
                );
              })}
              {minutes === 0 && (
                <View style={styles.emptyBox}>
                  <SandScene height={96} style={{ borderRadius: 12 }} label="Illustration: an hourglass waiting on the dunes" />
                  <Text style={styles.empty}>No focus logged in this range yet. Start a session to see it here.</Text>
                </View>
              )}
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const Summary = ({ value, label }: { value: string; label: string }) => {
  const styles = useStyles();
  return (
    <View style={styles.summary} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.summaryValue, tabular]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  scroll: { padding: 20, paddingBottom: 120 },
  scrollWide: { paddingHorizontal: 40, paddingTop: 28, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  h1: { fontFamily: fonts.display, fontSize: 34, color: t.colors.text.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 18, transform: [{ skewX: '-8deg' }] },
  segment: { flexDirection: 'row', backgroundColor: t.colors.surfaceAlt, borderRadius: 14, borderWidth: 1, borderColor: t.colors.border, padding: 4, gap: 4, marginBottom: 12 },
  segmentItem: { flex: 1, flexDirection: 'row', gap: 5, paddingVertical: 9, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentItemActive: { backgroundColor: t.colors.accent, transform: [{ skewX: SLANT }] },
  segmentText: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.text.secondary },
  segmentTextActive: { color: t.colors.text.onAccent, fontFamily: fonts.display, letterSpacing: 1, textTransform: 'uppercase', transform: [{ skewX: '12deg' }] },
  freeNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingHorizontal: 4 },
  freeNoteText: { flex: 1, fontFamily: fonts.medium, fontSize: 12.5, color: t.colors.text.tertiary },
  grid: {},
  gridWide: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  colMain: { flex: 1.4 },
  colSide: { flex: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  summary: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  summaryValue: { fontFamily: fonts.display, fontSize: 18, color: t.colors.text.primary, transform: [{ skewX: '-6deg' }] },
  summaryLabel: { fontFamily: fonts.semibold, fontSize: 11, color: t.colors.text.tertiary, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.8 },
  vline: { width: 1, height: 30, backgroundColor: t.colors.border },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 180, marginTop: 18, gap: 4 },
  chartCol: { flex: 1, alignItems: 'center', gap: 8 },
  barTrack: { height: 150, justifyContent: 'flex-end' },
  bar: { width: 22, borderRadius: 4, minHeight: 4, transform: [{ skewX: SLANT }], overflow: 'hidden' },
  barCap: { height: 4, width: '100%' },
  barLabel: { fontFamily: fonts.medium, fontSize: 10, color: t.colors.text.tertiary },
  catHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  catName: { fontFamily: fonts.semibold, fontSize: 14, color: t.colors.text.primary },
  catLv: { fontFamily: fonts.display, fontSize: 10.5, letterSpacing: 0.6 },
  catMins: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.text.secondary },
  catTrack: { height: 8, borderRadius: 3, backgroundColor: t.colors.barIdle, overflow: 'hidden' },
  catFill: { height: 8, borderRadius: 3 },
  emptyBox: { gap: 10, marginTop: 4 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: t.colors.text.tertiary, lineHeight: 19 },
}));
