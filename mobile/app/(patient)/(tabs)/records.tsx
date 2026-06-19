import React, { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';

import { listMedicalRecords, uploadMedicalRecord } from '@/api/records';
import { getLockerSummary } from '@/api/family';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { LuminaButton, LuminaChip, LuminaInput } from '@/components/lumina/LuminaButton';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { apiRecordTypeForCategory, filterRecordsByCategory } from '@/utils/recordCategories';
import { triggerHaptic } from '@/utils/haptics';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'reports', label: 'Reports' },
  { key: 'prescription', label: 'Prescriptions' },
  { key: 'xray', label: 'X-Ray' },
  { key: 'mri', label: 'MRI' },
  { key: 'ctscan', label: 'CT Scan' },
];

const RECORD_TYPES = [
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'diagnostic_report', label: 'Diagnostic' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'xray', label: 'X-Ray' },
  { value: 'mri', label: 'MRI' },
  { value: 'ctscan', label: 'CT Scan' },
];

function recordIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type.includes('prescription')) return 'medkit-outline';
  if (type.includes('lab')) return 'flask-outline';
  if (type.includes('diagnostic') || type.includes('xray') || type.includes('mri')) return 'scan-outline';
  return 'document-text-outline';
}

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();
  const { activePatientId } = useActivePatient();

  const [category, setCategory] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState('lab_report');
  const [description, setDescription] = useState('');
  const [pickedFile, setPickedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

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
      setModalVisible(false);
      setTitle('');
      setDescription('');
      setPickedFile(null);
      router.push('/(patient)/records/upload-success' as never);
    },
    onError: (err: Error) => Alert.alert('Upload Failed', err.message),
  });

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) setPickedFile(result.assets[0]);
  };

  const records = filterRecordsByCategory(data?.items ?? [], category);

  const resetModal = () => {
    setModalVisible(false);
    setTitle('');
    setDescription('');
    setPickedFile(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
            Health Locker
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {summary?.total_records ?? 0} documents · {summary?.total_downloads ?? 0} downloads
          </Text>
        </View>
        <Pressable
          style={[styles.uploadBtn, { backgroundColor: colors.primary }, LuminaShadow.sm]}
          onPress={() => {
            triggerHaptic('light');
            setModalVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Upload record"
        >
          <Ionicons name="cloud-upload-outline" size={22} color={colors.onPrimary} />
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(c) => c.key}
        contentContainerStyle={styles.filters}
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        renderItem={({ item }) => (
          <LuminaChip label={item.label} active={category === item.key} onPress={() => setCategory(item.key)} />
        )}
      />

      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <FlatList
          style={styles.list}
          data={records}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.recordList}
          ListEmptyComponent={
            <EmptyState
              icon="folder-open-outline"
              title="Your locker is empty"
              message="Upload lab results, imaging, and prescriptions — securely stored and always accessible."
              actionLabel="Upload Document"
              onAction={() => setModalVisible(true)}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.card, { backgroundColor: colors.surfaceElevated }, LuminaShadow.sm]}
              onPress={() => router.push(`/(patient)/records/${item.id}`)}
            >
              <View style={[styles.icon, { backgroundColor: colors.secondarySoft }]}>
                <Ionicons name={recordIcon(item.record_type)} size={22} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                  {item.record_type.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={[styles.cardDate, { color: colors.textSecondary }]}>
                  {new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={resetModal}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modal, { backgroundColor: colors.surfaceElevated }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Upload document</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              PDF or image · encrypted in your health locker
            </Text>

            <LuminaInput label="Title" placeholder="e.g. Annual blood panel" value={title} onChangeText={setTitle} />
            <LuminaInput
              label="Description (optional)"
              placeholder="Add notes for your care team..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.fieldLabel, { color: colors.text }]}>Document type</Text>
            <View style={styles.chipRow}>
              {RECORD_TYPES.map((t) => (
                <LuminaChip key={t.value} label={t.label} active={recordType === t.value} onPress={() => setRecordType(t.value)} />
              ))}
            </View>

            <Pressable
              style={[styles.fileBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={pickFile}
            >
              <View style={[styles.fileIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={pickedFile ? 'checkmark-circle' : 'attach-outline'} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>
                  {pickedFile ? pickedFile.name : 'Choose file'}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>PDF or image up to 10MB</Text>
              </View>
            </Pressable>

            <LuminaButton
              label={uploadMutation.isPending ? 'Uploading…' : 'Upload to locker'}
              icon="cloud-upload-outline"
              loading={uploadMutation.isPending}
              onPress={() => uploadMutation.mutate()}
              disabled={!title || !pickedFile}
            />
            <LuminaButton label="Cancel" variant="ghost" onPress={resetModal} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: LuminaSpacing.lg,
    marginBottom: LuminaSpacing.md,
  },
  title: { ...LuminaTypography.display, fontSize: 28 },
  subtitle: { ...LuminaTypography.body, marginTop: 4 },
  uploadBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  filterRow: { marginBottom: LuminaSpacing.md, maxHeight: 48, flexGrow: 0 },
  filters: { paddingHorizontal: LuminaSpacing.lg, gap: LuminaSpacing.sm },
  list: { flex: 1 },
  recordList: { paddingHorizontal: LuminaSpacing.lg, paddingBottom: 120, gap: LuminaSpacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.md,
    padding: LuminaSpacing.lg,
    borderRadius: LuminaRadius.xl,
  },
  icon: { width: 48, height: 48, borderRadius: LuminaRadius.lg, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { ...LuminaTypography.label, fontSize: 16 },
  cardMeta: { fontSize: 10, letterSpacing: 0.5, marginTop: 2 },
  cardDate: { fontSize: 13, marginTop: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modal: {
    borderTopLeftRadius: LuminaRadius.xxl,
    borderTopRightRadius: LuminaRadius.xxl,
    padding: LuminaSpacing.xl,
    paddingBottom: 40,
    gap: LuminaSpacing.sm,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: LuminaSpacing.md,
  },
  modalTitle: { ...LuminaTypography.h2 },
  modalSubtitle: { ...LuminaTypography.bodySmall, marginBottom: LuminaSpacing.sm },
  fieldLabel: { ...LuminaTypography.label, marginTop: LuminaSpacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: LuminaSpacing.sm, marginBottom: LuminaSpacing.md },
  fileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.md,
    borderWidth: 1,
    borderRadius: LuminaRadius.lg,
    padding: LuminaSpacing.lg,
    marginBottom: LuminaSpacing.md,
  },
  fileIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
