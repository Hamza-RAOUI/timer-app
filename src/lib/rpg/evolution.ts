import { RPG_CONFIG, type RpgConfig } from './config';

/**
 * Creature evolution. Every skill raises a creature from one of four families
 * (Study → Scholar, Work → Builder, Hobby → Creator, Personal → Wanderer) through
 * five stages (Grain → Pebble → Rock → Monolith → Timekeeper). Each family has its own
 * funny name per stage ("Unemployed Grain" … "Corporate Survivor"). Stages follow the
 * skill's level; the fifth — the Timekeeper, Flowglass's mascot — also needs all
 * four families trained, so the legendary form rewards a balanced life.
 * Pure: derived from skill levels, nothing stored.
 */
export type FamilyKey = 'scholar' | 'builder' | 'creator' | 'wanderer';
export type Stage = 1 | 2 | 3 | 4 | 5;

export interface FamilyDef {
  key: FamilyKey;
  /** Built-in skill this family belongs to. */
  skill: string;
  /** Internal family name (a11y, docs) — not shown as a label. */
  line: string;
  /** The one name shown for each stage, 1…5. */
  names: [string, string, string, string, string];
}

export const FAMILIES: Record<FamilyKey, FamilyDef> = {
  scholar: {
    key: 'scholar',
    skill: 'study',
    line: 'Scholar',
    names: ['Professional Procrastinator', 'The Highlighter Addict', 'Library Gremlin', 'The Academic Weapon', 'Dean of Time'],
  },
  builder: { key: 'builder', skill: 'work', line: 'Builder', names: ['Unemployed Grain', 'Unpaid Intern', 'Middle Manager', 'Corporate Survivor', 'CEO of Time'] },
  creator: {
    key: 'creator',
    skill: 'hobby',
    line: 'Creator',
    names: ['Starving Artist', 'Side Project Hoarder', 'Garage Band Legend', 'Unlicensed Genius', 'The Main Character'],
  },
  wanderer: { key: 'wanderer', skill: 'personal', line: 'Wanderer', names: ['Couch Grain', 'The Paperweight', 'Mike the Rock', 'The Side Quest Enjoyer', 'Keeper of Vibes'] },
};

export const FAMILY_KEYS = Object.keys(FAMILIES) as FamilyKey[];

/** Species per stage (shared by every family; used for art and a11y, not as a label). */
export const SPECIES: Record<Stage, string> = { 1: 'Grain', 2: 'Pebble', 3: 'Rock', 4: 'Monolith', 5: 'Timekeeper' };

/** Easter egg: tap a Rock-stage creature a few times. Original lines only. */
export const ROCK_JOKES = [
  'Rock solid. Literally.',
  'I was a pebble once. Then I discovered Pomodoro.',
  'Between a rock and a deadline? Pick the rock.',
  'Stone-cold focused since level 6.',
  'My eyebrow has more discipline than your notifications.',
  'A wild rock has entered the chat. The rock will now focus.',
  'Some call it hard-headed. I call it focus-dense.',
  'I don’t skip breaks. Breaks skip me. I’m a rock.',
] as const;

const BY_SKILL: Record<string, FamilyKey> = { study: 'scholar', work: 'builder', hobby: 'creator', personal: 'wanderer' };

/** Built-in skills have a fixed family; custom skills get a stable one from their key. */
export const familyForSkill = (skillKey: string): FamilyKey => {
  if (BY_SKILL[skillKey]) return BY_SKILL[skillKey];
  let h = 0;
  for (let i = 0; i < skillKey.length; i++) h = (h * 31 + skillKey.charCodeAt(i)) | 0;
  return FAMILY_KEYS[Math.abs(h) % FAMILY_KEYS.length];
};

/** Best skill level reached in each family (custom skills count toward their family). */
export const familyLevels = (skillLevels: Record<string, number>): Record<FamilyKey, number> => {
  const out: Record<FamilyKey, number> = { scholar: 1, builder: 1, creator: 1, wanderer: 1 };
  for (const [skill, level] of Object.entries(skillLevels)) {
    const f = familyForSkill(skill);
    out[f] = Math.max(out[f], level);
  }
  return out;
};

export interface TimekeeperStatus {
  unlocked: boolean;
  /** Families still below the required level. */
  missing: FamilyKey[];
  required: number;
}

export const timekeeperStatus = (skillLevels: Record<string, number>, cfg: RpgConfig = RPG_CONFIG): TimekeeperStatus => {
  const required = cfg.evolution.timekeeperFamilyLevel;
  const levels = familyLevels(skillLevels);
  const missing = FAMILY_KEYS.filter((f) => levels[f] < required);
  return { unlocked: missing.length === 0, missing, required };
};

/** Stage reached at a skill level. Stage 5 only when the Timekeeper is unlocked. */
export const stageForLevel = (level: number, timekeeperUnlocked: boolean, cfg: RpgConfig = RPG_CONFIG): Stage => {
  const at = cfg.evolution.stageLevels;
  let stage: Stage = 1;
  for (let i = 1; i < at.length; i++) if (level >= at[i]) stage = (i + 1) as Stage;
  return stage === 5 && !timekeeperUnlocked ? 4 : stage;
};

export interface Evolution {
  family: FamilyDef;
  /** Form on display — the player may pick any stage they've reached. */
  stage: Stage;
  /** Highest stage reached. */
  reached: Stage;
  species: string;
  name: string;
  skillLevel: number;
  /** Next stage, or null at the Timekeeper. `needsAllFamilies` → the level is reached but other families lag. */
  next: { stage: Stage; name: string; level: number; needsAllFamilies: boolean } | null;
  timekeeper: TimekeeperStatus;
}

export const stageName = (family: FamilyKey, stage: Stage) => FAMILIES[family].names[stage - 1];

export interface EvolutionOptions {
  cfg?: RpgConfig;
  /** Dev preview: pretend the skill is at this level and every family is trained. */
  previewLevel?: number | null;
  /** Form the player picked (ignored if not reached yet). */
  chosenStage?: number | null;
}

/** The creature a skill has raised so far. */
export const evolutionFor = (skillKey: string, skillLevels: Record<string, number>, opts: EvolutionOptions = {}): Evolution => {
  const cfg = opts.cfg ?? RPG_CONFIG;
  const preview = opts.previewLevel ?? null;
  const familyKey = familyForSkill(skillKey);
  const family = FAMILIES[familyKey];
  const skillLevel = preview ?? skillLevels[skillKey] ?? 1;
  const real = timekeeperStatus(skillLevels, cfg);
  const timekeeper: TimekeeperStatus = preview != null ? { unlocked: preview >= cfg.evolution.timekeeperFamilyLevel, missing: [], required: real.required } : real;
  const reached = stageForLevel(skillLevel, timekeeper.unlocked, cfg);
  const chosen = opts.chosenStage;
  const stage = chosen != null && chosen >= 1 && chosen <= reached ? (Math.round(chosen) as Stage) : reached;

  let next: Evolution['next'] = null;
  if (reached < 5) {
    const ns = (reached + 1) as Stage;
    const level = cfg.evolution.stageLevels[ns - 1];
    next = { stage: ns, name: stageName(familyKey, ns), level, needsAllFamilies: ns === 5 && skillLevel >= level };
  }
  return { family, stage, reached, species: SPECIES[stage], name: stageName(familyKey, stage), skillLevel, next, timekeeper };
};

/** Skill key → level, from computeProgress().skills. */
export const skillLevelsOf = (skills: Record<string, { level: { level: number } }>): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(skills)) out[k] = v.level.level;
  return out;
};
