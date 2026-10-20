import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { sandThemeByKey, techniqueByKey, type Skill, type Technique } from '../../constants/focus';
import { useActiveSkill } from '../../hooks/useSkills';
import { recordSession, useProgress } from '../../lib/game';
import { AMBIENCES, ambienceSupported, holdAmbience, playChime, previewAmbience, useAvailableAmbiences } from '../../lib/sound';
import { useTimerCommands } from '../../lib/timerCommands';
import { useCountdownStore } from '../../stores/countdownStore';
import { useRewardStore } from '../../stores/rewardStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useStopwatchStore } from '../../stores/stopwatchStore';
import { useUiStore } from '../../stores/uiStore';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts, SLANT, tabular, UNSLANT } from '../../theme/typography';
import { formatMsToClock } from '../../utils/timeFormatter';
import { RankEmblem } from '../art/RankEmblem';
import { SkillCrest } from '../art/SkillCrest';
import { Controls } from '../Controls';
import { RewardPanel } from '../feedback/RewardPanel';
import { ClassCharacter } from '../art/ClassCharacter';
import { QuestRow } from '../game/QuestRow';
import { SkewTag } from '../game/SkewTag';
import { XpBar } from '../game/XpBar';
import { Hourglass } from '../Hourglass';
import { ProgressDots } from '../ProgressDots';

/** Partial blocks shorter than this aren't logged (accidental starts). */
const MIN_LOG_MS = 60_000;
const BREAK_SAND: [string, string] = ['#6EE7B7', '#0D9488'];

