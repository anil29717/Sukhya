import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';

import { listMedicalRecords, uploadMedicalRecord } from '@/api/records';
import { getLockerSummary } from '@/api/family';
import { BottomSheet } from '@/components/lumina/BottomSheet';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { SheetOptionRow, SheetSectionLabel } from '@/components/lumina/SheetOptionRow';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import {
  apiRecordTypeForCategory,
  filterRecordsByCategory,
  formatFileSize,
  getRecordTypeStyle,
} from '@/utils/recordCategories';
import { triggerHaptic } from '@/utils/haptics';

const CATEGORIES = [
  { key: 'all', label: 'All documents', icon: 'layers-outline' as const },
  { key: 'reports', label: 'Lab & diagnostic reports', icon: 'flask-outline' as const },
  { key: 'prescription', label: 'Prescriptions', icon: 'medkit-outline' as const },
  { key: 'xray', label: 'X-Ray & imaging', icon: 'scan-outline' as const },
  { key: 'mri', label: 'MRI', icon: 'scan-outline' as const },
  { key: 'ctscan', label: 'CT scan', icon: 'scan-outline' as const },
];

const UPLOAD_TYPES = [
  { value: 'lab_report', label: 'Lab Report', icon: 'flask-outline' as const, color: '#0BA5EC', bg: '#E0F2FE' },
  { value: 'prescription', label: 'Prescription', icon: 'medkit-outline' as const, color: '#12B76A', bg: '#DCFCE7' },
  { value: 'diagnostic_report', label: 'Diagnostic', icon: 'document-text-outline' as const, color: '#868E96', bg: '#F1F3F5' },
  { value: 'xray', label: 'X-Ray', icon: 'scan-outline' as const, color: '#7C3AED', bg: '#EDE9FE' },
  { value: 'mri', label: 'MRI', icon: 'scan-outline' as const, color: '#F79009', bg: '#FEF3C7' },
  { value: 'ctscan', label: 'CT Scan', icon: 'scan-outline' as const, color: '#F05A2A', bg: '#FEF0EB' },
];

const SCREEN = Dimensions.get('window');
const TYPE_GRID_GAP = 8;
const TYPE_COLS = 3;
const TYPE_TILE_WIDTH =
  (SCREEN.width - LuminaSpacing.xl * 2 - TYPE_GRID_GAP * (TYPE_COLS - 1)) / TYPE_COLS;
const IS_COMPACT_SCREEN = SCREEN.height < 700;

