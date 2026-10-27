import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { APP_VERSION, FEATURES } from '../../constants/appConfig';
import { initAnalytics } from '../../lib/analytics';
import { deleteAccount, sendCode, signOut, syncNow, verifyCode } from '../../lib/cloud';
import { deleteAllData, exportData } from '../../lib/privacy';
import { cloudConfigured } from '../../lib/supabase';
import { RPG_CONFIG } from '../../lib/rpg';
import { useAccountStore } from '../../stores/accountStore';
import { useSettingsStore, type ThemeMode } from '../../stores/settingsStore';
import { useStatsStore } from '../../stores/statsStore';
import { useUiStore } from '../../stores/uiStore';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts, SLANT, tabular, UNSLANT } from '../../theme/typography';
import { FlowglassMark } from '../art/FlowglassMark';
import { Card } from '../Card';
import { SectionHeader } from '../game/SectionHeader';

const goalLabel = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const confirmAction = (title: string, message: string, cta: string, onYes: () => void) => {
  if (Platform.OS === 'web') {
    if (typeof confirm === 'function' && confirm(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: cta, style: 'destructive', onPress: onYes },
  ]);
};

const THEMES: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
];

const LEGAL: { href: Href; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { href: '/privacy', label: 'Privacy policy', icon: 'shield-checkmark-outline' },
  { href: '/terms', label: 'Terms of service', icon: 'document-text-outline' },
  { href: '/refunds', label: 'Refund policy', icon: 'card-outline' },
  { href: '/cookies', label: 'Cookie policy', icon: 'ellipse-outline' },
  { href: '/legal', label: 'Legal notice & credits', icon: 'information-circle-outline' },
];

const SHORTCUTS: [string, string][] = [
  ['Space', 'Start / pause'],
  ['R', 'Stop & restart the block'],
  ['S', 'Skip phase'],
  ['1 – 4', 'Timer · Character · Statistics · Settings'],
  ['Esc', 'Close dialogs and menus'],
];

