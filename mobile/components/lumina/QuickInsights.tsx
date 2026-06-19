import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { LuminaCard } from './LuminaCard';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaSpacing, LuminaTypography } from '@/theme/lumina';

type Insight = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint?: 'primary' | 'secondary' | 'accent' | 'warning';
};

export function QuickInsights({ items }: { items: Insight[] }) {
  const { colors } = useLuminaTheme();

  const tintMap = {
    primary: { bg: colors.primarySoft, fg: colors.primary },
    secondary: { bg: colors.secondarySoft, fg: colors.secondary },
    accent: { bg: colors.accentSoft, fg: colors.accent },
    warning: { bg: colors.warningSoft, fg: colors.warningText },
  };

  return (
    <View style={styles.row}>
      {items.map((item) => {
        const tint = tintMap[item.tint ?? 'primary'];
        return (
          <LuminaCard key={item.label} style={styles.card} padded="sm">
            <View style={[styles.icon, { backgroundColor: tint.bg }]}>
              <Ionicons name={item.icon} size={18} color={tint.fg} />
            </View>
            <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
              {item.value}
            </Text>
            <Text style={[styles.label, { color: colors.textMuted }]} numberOfLines={2}>
              {item.label}
            </Text>
          </LuminaCard>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: LuminaSpacing.sm, marginBottom: LuminaSpacing.lg },
  card: { flex: 1, minWidth: 0 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: LuminaSpacing.sm },
  value: { ...LuminaTypography.h3, fontSize: 15 },
  label: { ...LuminaTypography.bodySmall, fontSize: 12, marginTop: 2 },
});
