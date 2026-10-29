import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { PRO } from '../../constants/appConfig';
import { sandThemeByKey } from '../../constants/focus';
import { RPG_CONFIG } from '../../lib/rpg';
import { trackEvent } from '../../lib/analytics';
import { getProPriceLabel, paymentsEnabled, purchasePro, restorePurchases } from '../../lib/purchases';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUiStore } from '../../stores/uiStore';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts, SLANT, UNSLANT } from '../../theme/typography';
import { SandScene } from '../art/SandScene';
import { SkewTag } from '../game/SkewTag';

const PERKS: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; body: string; soon?: boolean }[] = [
  { icon: 'musical-notes', title: 'More soundscapes', body: 'Waves, night, café, fireplace and two lo-fi tracks (brown noise and rain stay free)' },
  { icon: 'people', title: 'More creatures', body: 'New creature families for your custom skills', soon: true },
  { icon: 'analytics', title: 'Insights', body: 'Focus heatmap, your best hours and weekly reports', soon: true },
  { icon: 'stats-chart', title: 'Full stats history', body: `Month and year views (free shows the last ${RPG_CONFIG.freeStatsDays} days)` },
  { icon: 'trophy', title: 'Weekly quests & streak freeze', body: `+${RPG_CONFIG.quests.weeklyReward} XP quests every week, and a freeze for a missed day` },
  { icon: 'color-palette', title: 'Custom skills & every sand', body: 'Rename and add your own skills, unlock all hourglass themes' },
];

/**
 * Pro prompt. Native with payments on → real checkout (RevenueCat, entitlement `pro`).
 * Otherwise → the "Pro · coming soon" sheet, which only records
 * anonymous interest (`pro_interest_clicked`). No payment is ever taken here.
 */
export const ProSheet: React.FC = () => {
  const source = useUiStore((s) => s.proSheet);
  const close = useUiStore((s) => s.closePro);
  return (
    <Modal visible={!!source} transparent animationType="fade" onRequestClose={close}>
      {source ? <ProSheetBody source={source} onClose={close} /> : null}
    </Modal>
  );
};

