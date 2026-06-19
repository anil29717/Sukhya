import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/lumina/AppHeader';
import { LuminaColors, LuminaSpacing, LuminaTypography } from '@/theme/lumina';

type PlaceholderScreenProps = {
  title: string;
  subtitle: string;
};

export function PlaceholderScreen({ title, subtitle }: PlaceholderScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 80 }]}>
      <View style={styles.content}>
        <AppHeader />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: LuminaColors.background },
  content: { flex: 1, paddingHorizontal: LuminaSpacing.lg },
  title: { ...LuminaTypography.h1, color: LuminaColors.text, marginBottom: LuminaSpacing.sm },
  subtitle: { ...LuminaTypography.body, color: LuminaColors.textSecondary },
});
