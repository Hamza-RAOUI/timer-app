import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { MAX_CUSTOM_SKILLS, SAND_THEMES, SKILL_ICONS, SWATCH_KEYS, type IconName, type Skill, type SwatchKey } from '../../constants/focus';
import { useActiveSkill, useSkills } from '../../hooks/useSkills';
import { useEvolution, useProgress } from '../../lib/game';
import { FAMILIES, FAMILY_KEYS, RPG_CONFIG, emptySkill, familyLevels, skillLevelsOf, stageName, type Stage } from '../../lib/rpg';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts, hardTextShadow, SLANT, tabular, UNSLANT } from '../../theme/typography';
import { formatMsHuman } from '../../utils/timeFormatter';
import { Critter } from '../art/Critter';
import { EvolutionPanel } from '../art/EvolutionPanel';
import { RankEmblem } from '../art/RankEmblem';
import { SkillCrest } from '../art/SkillCrest';
import { Card } from '../Card';
import { QuestRow } from '../game/QuestRow';
import { SectionHeader } from '../game/SectionHeader';
import { SkewTag } from '../game/SkewTag';
import { StripeField } from '../game/StripeField';
import { XpBar } from '../game/XpBar';
import { Hourglass } from '../Hourglass';

export const CharacterView: React.FC = () => {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const wide = width >= 1180;
  const narrow = width < 900;

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <ScrollView contentContainerStyle={[styles.scroll, !narrow && styles.scrollWide]} showsVerticalScrollIndicator={false}>
        {!narrow && (
          <Text style={styles.h1} accessibilityRole="header">
            Character
          </Text>
        )}
        <HeroCard narrow={width < 640} />
        <EvolutionCard />
        <StatTiles />
        <View style={[styles.cols, wide && styles.colsWide]}>
          <View style={[styles.col, wide && { flex: 1 }]}>
            <QuestsCard />
            <StreakCard />
          </View>
          <View style={[styles.col, wide && { flex: 1 }]}>
            <SkillsCard />
            <SandCard />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ───────────── Hero ─────────────
const HeroCard: React.FC<{ narrow: boolean }> = ({ narrow }) => {
  const t = useTheme();
  const styles = useStyles();
  const p = useProgress();
  const toNext = p.level.xpForNext - p.level.xpIntoLevel;
  const skill = useActiveSkill();
  const evo = useEvolution(skill.key);
  const [heroSize, setHeroSize] = useState({ w: 0, h: 0 });
  return (
    <View style={styles.hero}>
      <View style={[styles.heroChar, narrow && { opacity: 0.3 }, narrow ? styles.noTouch : styles.boxNone]} onLayout={(e) => setHeroSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {heroSize.w > 0 && (
          <EvolutionPanel
            skillKey={skill.key}
            width={narrow ? heroSize.w : heroSize.w * 0.62}
            height={heroSize.h}
            fadeTo={t.colors.surface}
            showName={!narrow}
            nameMaxWidth={heroSize.w * 0.36}
            interactive={!narrow}
            style={{ alignSelf: 'flex-end' }}
          />
        )}
      </View>
      <View style={[styles.heroBody, narrow ? styles.heroBodyNarrow : styles.heroBodyWide, styles.boxNone]}>
        <RankEmblem title={p.title.title} size={narrow ? 104 : 124} label={`${p.title.title} rank emblem`} />
        <View style={[styles.heroText, narrow && { alignItems: 'center' }]}>
          <SkewTag label="Player" size="sm" color={t.colors.highlight} />
          <Text style={[styles.heroLv, tabular]} accessibilityLabel={`Level ${p.level.level}`}>
            LV {p.level.level}
          </Text>
          <Text style={styles.heroTitle}>{p.title.title}</Text>
          <Text style={[styles.heroClass, narrow && { textAlign: 'center' }]}>
            Creature · {evo.name} <Text style={{ color: t.colors.swatch[skill.swatch].text }}>({skill.label})</Text>
          </Text>
          <XpBar progress={p.level.progress} height={12} ticks={10} style={{ marginTop: 12, maxWidth: 420 }} label="Player XP" />
          <Text style={[styles.heroXp, tabular, narrow && { textAlign: 'center' }]}>
            {p.level.xpIntoLevel} / {p.level.xpForNext} XP · {toNext} to LV {p.level.level + 1}
          </Text>
          <Text style={[styles.heroNext, narrow && { textAlign: 'center' }]}>
            {p.title.next ? `Next title: ${p.title.next.title} at LV ${p.title.next.level}` : 'Highest title reached — legendary.'}
          </Text>
        </View>
      </View>
    </View>
  );
};

// ───────────── Evolution line ─────────────
const STAGES: Stage[] = [1, 2, 3, 4, 5];

const EvolutionCard: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const p = useProgress();
  const skill = useActiveSkill();
  const evo = useEvolution(skill.key);
  const preview = useUiStore((s) => s.devPreviewLevel);
  const setForm = useSettingsStore((s) => s.setCreatureForm);
  const { width } = useWindowDimensions();
  const thumb = width < 640 ? 64 : 92;
  const fam = evo.family.key;
  const levels = familyLevels(skillLevelsOf(p.skills));
  const need = RPG_CONFIG.evolution.timekeeperFamilyLevel;
  const at = RPG_CONFIG.evolution.stageLevels;

  return (
    <Card padding={18} style={[styles.card, { marginTop: 14 }]} accent={t.colors.highlight}>
      <SectionHeader
        title={`${skill.label} evolution`}
        right={<Text style={styles.meta}>{preview != null ? `Dev preview · LV ${preview}` : `Skill LV ${evo.skillLevel}`}</Text>}
      />
      {evo.reached > 1 && <Text style={styles.evoHint}>Tap any form you've unlocked to show it.</Text>}
      <View style={styles.evoRow}>
        {STAGES.map((st) => {
          const reached = st <= evo.reached;
          const current = st === evo.stage;
          return (
            <Pressable
              key={st}
              disabled={!reached}
              // Picking the newest form clears the choice, so future evolutions show up automatically.
              onPress={() => setForm(skill.key, st === evo.reached ? null : st)}
              style={({ hovered }: { hovered?: boolean }) => [
                styles.evoCell,
                reached && hovered && !current && { borderColor: t.colors.borderStrong },
                current && { borderColor: t.colors.accent, backgroundColor: t.colors.accentSoft },
              ]}
              accessibilityRole={reached ? 'radio' : undefined}
              accessibilityState={reached ? { checked: current } : { disabled: true }}
              accessibilityLabel={reached ? `${stageName(fam, st)}${current ? ', shown' : ', tap to show'}` : `Locked form, skill level ${at[st - 1]}`}
            >
              <Critter family={fam} stage={st} size={thumb} silhouette={!reached} blink={current} />
              <Text style={[styles.evoName, !reached && { color: t.colors.text.tertiary }]} numberOfLines={2}>
                {reached ? stageName(fam, st) : '???'}
              </Text>
              <Text style={[styles.evoLv, tabular]}>{current ? 'Shown' : st === 5 ? `LV ${at[4]} + all` : `LV ${at[st - 1]}`}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.evoNext}>
        {evo.next == null
          ? 'Legendary form reached. The Timekeeper bows to no deadline.'
          : evo.next.needsAllFamilies
            ? `Ready for the Timekeeper — train every skill to LV ${need} to unlock it.`
            : `Next: ${evo.next.name} at skill LV ${evo.next.level}.`}
        {evo.stage === 3 || evo.stage === 4 ? '  Psst: rocks hate being poked.' : ''}
      </Text>

      <View style={styles.famRow}>
        {FAMILY_KEYS.map((f) => {
          const ok = preview != null ? preview >= need : levels[f] >= need;
          return (
            <View key={f} style={[styles.famChip, ok && { borderColor: t.colors.gold }]}>
              <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={ok ? t.colors.goldText : t.colors.text.tertiary} />
              <Text style={styles.famText}>
                {FAMILIES[f].line} <Text style={tabular}>{Math.min(preview ?? levels[f], need)}/{need}</Text>
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const StatTiles: React.FC = () => {
  const styles = useStyles();
  const p = useProgress();
  const tiles = [
    { label: 'Total XP', value: p.totalXp.toLocaleString() },
    { label: 'Sessions', value: String(p.completedSessions) },
    { label: 'Focus time', value: formatMsHuman(p.totalMinutes * 60_000) },
    { label: 'Best streak', value: `${p.streak.best}d` },
  ];
  return (
    <View style={styles.tiles}>
      {tiles.map((x) => (
        <View key={x.label} style={styles.tile} accessible accessibilityLabel={`${x.label}: ${x.value}`}>
          <Text style={[styles.tileValue, tabular]}>{x.value}</Text>
          <Text style={styles.tileLabel}>{x.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ───────────── Quests ─────────────
const QuestsCard: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const p = useProgress();
  const isPro = useSettingsStore((s) => s.isPro);
  const openPro = useUiStore((s) => s.openPro);
  return (
    <Card padding={18} style={styles.card} accent={t.colors.accent}>
      <SectionHeader title="Daily quest" right={<Text style={styles.meta}>Resets at midnight</Text>} />
      <QuestRow quest={p.today.quest} />

      <SectionHeader
        title="Weekly quests"
        style={{ marginTop: 22 }}
        right={isPro ? <Text style={styles.meta}>Resets Monday</Text> : <SkewTag label="Pro" size="sm" color={t.colors.gold} textColor="#3B2300" />}
      />
      <View style={{ gap: 10 }}>
        {p.week.quests.map((q) => (
          <QuestRow key={q.def.id} quest={q} onLockedPress={() => openPro('quests')} />
        ))}
      </View>
      {!isPro && (
        <Pressable onPress={() => openPro('quests')} style={styles.inlineCta} accessibilityRole="button">
          <Ionicons name="sparkles" size={14} color={t.colors.highlightText} />
          <Text style={styles.inlineCtaText}>Weekly quests are part of Founding Pro · +{RPG_CONFIG.quests.weeklyReward} XP each</Text>
        </Pressable>
      )}
    </Card>
  );
};

// ───────────── Streak ─────────────
const StreakCard: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const p = useProgress();
  const isPro = useSettingsStore((s) => s.isPro);
  const openPro = useUiStore((s) => s.openPro);
  const s = p.streak;
  const status = s.todayDone
    ? 'Today’s session is done — the streak is safe.'
    : s.atRisk
      ? 'Complete a session today to keep it going.'
      : 'Complete one session today to start a streak.';

  return (
    <Card padding={18} style={styles.card}>
      <SectionHeader title="Streak" />
      <View style={styles.streakRow}>
        <View style={[styles.flame, { backgroundColor: s.current > 0 ? t.colors.highlightSoft : t.colors.surfaceAlt }]}>
          <Ionicons name="flame" size={34} color={s.current > 0 ? t.colors.highlight : t.colors.text.tertiary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.streakNum, tabular]}>
            {s.current} <Text style={styles.streakUnit}>{s.current === 1 ? 'day' : 'days'}</Text>
          </Text>
          <Text style={styles.streakStatus}>{status}</Text>
        </View>
      </View>
      <View style={styles.freezeRow}>
        <Ionicons name="snow" size={16} color={isPro ? t.colors.swatch.sky.text : t.colors.text.tertiary} />
        {isPro ? (
          <Text style={styles.freezeText}>
            {s.freezeAvailable ? 'Streak freeze ready this week — a missed day is covered automatically.' : 'This week’s freeze is used.'}
            {s.frozenDays.length > 0 ? ` Days saved so far: ${s.frozenDays.length}.` : ''}
          </Text>
        ) : (
          <Pressable onPress={() => openPro('streak')} style={{ flex: 1 }} accessibilityRole="button">
            <Text style={styles.freezeText}>
              Streak freeze <Text style={styles.proInline}>· Pro</Text> — {RPG_CONFIG.streak.freezesPerWeek} per week, applied to a missed day automatically.
            </Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
};

// ───────────── Skills ─────────────
const SkillCard: React.FC<{ skill: Skill; editing: boolean }> = ({ skill, editing }) => {
  const t = useTheme();
  const styles = useStyles();
  const p = useProgress();
  const rename = useSettingsStore((s) => s.renameSkill);
  const archive = useSettingsStore((s) => s.archiveCustomSkill);
  const [draft, setDraft] = useState(skill.label);
  const sp = p.skills[skill.key] ?? emptySkill(skill.key);
  const sw = t.colors.swatch[skill.swatch];
  return (
    <View style={styles.skill}>
      <StripeField color={sw.soft} gap={12} />
      <View style={styles.skillTop}>
        <SkillCrest swatch={skill.swatch} icon={skill.icon} size={40} />
        <View style={{ flex: 1 }}>
          {editing ? (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onEndEditing={() => rename(skill.key, draft)}
              onBlur={() => rename(skill.key, draft)}
              maxLength={18}
              style={styles.skillInput}
              accessibilityLabel={`Rename ${skill.label}`}
            />
          ) : (
            <Text style={[styles.skillName, { color: sw.text }]} numberOfLines={1}>
              {skill.label}
            </Text>
          )}
          <Text style={[styles.skillLv, tabular]}>LV {sp.level.level}</Text>
        </View>
        {editing && !skill.builtIn && (
          <Pressable onPress={() => archive(skill.key)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Retire ${skill.label}`}>
            <Ionicons name="archive-outline" size={18} color={t.colors.text.tertiary} />
          </Pressable>
        )}
      </View>
      <XpBar progress={sp.level.progress} height={8} ticks={8} color={sw.fill} style={{ marginTop: 12 }} label={`${skill.label} XP`} />
      <View style={styles.skillMeta}>
        <Text style={[styles.skillMetaText, tabular]}>
          {sp.level.xpIntoLevel}/{sp.level.xpForNext} XP
        </Text>
        <Text style={[styles.skillMetaText, tabular]}>{formatMsHuman(sp.minutes * 60_000)}</Text>
      </View>
    </View>
  );
};

const AddSkill: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const t = useTheme();
  const styles = useStyles();
  const add = useSettingsStore((s) => s.addCustomSkill);
  const setCategory = useSettingsStore((s) => s.setCategory);
  const [name, setName] = useState('');
  const [swatch, setSwatch] = useState<SwatchKey>('violet');
  const [icon, setIcon] = useState<IconName>(SKILL_ICONS[0]);
  return (
    <View style={styles.addSkill}>
      <Text style={styles.addTitle}>New skill</Text>
      <TextInput value={name} onChangeText={setName} placeholder="e.g. Guitar" placeholderTextColor={t.colors.text.tertiary} maxLength={18} style={styles.skillInput} accessibilityLabel="Skill name" />
      <View style={styles.pickRow} accessibilityRole="radiogroup" accessibilityLabel="Color">
        {SWATCH_KEYS.map((k) => (
          <Pressable
            key={k}
            onPress={() => setSwatch(k)}
            style={[styles.swatchPick, { backgroundColor: t.colors.swatch[k].fill }, swatch === k && styles.pickActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: swatch === k }}
            accessibilityLabel={k}
          />
        ))}
      </View>
      <View style={styles.pickRow} accessibilityRole="radiogroup" accessibilityLabel="Icon">
        {SKILL_ICONS.map((i) => (
          <Pressable
            key={i}
            onPress={() => setIcon(i)}
            style={[styles.iconPick, icon === i && styles.pickActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: icon === i }}
            accessibilityLabel={i}
          >
            <Ionicons name={i} size={16} color={icon === i ? t.colors.accentText : t.colors.text.secondary} />
          </Pressable>
        ))}
      </View>
      <View style={styles.addActions}>
        <Pressable onPress={onDone} style={styles.ghostBtn} accessibilityRole="button">
          <Text style={styles.ghostBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            const key = add(name, swatch, icon);
            if (key) {
              setCategory(key);
              onDone();
            }
          }}
          disabled={!name.trim()}
          style={[styles.solidBtn, !name.trim() && { opacity: 0.5 }]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !name.trim() }}
        >
          <Text style={styles.solidBtnText}>Add skill</Text>
        </Pressable>
      </View>
    </View>
  );
};

const SkillsCard: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const skills = useSkills();
  const isPro = useSettingsStore((s) => s.isPro);
  const customCount = useSettingsStore((s) => s.customSkills.filter((c) => !c.archived).length);
  const openPro = useUiStore((s) => s.openPro);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  return (
    <Card padding={18} style={styles.card} accent={t.colors.highlight}>
      <SectionHeader
        title="Skills"
        right={
          isPro ? (
            <Pressable onPress={() => { setEditing((e) => !e); setAdding(false); }} hitSlop={8} accessibilityRole="button">
              <Text style={styles.link}>{editing ? 'Done' : 'Edit'}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => openPro('skills')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Rename and add skills — Pro">
              <Text style={styles.link}>Rename / add · Pro</Text>
            </Pressable>
          )
        }
      />
      <View style={styles.skillGrid}>
        {skills.map((s) => (
          <View key={s.key} style={styles.skillCell}>
            <SkillCard skill={s} editing={editing} />
          </View>
        ))}
      </View>
      {isPro && editing && !adding && customCount < MAX_CUSTOM_SKILLS && (
        <Pressable onPress={() => setAdding(true)} style={styles.addBtn} accessibilityRole="button">
          <Ionicons name="add" size={16} color={t.colors.accentText} />
          <Text style={styles.link}>Add a skill</Text>
        </Pressable>
      )}
      {adding && <AddSkill onDone={() => setAdding(false)} />}
    </Card>
  );
};

// ───────────── Hourglass sand ─────────────
const SandCard: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const p = useProgress();
  const isPro = useSettingsStore((s) => s.isPro);
  const current = useSettingsStore((s) => s.sandTheme);
  const setSand = useSettingsStore((s) => s.setSandTheme);
  const openPro = useUiStore((s) => s.openPro);
  return (
    <Card padding={18} style={styles.card}>
      <SectionHeader title="Hourglass sand" right={<Text style={styles.meta}>{isPro ? 'All unlocked' : 'Unlock by level'}</Text>} />
      <View style={styles.sandGrid}>
        {SAND_THEMES.map((s) => {
          const unlocked = isPro || p.level.level >= s.unlockLevel;
          const active = current === s.key;
          return (
            <Pressable
              key={s.key}
              onPress={() => (unlocked ? setSand(s.key) : openPro('themes'))}
              style={[styles.sand, active && { borderColor: t.colors.accent, backgroundColor: t.colors.accentSoft }]}
              accessibilityRole="radio"
              accessibilityState={{ checked: active, disabled: !unlocked }}
              accessibilityLabel={unlocked ? `${s.label} sand` : `${s.label} sand, unlocks at level ${s.unlockLevel} or with Pro`}
            >
              <View style={{ opacity: unlocked ? 1 : 0.35 }}>
                <Hourglass progress={0.42} sand={s.colors} frame={t.colors.text.primary} size={42} />
              </View>
              <Text style={[styles.sandLabel, active && { color: t.colors.accentText }]}>{s.label}</Text>
              {!unlocked && (
                <View style={styles.sandLock}>
                  <Ionicons name="lock-closed" size={10} color={t.colors.text.secondary} />
                  <Text style={[styles.sandLockText, tabular]}>LV {s.unlockLevel}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
};

const useStyles = makeStyles((t) => ({
  scroll: { padding: 16, paddingBottom: 120, gap: 16 },
  scrollWide: { paddingHorizontal: 36, paddingTop: 26, maxWidth: 1180, width: '100%', alignSelf: 'center' },
  h1: { fontFamily: fonts.display, fontSize: 34, color: t.colors.text.primary, letterSpacing: 1, textTransform: 'uppercase', transform: [{ skewX: '-8deg' }] },
  cols: { gap: 16 },
  colsWide: { flexDirection: 'row', alignItems: 'flex-start' },
  col: { gap: 16 },
  card: {},
  meta: { fontFamily: fonts.medium, fontSize: 12, color: t.colors.text.tertiary },
  link: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.accentText },

  evoRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  evoCell: { flex: 1, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderRadius: 14, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt, gap: 4 },
  evoName: { fontFamily: fonts.semibold, fontSize: 12, color: t.colors.text.primary, textAlign: 'center', minHeight: 30 },
  evoLv: { fontFamily: fonts.display, fontSize: 10.5, letterSpacing: 0.8, color: t.colors.text.tertiary, textTransform: 'uppercase' },
  evoHint: { fontFamily: fonts.body, fontSize: 12.5, color: t.colors.text.tertiary, marginBottom: 6 },
  evoNext: { fontFamily: fonts.body, fontSize: 13, color: t.colors.text.secondary, marginTop: 12 },
  famRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  famChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 30, borderRadius: 15, borderWidth: 1, borderColor: t.colors.border },
  famText: { fontFamily: fonts.semibold, fontSize: 12, color: t.colors.text.secondary },
  hero: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surface, ...t.shadow.md },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 22, padding: 24, minHeight: 230 },
  heroBodyNarrow: { flexDirection: 'column', gap: 12, minHeight: 340, justifyContent: 'center' },
  heroBodyWide: { paddingRight: '40%' },
  // Must live in the stylesheet: RNW only polyfills 'box-none' for compiled styles.
  boxNone: { pointerEvents: 'box-none' },
  noTouch: { pointerEvents: 'none' },
  heroChar: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  heroClass: { fontFamily: fonts.semibold, fontSize: 12.5, color: t.colors.text.secondary, marginTop: 4 },
  heroText: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
  heroLv: {
    fontFamily: fonts.display,
    fontSize: 64,
    lineHeight: 70,
    color: t.colors.text.primary,
    letterSpacing: -1.5,
    marginTop: 6,
    transform: [{ skewX: SLANT }],
    ...hardTextShadow(t.colors.highlight, 4),
  },
  heroTitle: { fontFamily: fonts.display, fontSize: 20, letterSpacing: 4, color: t.colors.accentText, textTransform: 'uppercase', transform: [{ skewX: '-8deg' }] },
  heroXp: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.text.primary, marginTop: 8 },
  heroNext: { fontFamily: fonts.medium, fontSize: 12.5, color: t.colors.text.secondary, marginTop: 3 },

  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: t.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: t.colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  tileValue: { fontFamily: fonts.display, fontSize: 24, color: t.colors.text.primary, transform: [{ skewX: '-6deg' }] },
  tileLabel: { fontFamily: fonts.semibold, fontSize: 11.5, color: t.colors.text.tertiary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },

  inlineCta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: t.colors.highlightSoft },
  inlineCtaText: { flex: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: t.colors.highlightText },

  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  flame: { width: 64, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: SLANT }] },
  streakNum: { fontFamily: fonts.display, fontSize: 34, color: t.colors.text.primary, transform: [{ skewX: '-6deg' }] },
  streakUnit: { fontFamily: fonts.display, fontSize: 16, color: t.colors.text.secondary },
  streakStatus: { fontFamily: fonts.medium, fontSize: 13, color: t.colors.text.secondary, marginTop: 2 },
  freezeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.colors.border },
  freezeText: { flex: 1, fontFamily: fonts.medium, fontSize: 12.5, lineHeight: 18, color: t.colors.text.secondary },
  proInline: { fontFamily: fonts.display, color: t.colors.goldText },

  skillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skillCell: { flexGrow: 1, flexBasis: 220 },
  skill: { borderRadius: 14, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt, padding: 14, overflow: 'hidden' },
  skillTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skillName: { fontFamily: fonts.display, fontSize: 14, letterSpacing: 1.2, textTransform: 'uppercase' },
  skillLv: { fontFamily: fonts.display, fontSize: 20, color: t.colors.text.primary, transform: [{ skewX: '-6deg' }] },
  skillInput: { fontFamily: fonts.semibold, fontSize: 14, color: t.colors.text.primary, borderWidth: 1, borderColor: t.colors.borderStrong, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: t.colors.surface },
  skillMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  skillMetaText: { fontFamily: fonts.medium, fontSize: 11.5, color: t.colors.text.tertiary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, alignSelf: 'flex-start' },
  addSkill: { marginTop: 14, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: t.colors.accentSoftBorder, backgroundColor: t.colors.accentSoft, gap: 12 },
  addTitle: { fontFamily: fonts.display, fontSize: 12, letterSpacing: 1.3, color: t.colors.text.primary, textTransform: 'uppercase' },
  pickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatchPick: { width: 26, height: 26, borderRadius: 6, transform: [{ rotate: '45deg' }], borderWidth: 2, borderColor: 'transparent' },
  iconPick: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: t.colors.border, backgroundColor: t.colors.surface },
  pickActive: { borderColor: t.colors.text.primary, borderWidth: 2 },
  addActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  ghostBtn: { height: 38, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.text.secondary },
  solidBtn: { height: 38, paddingHorizontal: 18, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.accent, transform: [{ skewX: SLANT }] },
  solidBtnText: { fontFamily: fonts.display, fontSize: 12.5, letterSpacing: 1, color: t.colors.text.onAccent, textTransform: 'uppercase', transform: [{ skewX: UNSLANT }] },

  sandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sand: { width: 86, alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt },
  sandLabel: { fontFamily: fonts.semibold, fontSize: 12, color: t.colors.text.secondary },
  sandLock: { position: 'absolute', top: 6, right: 6, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4, backgroundColor: t.colors.surface },
  sandLockText: { fontFamily: fonts.display, fontSize: 9, color: t.colors.text.secondary },
}));