export const SettingsView: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const settings = useSettingsStore();
  const sessionCount = useStatsStore((s) => s.sessions.length);
  const openPro = useUiStore((s) => s.openPro);
  const devSpeed = useUiStore((s) => s.devSpeed);
  const setDevSpeed = useUiStore((s) => s.setDevSpeed);
  const [deleted, setDeleted] = useState(false);
  const signedIn = useAccountStore((s) => s.status === 'signedIn');

  const analyticsOn = settings.analyticsConsent === 'granted' || (settings.analyticsConsent === 'unset' && !FEATURES.analyticsOptIn);

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <ScrollView contentContainerStyle={[styles.scroll, wide && styles.scrollWide]} showsVerticalScrollIndicator={false}>
        {wide && (
          <Text style={styles.h1} accessibilityRole="header">
            Settings
          </Text>
        )}

        <SectionHeader title="Appearance" style={styles.section} />
        <Card padding={16}>
          <Text style={styles.rowLabel}>Theme</Text>
          <View style={styles.segment} accessibilityRole="radiogroup" accessibilityLabel="Theme">
            {THEMES.map((m) => {
              const active = settings.themeMode === m.key;
              return (
                <Pressable
                  key={m.key}
                  onPress={() => settings.setThemeMode(m.key)}
                  style={[styles.segmentItem, active && styles.segmentItemActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={`${m.label} theme`}
                >
                  <View style={[styles.segmentInner, active && styles.unslant]}>
                    <Ionicons name={m.icon} size={15} color={active ? t.colors.text.onAccent : t.colors.text.secondary} />
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{m.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={[styles.row, styles.rowTop]}>
            <View style={styles.rowIcon}>
              <Ionicons name="pulse-outline" size={18} color={t.colors.accentText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Reduce motion</Text>
              <Text style={styles.rowDesc}>Skip the flip, sweeps and count-ups (your device setting is respected too)</Text>
            </View>
            <AppSwitch value={settings.reduceMotion} onChange={settings.toggleReduceMotion} label="Reduce motion" />
          </View>
        </Card>

        <SectionHeader title="Daily goal" style={styles.section} />
        <Card padding={18}>
          <View style={styles.goalRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.goalValue, tabular]}>{goalLabel(settings.dailyGoalMinutes)}</Text>
              <Text style={styles.rowDesc}>Target focus time per day</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable onPress={() => settings.setDailyGoal(settings.dailyGoalMinutes - 15)} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel="Decrease daily goal by 15 minutes">
                <Ionicons name="remove" size={18} color={t.colors.text.secondary} />
              </Pressable>
              <Pressable onPress={() => settings.setDailyGoal(settings.dailyGoalMinutes + 15)} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel="Increase daily goal by 15 minutes">
                <Ionicons name="add" size={18} color={t.colors.text.secondary} />
              </Pressable>
            </View>
          </View>
        </Card>

        <SectionHeader title="Preferences" style={styles.section} />
        <Card padding={0}>
          <Row icon="phone-portrait-outline" label="Haptics" desc="Vibrate on actions" value={settings.hapticsEnabled} onChange={settings.toggleHaptics} />
          <Row icon="volume-high-outline" label="Sounds" desc="Chime when a block ends, level-up and quest sounds (web)" value={settings.soundEnabled} onChange={settings.toggleSound} />
          <Row icon="sunny-outline" label="Keep screen on" desc="Prevent dimming during sessions" value={settings.keepScreenOn} onChange={settings.toggleKeepScreenOn} />
          <Row icon="play-forward-outline" label="Auto-start break" desc="Begin the break after focus ends" value={settings.autoStartBreak} onChange={settings.toggleAutoStartBreak} last />
        </Card>

        <SectionHeader title="Pro" style={styles.section} />
        <Card padding={18} accent={t.colors.highlight}>
          <View style={styles.proRow}>
            <View style={[styles.rowIcon, { backgroundColor: t.colors.highlightSoft }]}>
              <Ionicons name="sparkles" size={18} color={t.colors.highlightText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{settings.isPro ? 'Pro unlocked' : 'Founding Pro'}</Text>
              <Text style={styles.rowDesc}>
                {settings.isPro ? 'Soundscapes, full history, weekly quests, custom skills and every sand.' : 'Soundscapes, more characters, insights. $1.99 a month, coming soon.'}
              </Text>
            </View>
            <Pressable onPress={() => openPro('settings')} style={styles.smallBtn} accessibilityRole="button">
              <Text style={styles.smallBtnText}>{settings.isPro ? 'Details' : 'See Pro'}</Text>
            </Pressable>
          </View>
        </Card>

        {(cloudConfigured || __DEV__) && (
          <>
            <SectionHeader title="Account & sync" style={styles.section} />
            <AccountCard />
          </>
        )}

        <SectionHeader title="Privacy & data" style={styles.section} />
        <Card padding={0}>
          {Platform.OS === 'web' && (
            <Row
              icon="analytics-outline"
              label="Anonymous analytics"
              desc="Cookieless page views + 4 app events (Vercel Web Analytics). No personal data."
              value={analyticsOn}
              onChange={() => {
                const next = analyticsOn ? 'denied' : 'granted';
                settings.setAnalyticsConsent(next);
                if (next === 'granted') initAnalytics();
              }}
            />
          )}
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.rowIcon}>
              <Ionicons name="download-outline" size={18} color={t.colors.accentText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Export my data</Text>
              <Text style={styles.rowDesc}>
                {sessionCount} session{sessionCount === 1 ? '' : 's'} + settings as a JSON file
              </Text>
            </View>
            <Pressable onPress={() => exportData().catch(() => {})} style={styles.smallBtn} accessibilityRole="button" accessibilityLabel="Export my data as JSON">
              <Text style={styles.smallBtnText}>Export</Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: t.colors.dangerSoft }]}>
              <Ionicons name="trash-outline" size={18} color={t.colors.dangerText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Delete all my data</Text>
              <Text style={styles.rowDesc}>
                {deleted
                  ? 'Done — everything was erased.'
                  : signedIn
                    ? 'Sessions, XP, levels, skills and settings — on this device and in your account.'
                    : 'Sessions, XP, levels, skills and settings on this device.'}
              </Text>
            </View>
            <Pressable
              onPress={() =>
                confirmAction('Delete all data?', `This permanently erases your sessions, XP, levels, skills and settings${signedIn ? ' on this device and in your account' : ' on this device'}. It cannot be undone.`, 'Delete', () => {
                  deleteAllData().then(() => setDeleted(true));
                })
              }
              style={styles.dangerBtn}
              accessibilityRole="button"
              accessibilityLabel="Delete all my data"
            >
              <Text style={styles.dangerText}>Delete</Text>
            </Pressable>
          </View>
        </Card>
        <Text style={styles.footnote}>
          {signedIn
            ? 'Your data lives on this device and in your private account (stored with Supabase) so it syncs across devices. Export or delete it here anytime — nothing to request.'
            : 'Signed out, your focus data never leaves this device. Export or delete it here anytime — nothing to request.'}
        </Text>

        {Platform.OS === 'web' && (
          <>
            <SectionHeader title="Keyboard" style={styles.section} />
            <Card padding={16}>
              <View style={{ gap: 10 }}>
                {SHORTCUTS.map(([k, d]) => (
                  <View key={k} style={styles.kbdRow}>
                    <View style={styles.kbd}>
                      <Text style={styles.kbdText}>{k}</Text>
                    </View>
                    <Text style={styles.rowDesc}>{d}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}

        <SectionHeader title="Legal" style={styles.section} />
        <Card padding={0}>
          {LEGAL.map((l, i) => (
            <Pressable
              key={String(l.href)}
              onPress={() => router.push(l.href)}
              style={({ pressed }) => [styles.row, i < LEGAL.length - 1 && styles.rowBorder, pressed && { backgroundColor: t.colors.surfaceAlt }]}
              accessibilityRole="link"
            >
              <View style={styles.rowIcon}>
                <Ionicons name={l.icon} size={18} color={t.colors.accentText} />
              </View>
              <Text style={[styles.rowLabel, { flex: 1 }]}>{l.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={t.colors.text.tertiary} />
            </Pressable>
          ))}
        </Card>

        {__DEV__ && (
          <>
            <SectionHeader title="Developer" style={styles.section} />
            <Card padding={0}>
              <Row icon="flask-outline" label="Pro (local test)" desc="Dev builds only — flips the local Pro flag" value={settings.isPro} onChange={() => settings.setPro(!settings.isPro)} />
              <Row icon="speedometer-outline" label="Fast timers ×60" desc="1 real second = 1 timer minute (dev only)" value={devSpeed > 1} onChange={() => setDevSpeed(devSpeed > 1 ? 1 : 60)} />
              <PreviewLevelRow />
            </Card>
          </>
        )}

        <View style={styles.about}>
          <FlowglassMark size={56} label="Flowglass logo: the Timekeeper" />
          <Text style={styles.aboutName}>Flowglass</Text>
          <Text style={styles.aboutVer}>v{APP_VERSION} · flow + hourglass</Text>
          <Text style={styles.aboutCredits}>Inter typeface (SIL Open Font License 1.1) · Ionicons (MIT) · all illustrations, creatures and the Timekeeper logo are original</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const ago = (ms: number) => {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : new Date(ms).toLocaleDateString();
};

/** Optional account: sign in with an emailed code, then sessions + settings sync. */
const AccountCard: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const { status, email, sync, lastSyncedAt, error } = useAccountStore();
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000); // keep "synced x min ago" fresh
    return () => clearInterval(id);
  }, []);

  if (!cloudConfigured) {
    return (
      <Card padding={16}>
        <Text style={styles.rowLabel}>Cloud sync is off in this build</Text>
        <Text style={styles.rowDesc}>Dev note: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (see .env.example), then restart the dev server.</Text>
      </Card>
    );
  }

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true);
    setMsg(null);
    const err = await fn();
    setBusy(false);
    setMsg(err);
    return err;
  };
  const send = () => run(() => sendCode(input)).then((e) => !e && setStep('code'));
  const verify = () => run(() => verifyCode(input, code));

  if (status === 'loading' || status === 'off') {
    return (
      <Card padding={16}>
        <ActivityIndicator color={t.colors.accent} />
      </Card>
    );
  }

  if (status === 'signedIn') {
    const syncText = sync === 'syncing' ? 'Syncing…' : sync === 'error' ? (error ?? 'Sync failed') : lastSyncedAt ? `Synced ${ago(lastSyncedAt)}` : 'Waiting to sync';
    return (
      <Card padding={0}>
        <View style={[styles.row, styles.rowBorder]}>
          <View style={styles.rowIcon}>
            <Ionicons name="person-circle-outline" size={18} color={t.colors.accentText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {email ?? 'Signed in'}
            </Text>
            <Text style={[styles.rowDesc, sync === 'error' && { color: t.colors.dangerText }]} accessibilityLiveRegion="polite">
              {syncText}
            </Text>
          </View>
          <Pressable onPress={() => syncNow()} disabled={sync === 'syncing'} style={styles.smallBtn} accessibilityRole="button" accessibilityLabel="Sync now">
            <Ionicons name="sync" size={16} color={t.colors.accentText} />
          </Pressable>
          <Pressable onPress={() => signOut()} style={styles.smallBtn} accessibilityRole="button">
            <Text style={styles.smallBtnText}>Sign out</Text>
          </Pressable>
        </View>
        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: t.colors.dangerSoft }]}>
            <Ionicons name="person-remove-outline" size={18} color={t.colors.dangerText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Delete account</Text>
            <Text style={styles.rowDesc}>{msg ?? 'Removes the account and its cloud copy. This device keeps its data.'}</Text>
          </View>
          <Pressable
            onPress={() =>
              confirmAction('Delete your account?', 'Your account and everything synced to it are deleted for good. Data on this device stays until you delete it below.', 'Delete', () => {
                run(deleteAccount);
              })
            }
            style={styles.dangerBtn}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
          >
            <Text style={styles.dangerText}>Delete</Text>
          </Pressable>
        </View>
      </Card>
    );
  }

  return (
    <Card padding={16}>
      <View style={styles.proRow}>
        <View style={styles.rowIcon}>
          <Ionicons name="cloud-outline" size={18} color={t.colors.accentText} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>Back up & sync — optional</Text>
          <Text style={styles.rowDesc}>Keep your XP, sessions and settings safe and use them on every device. No password: we email you a code.</Text>
        </View>
      </View>
      {step === 'email' ? (
        <View style={styles.authRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="you@example.com"
            placeholderTextColor={t.colors.text.tertiary}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
            onSubmitEditing={send}
            style={styles.input}
            accessibilityLabel="Email address"
          />
          <Pressable onPress={send} disabled={busy} style={[styles.primaryBtn, busy && { opacity: 0.6 }]} accessibilityRole="button">
            <Text style={styles.primaryBtnText}>{busy ? 'Sending…' : 'Email me a code'}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text style={[styles.rowDesc, { marginTop: 14 }]}>Sent to {input.trim()}. Enter the code from the email, or tap its link on this device.</Text>
          <View style={styles.authRow}>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={t.colors.text.tertiary}
              keyboardType="number-pad"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              onSubmitEditing={verify}
              style={[styles.input, styles.codeInput]}
              accessibilityLabel="Code from the email"
            />
            <Pressable onPress={verify} disabled={busy} style={[styles.primaryBtn, busy && { opacity: 0.6 }]} accessibilityRole="button">
              <Text style={styles.primaryBtnText}>{busy ? 'Checking…' : 'Sign in'}</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => {
              setStep('email');
              setCode('');
              setMsg(null);
            }}
            accessibilityRole="button"
            style={{ marginTop: 10, alignSelf: 'flex-start' }}
          >
            <Text style={styles.linkText}>Use a different email</Text>
          </Pressable>
        </>
      )}
      {msg && (
        <Text style={[styles.rowDesc, { color: t.colors.dangerText, marginTop: 10 }]} accessibilityLiveRegion="polite">
          {msg}
        </Text>
      )}
      <Text style={[styles.rowDesc, { marginTop: 12 }]}>By signing in you agree to the Terms and Privacy policy. Your email is used only to sign you in.</Text>
    </Card>
  );
};

/** Dev only: preview every creature stage without logging fake sessions (not saved, not synced). */
const PreviewLevelRow: React.FC = () => {
  const t = useTheme();
  const styles = useStyles();
  const level = useUiStore((s) => s.devPreviewLevel);
  const setLevel = useUiStore((s) => s.setDevPreviewLevel);
  const jumps = RPG_CONFIG.evolution.stageLevels;
  return (
    <View style={[styles.row, { flexWrap: 'wrap' }]}>
      <View style={styles.rowIcon}>
        <Ionicons name="sparkles-outline" size={18} color={t.colors.accentText} />
      </View>
      <View style={{ flex: 1, minWidth: 160 }}>
        <Text style={styles.rowLabel}>Preview level {level != null ? `· LV ${level}` : '· off'}</Text>
        <Text style={styles.rowDesc}>Shows creatures as if every skill were at this level. Your real XP is untouched.</Text>
      </View>
      <View style={styles.stepper}>
        <Pressable onPress={() => setLevel((level ?? 1) - 1)} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel="Preview one level lower">
          <Ionicons name="remove" size={18} color={t.colors.text.primary} />
        </Pressable>
        <Pressable onPress={() => setLevel((level ?? 0) + 1)} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel="Preview one level higher">
          <Ionicons name="add" size={18} color={t.colors.text.primary} />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, width: '100%', marginTop: 10 }}>
        {jumps.map((lv, i) => (
          <Pressable key={lv} onPress={() => setLevel(lv)} style={[styles.smallBtn, level === lv && { backgroundColor: t.colors.accentSoft }]} accessibilityRole="button">
            <Text style={styles.smallBtnText}>
              Stage {i + 1} · LV {lv}
            </Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setLevel(null)} style={styles.smallBtn} accessibilityRole="button">
          <Text style={styles.smallBtnText}>Real progress</Text>
        </Pressable>
      </View>
    </View>
  );
};

/** Themed switch (React Native Web needs `activeThumbColor` or it paints the thumb teal). */
const AppSwitch: React.FC<{ value: boolean; onChange: () => void; label: string }> = ({ value, onChange, label }) => {
  const t = useTheme();
  const webThumb = { activeThumbColor: '#FFFFFF' } as object;
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: t.colors.switchTrackOff, true: t.colors.accent }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={t.colors.switchTrackOff}
      accessibilityLabel={label}
      {...webThumb}
    />
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
}) => {
  const t = useTheme();
  const styles = useStyles();
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={t.colors.accentText} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <AppSwitch value={value} onChange={onChange} label={label} />
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  scroll: { padding: 20, paddingBottom: 120 },
  scrollWide: { paddingHorizontal: 40, paddingTop: 28, maxWidth: 760, width: '100%', alignSelf: 'center' },
  h1: { fontFamily: fonts.display, fontSize: 34, color: t.colors.text.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4, transform: [{ skewX: '-8deg' }] },
  section: { marginTop: 22, marginBottom: 10 },
  goalRow: { flexDirection: 'row', alignItems: 'center' },
  goalValue: { fontFamily: fonts.display, fontSize: 24, color: t.colors.text.primary, transform: [{ skewX: '-6deg' }] },
  rowDesc: { fontFamily: fonts.body, fontSize: 12.5, color: t.colors.text.tertiary, marginTop: 2 },
  stepper: { flexDirection: 'row', gap: 10 },
  stepBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowTop: { paddingHorizontal: 0, paddingBottom: 0, paddingTop: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: t.colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: fonts.semibold, fontSize: 14, color: t.colors.text.primary },
  segment: { flexDirection: 'row', backgroundColor: t.colors.surfaceAlt, borderRadius: 12, borderWidth: 1, borderColor: t.colors.border, padding: 4, gap: 4, marginTop: 10 },
  segmentItem: { flex: 1, height: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentItemActive: { backgroundColor: t.colors.accent, transform: [{ skewX: SLANT }] },
  segmentInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  segmentText: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.text.secondary },
  segmentTextActive: { color: t.colors.text.onAccent, fontFamily: fonts.display, letterSpacing: 0.8, textTransform: 'uppercase' },
  unslant: { transform: [{ skewX: UNSLANT }] },
  proRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  smallBtn: { paddingHorizontal: 14, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: t.colors.accentText },
  smallBtnText: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.accentText },
  dangerBtn: { paddingHorizontal: 14, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: t.colors.dangerBorder, backgroundColor: t.colors.dangerSoft },
  dangerText: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.dangerText },
  authRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  input: { flexGrow: 1, flexBasis: 200, height: 42, borderRadius: 10, borderWidth: 1, borderColor: t.colors.borderStrong, backgroundColor: t.colors.surfaceAlt, paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 14, color: t.colors.text.primary },
  codeInput: { fontFamily: fonts.display, letterSpacing: 4, fontSize: 16 },
  primaryBtn: { paddingHorizontal: 16, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.accent, transform: [{ skewX: SLANT }] },
  primaryBtnText: { fontFamily: fonts.display, fontSize: 12.5, letterSpacing: 0.8, textTransform: 'uppercase', color: t.colors.text.onAccent, transform: [{ skewX: UNSLANT }] },
  linkText: { fontFamily: fonts.semibold, fontSize: 12.5, color: t.colors.accentText, textDecorationLine: 'underline' },
  footnote: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: t.colors.text.tertiary, marginTop: 8, paddingHorizontal: 4 },
  kbdRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kbd: { minWidth: 58, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: t.colors.borderStrong, backgroundColor: t.colors.surfaceAlt, alignItems: 'center' },
  kbdText: { fontFamily: fonts.display, fontSize: 11, color: t.colors.text.primary, letterSpacing: 0.6 },
  about: { alignItems: 'center', marginTop: 36, gap: 6 },
  logo: { width: 40, height: 40, borderRadius: 11, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 4, transform: [{ skewX: SLANT }] },
  aboutName: { fontFamily: fonts.display, fontSize: 18, letterSpacing: 1.6, color: t.colors.text.primary, textTransform: 'uppercase' },
  aboutVer: { fontFamily: fonts.body, fontSize: 12, color: t.colors.text.tertiary },
  aboutCredits: { fontFamily: fonts.body, fontSize: 11.5, color: t.colors.text.tertiary, textAlign: 'center', maxWidth: 360, marginTop: 6, lineHeight: 17 },
}));
