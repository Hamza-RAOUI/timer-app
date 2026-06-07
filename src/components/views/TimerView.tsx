import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { categoryByKey, techniqueByKey, type Category, type Technique } from '../../constants/focus';
import { useCountdownStore } from '../../stores/countdownStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useStatsStore } from '../../stores/statsStore';
import { useStopwatchStore } from '../../stores/stopwatchStore';
import { useUiStore } from '../../stores/uiStore';
import { colors } from '../../theme/colors';
import { fonts, tabular } from '../../theme/typography';
import { formatMsToClock } from '../../utils/timeFormatter';
import { Controls } from '../Controls';
import { Hourglass } from '../Hourglass';
import { ProgressDots } from '../ProgressDots';

const notify = () => {
  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};

const Stage: React.FC<{ phaseLabel: string; category: Category; technique: Technique; children: React.ReactNode }> = ({
  phaseLabel,
  category,
  technique,
  children,
}) => (
  <ScrollView contentContainerStyle={styles.stage} showsVerticalScrollIndicator={false}>
    <View style={styles.chipRow}>
      <View style={[styles.catChip, { backgroundColor: category.color + '16', borderColor: category.color + '40' }]}>
        <View style={[styles.catDot, { backgroundColor: category.color }]} />
        <Text style={[styles.catChipText, { color: category.color }]}>{category.label}</Text>
      </View>
      <Text style={styles.techLabel}>{technique.label}</Text>
    </View>
    <Text style={styles.phaseLabel}>{phaseLabel}</Text>
    {children}
  </ScrollView>
);

export const TimerView: React.FC = () => {
  const technique = techniqueByKey(useSettingsStore((s) => s.lastTechnique));
  const category = categoryByKey(useSettingsStore((s) => s.lastCategory));

  useEffect(() => {
    useCountdownStore.getState().pause();
    useStopwatchStore.getState().pause();
  }, [technique.key]);

  if (technique.kind === 'flow') return <FlowTimer key={technique.key} technique={technique} category={category} />;
  if (technique.kind === 'stopwatch') return <StopwatchTimer key={technique.key} technique={technique} category={category} />;
  return <CountdownTimer key={technique.key} technique={technique} category={category} />;
};

// ───────────── Countdown (Pomodoro / 52·17 / Custom) ─────────────
type Phase = 'focus' | 'break' | 'longBreak';

