import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { CATEGORIES } from '../../constants/focus';
import { useStatsStore, type RangeKey } from '../../stores/statsStore';
import { colors } from '../../theme/colors';
import { fonts, tabular } from '../../theme/typography';
import { formatMsHuman } from '../../utils/timeFormatter';
import { Card } from '../Card';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'D', label: 'Day' },
  { key: 'W', label: 'Week' },
  { key: 'M', label: 'Month' },
  { key: 'Y', label: 'Year' },
];

export const StatisticsView: React.FC = () => {
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<RangeKey>('W');

  // Subscribe to the stable `sessions` array, derive everything with useMemo so
  // object/array-returning selectors never trigger an update loop (zustand v5).
  const sessions = useStatsStore((s) => s.sessions);
  const minutes = useMemo(() => useStatsStore.getState().minutesInRange(range), [sessions, range]);
  const count = useMemo(() => useStatsStore.getState().countInRange(range), [sessions, range]);
  const byCat = useMemo(() => useStatsStore.getState().minutesByCategory(range), [sessions, range]);
  const series = useMemo(() => useStatsStore.getState().series(range), [sessions, range]);
  const streak = useMemo(() => useStatsStore.getState().streak(), [sessions]);

  const maxBar = Math.max(30, ...series.map((d) => d.minutes));
  const totalByCat = Math.max(1, Object.values(byCat).reduce((a, b) => a + b, 0));
  const wide = width >= 900;

  return (
    <ScrollView contentContainerStyle={[styles.scroll, wide && styles.scrollWide]} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Statistics</Text>

      {/* Range segmented control */}
      <View style={styles.segment}>
        {RANGES.map((r) => {
          const active = range === r.key;
          return (
            <Pressable key={r.key} onPress={() => setRange(r.key)} style={[styles.segmentItem, active && styles.segmentItemActive]}>
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{r.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.grid, wide && styles.gridWide]}>
        {/* Summary + chart */}
        <Card style={wide ? styles.colMain : undefined} padding={20}>
          <View style={styles.summaryRow}>
            <Summary value={formatMsHuman(minutes * 60000)} label="Focused" />
            <View style={styles.vline} />
            <Summary value={String(count)} label="Sessions" />
            <View style={styles.vline} />
            <Summary value={`${streak}d`} label="Streak" />
          </View>

          <View style={styles.chart}>
            {series.map((d, i) => {
              const h = Math.max(4, (d.minutes / maxBar) * 150);
              return (
                <View key={i} style={styles.chartCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: h, backgroundColor: d.highlight ? colors.accent : colors.barIdle }]} />
                  </View>
                  <Text style={[styles.barLabel, d.highlight && { color: colors.accent, fontFamily: fonts.semibold }]} numberOfLines={1}>
                    {d.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Category breakdown */}
        <Card style={wide ? styles.colSide : { marginTop: 16 }} padding={20}>
          <Text style={styles.cardTitle}>By category</Text>
          <View style={{ gap: 14, marginTop: 14 }}>
            {CATEGORIES.map((c) => {
              const mins = byCat[c.key];
              const pct = Math.round((mins / totalByCat) * 100);
              return (
                <View key={c.key}>
                  <View style={styles.catHead}>
                    <View style={styles.catLeft}>
                      <View style={[styles.catDot, { backgroundColor: c.color }]} />
                      <Text style={styles.catName}>{c.label}</Text>
                    </View>
                    <Text style={[styles.catMins, tabular]}>{formatMsHuman(mins * 60000)}</Text>
                  </View>
                  <View style={styles.catTrack}>
                    <View style={[styles.catFill, { width: `${mins === 0 ? 0 : Math.max(4, pct)}%`, backgroundColor: c.color }]} />
                  </View>
                </View>
              );
            })}
            {minutes === 0 && <Text style={styles.empty}>No focus logged in this range yet. Start a session to see it here.</Text>}
          </View>
        </Card>
      </View>
    </ScrollView>
  );
};

const Summary = ({ value, label }: { value: string; label: string }) => (
  <View style={styles.summary}>
    <Text style={[styles.summaryValue, tabular]}>{value}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 120 },
  scrollWide: { paddingHorizontal: 40, paddingTop: 28, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  h1: { fontFamily: fonts.headingBold, fontSize: 28, color: colors.text.primary, letterSpacing: -0.5, marginBottom: 18 },
  segment: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 4, gap: 4, marginBottom: 18 },
  segmentItem: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  segmentItemActive: { backgroundColor: colors.surface, ...{ shadowColor: '#1E293B', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 } },
  segmentText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text.secondary },
  segmentTextActive: { color: colors.accent, fontFamily: fonts.semibold },
  grid: {},
  gridWide: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  colMain: { flex: 1.4 },
  colSide: { flex: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  summary: { flex: 1, alignItems: 'center' },
  summaryValue: { fontFamily: fonts.headingBold, fontSize: 22, color: colors.text.primary },
  summaryLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.text.tertiary, marginTop: 2 },
  vline: { width: 1, height: 30, backgroundColor: colors.border },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 180, marginTop: 18, gap: 4 },
  chartCol: { flex: 1, alignItems: 'center', gap: 8 },
  barTrack: { height: 150, justifyContent: 'flex-end' },
  bar: { width: 22, borderRadius: 7, minHeight: 4 },
  barLabel: { fontFamily: fonts.medium, fontSize: 10, color: colors.text.tertiary },
  cardTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text.primary },
  catHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontFamily: fonts.medium, fontSize: 14, color: colors.text.primary },
  catMins: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text.secondary },
  catTrack: { height: 8, borderRadius: 4, backgroundColor: colors.barIdle, overflow: 'hidden' },
  catFill: { height: 8, borderRadius: 4 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.text.tertiary, lineHeight: 19, marginTop: 4 },
});
