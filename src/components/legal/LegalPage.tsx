import { A, H1, H3, P } from '@expo/html-elements';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SITE_URL } from '../../constants/appConfig';
import { LEGAL_ENTITY } from '../../constants/legal';
import { LEGAL_DOCS, type LegalDoc } from '../../content/legal';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { fonts, SLANT, UNSLANT } from '../../theme/typography';
import { SectionHeader } from '../game/SectionHeader';

/** Shared layout for the privacy / terms / refunds / cookies / legal pages. */
export const LegalPage: React.FC<{ doc: LegalDoc }> = ({ doc }) => {
  const t = useTheme();
  const styles = useStyles();
  const url = `${SITE_URL}${doc.path}`;
  return (
    <>
      <Head>
        <title>{`${doc.title} — Flowglass`}</title>
        <meta name="description" content={doc.description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={url} />
      </Head>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <View style={styles.topbar}>
          <Link href="/" style={styles.brandLink} accessibilityLabel="Flowglass home">
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <View style={{ transform: [{ skewX: UNSLANT }] }}>
                  <Ionicons name="hourglass" size={15} color={t.colors.text.onAccent} />
                </View>
              </View>
              <Text style={styles.brand}>Flowglass</Text>
            </View>
          </Link>
          <Link href="/" style={styles.openApp}>
            <Text style={styles.openAppText}>Open the app →</Text>
          </Link>
        </View>

        <View style={styles.page}>
          <H1 style={styles.h1}>{doc.title}</H1>
          <Text style={styles.updated}>Last updated {LEGAL_ENTITY.lastUpdated}</Text>
          <P style={styles.intro}>{doc.intro}</P>

          {doc.sections.map((s) => (
            <View key={s.title} style={styles.section}>
              <SectionHeader title={s.title} style={{ marginBottom: 8 }} />
              {s.blocks.map((b, i) =>
                'p' in b ? (
                  <P key={i} style={styles.p}>
                    {b.p}
                  </P>
                ) : 'h3' in b ? (
                  <H3 key={i} style={styles.h3}>
                    {b.h3}
                  </H3>
                ) : (
                  <View key={i} style={styles.list} role="list">
                    {b.list.map((item) => (
                      <View key={item} style={styles.li} role="listitem">
                        <View style={styles.bullet} />
                        <Text style={styles.liText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )
              )}
            </View>
          ))}

          <View style={styles.contact}>
            <Ionicons name="mail-outline" size={16} color={t.colors.accentText} />
            <Text style={styles.contactText}>
              Questions? <A href={`mailto:${LEGAL_ENTITY.email}`} style={styles.mail}>{LEGAL_ENTITY.email}</A>
            </Text>
          </View>
        </View>

        <View style={styles.footer} role="navigation" aria-label="Legal pages">
          {LEGAL_DOCS.map((d) => (
            <Link key={d.path} href={d.path} style={[styles.footerLink, d.path === doc.path && styles.footerLinkActive]}>
              {d.title}
            </Link>
          ))}
        </View>
        <Text style={styles.disclaimer}>Plain-language summary of how Flowglass works. It is not legal advice.</Text>
      </ScrollView>
    </>
  );
};

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 80, alignItems: 'center' },
  topbar: { width: '100%', maxWidth: 760, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18 },
  brandLink: { textDecorationLine: 'none' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 30, height: 30, borderRadius: 8, backgroundColor: t.colors.accent, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: SLANT }] },
  brand: { fontFamily: fonts.display, fontSize: 17, letterSpacing: 1.4, color: t.colors.text.primary, textTransform: 'uppercase' },
  openApp: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.colors.accentSoft, textDecorationLine: 'none' },
  openAppText: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.accentText },
  page: {
    width: '100%',
    maxWidth: 760,
    backgroundColor: t.colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: 24,
    marginTop: 6,
  },
  h1: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, color: t.colors.text.primary, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 0, marginBottom: 6 },
  updated: { fontFamily: fonts.medium, fontSize: 13, color: t.colors.text.tertiary },
  intro: { fontFamily: fonts.body, fontSize: 16, lineHeight: 25, color: t.colors.text.secondary, marginTop: 14, marginBottom: 6 },
  section: { marginTop: 20 },
  h3: { fontFamily: fonts.semibold, fontSize: 15, color: t.colors.text.primary, marginTop: 8, marginBottom: 4 },
  p: { fontFamily: fonts.body, fontSize: 15, lineHeight: 24, color: t.colors.text.secondary, marginTop: 0, marginBottom: 10 },
  list: { gap: 8, marginBottom: 10 },
  li: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { width: 8, height: 8, marginTop: 8, backgroundColor: t.colors.accent, transform: [{ rotate: '45deg' }] },
  liText: { flex: 1, fontFamily: fonts.body, fontSize: 15, lineHeight: 24, color: t.colors.text.secondary },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: t.colors.border },
  contactText: { fontFamily: fonts.medium, fontSize: 14, color: t.colors.text.secondary },
  mail: { fontFamily: fonts.semibold, color: t.colors.accentText },
  footer: { width: '100%', maxWidth: 760, flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22, justifyContent: 'center' },
  footerLink: { fontFamily: fonts.semibold, fontSize: 13, color: t.colors.accentText, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, textDecorationLine: 'none' },
  footerLinkActive: { backgroundColor: t.colors.accentSoft },
  disclaimer: { fontFamily: fonts.body, fontSize: 12, color: t.colors.text.tertiary, marginTop: 10, textAlign: 'center' },
}));
