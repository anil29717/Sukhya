import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listVitals } from '@/api/medications';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { VITAL_TYPES, getVitalTypeConfig } from '@/utils/vitalTypes';
import { triggerHaptic } from '@/utils/haptics';

function VitalSummaryCard({
  type,
  value,
  unit,
  colors,
}: {
  type: string;
  value: string;
  unit?: string | null;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  const config = getVitalTypeConfig(type);

  return (
    <View style={[summaryStyles.card, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
      <View style={[summaryStyles.iconWrap, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={18} color={config.color} />
      </View>
      <Text style={[summaryStyles.label, { color: colors.textMuted }]} numberOfLines={1}>
        {config.shortLabel}
      </Text>
      <Text style={[summaryStyles.value, { color: colors.text }]}>
        {value}
        {unit ? <Text style={[summaryStyles.unit, { color: colors.textSecondary }]}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    width: '47%',
    flexGrow: 1,
    padding: LuminaSpacing.md,
    borderRadius: LuminaRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    gap: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  value: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 22, letterSpacing: -0.5 },
  unit: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13 },
});

function VitalHistoryRow({
  type,
  value,
  unit,
  date,
  colors,
}: {
  type: string;
  value: string;
  unit?: string | null;
  date: string;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  const config = getVitalTypeConfig(type);

  return (
    <View style={[rowStyles.wrap, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
      <View style={[rowStyles.accent, { backgroundColor: config.color }]} />
      <View style={[rowStyles.iconWrap, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={18} color={config.color} />
      </View>
      <View style={rowStyles.body}>
        <Text style={[rowStyles.label, { color: colors.text }]}>{config.label}</Text>
        <Text style={[rowStyles.date, { color: colors.textMuted }]}>{date}</Text>
      </View>
      <Text style={[rowStyles.value, { color: colors.text }]}>
        {value}
        {unit ? <Text style={[rowStyles.unit, { color: colors.textSecondary }]}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingRight: 14,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    overflow: 'hidden',
  },
  accent: { width: 3, alignSelf: 'stretch' },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    flexShrink: 0,
  },
  body: { flex: 1, gap: 2 },
  label: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
  date: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 11 },
  value: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 16, letterSpacing: -0.3 },
  unit: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12 },
});

export default function VitalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const { activePatientId } = useActivePatient();

  const { data: vitals, isLoading } = useQuery({
    queryKey: ['vitals', activePatientId],
    queryFn: () => listVitals({ patient_id: activePatientId ?? undefined }),
  });

  const latestByType = useMemo(() => {
    const map = new Map<string, NonNullable<typeof vitals>[number]>();
    for (const v of vitals ?? []) {
      if (!map.has(v.vital_type)) map.set(v.vital_type, v);
    }
    return VITAL_TYPES.map((t) => map.get(t.key)).filter(Boolean);
  }, [vitals]);

  const openAdd = () => {
    triggerHaptic('light');
    router.push('/(patient)/vitals/add');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Vital Signs"
        subtitle={vitals?.length ? `${vitals.length} readings logged` : 'Track your health metrics'}
        role="patient"
        large
        rightIcon="add"
        onRightPress={openAdd}
      />

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : !vitals?.length ? (
        <EmptyState
          role="patient"
          icon="pulse-outline"
          title="No vitals logged yet"
          message="Start tracking blood pressure, heart rate, and more to build your health history."
          actionLabel="Add First Reading"
          onAction={openAdd}
        />
      ) : (
        <FlatList
          data={vitals}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <Text style={[styles.sectionLabel, { color: colors.coral }]}>LATEST READINGS</Text>
              <View style={styles.summaryGrid}>
                {latestByType.map((v) =>
                  v ? (
                    <VitalSummaryCard
                      key={v.vital_type}
                      type={v.vital_type}
                      value={v.value}
                      unit={v.unit}
                      colors={colors}
                    />
                  ) : null,
                )}
              </View>
              <Text style={[styles.sectionLabel, { color: colors.coral, marginTop: LuminaSpacing.md }]}>
                ALL READINGS
              </Text>
            </>
          }
          renderItem={({ item }) => (
            <VitalHistoryRow
              type={item.vital_type}
              value={item.value}
              unit={item.unit}
              date={new Date(item.recorded_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              colors={colors}
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: LuminaSpacing.sm,
  },
  list: { paddingHorizontal: LuminaSpacing.xl, paddingTop: LuminaSpacing.sm },
});
