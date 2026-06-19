import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { listVitals } from '@/api/medications';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingState } from '@/components/lumina/ErrorState';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

const VITAL_LABELS: Record<string, string> = {
  blood_pressure: 'Blood Pressure',
  blood_sugar: 'Blood Sugar',
  weight: 'Weight',
  heart_rate: 'Heart Rate',
  oxygen: 'Oxygen',
};

export default function VitalsScreen() {
  const router = useRouter();
  const { colors } = useLuminaTheme();
  const { activePatientId } = useActivePatient();

  const { data: vitals, isLoading } = useQuery({
    queryKey: ['vitals', activePatientId],
    queryFn: () => listVitals({ patient_id: activePatientId ?? undefined }),
  });

  const latestByType = Object.keys(VITAL_LABELS).map((type) => vitals?.find((v) => v.vital_type === type)).filter(Boolean);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Vital Signs" />
      <View style={styles.addBtn}>
        <LuminaButton label="Add Reading" icon="add-circle-outline" onPress={() => router.push('/(patient)/vitals/add')} />
      </View>
      {isLoading ? (
        <LoadingState />
      ) : !vitals?.length ? (
        <EmptyState icon="pulse-outline" title="No vitals logged" actionLabel="Add First Reading" onAction={() => router.push('/(patient)/vitals/add')} />
      ) : (
        <>
          <View style={styles.summaryGrid}>
            {latestByType.map((v) => v && (
              <View key={v.vital_type} style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="pulse" size={20} color={colors.accentTeal} />
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{VITAL_LABELS[v.vital_type] ?? v.vital_type}</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{v.value}{v.unit ? ` ${v.unit}` : ''}</Text>
              </View>
            ))}
          </View>
          <FlatList
            data={vitals}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: colors.text, flex: 1 }}>{VITAL_LABELS[item.vital_type] ?? item.vital_type}</Text>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{item.value}{item.unit ? ` ${item.unit}` : ''}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{new Date(item.recorded_at).toLocaleDateString()}</Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addBtn: { paddingHorizontal: LuminaSpacing.lg, marginBottom: LuminaSpacing.md },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: LuminaSpacing.lg, gap: LuminaSpacing.sm, marginBottom: LuminaSpacing.md },
  summaryCard: { width: '47%', padding: LuminaSpacing.md, borderRadius: LuminaRadius.lg, borderWidth: 1, gap: 4 },
  summaryLabel: { fontSize: 11 },
  summaryValue: { ...LuminaTypography.h3 },
  list: { paddingHorizontal: LuminaSpacing.lg, paddingBottom: 40, gap: LuminaSpacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.sm, padding: LuminaSpacing.md, borderRadius: LuminaRadius.md, borderWidth: 1 },
});
