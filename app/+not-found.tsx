import { colors } from '@/src/theme/colors';
import { fonts } from '@/src/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <View style={styles.icon}>
          <Ionicons name="compass-outline" size={28} color={colors.accent} />
        </View>
        <Text style={styles.title}>Nothing here</Text>
        <Text style={styles.subtitle}>That screen doesn’t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Back to timer</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  icon: { width: 60, height: 60, borderRadius: 18, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontFamily: fonts.headingBold, fontSize: 22, color: colors.text.primary },
  subtitle: { fontFamily: fonts.body, color: colors.text.tertiary, fontSize: 14, marginTop: 6 },
  link: { marginTop: 18, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.accent },
  linkText: { fontFamily: fonts.semibold, fontSize: 14, color: '#fff' },
});
