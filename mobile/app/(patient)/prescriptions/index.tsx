import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listPrescriptions } from '@/api/prescriptions';
import { Prescription, formatDoctorName } from '@/api/types';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { SegmentedControl } from '@/components/lumina/SegmentedControl';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { getPrescriptionStatusStyle } from '@/utils/prescriptionStatus';
import { triggerHaptic } from '@/utils/haptics';

const PRESCRIPTION_COLOR = '#F79009';
const PRESCRIPTION_BG = '#FEF3C7';

function PrescriptionCard({
  item,
  onPress,
  colors,
}: {
  item: Prescription;
  onPress: () => void;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  const status = getPrescriptionStatusStyle(item.status);
  const medCount = item.medications.length;
  const date = new Date(item.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onPress(); }}
      style={({ pressed }) => [
        cardStyles.wrap,
        LuminaShadow.md,
        {
          backgroundColor: colors.surface,
          borderColor: 'rgba(255,255,255,0.65)',
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={[cardStyles.accent, { backgroundColor: PRESCRIPTION_COLOR }]} />
      <View style={[cardStyles.iconWrap, { backgroundColor: PRESCRIPTION_BG }]}>
        <Ionicons name="medkit-outline" size={22} color={PRESCRIPTION_COLOR} />
      </View>
      <View style={cardStyles.body}>
        <Text style={[cardStyles.title, { color: colors.text }]} numberOfLines={2}>
          {item.diagnosis ?? 'Prescription'}
        </Text>
        <Text style={[cardStyles.doctor, { color: colors.textSecondary }]} numberOfLines={1}>
          {formatDoctorName(item.doctor_name)}
        </Text>
        <View style={cardStyles.metaRow}>
          <View style={[cardStyles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={10} color={status.color} />
            <Text style={[cardStyles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={[cardStyles.metaDot, { color: colors.textMuted }]}>·</Text>
          <Text style={[cardStyles.metaText, { color: colors.textMuted }]}>
            {medCount} {medCount === 1 ? 'medicine' : 'medicines'}
          </Text>
          <Text style={[cardStyles.metaDot, { color: colors.textMuted }]}>·</Text>
          <Text style={[cardStyles.date, { color: colors.textMuted }]}>{date}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingRight: 14,
    borderRadius: LuminaRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accent: { width: 4, alignSelf: 'stretch' },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    flexShrink: 0,
  },
  body: { flex: 1, gap: 4 },
  title: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15, lineHeight: 20 },
  doctor: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: LuminaRadius.full,
  },
  statusText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 10, letterSpacing: 0.2 },
  metaDot: { fontSize: 10 },
  metaText: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 11 },
  date: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 11 },
});

export default function PrescriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const { activePatientId } = useActivePatient();
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions', activePatientId],
    queryFn: () => listPrescriptions({ patient_id: activePatientId ?? undefined }),
  });

  const allItems = data?.items ?? [];

  const { activeCount, historyCount } = useMemo(() => {
    let active = 0;
    let history = 0;
    for (const p of allItems) {
      if (p.status === 'cancelled' || p.status === 'expired') history += 1;
      else active += 1;
    }
    return { activeCount: active, historyCount: history };
  }, [allItems]);

  const items = allItems.filter((p) =>
    tab === 'active'
      ? p.status !== 'cancelled' && p.status !== 'expired'
      : p.status === 'cancelled' || p.status === 'expired',
  );

  const subtitle =
    tab === 'active'
      ? `${activeCount} active prescription${activeCount === 1 ? '' : 's'}`
      : `${historyCount} in history`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Prescriptions" subtitle={subtitle} role="patient" large />

      <SegmentedControl
        role="patient"
        segments={[
          { key: 'active', label: 'Active', badge: activeCount || undefined },
          { key: 'history', label: 'History', badge: historyCount || undefined },
        ]}
        active={tab}
        onChange={setTab}
      />

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          role="patient"
          icon="medkit-outline"
          title={tab === 'active' ? 'No active prescriptions' : 'No history yet'}
          message={
            tab === 'active'
              ? 'Prescriptions from your doctors will appear here once shared with you.'
              : 'Expired or cancelled prescriptions will show up here.'
          }
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PrescriptionCard
              item={item}
              colors={colors}
              onPress={() => router.push(`/(patient)/prescriptions/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: LuminaSpacing.xl, paddingTop: LuminaSpacing.sm, gap: 12 },
});
