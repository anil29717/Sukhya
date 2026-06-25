import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getPrescription } from '@/api/prescriptions';
import { formatDoctorName } from '@/api/types';
import { downloadAuthenticatedFile, getPrescriptionDownloadPath, shareFile } from '@/api/download';
import { LoadingSkeleton, ErrorState } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { getPrescriptionStatusStyle } from '@/utils/prescriptionStatus';
import { triggerHaptic } from '@/utils/haptics';

const PRESCRIPTION_COLOR = '#F79009';
const PRESCRIPTION_BG = '#FEF3C7';

function InfoRow({
  icon,
  label,
  value,
  colors,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  isLast?: boolean;
}) {
  return (
    <View style={[infoStyles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <View style={[infoStyles.iconWrap, { backgroundColor: colors.neutral100 }]}>
        <Ionicons name={icon} size={15} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[infoStyles.label, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[infoStyles.value, { color: colors.text }]} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: LuminaRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  value: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 14 },
});

export default function PrescriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'patient' });

  const { data: rx, isLoading, error, refetch } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => getPrescription(parseInt(id!, 10)),
    enabled: !!id,
  });

  const handleDownload = async () => {
    try {
      triggerHaptic('medium');
      const file = await downloadAuthenticatedFile(
        getPrescriptionDownloadPath(parseInt(id!, 10)),
        `prescription-${id}.pdf`,
        'application/pdf'
      );
      await shareFile(file.uri, { mimeType: file.mimeType, fileName: file.fileName });
    } catch {
      Alert.alert('Error', 'Download not available for this prescription.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Prescription" role="patient" />
        <LoadingSkeleton count={3} />
      </View>
    );
  }

  if (error || !rx) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Prescription" role="patient" />
        <ErrorState onRetry={refetch} />
      </View>
    );
  }

  const status = getPrescriptionStatusStyle(rx.status);
  const date = new Date(rx.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Prescription Details" role="patient" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, LuminaShadow.md, { backgroundColor: colors.surface }]}>
          <View style={[styles.heroAccent, { backgroundColor: PRESCRIPTION_COLOR }]} />
          <View style={styles.heroInner}>
            <View style={[styles.heroIcon, { backgroundColor: PRESCRIPTION_BG }]}>
              <Ionicons name="medkit-outline" size={28} color={PRESCRIPTION_COLOR} />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Ionicons name={status.icon} size={11} color={status.color} />
              <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              {rx.diagnosis ?? 'Prescription'}
            </Text>
            <Text style={[styles.heroDoctor, { color: colors.textSecondary }]}>
              {formatDoctorName(rx.doctor_name)}
            </Text>
          </View>
        </View>

        <View style={[styles.detailsCard, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.coral }]}>PRESCRIPTION INFO</Text>
          <InfoRow icon="calendar-outline" label="Issued" value={date} colors={colors} />
          <InfoRow
            icon="medkit-outline"
            label="Medicines"
            value={`${rx.medications.length} prescribed`}
            colors={colors}
            isLast={!rx.instructions}
          />
          {rx.instructions ? (
            <InfoRow icon="document-text-outline" label="Instructions" value={rx.instructions} colors={colors} isLast />
          ) : null}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.coral, marginLeft: 4 }]}>MEDICINES</Text>
        {rx.medications.map((m, i) => (
          <View
            key={`${m.name}-${i}`}
            style={[styles.medCard, LuminaShadow.sm, { backgroundColor: colors.surface }]}
          >
            <View style={[styles.medIndex, { backgroundColor: PRESCRIPTION_BG }]}>
              <Text style={[styles.medIndexText, { color: PRESCRIPTION_COLOR }]}>{i + 1}</Text>
            </View>
            <View style={styles.medBody}>
              <Text style={[styles.medName, { color: colors.text }]}>{m.name}</Text>
              <View style={styles.medMetaRow}>
                {m.dosage ? (
                  <Text style={[styles.medMeta, { color: colors.textSecondary }]}>{m.dosage}</Text>
                ) : null}
                {m.frequency ? (
                  <>
                    <Text style={[styles.medDot, { color: colors.textMuted }]}>·</Text>
                    <Text style={[styles.medMeta, { color: colors.textSecondary }]}>{m.frequency}</Text>
                  </>
                ) : null}
                {m.duration ? (
                  <>
                    <Text style={[styles.medDot, { color: colors.textMuted }]}>·</Text>
                    <Text style={[styles.medMeta, { color: colors.textSecondary }]}>{m.duration}</Text>
                  </>
                ) : null}
              </View>
            </View>
          </View>
        ))}

        <View style={[styles.privacyBanner, { backgroundColor: colors.tealSoft, borderColor: colors.teal + '33' }]}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.teal} />
          <Text style={[styles.privacyText, { color: colors.teal }]}>
            Only you and your care team can view this prescription.
          </Text>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 16),
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
          LuminaShadow.nav,
        ]}
      >
        <Pressable
          onPress={handleDownload}
          style={[styles.footerBtn, { backgroundColor: colors.coral }]}
        >
          <Ionicons name="download-outline" size={18} color="#FFFFFF" />
          <Text style={styles.footerBtnText}>Download PDF</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.sm,
    gap: LuminaSpacing.lg,
  },
  heroCard: {
    borderRadius: LuminaRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  heroAccent: { height: 4 },
  heroInner: { alignItems: 'center', padding: LuminaSpacing.xl, gap: 8 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: LuminaRadius.full,
  },
  statusText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 11, letterSpacing: 0.2 },
  heroTitle: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  heroDoctor: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 14,
    textAlign: 'center',
  },
  detailsCard: {
    borderRadius: LuminaRadius.xl,
    paddingHorizontal: LuminaSpacing.lg,
    paddingBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: LuminaSpacing.md,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  medIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  medIndexText: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 12 },
  medBody: { flex: 1, gap: 2 },
  medName: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 15 },
  medMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  medMeta: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12 },
  medDot: { fontSize: 12 },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
  },
  privacyText: {
    flex: 1,
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: LuminaRadius.lg,
    gap: 8,
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  footerBtnText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
