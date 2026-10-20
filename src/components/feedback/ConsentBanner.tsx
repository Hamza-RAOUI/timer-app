import { Link } from 'expo-router';
import React from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { FEATURES } from '../../constants/appConfig';
import { initAnalytics } from '../../lib/analytics';
import { useSettingsStore } from '../../stores/settingsStore';
import { makeStyles } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/typography';

/**
 * Privacy notice for the cookieless analytics (web only). Two equal-weight
 * choices, no pre-ticked boxes; the choice can be changed later in Settings.
 */
export const ConsentBanner: React.FC = () => {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const hydrated = useSettingsStore((s) => s.hydrated);
  const consent = useSettingsStore((s) => s.analyticsConsent);
  const setConsent = useSettingsStore((s) => s.setAnalyticsConsent);
  if (Platform.OS !== 'web' || !hydrated || consent !== 'unset') return null;

  const wide = width >= 700;
  return (
    <View style={[styles.wrap, wide ? styles.wrapWide : styles.wrapNarrow]} role="region" aria-label="Privacy choices">
      <Text style={styles.title}>Your privacy</Text>
      <Text style={styles.body}>
        Your focus data stays on this device. To learn what’s useful, Flowglass uses cookieless, anonymous analytics (Vercel Web Analytics):
        page views and four app events — no cookies, no ads, no personal data.
        {FEATURES.analyticsOptIn ? ' Nothing is sent unless you allow it.' : ' You can turn it off now or anytime in Settings.'}
      </Text>
      <View style={styles.row}>
        <Pressable onPress={() => setConsent('denied')} style={styles.btn} accessibilityRole="button">
          <Text style={styles.btnText}>Decline</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setConsent('granted');
            initAnalytics();
          }}
          style={styles.btn}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>Accept</Text>
        </Pressable>
        <Link href="/cookies" style={styles.link}>
          Cookie policy
        </Link>
      </View>
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  wrap: {
    position: 'absolute',
    zIndex: 150,
    backgroundColor: t.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
    borderRadius: 16,
    padding: 16,
    ...t.shadow.lg,
  },
  wrapWide: { left: 20, bottom: 20, maxWidth: 460 },
  wrapNarrow: { left: 10, right: 10, bottom: 10 },
  title: { fontFamily: fonts.display, fontSize: 13, letterSpacing: 1.2, color: t.colors.text.primary, textTransform: 'uppercase' },
  body: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: t.colors.text.secondary, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' },
  btn: { minWidth: 104, height: 40, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: t.colors.accentText, backgroundColor: t.colors.surface },
  btnText: { fontFamily: fonts.semibold, fontSize: 14, color: t.colors.accentText },
  link: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.accentText, textDecorationLine: 'underline', marginLeft: 4 },
}));