const CountdownTimer: React.FC<{ technique: Technique; category: Category }> = ({ technique, category }) => {
  const countdown = useCountdownStore();
  const completeSession = useStatsStore((s) => s.completeSession);
  const autoStartBreak = useSettingsStore((s) => s.autoStartBreak);
  const customConfig = useSettingsStore((s) => s.customConfig);
  const consumeStart = useUiStore((s) => s.consumeStart);

  const isCustom = !!technique.adjustable;
  const focusMin = isCustom ? customConfig.workMinutes : technique.focusMin ?? 25;
  const breakMin = isCustom ? customConfig.breakMinutes : technique.breakMin ?? 5;
  const longBreakMin = isCustom ? customConfig.longBreakMinutes : technique.longBreakMin ?? 15;
  const cycles = isCustom ? customConfig.cycles : technique.cycles ?? 4;

  const [phase, setPhase] = useState<Phase>('focus');
  const [cycle, setCycle] = useState(0);
  const lastRunning = useRef(countdown.isRunning);

  const targetMin = phase === 'focus' ? focusMin : phase === 'break' ? breakMin : longBreakMin;
  const targetMs = targetMin * 60_000;

  useEffect(() => {
    if (!countdown.isRunning && countdown.durationMs !== targetMs) {
      countdown.pause();
      countdown.setDuration(targetMs);
      countdown.reset();
    }
  }, [targetMs, countdown]);

  useEffect(() => {
    if (consumeStart()) {
      countdown.setDuration(targetMs);
      countdown.reset();
      countdown.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lastRunning.current && !countdown.isRunning && countdown.remainingMs === 0) {
      notify();
      if (phase === 'focus') {
        completeSession(focusMin, category.key, technique.key);
        const next = cycle + 1;
        setCycle(next);
        const isLong = next % cycles === 0; // real Pomodoro: long break every `cycles` focuses
        const nextPhase: Phase = isLong ? 'longBreak' : 'break';
        setPhase(nextPhase);
        if (autoStartBreak) {
          const ms = (isLong ? longBreakMin : breakMin) * 60_000;
          setTimeout(() => {
            countdown.setDuration(ms);
            countdown.reset();
            countdown.start();
          }, 500);
        }
      } else {
        setPhase('focus');
      }
    }
    lastRunning.current = countdown.isRunning;
  }, [countdown.isRunning, countdown.remainingMs, phase, cycle, cycles, focusMin, breakMin, longBreakMin, autoStartBreak, technique, category.key, completeSession, countdown]);

  const phaseLabel = phase === 'focus' ? 'Focus' : phase === 'break' ? 'Short break' : 'Long break';
  const accent = phase === 'focus' ? colors.accent : category.color;
  const progress = countdown.durationMs > 0 ? 1 - countdown.remainingMs / countdown.durationMs : 0;
  const showConfig = isCustom && !countdown.isRunning;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.cornerHg} pointerEvents="none">
        <Hourglass progress={progress} color={accent} running={countdown.isRunning} size={64} />
      </View>
      <Stage phaseLabel={phaseLabel} category={category} technique={technique}>
        <Text style={[styles.digits, styles.digitsBig, tabular]}>{formatMsToClock(countdown.remainingMs)}</Text>

        <ProgressDots total={cycles} filled={cycle % cycles} active={phase === 'focus' ? cycle % cycles : undefined} color={colors.accent} />

        {showConfig && <CustomConfig />}

        <View style={styles.controls}>
          <Controls
            isRunning={countdown.isRunning}
            onPlayPause={() => (countdown.isRunning ? countdown.pause() : countdown.start())}
            onReset={countdown.reset}
            onSkip={() => {
              countdown.pause();
              countdown.reset();
              if (phase === 'focus') {
                const next = cycle + 1;
                setCycle(next);
                setPhase(next % cycles === 0 ? 'longBreak' : 'break'); // 4th focus → long break
              } else {
                setPhase('focus');
              }
            }}
            accent={accent}
          />
        </View>
        {phase !== 'focus' && (
          <Text style={styles.restHint}>Resting — reset ↺ restarts this break, skip ⏭ jumps back to focus.</Text>
        )}
      </Stage>
    </View>
  );
};

