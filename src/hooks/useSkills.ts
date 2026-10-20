import { useMemo } from 'react';
import { CATEGORIES, skillFrom, type Skill } from '../constants/focus';
import { useSettingsStore } from '../stores/settingsStore';

/** Built-in skills (with Pro renames) followed by custom skills. */
export const resolveSkills = (skillNames: Record<string, string>, customSkills: Skill[]): Skill[] => [
  ...CATEGORIES.map((c) => (skillNames[c.key] ? { ...c, label: skillNames[c.key] } : c)),
  ...customSkills.map((c) => ({ ...c, builtIn: false })),
];

/** All skills, archived custom ones included (for history). */
export const useAllSkills = (): Skill[] => {
  const names = useSettingsStore((s) => s.skillNames);
  const custom = useSettingsStore((s) => s.customSkills);
  return useMemo(() => resolveSkills(names, custom), [names, custom]);
};

/** Skills offered in the picker (archived custom skills hidden). */
export const useSkills = (): Skill[] => {
  const all = useAllSkills();
  return useMemo(() => all.filter((s) => !s.archived), [all]);
};

export const useActiveSkill = (): Skill => {
  const all = useAllSkills();
  const key = useSettingsStore((s) => s.lastCategory);
  return useMemo(() => {
    const found = skillFrom(all, key);
    return found.archived ? all[0] : found;
  }, [all, key]);
};

/** Non-hook lookup for store/event code. */
export const getSkill = (key: string): Skill => {
  const { skillNames, customSkills } = useSettingsStore.getState();
  return skillFrom(resolveSkills(skillNames, customSkills), key);
};
