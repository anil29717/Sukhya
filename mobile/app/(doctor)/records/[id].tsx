import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { getMedicalRecord } from '@/api/records';
import { LoadingSkeleton, ErrorState } from '@/components/lumina/ErrorState';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function DoctorRecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useLuminaTheme({ role: 'doctor' });

  const { data: record, isLoading, error, refetch } = useQuery({
    queryKey: ['record', id],
    queryFn: () => getMedicalRecord(parseInt(id!, 10)),
    enabled: !!id,
  });

  if (isLoading) return <><ScreenHeader title="Record" /><LoadingSkeleton count={3} /></>;
  if (error || !record) return <><ScreenHeader title="Record" /><ErrorState onRetry={refetch} /></>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Medical Record" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <LuminaCard>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 18 }}>{record.title}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 4, textTransform: 'capitalize' }}>{record.record_type.replace('_', ' ')}</Text>
          {record.description ? <Text style={{ color: colors.textSecondary, marginTop: LuminaSpacing.md }}>{record.description}</Text> : null}
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: LuminaSpacing.md }}>
            {record.file_name} · {(record.file_size / 1024).toFixed(1)} KB · {record.created_at.slice(0, 10)}
          </Text>
        </LuminaCard>
        <LuminaButton label="Preview Document" icon="eye-outline" onPress={() => router.push({ pathname: '/(doctor)/records/preview', params: { id: String(record.id), mimeType: record.mime_type, fileName: record.file_name } })} />
        <LuminaButton label="View Patient" variant="outline" onPress={() => router.push(`/(doctor)/patients/${record.patient_id}` as never)} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, gap: LuminaSpacing.md, paddingBottom: 40 },
});
