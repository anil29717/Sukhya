import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaTypography } from '@/theme/lumina';

export default function NotFoundScreen() {
  const { colors } = useLuminaTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text, ...LuminaTypography.h2 }]}>
          This screen doesn't exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.teal }]}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
  },
  link: {
    marginTop: 16,
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 15,
  },
});
