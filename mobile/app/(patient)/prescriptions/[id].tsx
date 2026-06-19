import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { getPrescription } from '@/api/prescriptions';
import { formatDoctorName } from '@/api/types';
import { downloadAuthenticatedFile, getPrescriptionDownloadPath, shareFile } from '@/api/download';
import { LoadingState, ErrorState } from '@/components/lumina/ErrorState';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function PrescriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useLuminaTheme();

  const { data: rx, isLoading, error, refetch } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => getPrescription(parseInt(id!, 10)),
    enabled: !!id,
  });

  const handleDownload = async () => {
    try {
      const uri = await downloadAuthenticatedFile(getPrescriptionDownloadPath(parseInt(id!, 10)), `prescription-${id}.pdf`);
      await shareFile(uri);
    } catch {
      Alert.alert('Error', 'Download not available for this prescription.');
    }
  };

  if (isLoading) return <><ScreenHeader title="Prescription" /><LoadingState /></>;
  if (error || !rx) return <><ScreenHeader title="Prescription" /><ErrorState onRetry={refetch} /></>;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Prescription Details" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.doctor, { color: colors.text }]}>{formatDoctorName(rx.doctor_name)}</Text>
          <Text style={{ color: colors.textSecondary }}>{new Date(rx.created_at).toLocaleDateString()}</Text>
          {rx.diagnosis ? <Text style={[styles.section, { color: colors.text }]}>Diagnosis: {rx.diagnosis}</Text> : null}
          {rx.notes ? <Text style={{ color: colors.textSecondary }}>{rx.notes}</Text> : null}
        </View>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>MEDICINES</Text>
        {rx.medications.map((m, i) => (
          <View key={i} style={[styles.medCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.medName, { color: colors.text }]}>{m.name}</Text>
            <Text style={{ color: colors.textSecondary }}>{m.dosage} · {m.frequency} · {m.duration}</Text>
          </View>
        ))}
        <LuminaButton label="Download Prescription" icon="download-outline" onPress={handleDownload} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, gap: LuminaSpacing.sm },
  card: { padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, borderWidth: 1, gap: 8 },
  doctor: { ...LuminaTypography.h2 },
  section: { ...LuminaTypography.body, marginTop: 8 },
  sectionTitle: { ...LuminaTypography.caption, marginTop: LuminaSpacing.md },
  medCard: { padding: LuminaSpacing.md, borderRadius: LuminaRadius.md, borderWidth: 1 },
  medName: { ...LuminaTypography.h3 },
});