// Inline Custom config: define work / break / long break / cycles, then save it.
const CustomConfig: React.FC = () => {
  const cfg = useSettingsStore((s) => s.customConfig);
  const setCustomConfig = useSettingsStore((s) => s.setCustomConfig);
  const presets = useSettingsStore((s) => s.customPresets);
  const addCustomPreset = useSettingsStore((s) => s.addCustomPreset);
  const removeCustomPreset = useSettingsStore((s) => s.removeCustomPreset);
  const loadCustomPreset = useSettingsStore((s) => s.loadCustomPreset);
  const [name, setName] = useState('My block');

  return (
    <View style={styles.config}>
      <View style={styles.configGrid}>
        <Stepper label="Work" value={cfg.workMinutes} unit="m" onDec={() => setCustomConfig({ workMinutes: cfg.workMinutes - 5 })} onInc={() => setCustomConfig({ workMinutes: cfg.workMinutes + 5 })} />
        <Stepper label="Break" value={cfg.breakMinutes} unit="m" onDec={() => setCustomConfig({ breakMinutes: cfg.breakMinutes - 1 })} onInc={() => setCustomConfig({ breakMinutes: cfg.breakMinutes + 1 })} />
        <Stepper label="Long break" value={cfg.longBreakMinutes} unit="m" onDec={() => setCustomConfig({ longBreakMinutes: cfg.longBreakMinutes - 5 })} onInc={() => setCustomConfig({ longBreakMinutes: cfg.longBreakMinutes + 5 })} />
        <Stepper label="Cycles" value={cfg.cycles} unit="×" onDec={() => setCustomConfig({ cycles: cfg.cycles - 1 })} onInc={() => setCustomConfig({ cycles: cfg.cycles + 1 })} />
      </View>

      <View style={styles.saveRow}>
        <TextInput value={name} onChangeText={setName} placeholder="Preset name" placeholderTextColor={colors.text.tertiary} style={styles.input} />
        <Pressable onPress={() => addCustomPreset(name)} style={styles.saveBtn}>
          <Ionicons name="bookmark-outline" size={16} color="#fff" />
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>

      {presets.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
          {presets.map((p) => (
            <Pressable key={p.id} onPress={() => loadCustomPreset(p.id)} style={styles.presetChip}>
              <Text style={styles.presetName} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.presetMeta}>{p.workMinutes}/{p.breakMinutes} · {p.cycles}×</Text>
              <Pressable hitSlop={8} onPress={() => removeCustomPreset(p.id)} style={styles.presetX}>
                <Ionicons name="close" size={12} color={colors.text.tertiary} />
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const Stepper: React.FC<{ label: string; value: number; unit: string; onDec: () => void; onInc: () => void }> = ({ label, value, unit, onDec, onInc }) => (
  <View style={styles.stepper}>
    <Text style={styles.stepperLabel}>{label}</Text>
    <View style={styles.stepperRow}>
      <Pressable onPress={onDec} style={styles.stepBtn}><Ionicons name="remove" size={16} color={colors.text.secondary} /></Pressable>
      <Text style={[styles.stepperValue, tabular]}>{value}{unit}</Text>
      <Pressable onPress={onInc} style={styles.stepBtn}><Ionicons name="add" size={16} color={colors.text.secondary} /></Pressable>
    </View>
  </View>
);

// ───────────── Flowtime ─────────────
const FlowTimer: React.FC<{ technique: Technique; category: Category }> = ({ technique, category }) => {
  const stopwatch = useStopwatchStore();
  const countdown = useCountdownStore();
  const completeSession = useStatsStore((s) => s.completeSession);
  const [phase, setPhase] = useState<'idle' | 'focus' | 'break'>('idle');

  const startFocus = () => {
    stopwatch.reset();
    stopwatch.start();
    setPhase('focus');
  };
  const takeBreak = () => {
    stopwatch.pause();
    const mins = stopwatch.elapsedMs / 60_000;
    if (mins >= 1) completeSession(mins, category.key, technique.key);
    countdown.setDuration(Math.max(5 * 60_000, Math.floor(stopwatch.elapsedMs / 5)));
    countdown.reset();
    countdown.start();
    setPhase('break');
  };
  const reset = () => {
    stopwatch.reset();
    countdown.reset();
    setPhase('idle');
  };

  const inBreak = phase === 'break';
  const digits = inBreak ? formatMsToClock(countdown.remainingMs) : formatMsToClock(stopwatch.elapsedMs);

  return (
    <Stage phaseLabel={phase === 'idle' ? 'Ready' : phase === 'focus' ? 'In flow' : 'Break'} category={category} technique={technique}>
      <Text style={[styles.digits, styles.digitsBig, tabular]}>{digits}</Text>
      <Text style={styles.hint}>{phase === 'focus' ? 'Work until your focus fades, then take a break.' : phase === 'break' ? 'Rest — break is one-fifth of your focus.' : 'Press start and just begin.'}</Text>
      <View style={styles.controls}>
        {phase === 'focus' ? (
          <Pressable onPress={takeBreak} style={[styles.bigBtn, { backgroundColor: category.color }]}>
            <Ionicons name="cafe" size={20} color="#fff" />
            <Text style={styles.bigBtnText}>Take a break</Text>
          </Pressable>
        ) : (
          <Pressable onPress={startFocus} style={[styles.bigBtn, { backgroundColor: colors.accent }]}>
            <Ionicons name="play" size={20} color="#fff" />
            <Text style={styles.bigBtnText}>{phase === 'break' ? 'Start new focus' : 'Start focus'}</Text>
          </Pressable>
        )}
      </View>
      {phase !== 'idle' && (
        <Pressable onPress={reset} style={styles.resetText}>
          <Text style={styles.resetTextLabel}>Reset</Text>
        </Pressable>
      )}
    </Stage>
  );
};

// ───────────── Stopwatch ─────────────
const StopwatchTimer: React.FC<{ technique: Technique; category: Category }> = ({ technique, category }) => {
  const stopwatch = useStopwatchStore();
  const completeSession = useStatsStore((s) => s.completeSession);

  const logAndReset = () => {
    const mins = stopwatch.elapsedMs / 60_000;
    if (mins >= 1) completeSession(mins, category.key, technique.key);
    stopwatch.reset();
  };

  return (
    <Stage phaseLabel={stopwatch.isRunning ? 'Running' : stopwatch.elapsedMs > 0 ? 'Paused' : 'Ready'} category={category} technique={technique}>
      <Text style={[styles.digits, styles.digitsBig, tabular]}>{formatMsToClock(stopwatch.elapsedMs)}</Text>
      <Text style={styles.hint}>Open-ended timer. Log it to your category when you’re done.</Text>
      <View style={styles.controls}>
        <Controls isRunning={stopwatch.isRunning} onPlayPause={() => (stopwatch.isRunning ? stopwatch.pause() : stopwatch.start())} onReset={stopwatch.reset} accent={category.color} />
      </View>
      {stopwatch.elapsedMs > 0 && !stopwatch.isRunning && (
        <Pressable onPress={logAndReset} style={[styles.bigBtn, { backgroundColor: colors.accent, marginTop: 16 }]}>
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.bigBtnText}>Log {Math.round(stopwatch.elapsedMs / 60_000)} min to {category.label}</Text>
        </Pressable>
      )}
    </Stage>
  );
};

const styles = StyleSheet.create({
  stage: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28, gap: 4 },
  cornerHg: { position: 'absolute', top: 16, right: 18, zIndex: 5 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 11, borderWidth: 1 },
  catDot: { width: 7, height: 7, borderRadius: 4 },
  catChipText: { fontFamily: fonts.semibold, fontSize: 12 },
  techLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.text.tertiary },
  phaseLabel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.secondary, marginTop: 2, marginBottom: 6 },
  digits: { fontFamily: fonts.headingBold, fontSize: 60, color: colors.text.primary, letterSpacing: -2, marginTop: 10, marginBottom: 6 },
  digitsBig: { fontSize: 80, marginTop: 24 },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.text.tertiary, textAlign: 'center', maxWidth: 280, marginBottom: 8 },
  controls: { marginTop: 22 },
  restHint: { fontFamily: fonts.body, fontSize: 12, color: colors.text.tertiary, textAlign: 'center', maxWidth: 300, marginTop: 14 },

  // Custom config
  config: { width: '100%', maxWidth: 380, marginTop: 18, gap: 12 },
  configGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  stepper: { width: 168, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.text.secondary },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text.primary, minWidth: 38, textAlign: 'center' },
  saveRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.medium, fontSize: 14, color: colors.text.primary },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 16 },
  saveBtnText: { fontFamily: fonts.semibold, fontSize: 14, color: '#fff' },
  presetRow: { gap: 8, paddingVertical: 2 },
  presetChip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, paddingRight: 28 },
  presetName: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text.primary },
  presetMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.text.tertiary, marginTop: 2 },
  presetX: { position: 'absolute', top: 7, right: 7 },

  bigBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, paddingHorizontal: 26, borderRadius: 28 },
  bigBtnText: { fontFamily: fonts.headingBold, fontSize: 15, color: '#fff' },
  resetText: { marginTop: 14, padding: 8 },
  resetTextLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.text.tertiary },
});