const ProSheetBody: React.FC<{ source: string; onClose: () => void }> = ({ source, onClose }) => {
  const t = useTheme();
  const styles = useStyles();
  const isPro = useSettingsStore((s) => s.isPro);
  const sandKey = useSettingsStore((s) => s.sandTheme);
  const canBuy = paymentsEnabled();
  const [price, setPrice] = useState<string>(PRO.priceLabel);
  const [state, setState] = useState<'idle' | 'busy' | 'interested' | 'error'>('idle');

  useEffect(() => {
    getProPriceLabel().then(setPrice).catch(() => {});
  }, []);

  const interested = () => {
    trackEvent('pro_interest_clicked', { source });
    setState('interested');
  };

  const buy = async () => {
    setState('busy');
    const r = await purchasePro();
    if (r === 'purchased') onClose();
    else setState(r === 'cancelled' ? 'idle' : 'error');
  };

  return (
    <View style={styles.backdrop}>
      <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.sheet} role="dialog" aria-modal aria-label="Flowglass Pro">
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          <View>
            <SandScene height={130} sand={sandThemeByKey(sandKey).colors} label="Illustration: an hourglass on the dunes" />
            <View style={styles.heroTag}>
              <SkewTag label={canBuy || isPro ? 'Flowglass Pro' : 'Pro · Coming soon'} size="lg" color={t.colors.highlight} shadowColor={t.colors.accent} />
            </View>
            <Pressable onPress={onClose} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.body}>
            {isPro ? (
              <Text style={styles.lead}>Pro is unlocked on this device. Thanks for supporting Flowglass!</Text>
            ) : canBuy ? (
              <Text style={styles.lead}>{PRO.priceLabel} a month, cancel anytime. All timers, XP, levels, skills, streaks and the daily quest stay free.</Text>
            ) : (
              <Text style={styles.lead}>
                Coming soon — Pro isn’t for sale yet. Everything below is planned as a small monthly subscription you can cancel anytime; all
                timers, XP, levels, skills, streaks and the daily quest stay free.
              </Text>
            )}

            <View style={styles.perks}>
              {PERKS.map((p) => (
                <View key={p.title} style={styles.perk}>
                  <View style={styles.perkIcon}>
                    <Ionicons name={p.icon} size={16} color={t.colors.accentText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.perkTitle}>
                      {p.title}
                      {p.soon ? <Text style={styles.soon}>  SOON</Text> : null}
                    </Text>
                    <Text style={styles.perkBody}>{p.body}</Text>
                  </View>
                </View>
              ))}
            </View>

            {!isPro && (
              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  {price}
                  <Text style={styles.pricePer}> / {PRO.period}</Text>
                </Text>
                <Text style={styles.priceNote}>{canBuy ? 'renews monthly · cancel anytime' : 'planned price · cancel anytime'}</Text>
              </View>
            )}

            {isPro ? (
              <Pressable onPress={onClose} style={styles.primary} accessibilityRole="button">
                <Text style={styles.primaryText}>Done</Text>
              </Pressable>
            ) : canBuy ? (
              <>
                <Pressable onPress={buy} disabled={state === 'busy'} style={styles.primary} accessibilityRole="button" accessibilityLabel={`Subscribe to Pro for ${price} a ${PRO.period}`}>
                  {state === 'busy' ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Get Pro · {price}/mo</Text>}
                </Pressable>
                {state === 'error' && <Text style={styles.error}>The purchase didn’t go through. You haven’t been charged.</Text>}
                <Text style={styles.terms}>
                  Renews every {PRO.period} at {price} until you cancel. Cancel anytime in your {Platform.OS === 'ios' ? 'App Store' : 'Google Play'} subscriptions, at least 24 hours before renewal.
                </Text>
                <Pressable onPress={() => restorePurchases()} style={styles.secondary} accessibilityRole="button">
                  <Text style={styles.secondaryText}>Restore purchase</Text>
                </Pressable>
              </>
            ) : state === 'interested' ? (
              <View style={styles.thanks} role="status">
                <Ionicons name="checkmark-circle" size={20} color={t.colors.successText} />
                <Text style={styles.thanksText}>Thanks — your interest was counted anonymously. Nothing was charged and no details were collected.</Text>
              </View>
            ) : (
              <Pressable onPress={interested} style={styles.primary} accessibilityRole="button" accessibilityHint="Records anonymous interest. No payment is taken.">
                <Text style={styles.primaryText}>I’m interested</Text>
              </Pressable>
            )}

            {!isPro && (
              <Pressable onPress={onClose} style={styles.secondary} accessibilityRole="button">
                <Text style={styles.secondaryText}>Not now</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  backdrop: { flex: 1, backgroundColor: t.colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
  fill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  sheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    backgroundColor: t.colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
    overflow: 'hidden',
    ...t.shadow.lg,
  },
  heroTag: { position: 'absolute', left: 18, bottom: 14 },
  close: { position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.45)' },
  body: { padding: 20, paddingTop: 16 },
  lead: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, color: t.colors.text.secondary },
  perks: { gap: 12, marginTop: 16 },
  perk: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  perkIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: SLANT }] },
  soon: { fontFamily: fonts.display, fontSize: 10, letterSpacing: 1, color: t.colors.highlightText },
  perkTitle: { fontFamily: fonts.semibold, fontSize: 14, color: t.colors.text.primary },
  perkBody: { fontFamily: fonts.body, fontSize: 12.5, color: t.colors.text.tertiary, marginTop: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 20 },
  price: { fontFamily: fonts.display, fontSize: 28, color: t.colors.text.primary, letterSpacing: -0.5 },
  pricePer: { fontFamily: fonts.semibold, fontSize: 15, color: t.colors.text.tertiary, letterSpacing: 0 },
  terms: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 16, color: t.colors.text.tertiary, textAlign: 'center', marginTop: 10 },
  priceNote: { fontFamily: fonts.medium, fontSize: 12.5, color: t.colors.text.tertiary },
  primary: { marginTop: 14, height: 52, borderRadius: 12, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: SLANT }] },
  primaryText: { fontFamily: fonts.display, fontSize: 15, letterSpacing: 1.4, color: t.colors.text.onAccent, textTransform: 'uppercase', transform: [{ skewX: UNSLANT }] },
  secondary: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 14, color: t.colors.accentText },
  thanks: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: t.colors.successSoft },
  thanksText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: t.colors.successText },
  error: { fontFamily: fonts.medium, fontSize: 12.5, color: t.colors.dangerText, marginTop: 8, textAlign: 'center' },
}));
