/**
 * App glue for the RPG layer: memoized progress for components, and
 * `recordSession` — log a session, diff progress, then play the feedback
 * (XP count-up → quest/skill toasts → level-up modal) and send analytics.
 */
import { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { BUILT_IN_SKILL_KEYS } from '../constants/focus';
import { getSkill } from '../hooks/useSkills';
import { useRewardStore } from '../stores/rewardStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useStatsStore, type NewSession } from '../stores/statsStore';
import { useUiStore } from '../stores/uiStore';
import { trackEvent } from './analytics';
import { playDing, playLevelUp } from './sound';
import { buildReward, computeProgress, type Progress, type Reward, type SessionEvent } from './rpg';

/** Hourglass flip length; the XP panel waits for it. */
export const FLIP_MS = 820;
/** XP count-up length. */
export const XP_COUNT_MS = 1100;

let memo: { sessions: SessionEvent[]; isPro: boolean; proSince: number | null; today: string; value: Progress } | null = null;

const progressFor = (sessions: SessionEvent[], isPro: boolean, proSince: number | null, today: string): Progress => {
  if (memo && memo.sessions === sessions && memo.isPro === isPro && memo.proSince === proSince && memo.today === today) {
    return memo.value;
  }
  const value = computeProgress(sessions, { now: Date.now(), isPro, proSince });
  memo = { sessions, isPro, proSince, today, value };
  return value;
};

/** Current RPG progress. Recomputes when the log, Pro status or calendar day changes. */
export const useProgress = (): Progress => {
  const sessions = useStatsStore((s) => s.sessions);
  const isPro = useSettingsStore((s) => s.isPro);
  const proSince = useSettingsStore((s) => s.proSince);
  const today = useUiStore((s) => s.today);
  return useMemo(() => progressFor(sessions, isPro, proSince, today), [sessions, isPro, proSince, today]);
};

export const getProgress = (): Progress => {
  const { isPro, proSince } = useSettingsStore.getState();
  return progressFor(useStatsStore.getState().sessions, isPro, proSince, useUiStore.getState().today);
};

// ───────────── Reduced motion: OS setting + in-app switch ─────────────
let systemReduced = false;
const listeners = new Set<(v: boolean) => void>();
if (Platform.OS !== 'web' || typeof window !== 'undefined') {
  try {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        systemReduced = v;
        listeners.forEach((l) => l(v));
      })
      .catch(() => {});
    AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      systemReduced = v;
      listeners.forEach((l) => l(v));
    });
  } catch {
    /* not supported here */
  }
}

export const prefersReducedMotion = () => systemReduced || useSettingsStore.getState().reduceMotion;

export const useReducedMotionPref = (): boolean => {
  const [system, setSystem] = useState(systemReduced);
  const manual = useSettingsStore((s) => s.reduceMotion);
  useEffect(() => {
    listeners.add(setSystem);
    setSystem(systemReduced);
    return () => {
      listeners.delete(setSystem);
    };
  }, []);
  return system || manual;
};

// ───────────── Logging a session ─────────────
export const recordSession = (input: NewSession, opts: { flip?: boolean } = {}): Reward | null => {
  const { isPro, proSince } = useSettingsStore.getState();
  const options = { now: Date.now(), isPro, proSince };
  const before = computeProgress(useStatsStore.getState().sessions, options);
  const event = useStatsStore.getState().logSession(input);
  if (!event) return null;
  const after = computeProgress(useStatsStore.getState().sessions, options);
  const reward = buildReward(before, after, event);

  const reduced = prefersReducedMotion();
  const reveal = opts.flip && !reduced ? FLIP_MS : 0;
  useRewardStore.getState().present(reward, reveal);

  // After the XP count-up: quests, skill toast, then the level-up modal.
  setTimeout(
    () => {
      const r = useRewardStore.getState();
      for (const q of reward.questsCompleted) {
        r.pushToast({ kind: 'quest', title: q.scope === 'daily' ? 'Daily quest complete' : 'Weekly quest complete', body: `${q.def.label} · +${q.reward} XP`, icon: 'trophy' });
      }
      if (reward.skillLeveledUp) {
        const skill = getSkill(event.skill);
        r.pushToast({ kind: 'skill', title: `${skill.label} reached LV ${reward.skillAfter.level}`, body: 'Skill level up', swatch: skill.swatch, icon: skill.icon });
      }
      if (reward.leveledUp) r.showLevelUp(reward);
      if (useSettingsStore.getState().soundEnabled) {
        if (reward.leveledUp) playLevelUp();
        else if (reward.questsCompleted.length > 0 || reward.skillLeveledUp) playDing();
      }
    },
    reveal + (reduced ? 250 : XP_COUNT_MS + 250)
  );

  // Analytics: no personal data — custom skill names are never sent. Max 2 properties
  // per event (the limit on Vercel's Pro plan).
  const skill = BUILT_IN_SKILL_KEYS.includes(event.skill) ? event.skill : 'custom';
  if (reward.completed) trackEvent('session_completed', { technique: event.technique, skill });
  if (reward.leveledUp) trackEvent('level_up', { level: reward.levelAfter.level });
  for (const q of reward.questsCompleted) trackEvent('quest_completed', { quest: q.def.id, scope: q.scope });

  return reward;
};
