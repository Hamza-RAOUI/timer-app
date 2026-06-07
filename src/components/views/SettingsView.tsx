import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';
import { useStatsStore } from '../../stores/statsStore';
import { colors } from '../../theme/colors';
import { fonts, tabular } from '../../theme/typography';
import { Card } from '../Card';

const goalLabel = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const SettingsView: React.FC = () => {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const settings = useSettingsStore();
  const stats = useStatsStore();

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      if (typeof confirm === 'function' && confirm('Reset all history? This cannot be undone.')) stats.reset();
      return;
    }
    Alert.alert('Reset history', 'This clears all your focus sessions. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => stats.reset() },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={[styles.scroll, wide && styles.scrollWide]} showsVerticalScrollIndicator={false}>
      <Text style={styles.h1}>Settings</Text>

      <Text style={styles.section}>DAILY GOAL</Text>
      <Card padding={18}>
        <View style={styles.goalRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.goalValue, tabular]}>{goalLabel(settings.dailyGoalMinutes)}</Text>
            <Text style={styles.rowDesc}>Target focus time per day</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable onPress={() => settings.setDailyGoal(settings.dailyGoalMinutes - 15)} style={styles.stepBtn}>
              <Ionicons name="remove" size={18} color={colors.text.secondary} />
            </Pressable>
            <Pressable onPress={() => settings.setDailyGoal(settings.dailyGoalMinutes + 15)} style={styles.stepBtn}>
              <Ionicons name="add" size={18} color={colors.text.secondary} />
            </Pressable>
          </View>
        </View>
      </Card>

      <Text style={styles.section}>PREFERENCES</Text>
      <Card padding={0}>
        <Row icon="phone-portrait-outline" label="Haptics" desc="Vibrate on actions" value={settings.hapticsEnabled} onChange={settings.toggleHaptics} />
        <Row icon="volume-high-outline" label="Sounds" desc="Tone when a timer ends" value={settings.soundEnabled} onChange={settings.toggleSound} />
        <Row icon="sunny-outline" label="Keep screen on" desc="Prevent dimming during sessions" value={settings.keepScreenOn} onChange={settings.toggleKeepScreenOn} />
        <Row icon="play-forward-outline" label="Auto-start break" desc="Begin the break after focus ends" value={settings.autoStartBreak} onChange={settings.toggleAutoStartBreak} last />
      </Card>

      <Text style={styles.section}>DATA</Text>
      <Card padding={18}>
        <View style={styles.dataRow}>
          <View>
            <Text style={[styles.goalValue, tabular]}>{stats.sessions.length}</Text>
            <Text style={styles.rowDesc}>sessions recorded</Text>
          </View>
          <Pressable onPress={confirmReset} style={styles.dangerBtn}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={styles.dangerText}>Reset history</Text>
          </Pressable>
        </View>
      </Card>

      <View style={styles.about}>
        <View style={styles.logo}>
          <Ionicons name="timer" size={18} color="#fff" />
        </View>
        <Text style={styles.aboutName}>Flowglass</Text>
        <Text style={styles.aboutVer}>v1.0.0 · flow + hourglass</Text>
      </View>
    </ScrollView>
  );
};

const Row = ({
  icon,
  label,
  desc,
  value,
  onChange,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  value: boolean;
  onChange: () => void;
  last?: boolean;
}) => (
  <View style={[styles.row, !last && styles.rowBorder]}>
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={18} color={colors.accent} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowDesc}>{desc}</Text>
    </View>
    <Switch value={value} onValueChange={onChange} trackColor={{ false: '#D7DCE6', true: colors.accent }} thumbColor="#fff" />
  </View>
);

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 120 },
  scrollWide: { paddingHorizontal: 40, paddingTop: 28, maxWidth: 720, width: '100%', alignSelf: 'center' },
  h1: { fontFamily: fonts.headingBold, fontSize: 28, color: colors.text.primary, letterSpacing: -0.5, marginBottom: 8 },
  section: { fontFamily: fonts.semibold, fontSize: 11, color: colors.text.tertiary, letterSpacing: 1, marginTop: 22, marginBottom: 10 },
  goalRow: { flexDirection: 'row', alignItems: 'center' },
  goalValue: { fontFamily: fonts.headingBold, fontSize: 22, color: colors.text.primary },
  rowDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.text.tertiary, marginTop: 2 },
  stepper: { flexDirection: 'row', gap: 10 },
  stepBtn: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text.primary },
  dataRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F3C6C6', backgroundColor: '#FEF2F2' },
  dangerText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.danger },
  about: { alignItems: 'center', marginTop: 36, gap: 6 },
  logo: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  aboutName: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.text.primary },
  aboutVer: { fontFamily: fonts.body, fontSize: 12, color: colors.text.tertiary },
});
