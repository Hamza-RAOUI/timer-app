import { A, H1, H2, P } from '@expo/html-elements';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, shadow } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { MiniTimer } from './MiniTimer';

const SITE = 'https://www.flowglass.app';

export interface RelatedLink {
  href: string;
  label: string;
}

interface SeoArticleProps {
  path: string; // e.g. "/pomodoro-timer"
  title: string; // <title>
  description: string;
  h1: string;
  intro: string;
  timerMinutes?: number;
  children: React.ReactNode; // article body (H2 + P from @expo/html-elements)
  related: RelatedLink[];
  jsonLd: object;
}

export const SeoArticle: React.FC<SeoArticleProps> = ({ path, title, description, h1, intro, timerMinutes = 25, children, related, jsonLd }) => {
  const url = `${SITE}${path}`;
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Head>

      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        {/* Top bar */}
        <View style={styles.topbar}>
          <Link href="/" style={styles.brandLink}>
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <Ionicons name="timer" size={16} color="#fff" />
              </View>
              <Text style={styles.brand}>Flowglass</Text>
            </View>
          </Link>
          <Link href="/" style={styles.openApp}>
            <Text style={styles.openAppText}>Open the app →</Text>
          </Link>
        </View>

        <View style={styles.hero}>
          <H1 style={styles.h1}>{h1}</H1>
          <P style={styles.intro}>{intro}</P>
        </View>

        {/* Live, embedded, working timer */}
        <View style={styles.timerCard}>
          <MiniTimer minutes={timerMinutes} />
          <Text style={styles.timerNote}>A real Flowglass timer — press start and focus right here.</Text>
        </View>

        <View style={styles.article}>{children}</View>

        {/* Internal links */}
        <View style={styles.related}>
          <H2 style={styles.relatedTitle}>Keep exploring</H2>
          <View style={styles.relatedGrid}>
            {related.map((r) => (
              <Link key={r.href} href={r.href as never} style={styles.relatedLink}>
                <Text style={styles.relatedLinkText}>{r.label}</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.accent} />
              </Link>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <A href={SITE} style={styles.footerLink}>flowglass.app</A>
          <Text style={styles.footerText}>Free focus & Pomodoro timer · Web · iOS · Android</Text>
        </View>
      </ScrollView>
    </>
  );
};

export const articleStyles = StyleSheet.create({
  h2: { fontFamily: fonts.headingBold, fontSize: 22, color: colors.text.primary, marginTop: 26, marginBottom: 8, letterSpacing: -0.4 },
  p: { fontFamily: fonts.body, fontSize: 16, lineHeight: 26, color: colors.text.secondary, marginBottom: 14 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 80, alignItems: 'center' },
  topbar: { width: '100%', maxWidth: 760, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18 },
  brandLink: { textDecorationLine: 'none' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: fonts.headingBold, fontSize: 18, color: colors.text.primary },
  openApp: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.accentSoft },
  openAppText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.accent },
  hero: { width: '100%', maxWidth: 760, marginTop: 14 },
  h1: { fontFamily: fonts.headingBold, fontSize: 38, lineHeight: 44, color: colors.text.primary, letterSpacing: -1, marginBottom: 12 },
  intro: { fontFamily: fonts.body, fontSize: 18, lineHeight: 28, color: colors.text.secondary, marginBottom: 4 },
  timerCard: {
    width: '100%',
    maxWidth: 760,
    marginTop: 22,
    paddingVertical: 26,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadow.md,
  },
  timerNote: { fontFamily: fonts.body, fontSize: 13, color: colors.text.tertiary, marginTop: 14 },
  article: { width: '100%', maxWidth: 760, marginTop: 10 },
  related: { width: '100%', maxWidth: 760, marginTop: 30 },
  relatedTitle: { fontFamily: fonts.headingBold, fontSize: 20, color: colors.text.primary, marginBottom: 12, letterSpacing: -0.3 },
  relatedGrid: { gap: 10 },
  relatedLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    textDecorationLine: 'none',
  },
  relatedLinkText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text.primary },
  footer: { width: '100%', maxWidth: 760, marginTop: 40, alignItems: 'center', gap: 6 },
  footerLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent, textDecorationLine: 'none' },
  footerText: { fontFamily: fonts.body, fontSize: 12, color: colors.text.tertiary },
});