function RecordCard({
  title,
  recordType,
  date,
  fileSize,
  onPress,
  colors,
}: {
  title: string;
  recordType: string;
  date: string;
  fileSize?: number;
  onPress: () => void;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  const style = getRecordTypeStyle(recordType);

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
      <View style={[cardStyles.accent, { backgroundColor: style.color }]} />
      <View style={[cardStyles.iconWrap, { backgroundColor: style.bg }]}>
        <Ionicons name={style.icon} size={22} color={style.color} />
      </View>
      <View style={cardStyles.body}>
        <Text style={[cardStyles.title, { color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={cardStyles.metaRow}>
          <View style={[cardStyles.typeBadge, { backgroundColor: style.bg }]}>
            <Text style={[cardStyles.typeText, { color: style.color }]}>{style.label}</Text>
          </View>
          {fileSize ? (
            <Text style={[cardStyles.sizeText, { color: colors.textMuted }]}>
              {formatFileSize(fileSize)}
            </Text>
          ) : null}
        </View>
        <Text style={[cardStyles.date, { color: colors.textSecondary }]}>{date}</Text>
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
  body: { flex: 1, gap: 5 },
  title: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: LuminaRadius.full,
  },
  typeText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 10, letterSpacing: 0.3 },
  sizeText: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 11 },
  date: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12 },
});

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const { activePatientId } = useActivePatient();

  const [category, setCategory] = useState('all');
  const [draftCategory, setDraftCategory] = useState('all');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState('lab_report');
  const [description, setDescription] = useState('');
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  const hasActiveFilter = category !== 'all';
  const activeCategoryLabel = CATEGORIES.find((c) => c.key === category)?.label ?? 'All';

  const apiType = apiRecordTypeForCategory(category);

  const { data, isLoading } = useQuery({
    queryKey: ['medical-records', activePatientId, category],
    queryFn: () =>
      listMedicalRecords({
        patient_id: activePatientId ?? undefined,
        record_type: apiType,
      }),
  });

  const { data: summary } = useQuery({
    queryKey: ['locker-summary', activePatientId],
    queryFn: () => getLockerSummary(activePatientId ?? undefined),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!title || !pickedFile || !activePatientId) throw new Error('Missing required fields');
      const formData = new FormData();
      formData.append('patient_id', String(activePatientId));
      formData.append('record_type', recordType);
      formData.append('title', title);
      formData.append('description', description || '');
      formData.append('file', {
        uri: pickedFile.uri,
        type: pickedFile.mimeType ?? 'application/octet-stream',
        name: pickedFile.name,
      } as unknown as Blob);
      return uploadMedicalRecord(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
      queryClient.invalidateQueries({ queryKey: ['locker-summary'] });
      resetUpload();
      router.push('/(patient)/records/upload-success' as never);
    },
    onError: (err: Error) => Alert.alert('Upload Failed', err.message),
  });

  const canUpload = !!title.trim() && !!pickedFile && !uploadMutation.isPending;

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) setPickedFile(result.assets[0]);
  };

  const records = filterRecordsByCategory(data?.items ?? [], category);

  const openFilter = () => {
    triggerHaptic('light');
    setDraftCategory(category);
    setShowFilterSheet(true);
  };

  const applyFilter = () => {
    triggerHaptic('medium');
    setCategory(draftCategory);
    setShowFilterSheet(false);
  };

  const resetUpload = () => {
    setShowUploadSheet(false);
    setTitle('');
    setDescription('');
    setPickedFile(null);
    setTitleFocused(false);
    setDescFocused(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            Health Locker
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {summary?.total_records ?? 0} documents · {summary?.total_downloads ?? 0} downloads
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={[
              styles.headerBtn,
              {
                backgroundColor: hasActiveFilter ? colors.coralSoft : colors.surface,
                borderColor: hasActiveFilter ? colors.coral : colors.border,
              },
              LuminaShadow.sm,
            ]}
            onPress={openFilter}
            accessibilityLabel="Filter records"
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={hasActiveFilter ? colors.coral : colors.textSecondary}
            />
            {hasActiveFilter ? (
              <View style={[styles.filterDot, { backgroundColor: colors.coral }]} />
            ) : null}
          </Pressable>
          <Pressable
            style={[styles.uploadBtn, { backgroundColor: colors.coral }, LuminaShadow.sm]}
            onPress={() => { triggerHaptic('light'); setShowUploadSheet(true); }}
            accessibilityLabel="Upload record"
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Active filter banner */}
      {hasActiveFilter ? (
        <Pressable
          onPress={openFilter}
          style={[styles.filterBanner, { backgroundColor: colors.coralSoft, borderColor: colors.coral + '33' }]}
        >
          <Ionicons name="funnel-outline" size={13} color={colors.coral} />
          <Text style={[styles.filterBannerText, { color: colors.coral }]} numberOfLines={1}>
            {activeCategoryLabel}
          </Text>
          <Pressable
            onPress={() => { setCategory('all'); setDraftCategory('all'); }}
            hitSlop={8}
          >
            <Ionicons name="close" size={15} color={colors.coral} />
          </Pressable>
        </Pressable>
      ) : null}

      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <FlatList
          style={styles.list}
          data={records}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.recordList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="folder-open-outline"
              title="Your locker is empty"
              message="Upload lab results, imaging, and prescriptions — securely stored and always accessible."
              actionLabel="Upload Document"
              onAction={() => setShowUploadSheet(true)}
              role="patient"
            />
          }
          renderItem={({ item }) => (
            <RecordCard
              title={item.title}
              recordType={item.record_type}
              date={new Date(item.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              fileSize={item.file_size}
              colors={colors}
              onPress={() => router.push(`/(patient)/records/${item.id}`)}
            />
          )}
        />
      )}

      {/* Filter sheet */}
      <BottomSheet visible={showFilterSheet} onClose={() => setShowFilterSheet(false)} height={520}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Filter documents</Text>
          <Pressable onPress={() => setShowFilterSheet(false)} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
          <SheetSectionLabel label="Document type" />
          {CATEGORIES.map((c) => (
            <SheetOptionRow
              key={c.key}
              icon={c.icon}
              label={c.label}
              selected={draftCategory === c.key}
              onPress={() => setDraftCategory(c.key)}
              role="patient"
            />
          ))}
        </ScrollView>
        <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={() => setDraftCategory('all')}
            style={[styles.sheetSecBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.sheetSecText, { color: colors.textSecondary }]}>Reset</Text>
          </Pressable>
          <Pressable
            onPress={applyFilter}
            style={[styles.sheetPriBtn, { backgroundColor: colors.coral }]}
          >
            <Text style={styles.sheetPriText}>Apply</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Upload sheet */}
      <BottomSheet visible={showUploadSheet} onClose={resetUpload} maxHeight="92%">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.uploadSheetBody}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.uploadSheetHeader}>
            <View style={styles.uploadSheetHeaderText}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Upload document</Text>
              <Text style={[styles.uploadHint, { color: colors.textSecondary }]}>
                PDF or image · encrypted in your health locker
              </Text>
            </View>
            <Pressable
              onPress={resetUpload}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: colors.neutral100 }]}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.uploadScroll}
            contentContainerStyle={styles.uploadScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces
            nestedScrollEnabled
          >
            <Pressable
              onPress={pickFile}
              style={({ pressed }) => [
                styles.dropZone,
                IS_COMPACT_SCREEN && styles.dropZoneCompact,
                {
                  backgroundColor: pickedFile ? colors.coralSoft : colors.neutral100,
                  borderColor: pickedFile ? colors.coral + '55' : colors.border,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}
            >
              <View style={[styles.dropIconWrap, { backgroundColor: pickedFile ? colors.coral + '22' : colors.surface }]}>
                <Ionicons
                  name={pickedFile ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={IS_COMPACT_SCREEN ? 28 : 32}
                  color={colors.coral}
                />
              </View>
              {pickedFile ? (
                <>
                  <Text style={[styles.dropTitle, { color: colors.text }]} numberOfLines={2}>
                    {pickedFile.name}
                  </Text>
                  <Text style={[styles.dropSub, { color: colors.coral }]}>Tap to change file</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.dropTitle, { color: colors.text }]}>Choose a file</Text>
                  <Text style={[styles.dropSub, { color: colors.textSecondary }]}>
                    PDF or image · up to 10 MB
                  </Text>
                </>
              )}
            </Pressable>

            <Text style={[styles.uploadSectionLabel, { color: colors.coral }]}>DOCUMENT TYPE</Text>
            <View style={styles.typeGrid}>
              {UPLOAD_TYPES.map((t) => {
                const selected = recordType === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => { triggerHaptic('light'); setRecordType(t.value); }}
                    style={[
                      styles.typeTile,
                      { width: TYPE_TILE_WIDTH },
                      {
                        backgroundColor: selected ? t.bg : colors.neutral100,
                        borderColor: selected ? t.color + '66' : 'transparent',
                        borderWidth: selected ? 1.5 : 0,
                      },
                    ]}
                  >
                    <View style={[styles.typeTileIcon, { backgroundColor: selected ? t.color + '22' : t.bg }]}>
                      <Ionicons name={t.icon} size={18} color={t.color} />
                    </View>
                    <Text
                      style={[
                        styles.typeTileLabel,
                        { color: selected ? t.color : colors.textSecondary },
                        selected && { fontFamily: LuminaFontFamily.dmSansMedium },
                      ]}
                      numberOfLines={2}
                    >
                      {t.label}
                    </Text>
                    {selected ? (
                      <View style={[styles.typeTileCheck, { backgroundColor: t.color }]}>
                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.uploadSectionLabel, { color: colors.coral }]}>DETAILS</Text>
            <View style={styles.inputBlock}>
              <Text style={[styles.inputLabel, { color: colors.textBody }]}>Title</Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.neutral100,
                    borderColor: titleFocused ? colors.coral : 'transparent',
                    borderWidth: titleFocused ? 1.5 : 0,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. Annual blood panel"
                  placeholderTextColor={colors.textHint}
                  value={title}
                  onChangeText={setTitle}
                  onFocus={() => setTitleFocused(true)}
                  onBlur={() => setTitleFocused(false)}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputBlock}>
              <Text style={[styles.inputLabel, { color: colors.textBody }]}>
                Notes <Text style={{ color: colors.textMuted, fontFamily: LuminaFontFamily.dmSansRegular }}>(optional)</Text>
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  styles.inputWrapMultiline,
                  {
                    backgroundColor: colors.neutral100,
                    borderColor: descFocused ? colors.coral : 'transparent',
                    borderWidth: descFocused ? 1.5 : 0,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, styles.inputMultiline, { color: colors.text }]}
                  placeholder="Add notes for your care team..."
                  placeholderTextColor={colors.textHint}
                  value={description}
                  onChangeText={setDescription}
                  onFocus={() => setDescFocused(true)}
                  onBlur={() => setDescFocused(false)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={[styles.secureNote, { backgroundColor: colors.tealSoft, borderColor: colors.teal + '33' }]}>
              <Ionicons name="lock-closed-outline" size={14} color={colors.teal} />
              <Text style={[styles.secureNoteText, { color: colors.teal }]}>
                Encrypted and stored under DPDPA 2023. Only you and your doctors can access this file.
              </Text>
            </View>
          </ScrollView>

          <View
            style={[
              styles.uploadFooter,
              { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <Pressable
              onPress={() => canUpload && uploadMutation.mutate()}
              disabled={!canUpload}
              style={({ pressed }) => [
                styles.uploadCta,
                {
                  backgroundColor: canUpload ? colors.coral : colors.neutral100,
                  opacity: pressed && canUpload ? 0.92 : 1,
                },
                canUpload && styles.uploadCtaShadow,
              ]}
            >
              {uploadMutation.isPending ? (
                <Text style={[styles.uploadCtaText, { color: '#FFFFFF' }]}>Uploading…</Text>
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color={canUpload ? '#FFFFFF' : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.uploadCtaText,
                      { color: canUpload ? '#FFFFFF' : colors.textMuted },
                    ]}
                  >
                    Upload to locker
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.lg,
    marginBottom: LuminaSpacing.md,
    gap: LuminaSpacing.md,
  },
  title: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 26,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    marginTop: 3,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: LuminaRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  uploadBtn: {
    width: 40,
    height: 40,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: LuminaSpacing.xl,
    marginBottom: LuminaSpacing.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
  },
  filterBannerText: {
    flex: 1,
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 13,
  },
  list: { flex: 1 },
  recordList: { paddingHorizontal: LuminaSpacing.xl, paddingBottom: 120, gap: 12 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.sm,
  },
  sheetTitle: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 20 },
  sheetContent: { paddingHorizontal: LuminaSpacing.xl, paddingBottom: LuminaSpacing.md },
  sheetFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: 1,
  },
  sheetSecBtn: {
    flex: 1,
    height: 48,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSecText: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 15 },
  sheetPriBtn: {
    flex: 2,
    height: 48,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPriText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 15, color: '#FFFFFF' },

  uploadSheetBody: { flex: 1 },
  uploadSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.sm,
    gap: 12,
    flexShrink: 0,
  },
  uploadSheetHeaderText: { flex: 1 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadHint: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    marginTop: 2,
  },
  uploadScroll: { flex: 1 },
  uploadScrollContent: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.xs,
    paddingBottom: LuminaSpacing.xl,
  },
  dropZone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: LuminaSpacing.lg,
    borderRadius: LuminaRadius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: LuminaSpacing.lg,
    gap: 6,
  },
  dropZoneCompact: {
    paddingVertical: 20,
  },
  dropIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  dropTitle: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 15,
    textAlign: 'center',
    maxWidth: '90%',
  },
  dropSub: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    textAlign: 'center',
  },
  uploadSectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TYPE_GRID_GAP,
    marginBottom: LuminaSpacing.lg,
  },
  typeTile: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: LuminaRadius.lg,
    gap: 6,
    position: 'relative',
    minHeight: 88,
    justifyContent: 'center',
  },
  typeTileIcon: {
    width: 36,
    height: 36,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTileLabel: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  typeTileCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBlock: { marginBottom: LuminaSpacing.md },
  inputLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 13,
    marginBottom: 8,
  },
  inputWrap: {
    borderRadius: LuminaRadius.lg,
    paddingHorizontal: 14,
    height: 50,
    justifyContent: 'center',
  },
  inputWrapMultiline: {
    height: 88,
    paddingVertical: 12,
    justifyContent: 'flex-start',
  },
  input: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 15,
    padding: 0,
  },
  inputMultiline: {
    minHeight: 64,
    lineHeight: 20,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    marginTop: 4,
  },
  secureNoteText: {
    flex: 1,
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 12,
    lineHeight: 17,
  },
  uploadFooter: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  uploadCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: LuminaRadius.lg,
    gap: 8,
  },
  uploadCtaShadow: {
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  uploadCtaText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
