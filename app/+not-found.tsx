import { makeStyles, useTheme } from '@/src/theme/ThemeProvider';
import { fonts, SLANT } from '@/src/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  const t = useTheme();
  const styles = useStyles();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <View style={styles.icon}>
          <Ionicons name="compass-outline" size={28} color={t.colors.accentText} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Nothing here
        </Text>
        <Text style={styles.subtitle}>That screen doesn’t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Back to timer</Text>
        </Link>
      </View>
    </>
  );
}

const useStyles = makeStyles((t) => ({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: t.colors.bg },
  icon: { width: 60, height: 60, borderRadius: 16, backgroundColor: t.colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16, transform: [{ skewX: SLANT }] },
  title: { fontFamily: fonts.display, fontSize: 24, color: t.colors.text.primary, letterSpacing: 1, textTransform: 'uppercase' },
  subtitle: { fontFamily: fonts.body, color: t.colors.text.tertiary, fontSize: 14, marginTop: 6 },
  link: { marginTop: 18, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: t.colors.accent },
  linkText: { fontFamily: fonts.semibold, fontSize: 14, color: t.colors.text.onAccent },
}));
