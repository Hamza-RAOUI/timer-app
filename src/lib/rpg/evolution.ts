import { RPG_CONFIG, type RpgConfig } from './config';

/**
 * Creature evolution. Every skill raises a creature from one of four families
 * (Study → Scholar, Work → Builder, Hobby → Creator, Personal → Wanderer) through
 * five stages: Grain → Pebble → Rock → Monolith → Flowkeeper. Stages follow the
 * skill's level; the fifth — the Flowkeeper, Flowglass's mascot — also needs all
 * four families trained, so the legendary form rewards a balanced life.
 * Pure: derived from skill levels, nothing stored.
 */
export type FamilyKey = 'scholar' | 'builder' | 'creator' | 'wanderer';
export type Stage = 1 | 2 | 3 | 4 | 5;

export interface FamilyDef {
  key: FamilyKey;
  /** Built-in skill this family belongs to. */
  skill: string;
  line: string;
  /** Stage names, stage 1…5. */
  names: [string, string, string, string, string];
  /** Funny title shown at the Monolith stage. */
  epithet: string;
}

export const FAMILIES: Record<FamilyKey, FamilyDef> = {
  scholar: {
    key: 'scholar',
    skill: 'study',
    line: 'Scholar',
    names: ['Grain Scholar', 'Pebble Apprentice', 'Rune Rock', 'Archive Monolith', 'The Flowkeeper'],
    epithet: 'The Academic Weapon',
  },
  builder: {
    key: 'builder',
    skill: 'work',
    line: 'Builder',
    names: ['Pebble Builder', 'Hard-Hat Pebble', 'Foreman Rock', 'Iron Monolith', 'The Flowkeeper'],
    epithet: 'Corporate Survivor',
  },
  creator: {
    key: 'creator',
    skill: 'hobby',
    line: 'Creator',
    names: ['Little Creator', 'Painter Pebble', 'Rockstar', 'Studio Monolith', 'The Flowkeeper'],
    epithet: 'Unlicensed Genius',
  },
  wanderer: {
    key: 'wanderer',
    skill: 'personal',
    line: 'Wanderer',
    names: ['Sand Wanderer', 'Pathfinder Pebble', 'Lantern Rock', 'Guardian Monolith', 'The Flowkeeper'],
    epithet: 'The Side Quest Enjoyer',
  },
};

export const FAMILY_KEYS = Object.keys(FAMILIES) as FamilyKey[];

/** Species per stage (shared by every family). */
export const SPECIES: Record<Stage, string> = { 1: 'Grain', 2: 'Pebble', 3: 'Rock', 4: 'Monolith', 5: 'Flowkeeper' };

/** Funny titles per stage; stage 4 uses the family's epithet. */
const QUIPS: Record<Exclude<Stage, 4>, string> = {
  1: 'Unemployed Grain',
  2: 'The Paperweight',
  3: 'Mike the Rock',
  5: 'The Flow Demon',
};

/** Easter egg: tap a Rock-stage creature a few times. Original lines only. */
export const ROCK_JOKES = [
  'Rock solid. Literally.',
  'I was a pebble once. Then I discovered Pomodoro.',
  'Between a rock and a deadline? Pick the rock.',
  'Stone-cold focused since level 6.',
  'My eyebrow has more discipline than your notifications.',
  'Mike the Rock has entered the chat. Mike the Rock will now focus.',
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

export interface FlowkeeperStatus {
  unlocked: boolean;
  /** Families still below the required level. */
  missing: FamilyKey[];
  required: number;
}

export const flowkeeperStatus = (skillLevels: Record<string, number>, cfg: RpgConfig = RPG_CONFIG): FlowkeeperStatus => {
  const required = cfg.evolution.flowkeeperFamilyLevel;
  const levels = familyLevels(skillLevels);
  const missing = FAMILY_KEYS.filter((f) => levels[f] < required);
  return { unlocked: missing.length === 0, missing, required };
};

/** Stage reached at a skill level. Stage 5 only when the Flowkeeper is unlocked. */
export const stageForLevel = (level: number, flowkeeperUnlocked: boolean, cfg: RpgConfig = RPG_CONFIG): Stage => {
  const at = cfg.evolution.stageLevels;
  let stage: Stage = 1;
  for (let i = 1; i < at.length; i++) if (level >= at[i]) stage = (i + 1) as Stage;
  return stage === 5 && !flowkeeperUnlocked ? 4 : stage;
};

export interface Evolution {
  family: FamilyDef;
  stage: Stage;
  species: string;
  name: string;
  quip: string;
  skillLevel: number;
  /** Next stage, or null at the Flowkeeper. `needsAllFamilies` → the level is reached but other families lag. */
  next: { stage: Stage; name: string; level: number; needsAllFamilies: boolean } | null;
  flowkeeper: FlowkeeperStatus;
}

export const stageName = (family: FamilyKey, stage: Stage) => FAMILIES[family].names[stage - 1];
export const stageQuip = (family: FamilyKey, stage: Stage) => (stage === 4 ? FAMILIES[family].epithet : QUIPS[stage]);

export interface EvolutionOptions {
  cfg?: RpgConfig;
  /** Dev preview: pretend the skill is at this level and every family is trained. */
  previewLevel?: number | null;
}

/** The creature a skill has raised so far. */
export const evolutionFor = (skillKey: string, skillLevels: Record<string, number>, opts: EvolutionOptions = {}): Evolution => {
  const cfg = opts.cfg ?? RPG_CONFIG;
  const preview = opts.previewLevel ?? null;
  const familyKey = familyForSkill(skillKey);
  const family = FAMILIES[familyKey];
  const skillLevel = preview ?? skillLevels[skillKey] ?? 1;
  const real = flowkeeperStatus(skillLevels, cfg);
  const flowkeeper: FlowkeeperStatus = preview != null ? { unlocked: preview >= cfg.evolution.flowkeeperFamilyLevel, missing: [], required: real.required } : real;
  const stage = stageForLevel(skillLevel, flowkeeper.unlocked, cfg);

  let next: Evolution['next'] = null;
  if (stage < 5) {
    const ns = (stage + 1) as Stage;
    const level = cfg.evolution.stageLevels[ns - 1];
    next = { stage: ns, name: stageName(familyKey, ns), level, needsAllFamilies: ns === 5 && skillLevel >= level };
  }
  return { family, stage, species: SPECIES[stage], name: stageName(familyKey, stage), quip: stageQuip(familyKey, stage), skillLevel, next, flowkeeper };
};

/** Skill key → level, from computeProgress().skills. */
export const skillLevelsOf = (skills: Record<string, { level: { level: number } }>): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(skills)) out[k] = v.level.level;
  return out;
};