const notify = () => {
  const s = useSettingsStore.getState();
  if (Platform.OS !== 'web' && s.hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  if (s.soundEnabled) playChime();
};

/** Play the chosen soundscape while `active` (a focus block is running). Pro sounds need Pro. */
const useFocusAmbience = (active: boolean) => {
  const key = useSettingsStore((s) => s.ambience);
  const isPro = useSettingsStore((s) => s.isPro);
  useEffect(() => {
    const allowed = key !== 'off' && (isPro || !AMBIENCES.find((a) => a.key === key)?.pro);
    holdAmbience(active && allowed ? key : 'off');
  }, [active, key, isPro]);
  useEffect(() => () => holdAmbience('off'), []);
};

/** Soundscape picker under the controls (web only): one pill showing the current
 *  sound; tap it to open a row of icons, pick one and it folds away again. */
const AmbiencePicker: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const current = useSettingsStore((s) => s.ambience);
  const isPro = useSettingsStore((s) => s.isPro);
  const setAmbience = useSettingsStore((s) => s.setAmbience);
  const openPro = useUiStore((s) => s.openPro);
  const tracks = useAvailableAmbiences();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  if (!ambienceSupported() || tracks.length === 0) return null;
  const options = [{ key: 'off' as const, label: 'Off', icon: 'volume-mute', pro: false }, ...tracks];
  const selected = options.find((o) => o.key === current) ?? options[0];
  const on = selected.key !== 'off';
  return (
    <View style={styles.ambience}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[styles.soundPill, on && { borderColor: t.colors.accent }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Ambience: ${selected.label}. ${open ? 'Hide' : 'Change'} sound`}
      >
        <Ionicons name={(on ? selected.icon : 'volume-mute') as keyof typeof Ionicons.glyphMap} size={14} color={on ? t.colors.accent : t.colors.text.tertiary} />
        <Text style={[styles.soundPillText, on && { color: t.colors.text.primary }]}>{hover ?? (on ? selected.label : 'Sound off')}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={13} color={t.colors.text.tertiary} />
      </Pressable>
      {open && (
        <View style={styles.ambienceRow} accessibilityRole="radiogroup" accessibilityLabel="Focus ambience">
          {options.map((o) => {
            const active = current === o.key;
            const locked = o.pro && !isPro;
            return (
              <Pressable
                key={o.key}
                onPress={() => {
                  if (locked) return openPro('sounds');
                  previewAmbience(o.key); // before saving, so the session hook sees the preview
                  setAmbience(o.key);
                  setOpen(false);
                  setHover(null);
                }}
                onHoverIn={() => setHover(locked ? `${o.label} · Pro` : o.label)}
                onHoverOut={() => setHover(null)}
                style={[styles.soundIcon, active && styles.soundIconActive]}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={locked ? `${o.label}, Pro` : o.label}
              >
                <Ionicons name={o.icon as keyof typeof Ionicons.glyphMap} size={16} color={active ? t.colors.text.onAccent : t.colors.text.secondary} style={{ transform: [{ skewX: UNSLANT }] }} />
                {locked && (
                  <View style={styles.soundLock}>
                    <Ionicons name="lock-closed" size={8} color={t.colors.text.onAccent} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
};

const useSand = (): [string, string] => sandThemeByKey(useSettingsStore((s) => s.sandTheme)).colors;

/** Hero hourglass + digits scale with the window height so the XP panel fits on laptops. */
const useHeroSize = () => {
  const { height } = useWindowDimensions();
  if (height < 700) return { glass: 116, digits: { fontSize: 64, lineHeight: 74 } };
  if (height < 860) return { glass: 140, digits: { fontSize: 74, lineHeight: 84 } };
  return { glass: 172, digits: { fontSize: 84, lineHeight: 96 } };
};

// ───────────── Shared stage ─────────────
const PlayerHud: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const progress = useProgress();
  const setView = useUiStore((s) => s.setView);
  return (
    <Pressable
      onPress={() => setView('character')}
      style={styles.hud}
      accessibilityRole="button"
      accessibilityLabel={`Level ${progress.level.level} ${progress.title.title}, ${progress.streak.current} day streak. Open character.`}
    >
      <RankEmblem title={progress.title.title} size={30} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={styles.hudHead}>
          <Text style={[styles.hudLv, tabular]}>LV {progress.level.level}</Text>
          <Text style={styles.hudTitle} numberOfLines={1}>
            {progress.title.title}
          </Text>
        </View>
        <XpBar progress={progress.level.progress} height={6} ticks={8} />
      </View>
      <View style={styles.hudStreak}>
        <Ionicons name="flame" size={15} color={progress.streak.current > 0 ? t.colors.highlight : t.colors.text.tertiary} />
        <Text style={[styles.hudStreakText, tabular]}>{progress.streak.current}</Text>
      </View>
    </Pressable>
  );
};

const SkillChip: React.FC<{ skill: Skill }> = ({ skill }) => {
  const t = useTheme();
  const styles = useStyles();
  const progress = useProgress();
  const lv = progress.skills[skill.key]?.level.level ?? 1;
  const sw = t.colors.swatch[skill.swatch];
  return (
    <View style={[styles.catChip, { backgroundColor: sw.soft, borderColor: sw.border }]}>
      <SkillCrest swatch={skill.swatch} icon={skill.icon} size={18} />
      <Text style={[styles.catChipText, { color: sw.text }]}>{skill.label}</Text>
      <Text style={[styles.catChipLv, { color: sw.text }, tabular]}>LV {lv}</Text>
    </View>
  );
};

const QuestStrip: React.FC = () => {
  const styles = useStyles();
  const progress = useProgress();
  const setView = useUiStore((s) => s.setView);
  const busy = useRewardStore((s) => s.current);
  if (busy) return null;
  return (
    <Pressable onPress={() => setView('character')} style={styles.questStrip} accessibilityRole="button" accessibilityHint="Opens your character and quests">
      <Text style={styles.questKicker}>Today’s quest</Text>
      <QuestRow quest={progress.today.quest} compact />
    </Pressable>
  );
};

/**
 * The active skill's class art, Persona-menu style: it fills the right side of the
 * screen, fades into the page, and carries the class name in big slanted type.
 * On tighter screens it sinks back behind the timer without the name.
 */
const CharacterBackdrop: React.FC<{ skill: Skill }> = ({ skill }) => {
  const t = useTheme();
  const { width, height } = useWindowDimensions();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const wide = width >= 900;
  const main = wide && !collapsed ? width - 272 : width;
  const roomy = (main - 440) / 2 >= 170;
  const h = wide ? height : height - 56;
  const w = roomy ? Math.min(main * 0.62, h * 1.05) : main;
  // The name gets the space between the timer column (~460px, centered) and the right edge.
  return (
    <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, opacity: roomy ? 1 : 0.32, pointerEvents: 'none' }} aria-hidden>
      <ClassCharacter skillKey={skill.key} width={w} height={h} fadeTo={t.colors.bg} showName={roomy} nameMaxWidth={main / 2 - 230 - w * 0.06} />
    </View>
  );
};

const Stage: React.FC<{
  phase: string;
  phaseColor?: string;
  skill: Skill;
  technique: Technique;
  hourglass: React.ReactNode;
  children: React.ReactNode;
}> = ({ phase, phaseColor, skill, technique, hourglass, children }) => {
  const t = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const scroll = useRef<ScrollView>(null);
  const seq = useRewardStore((s) => s.seq);

  // Bring the XP panel into view when it appears (short screens).
  useEffect(() => {
    if (!seq) return;
    const wait = Math.max(0, useRewardStore.getState().revealAt - Date.now()) + 60;
    const id = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), wait);
    return () => clearTimeout(id);
  }, [seq]);

  return (
    <View style={styles.root}>
      <CharacterBackdrop skill={skill} />
      <ScrollView ref={scroll} contentContainerStyle={styles.stage} showsVerticalScrollIndicator={false}>
        {!wide && <PlayerHud />}
        <View style={styles.chipRow}>
          <SkillChip skill={skill} />
          <Text style={styles.techLabel}>{technique.label}</Text>
        </View>
        <View style={styles.hourglass}>{hourglass}</View>
        <SkewTag label={phase} color={phaseColor ?? t.colors.text.primary} textColor={phaseColor ? t.colors.text.onAccent : t.colors.bg} size="md" style={styles.phaseTag} />
        {children}
        <AmbiencePicker />
        <RewardPanel />
        <QuestStrip />
      </ScrollView>
    </View>
  );
};

export const TimerView: React.FC = () => {
  const technique = techniqueByKey(useSettingsStore((s) => s.lastTechnique));
  const skill = useActiveSkill();

  useEffect(() => {
    useCountdownStore.getState().pause();
    useStopwatchStore.getState().pause();
  }, [technique.key]);

  if (technique.kind === 'flow') return <FlowTimer key={technique.key} technique={technique} skill={skill} />;
  if (technique.kind === 'stopwatch') return <StopwatchTimer key={technique.key} technique={technique} skill={skill} />;
  return <CountdownTimer key={technique.key} technique={technique} skill={skill} />;
};

// ───────────── Countdown (Pomodoro / 52·17 / Custom) ─────────────
type Phase = 'focus' | 'break' | 'longBreak';

const CountdownTimer: React.FC<{ technique: Technique; skill: Skill }> = ({ technique, skill }) => {
  const t = useTheme();
  const styles = useStyles();
  const countdown = useCountdownStore();
  const autoStartBreak = useSettingsStore((s) => s.autoStartBreak);
  const customConfig = useSettingsStore((s) => s.customConfig);
  const consumeStart = useUiStore((s) => s.consumeStart);
  const sand = useSand();
  const hero = useHeroSize();

  const isCustom = !!technique.adjustable;
  const focusMin = isCustom ? customConfig.workMinutes : (technique.focusMin ?? 25);
  const breakMin = isCustom ? customConfig.breakMinutes : (technique.breakMin ?? 5);
  const longBreakMin = isCustom ? customConfig.longBreakMinutes : (technique.longBreakMin ?? 15);
  const cycles = isCustom ? customConfig.cycles : (technique.cycles ?? 4);

  const [phase, setPhase] = useState<Phase>('focus');
  const [cycle, setCycle] = useState(0);
  const [flipKey, setFlipKey] = useState(0);
  const lastRunning = useRef(countdown.isRunning);

  // Latest values for callbacks that outlive a render (unmount cleanup, timers).
  const live = useRef({ phase, skill, technique, focusMin });
  live.current = { phase, skill, technique, focusMin };

  const targetMin = phase === 'focus' ? focusMin : phase === 'break' ? breakMin : longBreakMin;
  const targetMs = targetMin * 60_000;

  /** A focus block that ends before zero is still a session: log it as stopped early. */
  const logPartial = () => {
    const c = useCountdownStore.getState();
    const { phase: ph, skill: sk, technique: tq } = live.current;
    const elapsed = c.elapsedMs();
    if (ph !== 'focus' || elapsed < MIN_LOG_MS || c.startedAt == null) return;
    recordSession({
      startedAt: c.startedAt,
      endedAt: Date.now(),
      focusedMinutes: elapsed / 60_000,
      plannedMinutes: c.durationMs / 60_000,
      technique: tq.key,
      skill: sk.key,
      completed: false,
    });
  };

  useEffect(() => {
    if (!countdown.isRunning && countdown.durationMs !== targetMs) {
      logPartial();
      countdown.pause();
      countdown.setDuration(targetMs);
      countdown.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMs, countdown]);

  useEffect(() => {
    if (consumeStart()) {
      countdown.setDuration(targetMs);
      countdown.reset();
      countdown.start();
    }
    // Leaving this technique mid-block ends the block.
    return () => {
      logPartial();
      useCountdownStore.getState().reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lastRunning.current && !countdown.isRunning && countdown.remainingMs === 0) {
      notify();
      setFlipKey((k) => k + 1);
      if (phase === 'focus') {
        const c = useCountdownStore.getState();
        recordSession(
          {
            startedAt: c.startedAt ?? Date.now() - c.durationMs,
            endedAt: Date.now(),
            focusedMinutes: c.durationMs / 60_000,
            plannedMinutes: c.durationMs / 60_000,
            technique: technique.key,
            skill: skill.key,
            completed: true,
          },
          { flip: true }
        );
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
          }, 900);
        }
      } else {
        setPhase('focus');
      }
    }
    lastRunning.current = countdown.isRunning;
  }, [countdown.isRunning, countdown.remainingMs, phase, cycle, cycles, breakMin, longBreakMin, autoStartBreak, technique, skill.key, countdown]);

  const playPause = () => (countdown.isRunning ? countdown.pause() : countdown.start());
  const reset = () => {
    logPartial();
    countdown.reset();
  };
  const skip = () => {
    logPartial();
    countdown.pause();
    countdown.reset();
    if (phase === 'focus') {
      const next = cycle + 1;
      setCycle(next);
      setPhase(next % cycles === 0 ? 'longBreak' : 'break'); // 4th focus → long break
    } else {
      setPhase('focus');
    }
  };

  useFocusAmbience(countdown.isRunning && phase === 'focus');

  useTimerCommands((cmd) => {
    if (cmd === 'toggle') playPause();
    else if (cmd === 'reset') reset();
    else skip();
  });

  const focus = phase === 'focus';
  const phaseLabel = focus ? `Focus · ${(cycle % cycles) + 1}/${cycles}` : phase === 'break' ? 'Short break' : 'Long break';
  const progress = countdown.durationMs > 0 ? 1 - countdown.remainingMs / countdown.durationMs : 0;
  const showConfig = isCustom && !countdown.isRunning;
  const remaining = formatMsToClock(countdown.remainingMs);

  return (
    <Stage
      phase={phaseLabel}
      phaseColor={focus ? t.colors.accent : t.colors.swatch.teal.fill}
      skill={skill}
      technique={technique}
      hourglass={
        <Hourglass
          progress={progress}
          sand={focus ? sand : BREAK_SAND}
          frame={t.colors.text.primary}
          running={countdown.isRunning}
          size={hero.glass}
          glow
          flipKey={flipKey}
          label={`Hourglass: ${remaining} left in this ${focus ? 'focus block' : 'break'}`}
        />
      }
    >
      <Text style={[styles.digits, hero.digits, tabular]} accessibilityRole="timer" accessibilityLabel={`${remaining} remaining`}>
        {remaining}
      </Text>

      <ProgressDots total={cycles} filled={cycle % cycles} active={focus ? cycle % cycles : undefined} color={t.colors.accent} />

      {showConfig && <CustomConfig />}

      <View style={styles.controls}>
        <Controls
          isRunning={countdown.isRunning}
          onPlayPause={playPause}
          onReset={reset}
          onSkip={skip}
          resetLabel={focus ? 'Stop and restart this block' : 'Restart this break'}
          skipLabel={focus ? 'End focus and skip to break' : 'Skip to focus'}
          accent={focus ? t.colors.accent : t.colors.swatch.teal.fill}
        />
      </View>
      {!focus && (
        <Text style={styles.restHint} numberOfLines={1}>
          Resting — ↺ restarts this break, ⏭ jumps back to focus.
        </Text>
      )}
    </Stage>
  );
};

// Inline Custom config: define work / break / long break / cycles, then save it.
const CustomConfig: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
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
        <TextInput value={name} onChangeText={setName} placeholder="Preset name" placeholderTextColor={t.colors.text.tertiary} style={styles.input} accessibilityLabel="Preset name" maxLength={24} />
        <Pressable onPress={() => addCustomPreset(name)} style={styles.saveBtn} accessibilityRole="button" accessibilityLabel="Save preset">
          <Ionicons name="bookmark-outline" size={16} color={t.colors.text.onAccent} />
          <Text style={styles.saveBtnText}>Save</Text>
        </Pressable>
      </View>

      {presets.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
          {presets.map((p) => (
            <Pressable key={p.id} onPress={() => loadCustomPreset(p.id)} style={styles.presetChip} accessibilityRole="button" accessibilityLabel={`Load preset ${p.name}`}>
              <Text style={styles.presetName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.presetMeta}>
                {p.workMinutes}/{p.breakMinutes} · {p.cycles}×
              </Text>
              <Pressable hitSlop={8} onPress={() => removeCustomPreset(p.id)} style={styles.presetX} accessibilityRole="button" accessibilityLabel={`Delete preset ${p.name}`}>
                <Ionicons name="close" size={12} color={t.colors.text.tertiary} />
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const Stepper: React.FC<{ label: string; value: number; unit: string; onDec: () => void; onInc: () => void }> = ({ label, value, unit, onDec, onInc }) => {
  const t = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperRow}>
        <Pressable onPress={onDec} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel={`Decrease ${label}`}>
          <Ionicons name="remove" size={16} color={t.colors.text.secondary} />
        </Pressable>
        <Text style={[styles.stepperValue, tabular]} accessibilityLabel={`${label} ${value}${unit === 'm' ? ' minutes' : ''}`}>
          {value}
          {unit}
        </Text>
        <Pressable onPress={onInc} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel={`Increase ${label}`}>
          <Ionicons name="add" size={16} color={t.colors.text.secondary} />
        </Pressable>
      </View>
    </View>
  );
};

// ───────────── Flowtime ─────────────
const FlowTimer: React.FC<{ technique: Technique; skill: Skill }> = ({ technique, skill }) => {
  const t = useTheme();
  const styles = useStyles();
  const stopwatch = useStopwatchStore();
  const countdown = useCountdownStore();
  const sand = useSand();
  const hero = useHeroSize();
  const [phase, setPhase] = useState<'idle' | 'focus' | 'break'>('idle');
  const [flipKey, setFlipKey] = useState(0);

  const startFocus = () => {
    countdown.reset();
    stopwatch.reset();
    stopwatch.start();
    setPhase('focus');
  };
  const takeBreak = () => {
    stopwatch.pause();
    const s = useStopwatchStore.getState();
    const mins = s.elapsedMs / 60_000;
    if (s.elapsedMs >= MIN_LOG_MS) {
      setFlipKey((k) => k + 1);
      recordSession(
        { startedAt: s.firstStartedAt ?? Date.now() - s.elapsedMs, endedAt: Date.now(), focusedMinutes: mins, plannedMinutes: null, technique: technique.key, skill: skill.key, completed: true },
        { flip: true }
      );
    }
    countdown.setDuration(Math.max(5 * 60_000, Math.floor(s.elapsedMs / 5)));
    countdown.reset();
    countdown.start();
    setPhase('break');
  };
  const reset = () => {
    stopwatch.reset();
    countdown.reset();
    setPhase('idle');
  };

  useFocusAmbience(phase === 'focus' && stopwatch.isRunning);

  useTimerCommands((cmd) => {
    if (cmd === 'toggle') phase === 'focus' ? takeBreak() : startFocus();
    else if (cmd === 'reset') reset();
  });

  const inBreak = phase === 'break';
  const digits = inBreak ? formatMsToClock(countdown.remainingMs) : formatMsToClock(stopwatch.elapsedMs);
  // Count-up has no end: the glass fills over an hour, then keeps going.
  const progress = inBreak ? (countdown.durationMs > 0 ? 1 - countdown.remainingMs / countdown.durationMs : 0) : Math.min(1, stopwatch.elapsedMs / 3_600_000);

  return (
    <Stage
      phase={phase === 'idle' ? 'Ready' : phase === 'focus' ? 'In flow' : 'Break'}
      phaseColor={phase === 'focus' ? t.colors.accent : phase === 'break' ? t.colors.swatch.teal.fill : undefined}
      skill={skill}
      technique={technique}
      hourglass={
        <Hourglass
          progress={progress}
          sand={inBreak ? BREAK_SAND : sand}
          frame={t.colors.text.primary}
          running={stopwatch.isRunning || countdown.isRunning}
          size={hero.glass}
          glow
          flipKey={flipKey}
          label={`Hourglass: ${digits} ${inBreak ? 'of break left' : 'in flow'}`}
        />
      }
    >
      <Text style={[styles.digits, hero.digits, tabular]} accessibilityRole="timer">
        {digits}
      </Text>
      <Text style={styles.hint}>
        {phase === 'focus' ? 'Work until your focus fades, then take a break. 10+ min counts as a completed session.' : phase === 'break' ? 'Rest — break is one-fifth of your focus.' : 'Press start and just begin.'}
      </Text>
      <View style={styles.controls}>
        {phase === 'focus' ? (
          <BigButton icon="cafe" label="Take a break" color={t.colors.swatch.teal.fill} onPress={takeBreak} />
        ) : (
          <BigButton icon="play" label={phase === 'break' ? 'Start new focus' : 'Start focus'} color={t.colors.accent} onPress={startFocus} />
        )}
      </View>
      {phase !== 'idle' && (
        <Pressable onPress={reset} style={styles.resetText} accessibilityRole="button" accessibilityHint={phase === 'focus' ? 'Discards this flow without logging it' : undefined}>
          <Text style={styles.resetTextLabel}>Reset</Text>
        </Pressable>
      )}
    </Stage>
  );
};

const BigButton: React.FC<{ icon: React.ComponentProps<typeof Ionicons>['name']; label: string; color: string; onPress: () => void }> = ({ icon, label, color, onPress }) => {
  const t = useTheme();
  const styles = useStyles();
  return (
    <View>
      <View style={[styles.bigShadow, { backgroundColor: t.colors.highlight }]} />
      <Pressable onPress={onPress} style={[styles.bigBtn, { backgroundColor: color }]} accessibilityRole="button">
        <View style={styles.bigInner}>
          <Ionicons name={icon} size={20} color={t.colors.text.onAccent} />
          <Text style={styles.bigBtnText}>{label}</Text>
        </View>
      </Pressable>
    </View>
  );
};

// ───────────── Stopwatch ─────────────
const StopwatchTimer: React.FC<{ technique: Technique; skill: Skill }> = ({ technique, skill }) => {
  const t = useTheme();
  const styles = useStyles();
  const stopwatch = useStopwatchStore();
  const sand = useSand();
  const hero = useHeroSize();
  const [flipKey, setFlipKey] = useState(0);

  const logAndReset = () => {
    const s = useStopwatchStore.getState();
    if (s.elapsedMs >= MIN_LOG_MS) {
      setFlipKey((k) => k + 1);
      recordSession(
        { startedAt: s.firstStartedAt ?? Date.now() - s.elapsedMs, endedAt: Date.now(), focusedMinutes: s.elapsedMs / 60_000, plannedMinutes: null, technique: technique.key, skill: skill.key, completed: true },
        { flip: true }
      );
    }
    stopwatch.reset();
  };

  useFocusAmbience(stopwatch.isRunning);

  useTimerCommands((cmd) => {
    if (cmd === 'toggle') (stopwatch.isRunning ? stopwatch.pause() : stopwatch.start());
    else if (cmd === 'reset') stopwatch.reset();
  });

  const minutes = Math.floor(stopwatch.elapsedMs / 60_000);
  const clock = formatMsToClock(stopwatch.elapsedMs);
  return (
    <Stage
      phase={stopwatch.isRunning ? 'Running' : stopwatch.elapsedMs > 0 ? 'Paused' : 'Ready'}
      phaseColor={stopwatch.isRunning ? t.colors.accent : undefined}
      skill={skill}
      technique={technique}
      hourglass={
        <Hourglass
          progress={Math.min(1, stopwatch.elapsedMs / 3_600_000)}
          sand={sand}
          frame={t.colors.text.primary}
          running={stopwatch.isRunning}
          size={hero.glass}
          glow
          flipKey={flipKey}
          label={`Hourglass: ${clock} elapsed`}
        />
      }
    >
      <Text style={[styles.digits, hero.digits, tabular]} accessibilityRole="timer">
        {clock}
      </Text>
      <Text style={styles.hint}>Open-ended timer. Log it to {skill.label} when you’re done — 10+ min counts as completed.</Text>
      <View style={styles.controls}>
        <Controls isRunning={stopwatch.isRunning} onPlayPause={() => (stopwatch.isRunning ? stopwatch.pause() : stopwatch.start())} onReset={stopwatch.reset} resetLabel="Reset without logging" accent={t.colors.accent} />
      </View>
      {stopwatch.elapsedMs > 0 && !stopwatch.isRunning && (
        <View style={{ marginTop: 18 }}>
          {stopwatch.elapsedMs >= MIN_LOG_MS ? (
            <BigButton icon="checkmark" label={`Log ${minutes} min to ${skill.label}`} color={t.colors.accent} onPress={logAndReset} />
          ) : (
            <Text style={styles.hint}>Sessions under a minute aren’t logged.</Text>
          )}
        </View>
      )}
    </Stage>
  );
};

const useStyles = makeStyles((t) => ({
  root: { flex: 1, overflow: 'hidden' },
  stage: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 4 },

  hud: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    marginBottom: 14,
  },
  hudHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  hudLv: { fontFamily: fonts.display, fontSize: 13, color: t.colors.text.primary, letterSpacing: 0.6 },
  hudTitle: { fontFamily: fonts.display, fontSize: 11, color: t.colors.accentText, letterSpacing: 1.4, textTransform: 'uppercase', flexShrink: 1 },
  hudStreak: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingLeft: 6 },
  hudStreakText: { fontFamily: fonts.display, fontSize: 14, color: t.colors.text.primary },

  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4, paddingRight: 10, paddingVertical: 4, borderRadius: 11, borderWidth: 1 },
  catChipText: { fontFamily: fonts.display, fontSize: 11.5, letterSpacing: 1.1, textTransform: 'uppercase' },
  catChipLv: { fontFamily: fonts.semibold, fontSize: 11, opacity: 0.85 },
  techLabel: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.text.tertiary },
  hourglass: { marginTop: 6, marginBottom: 2 },
  phaseTag: { alignSelf: 'center', marginTop: 2 },
  digits: {
    fontFamily: fonts.display,
    fontSize: 84,
    lineHeight: 96,
    color: t.colors.text.primary,
    letterSpacing: -2,
    marginTop: 8,
    marginBottom: 8,
    transform: [{ skewX: '-6deg' }],
  },
  hint: { fontFamily: fonts.body, fontSize: 13, color: t.colors.text.tertiary, textAlign: 'center', maxWidth: 300, marginBottom: 8 },
  controls: { marginTop: 22 },

  restHint: { fontFamily: fonts.body, fontSize: 11.5, color: t.colors.text.tertiary, textAlign: 'center', marginTop: 10 },
  ambience: { alignItems: 'center', gap: 10, marginTop: 18 },
  soundPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 30, borderRadius: 15, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surface },
  soundPillText: { fontFamily: fonts.semibold, fontSize: 12, color: t.colors.text.tertiary },
  ambienceRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, maxWidth: 360 },
  soundIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surface, transform: [{ skewX: SLANT }] },
  soundIconActive: { backgroundColor: t.colors.accent, borderColor: t.colors.accent },
  soundLock: { position: 'absolute', right: -3, top: -3, width: 13, height: 13, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.text.tertiary },
  questStrip: { width: '100%', maxWidth: 420, marginTop: 26, gap: 8 },
  questKicker: { fontFamily: fonts.display, fontSize: 11, letterSpacing: 1.6, color: t.colors.text.tertiary, textTransform: 'uppercase' },

  // Custom config
  config: { width: '100%', maxWidth: 380, marginTop: 18, gap: 12 },
  configGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  stepper: { width: 168, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepperLabel: { fontFamily: fonts.medium, fontSize: 13, color: t.colors.text.secondary },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontFamily: fonts.semibold, fontSize: 14, color: t.colors.text.primary, minWidth: 38, textAlign: 'center' },
  saveRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.medium, fontSize: 14, color: t.colors.text.primary },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.colors.accent, borderRadius: 12, paddingHorizontal: 16 },
  saveBtnText: { fontFamily: fonts.semibold, fontSize: 14, color: t.colors.text.onAccent },
  presetRow: { gap: 8, paddingVertical: 2 },
  presetChip: { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, paddingRight: 28 },
  presetName: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.text.primary },
  presetMeta: { fontFamily: fonts.body, fontSize: 11, color: t.colors.text.tertiary, marginTop: 2 },
  presetX: { position: 'absolute', top: 7, right: 7 },

  bigShadow: { position: 'absolute', left: 5, top: 5, right: -5, bottom: -5, borderRadius: 14, transform: [{ skewX: SLANT }] },
  bigBtn: { height: 58, paddingHorizontal: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: SLANT }] },
  bigInner: { flexDirection: 'row', alignItems: 'center', gap: 10, transform: [{ skewX: UNSLANT }] },
  bigBtnText: { fontFamily: fonts.display, fontSize: 15, color: t.colors.text.onAccent, letterSpacing: 1.2, textTransform: 'uppercase' },
  resetText: { marginTop: 14, padding: 8 },
  resetTextLabel: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.text.tertiary },
}));
