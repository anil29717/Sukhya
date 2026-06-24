import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getMedicalRecord } from '@/api/records';
import { getLockerDownloads } from '@/api/family';
import {
  downloadAuthenticatedFile,
  getRecordDownloadPath,
  saveDownloadedFile,
  shareDownloadedFile,
  type DownloadedFile,
} from '@/api/download';
import { LoadingSkeleton, ErrorState } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { formatFileSize, getRecordTypeStyle } from '@/utils/recordCategories';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { triggerHaptic } from '@/utils/haptics';

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
    <View style={[infoStyles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
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
  value: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 14,
  },
});

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'patient' });

  const { data: record, isLoading, error, refetch } = useQuery({
    queryKey: ['record', id],
    queryFn: () => getMedicalRecord(parseInt(id!, 10)),
    enabled: !!id,
  });

  const { data: downloads } = useQuery({ queryKey: ['locker-downloads'], queryFn: getLockerDownloads });
  const downloadCount = Array.isArray(downloads)
    ? downloads.filter((d: { medical_record_id?: number }) => d.medical_record_id === parseInt(id!, 10)).length
    : 0;

  const [cachedFile, setCachedFile] = useState<DownloadedFile | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  const ensureFile = useCallback(async (): Promise<DownloadedFile> => {
    if (cachedFile) return cachedFile;
    if (!record) throw new Error('Record not loaded');
    setFileLoading(true);
    try {
      const file = await downloadAuthenticatedFile(
        getRecordDownloadPath(parseInt(id!, 10)),
        record.file_name,
        record.mime_type
      );
      setCachedFile(file);
      return file;
    } finally {
      setFileLoading(false);
    }
  }, [cachedFile, id, record]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Record" role="patient" />
        <LoadingSkeleton count={3} />
      </View>
    );
  }

  if (error || !record) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Record" role="patient" />
        <ErrorState onRetry={refetch} />
      </View>
    );
  }

  const typeStyle = getRecordTypeStyle(record.record_type);
  const uploadedAt = new Date(record.created_at).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDownload = async () => {
    try {
      triggerHaptic('medium');
      const file = await ensureFile();
      await saveDownloadedFile(file);
    } catch (e) {
      Alert.alert('Download failed', getApiErrorMessage(e, 'Could not save the file. Check your connection and try again.'));
    }
  };

  const handleShare = async () => {
    try {
      triggerHaptic('light');
      const file = await ensureFile();
      await shareDownloadedFile(file);
    } catch (e) {
      Alert.alert('Share failed', getApiErrorMessage(e, 'Could not open the share menu. Please try again.'));
    }
  };

  const handlePreview = () => {
    triggerHaptic('light');
    router.push({
      pathname: '/(patient)/records/preview',
      params: { id, mimeType: record.mime_type, fileName: record.file_name },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Record Details" role="patient" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={[styles.heroCard, LuminaShadow.md, { backgroundColor: colors.surface }]}>
          <View style={[styles.heroAccent, { backgroundColor: typeStyle.color }]} />
          <View style={styles.heroInner}>
            <View style={[styles.heroIcon, { backgroundColor: typeStyle.bg }]}>
              <Ionicons name={typeStyle.icon} size={28} color={typeStyle.color} />
            </View>
            <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
              <Text style={[styles.typeBadgeText, { color: typeStyle.color }]}>{typeStyle.label}</Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>{record.title}</Text>
            {record.description ? (
              <Text style={[styles.heroDesc, { color: colors.textSecondary }]}>{record.description}</Text>
            ) : null}
          </View>
        </View>

        {/* Details card */}
        <View style={[styles.detailsCard, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.coral }]}>FILE DETAILS</Text>
          <InfoRow icon="calendar-outline" label="Uploaded" value={uploadedAt} colors={colors} />
          <InfoRow icon="download-outline" label="Downloads" value={String(downloadCount)} colors={colors} />
          <InfoRow
            icon="document-outline"
            label="File"
            value={`${record.file_name} · ${formatFileSize(record.file_size)}`}
            colors={colors}
            isLast
          />
        </View>

        {/* Privacy note */}
        <View style={[styles.privacyBanner, { backgroundColor: colors.tealSoft, borderColor: colors.teal + '33' }]}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.teal} />
          <Text style={[styles.privacyText, { color: colors.teal }]}>
            Stored securely in your health locker. Only you and your care team can access this file.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky footer — side by side */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          onPress={handlePreview}
          style={[styles.footerBtn, styles.footerBtnPrimary, { backgroundColor: colors.coral }]}
        >
          <Ionicons name="eye-outline" size={18} color="#FFFFFF" />
          <Text style={styles.footerBtnPrimaryText}>Preview</Text>
        </Pressable>
        <Pressable
          onPress={handleDownload}
          disabled={fileLoading}
          style={[styles.footerBtn, styles.footerBtnSecondary, { borderColor: colors.border, backgroundColor: colors.surface, opacity: fileLoading ? 0.6 : 1 }]}
        >
          <Ionicons name="download-outline" size={18} color={colors.coral} />
          <Text style={[styles.footerBtnSecondaryText, { color: colors.coral }]}>Download</Text>
        </Pressable>
        <Pressable
          onPress={handleShare}
          disabled={fileLoading}
          style={[styles.footerBtn, styles.footerBtnSecondary, { borderColor: colors.border, backgroundColor: colors.surface, opacity: fileLoading ? 0.6 : 1 }]}
        >
          <Ionicons name="share-outline" size={18} color={colors.coral} />
          <Text style={[styles.footerBtnSecondaryText, { color: colors.coral }]}>Share</Text>
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
  heroAccent: { height: 5 },
  heroInner: {
    padding: LuminaSpacing.xl,
    alignItems: 'center',
    gap: 10,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: LuminaRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: LuminaRadius.full,
  },
  typeBadgeText: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 26,
  },
  heroDesc: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsCard: {
    borderRadius: LuminaRadius.xl,
    paddingHorizontal: LuminaSpacing.lg,
    paddingBottom: LuminaSpacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    paddingTop: LuminaSpacing.lg,
    paddingBottom: LuminaSpacing.sm,
  },
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
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: LuminaRadius.lg,
    gap: 5,
    paddingHorizontal: 4,
  },
  footerBtnPrimary: {
    flex: 1.25,
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  footerBtnPrimaryText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  footerBtnSecondary: {
    borderWidth: 1,
  },
  footerBtnSecondaryText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 13,
  },
});
