import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { getMedicalRecord } from '@/api/records';
import { getLockerDownloads } from '@/api/family';
import { downloadAuthenticatedFile, getRecordDownloadPath, shareFile } from '@/api/download';
import { LoadingState, ErrorState } from '@/components/lumina/ErrorState';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useLuminaTheme();

  const { data: record, isLoading, error, refetch } = useQuery({
    queryKey: ['record', id],
    queryFn: () => getMedicalRecord(parseInt(id!, 10)),
    enabled: !!id,
  });

  const { data: downloads } = useQuery({ queryKey: ['locker-downloads'], queryFn: getLockerDownloads });
  const downloadCount = Array.isArray(downloads) ? downloads.filter((d: { medical_record_id?: number }) => d.medical_record_id === parseInt(id!, 10)).length : 0;

  const handleDownload = async () => {
    try {
      const uri = await downloadAuthenticatedFile(getRecordDownloadPath(parseInt(id!, 10)), record!.file_name);
      await shareFile(uri);
    } catch {
      Alert.alert('Error', 'Could not download file.');
    }
  };

  const handlePreview = () => {
    router.push({ pathname: '/(patient)/records/preview', params: { id, mimeType: record?.mime_type, fileName: record?.file_name } });
  };

  if (isLoading) return <><ScreenHeader title="Record" /><LoadingState /></>;
  if (error || !record) return <><ScreenHeader title="Record" /><ErrorState onRetry={refetch} /></>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Record Details" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{record.title}</Text>
          <Text style={{ color: colors.textMuted }}>{record.record_type.toUpperCase()}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>{record.description ?? 'No description'}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>Uploaded: {new Date(record.created_at).toLocaleString()}</Text>
          <Text style={{ color: colors.textMuted }}>Downloads: {downloadCount}</Text>
          <Text style={{ color: colors.textMuted }}>File: {record.file_name}</Text>
        </View>
        <LuminaButton label="Preview" icon="eye-outline" onPress={handlePreview} />
        <LuminaButton label="Download & Share" variant="secondary" icon="download-outline" onPress={handleDownload} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, gap: LuminaSpacing.md },
  card: { padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, borderWidth: 1 },
  title: { ...LuminaTypography.h2 },
});
