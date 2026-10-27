import { A, H1, H2, P } from '@expo/html-elements';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SITE_URL } from '../../constants/appConfig';
import { LEGAL_DOCS } from '../../content/legal';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/typography';
import { FlowglassMark } from '../art/FlowglassMark';
import { SandScene } from '../art/SandScene';
import { MiniTimer } from './MiniTimer';

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
  children: React.ReactNode; // article body (ArticleH2 + ArticleP)
  related: RelatedLink[];
  jsonLd: object;
}

export const SeoArticle: React.FC<SeoArticleProps> = ({ path, title, description, h1, intro, timerMinutes = 25, children, related, jsonLd }) => {
  const t = useTheme();
  const styles = useStyles();
  const url = `${SITE_URL}${path}`;
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
          <Link href="/" style={styles.brandLink} accessibilityLabel="Flowglass home">
            <View style={styles.brandRow}>
              <FlowglassMark size={32} />
              <Text style={styles.brand}>Flowglass</Text>
            </View>
          </Link>
          <Link href="/" style={styles.openApp}>
            <Text style={styles.openAppText}>Open the app →</Text>
          </Link>
        </View>

        <SandScene height={150} style={styles.heroArt} label="Illustration: an hourglass on sand dunes under the sky" />

        <View style={styles.hero}>
          <H1 style={styles.h1}>{h1}</H1>
          <P style={styles.intro}>{intro}</P>
        </View>

        {/* Live, embedded, working timer */}
        <View style={styles.timerCard}>
          <MiniTimer minutes={timerMinutes} />
          <Text style={styles.timerNote}>A real Flowglass timer — press start and focus right here. Open the app to earn XP and level up.</Text>
        </View>

        <View style={styles.article}>{children}</View>

        {/* Internal links */}
        <View style={styles.related}>
          <H2 style={styles.relatedTitle}>Keep exploring</H2>
          <View style={styles.relatedGrid}>
            {related.map((r) => (
              <Link key={r.href} href={r.href as never} style={styles.relatedLink}>
                <Text style={styles.relatedLinkText}>{r.label}</Text>
                <Ionicons name="arrow-forward" size={15} color={t.colors.accentText} />
              </Link>
            ))}
          </View>
        </View>

        <View style={styles.footer} role="contentinfo">
          <A href={SITE_URL} style={styles.footerLink}>
            flowglass.app
          </A>
          <Text style={styles.footerText}>Free focus & Pomodoro timer · no ads · no tracking cookies</Text>
          <View style={styles.legalRow}>
            {LEGAL_DOCS.map((d) => (
              <Link key={d.path} href={d.path} style={styles.legalLink}>
                {d.title}
              </Link>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
};

/** Article heading / paragraph with the themed article typography. */
export const ArticleH2: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const styles = useStyles();
  return <H2 style={styles.h2}>{children}</H2>;
};

export const ArticleP: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const styles = useStyles();
  return <P style={styles.p}>{children}</P>;
};

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 80, alignItems: 'center' },
  topbar: { width: '100%', maxWidth: 760, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18 },
  brandLink: { textDecorationLine: 'none' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brand: { fontFamily: fonts.display, fontSize: 17, letterSpacing: 1.4, color: t.colors.text.primary, textTransform: 'uppercase' },
  openApp: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.colors.accentSoft, textDecorationLine: 'none' },
  openAppText: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.accentText },
  heroArt: { maxWidth: 760, borderRadius: 22, borderWidth: 1, borderColor: t.colors.border },
  hero: { width: '100%', maxWidth: 760, marginTop: 22 },
  h1: { fontFamily: fonts.display, fontSize: 38, lineHeight: 44, color: t.colors.text.primary, letterSpacing: -0.5, marginBottom: 12, marginTop: 0 },
  intro: { fontFamily: fonts.body, fontSize: 18, lineHeight: 28, color: t.colors.text.secondary, marginBottom: 4 },
  timerCard: {
    width: '100%',
    maxWidth: 760,
    marginTop: 22,
    paddingVertical: 26,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    alignItems: 'center',
    ...t.shadow.md,
  },
  timerNote: { fontFamily: fonts.body, fontSize: 13, color: t.colors.text.tertiary, marginTop: 14, textAlign: 'center' },
  article: { width: '100%', maxWidth: 760, marginTop: 10 },
  h2: { fontFamily: fonts.headingBold, fontSize: 22, color: t.colors.text.primary, marginTop: 26, marginBottom: 8, letterSpacing: -0.4 },
  p: { fontFamily: fonts.body, fontSize: 16, lineHeight: 26, color: t.colors.text.secondary, marginBottom: 14, marginTop: 0 },
  related: { width: '100%', maxWidth: 760, marginTop: 30 },
  relatedTitle: { fontFamily: fonts.headingBold, fontSize: 20, color: t.colors.text.primary, marginBottom: 12, letterSpacing: -0.3 },
  relatedGrid: { gap: 10 },
  relatedLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.border,
    textDecorationLine: 'none',
  },
  relatedLinkText: { fontFamily: fonts.semibold, fontSize: 15, color: t.colors.text.primary },
  footer: { width: '100%', maxWidth: 760, marginTop: 40, alignItems: 'center', gap: 6 },
  footerLink: { fontFamily: fonts.semibold, fontSize: 14, color: t.colors.accentText, textDecorationLine: 'none' },
  footerText: { fontFamily: fonts.body, fontSize: 12, color: t.colors.text.tertiary },
  legalRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4, marginTop: 6 },
  legalLink: { fontFamily: fonts.medium, fontSize: 12, color: t.colors.text.secondary, paddingHorizontal: 6, paddingVertical: 4, textDecorationLine: 'underline' },
}));
