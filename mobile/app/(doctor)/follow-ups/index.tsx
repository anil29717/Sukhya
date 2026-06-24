import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listFollowUps, updateFollowUp } from '@/api/followUps';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { LuminaButton, StatusBadge } from '@/components/lumina/LuminaButton';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { SegmentedControl } from '@/components/lumina/SegmentedControl';
import { LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

type Tab = 'upcoming' | 'missed';

export default function FollowUpsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'doctor' });
  const [tab, setTab] = useState<Tab>('upcoming');

  const { data, isLoading } = useQuery({ queryKey: ['follow-ups'], queryFn: () => listFollowUps() });

  const completeMutation = useMutation({
    mutationFn: (id: number) => updateFollowUp(id, { status: 'completed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['follow-ups'] }),
  });

  const items = (data ?? []).filter((f) =>
    tab === 'upcoming' ? f.status === 'scheduled' : f.status === 'missed'
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Follow-Ups" />
      <SegmentedControl role="doctor" segments={[{ key: 'upcoming', label: 'Upcoming' }, { key: 'missed', label: 'Missed' }]} active={tab} onChange={setTab} />
      <View style={{ paddingHorizontal: LuminaSpacing.lg, paddingTop: LuminaSpacing.sm }}>
        <LuminaButton label="Schedule Follow-Up" variant="secondary" icon="add-outline" onPress={() => router.push('/(doctor)/follow-ups/schedule')} />
      </View>

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : items.length === 0 ? (
        <EmptyState icon="arrow-redo-outline" title={`No ${tab} follow-ups`} actionLabel="Schedule" onAction={() => router.push('/(doctor)/follow-ups/schedule')} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <LuminaCard style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{item.patient_name ?? `Patient #${item.patient_id}`}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{item.scheduled_date}{item.scheduled_time ? ` · ${item.scheduled_time.slice(0, 5)}` : ''}</Text>
                  {item.reason ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>{item.reason}</Text> : null}
                </View>
                <StatusBadge status={item.status} />
              </View>
              {item.status === 'scheduled' ? (
                <Pressable onPress={() => completeMutation.mutate(item.id)} style={{ marginTop: LuminaSpacing.sm }}>
                  <Text style={{ color: colors.accentTeal, fontWeight: '600' }}>Mark Complete</Text>
                </Pressable>
              ) : null}
            </LuminaCard>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: LuminaSpacing.lg, paddingBottom: 40 },
  card: { marginBottom: LuminaSpacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
});
