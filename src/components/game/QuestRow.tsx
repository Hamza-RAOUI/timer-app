import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { QuestStatus } from '../../lib/rpg';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts, SLANT, tabular } from '../../theme/typography';
import { XpBar } from './XpBar';

interface QuestRowProps {
  quest: QuestStatus;
  /** Shown instead of progress when locked (e.g. opens the Pro sheet). */
  onLockedPress?: () => void;
  compact?: boolean;
}

const unit = (q: QuestStatus) => (q.def.kind === 'minutes' ? ' min' : q.def.kind === 'streak' ? ' days' : '');

/** One quest: icon, label, progress bar and reward — done / locked states included. */
export const QuestRow: React.FC<QuestRowProps> = ({ quest, onLockedPress, compact }) => {
  const t = useTheme();
  const styles = useStyles();
  const pct = quest.target > 0 ? quest.progress / quest.target : 0;
  const locked = quest.locked;
  const icon = locked ? 'lock-closed' : quest.done ? 'checkmark' : quest.scope === 'daily' ? 'flag' : 'trophy';

  const body = (
    <View style={[styles.row, compact && styles.rowCompact, quest.done && !locked && styles.rowDone]}>
      <View style={[styles.icon, { backgroundColor: quest.done && !locked ? t.colors.success : locked ? t.colors.barIdle : t.colors.accentSoft }]}>
        <Ionicons name={icon} size={compact ? 13 : 15} color={quest.done && !locked ? '#FFFFFF' : locked ? t.colors.text.tertiary : t.colors.accentText} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={styles.head}>
          <Text style={[styles.label, compact && styles.labelCompact, quest.done && !locked && styles.labelDone]} numberOfLines={2}>
            {quest.def.label}
          </Text>
          <View style={[styles.reward, { backgroundColor: locked ? t.colors.barIdle : t.colors.goldSoft }]}>
            <Text style={[styles.rewardText, { color: locked ? t.colors.text.tertiary : t.colors.goldText }]}>+{quest.reward} XP</Text>
          </View>
        </View>
        {!compact && (
          <View style={styles.progressRow}>
            <XpBar progress={pct} height={7} ticks={Math.min(quest.target, 10)} color={quest.done ? t.colors.success : t.colors.accent} style={{ flex: 1 }} label={`${quest.def.label} progress`} />
            <Text style={[styles.count, tabular]}>
              {locked ? 'PRO' : quest.done ? 'DONE' : `${quest.progress}/${quest.target}${unit(quest)}`}
            </Text>
          </View>
        )}
        {compact && (
          <Text style={[styles.countCompact, tabular]}>
            {quest.done ? 'Complete' : `${quest.progress}/${quest.target}${unit(quest)}`}
          </Text>
        )}
      </View>
    </View>
  );

  if (locked && onLockedPress) {
    return (
      <Pressable onPress={onLockedPress} accessibilityRole="button" accessibilityLabel={`${quest.def.label}. Pro quest, locked. Learn about Pro.`}>
        {body}
      </Pressable>
    );
  }
  return (
    <View
      accessible
      accessibilityLabel={`${quest.scope === 'daily' ? 'Daily' : 'Weekly'} quest: ${quest.def.label}. ${quest.done ? 'Complete' : `${quest.progress} of ${quest.target}`}. Reward ${quest.reward} XP.`}
    >
      {body}
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: t.colors.surfaceAlt, borderWidth: 1, borderColor: t.colors.border },
  rowCompact: { paddingVertical: 10, paddingHorizontal: 12, gap: 10 },
  rowDone: { borderColor: t.colors.success, backgroundColor: t.colors.successSoft },
  icon: { width: 30, height: 30, borderRadius: 7, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: SLANT }] },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: t.colors.text.primary },
  labelCompact: { fontSize: 13 },
  labelDone: { color: t.colors.successText },
  reward: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, transform: [{ skewX: SLANT }] },
  rewardText: { fontFamily: fonts.display, fontSize: 10.5, letterSpacing: 0.6, transform: [{ skewX: '12deg' }] },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  count: { fontFamily: fonts.display, fontSize: 11, color: t.colors.text.secondary, minWidth: 54, textAlign: 'right', letterSpacing: 0.5 },
  countCompact: { fontFamily: fonts.medium, fontSize: 12, color: t.colors.text.secondary, marginTop: -2 },
}));
