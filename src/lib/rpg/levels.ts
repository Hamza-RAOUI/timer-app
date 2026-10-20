import { RPG_CONFIG, type RpgConfig, type TitleDef } from './config';

export interface LevelInfo {
  level: number;
  totalXp: number;
  /** XP earned inside the current level. */
  xpIntoLevel: number;
  /** XP needed to go from this level to the next. */
  xpForNext: number;
  /** 0…1 progress toward the next level. */
  progress: number;
}

/** XP to go from level L to L+1. */
export const xpToNext = (level: number, cfg: RpgConfig = RPG_CONFIG): number => cfg.levels.base + cfg.levels.perLevel * level;

/** Total XP needed to *reach* `level` (level 1 = 0 XP). */
export const xpForLevel = (level: number, cfg: RpgConfig = RPG_CONFIG): number => {
  const n = Math.max(0, level - 1);
  return cfg.levels.base * n + (cfg.levels.perLevel * n * (n + 1)) / 2;
};

export const levelFromXp = (totalXp: number, cfg: RpgConfig = RPG_CONFIG): LevelInfo => {
  const xp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (xp >= xpForLevel(level + 1, cfg)) level += 1;
  const xpIntoLevel = xp - xpForLevel(level, cfg);
  const xpForNext = xpToNext(level, cfg);
  return { level, totalXp: xp, xpIntoLevel, xpForNext, progress: xpForNext > 0 ? xpIntoLevel / xpForNext : 0 };
};

export interface TitleInfo {
  title: string;
  /** Level the current title was unlocked at. */
  since: number;
  next: TitleDef | null;
}

export const titleForLevel = (level: number, cfg: RpgConfig = RPG_CONFIG): TitleInfo => {
  let current = cfg.titles[0];
  let next: TitleDef | null = null;
  for (const t of cfg.titles) {
    if (level >= t.level) current = t;
    else {
      next = t;
      break;
    }
  }
  return { title: current.title, since: current.level, next };
};
