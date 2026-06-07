import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES, TECHNIQUES, type TechniqueKey } from '../constants/focus';
import { useSettingsStore } from '../stores/settingsStore';
import { useStatsStore } from '../stores/statsStore';
import { useUiStore, type AppView } from '../stores/uiStore';
import { colors } from '../theme/colors';
import { fonts, tabular } from '../theme/typography';
import { formatMsHuman } from '../utils/timeFormatter';
import { Dropdown } from './Dropdown';

const NAV: { key: AppView; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'timer', label: 'Timer', icon: 'timer-outline' },
  { key: 'stats', label: 'Statistics', icon: 'stats-chart-outline' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline' },
];

export const Sidebar: React.FC = () => {
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  const technique = useSettingsStore((s) => s.lastTechnique);
  const setTechnique = useSettingsStore((s) => s.setTechnique);
  const category = useSettingsStore((s) => s.lastCategory);
  const setCategory = useSettingsStore((s) => s.setCategory);
  // Subscribe to the stable `sessions` array; derive objects with useMemo so
  // selectors never return a fresh reference each render (avoids update loops).
  const sessions = useStatsStore((s) => s.sessions);
  const todayMin = useMemo(() => useStatsStore.getState().todayMinutes(), [sessions]);
  const byCat = useMemo(() => useStatsStore.getState().minutesByCategory('D'), [sessions]);

  const totalToday = Math.max(1, todayMin);

  return (
    <View style={styles.root}>
      <View style={styles.brandRow}>
        <View style={styles.logo}>
          <Ionicons name="timer" size={18} color="#fff" />
        </View>
        <Text style={styles.brand}>Flowglass</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        {/* Today */}
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>TODAY</Text>
          <Text style={[styles.todayValue, tabular]}>{formatMsHuman(todayMin * 60000)}</Text>
          <View style={styles.stackBar}>
            {CATEGORIES.map((c) => {
              const w = (byCat[c.key] / totalToday) * 100;
              if (w <= 0) return null;
              return <View key={c.key} style={{ width: `${w}%`, backgroundColor: c.color }} />;
            })}
            {todayMin === 0 && <View style={styles.stackEmpty} />}
          </View>
          <View style={styles.legend}>
            {CATEGORIES.map((c) => (
              <View key={c.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                <Text style={styles.legendText}>{c.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Technique */}
        <View style={styles.field}>
          <Dropdown<TechniqueKey>
            label="Technique"
            value={technique}
            options={TECHNIQUES.map((t) => ({ key: t.key, label: t.label, sub: t.sub, icon: 'ellipse', color: colors.accent }))}
            onChange={(t) => {
              setTechnique(t);
              setView('timer');
            }}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  style={[styles.catChip, active && { borderColor: c.color, backgroundColor: c.color + '14' }]}
                >
                  <View style={[styles.catDot, { backgroundColor: c.color }]}>
                    <Ionicons name={c.icon} size={12} color="#fff" />
                  </View>
                  <Text style={[styles.catLabel, active && { color: colors.text.primary }]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Nav */}
      <View style={styles.nav}>
        {NAV.map((n) => {
          const active = view === n.key;
          return (
            <Pressable key={n.key} onPress={() => setView(n.key)} style={[styles.navItem, active && styles.navItemActive]}>
              <Ionicons name={n.icon} size={19} color={active ? colors.accent : colors.text.secondary} />
              <Text style={[styles.navLabel, active && { color: colors.accent, fontFamily: fonts.semibold }]}>{n.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16, paddingTop: 18 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18, paddingHorizontal: 4 },
  logo: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: fonts.headingBold, fontSize: 20, color: colors.text.primary, letterSpacing: -0.3 },

  todayCard: { backgroundColor: colors.surfaceAlt, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 18 },
  todayLabel: { fontFamily: fonts.semibold, fontSize: 10, color: colors.text.tertiary, letterSpacing: 1 },
  todayValue: { fontFamily: fonts.headingBold, fontSize: 26, color: colors.text.primary, marginTop: 2, marginBottom: 12 },
  stackBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.barIdle },
  stackEmpty: { flex: 1, backgroundColor: colors.barIdle },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontFamily: fonts.medium, fontSize: 11, color: colors.text.secondary },

  field: { marginBottom: 16 },
  fieldLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.text.tertiary, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  catDot: { width: 20, height: 20, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.text.secondary },

  nav: { gap: 4, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12 },
  navItemActive: { backgroundColor: colors.accentSoft },
  navLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.text.secondary },
});
