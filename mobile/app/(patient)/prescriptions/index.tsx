import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { listPrescriptions } from '@/api/prescriptions';
import { formatDoctorName } from '@/api/types';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingState } from '@/components/lumina/ErrorState';
import { StatusBadge } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { TabBar } from '@/components/lumina/MetricCard';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function PrescriptionsScreen() {
  const router = useRouter();
  const { colors } = useLuminaTheme();
  const { activePatientId } = useActivePatient();
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions', activePatientId],
    queryFn: () => listPrescriptions({ patient_id: activePatientId ?? undefined }),
  });

  const items = (data?.items ?? []).filter((p) =>
    tab === 'active' ? p.status !== 'cancelled' && p.status !== 'expired' : p.status === 'cancelled' || p.status === 'expired'
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Prescriptions" />
      <TabBar tabs={[{ key: 'active', label: 'Active' }, { key: 'history', label: 'History' }]} active={tab} onChange={setTab} />
      {isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState icon="medkit-outline" title="No prescriptions" message="Prescriptions from your doctors will appear here." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push(`/(patient)/prescriptions/${item.id}`)}>
              <Text style={[styles.title, { color: colors.text }]}>{item.diagnosis ?? 'Prescription'}</Text>
              <Text style={{ color: colors.textSecondary }}>{formatDoctorName(item.doctor_name)}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{new Date(item.created_at).toLocaleDateString()}</Text>
              <StatusBadge status={item.status} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: LuminaSpacing.lg, gap: LuminaSpacing.sm },
  card: { padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, borderWidth: 1, gap: 4 },
  title: { ...LuminaTypography.h3 },
});
