import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';
import { formatShortDate } from '../../../utils/format';

// ─── API ──────────────────────────────────────────────────────────
const fetchNotes       = () => apiFetch('/doctor-notes?page=1&page_size=50');
const fetchPrescriptions = () => apiFetch('/prescriptions?page=1&page_size=50');
const fetchFollowUps   = () => apiFetch('/follow-ups?page=1&page_size=50');

// ─── Segmented control ────────────────────────────────────────────
function SegControl({ tabs, active, onChange, colors }) {
  return (
    <View style={[segS.wrap, { backgroundColor: colors.neutral100 ?? '#F1F3F5' }]}>
      {tabs.map((t, i) => (
        <TouchableOpacity
          key={t}
          style={[segS.tab, active === i && { backgroundColor: colors.teal }]}
          onPress={() => onChange(i)}
          activeOpacity={0.8}
        >
          <Text style={[segS.text, {
            color: active === i ? '#FFFFFF' : colors.textSecondary,
            fontFamily: active === i ? FontFamily.dmSansMedium : FontFamily.dmSansRegular,
          }]}>
            {t}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const segS = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: Radius.md, padding: 4, marginHorizontal: Spacing[5], marginBottom: Spacing[4] },
  tab:  { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: FontSize.sm },
});

// ─── Note type config ─────────────────────────────────────────────
const NOTE_TYPES = {
  consultation: { color: '#0D9B76', bg: '#E6F7F2', label: 'Consultation' },
  diagnosis:    { color: '#0BA5EC', bg: '#E0F2FE', label: 'Diagnosis' },
  follow_up:    { color: '#F79009', bg: '#FEF3C7', label: 'Follow-up' },
  observation:  { color: '#12B76A', bg: '#DCFCE7', label: 'Observation' },
  private:      { color: '#7C3AED', bg: '#EDE9FE', label: 'Private' },
};

// ─── Note card ────────────────────────────────────────────────────
function NoteCard({ item, onPress, colors }) {
  const cfg = NOTE_TYPES[item.note_type] ?? NOTE_TYPES.consultation;
  return (
    <TouchableOpacity
      style={[cardS.card, Shadow.sm, { backgroundColor: colors.surface }]}
      onPress={() => onPress(item)}
      activeOpacity={0.82}
    >
      <View style={[cardS.leftBar, { backgroundColor: cfg.color }]} />
      <View style={cardS.inner}>
        <View style={cardS.row1}>
          <View style={[cardS.typePill, { backgroundColor: cfg.bg }]}>
            <Text style={[cardS.typeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          {item.is_private && (
            <View style={[cardS.privatePill, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="lock-closed" size={10} color="#7C3AED" />
              <Text style={[cardS.privateText, { color: '#7C3AED' }]}>Private</Text>
            </View>
          )}
          <Text style={[cardS.date, { color: colors.textSecondary }]}>
            {item.created_at ? formatShortDate(item.created_at) : '—'}
          </Text>
        </View>
        <Text style={[cardS.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.title ?? 'Untitled note'}
        </Text>
        {item.patient_name && (
          <Text style={[cardS.patient, { color: colors.textSecondary }]}>
            {item.patient_name}
          </Text>
        )}
        {item.content && (
          <Text style={[cardS.preview, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.content}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Prescription card ────────────────────────────────────────────
function PrescriptionCard({ item, onPress, colors }) {
  const isDraft = item.status === 'draft';
  const meds = item.medications ?? [];
  return (
    <TouchableOpacity
      style={[cardS.card, Shadow.sm, { backgroundColor: colors.surface }]}
      onPress={() => onPress(item)}
      activeOpacity={0.82}
    >
      <View style={[cardS.leftBar, { backgroundColor: isDraft ? colors.warning : colors.success }]} />
      <View style={cardS.inner}>
        <View style={cardS.row1}>
          <View style={[cardS.typePill, {
            backgroundColor: isDraft ? '#FEF3C7' : '#DCFCE7',
          }]}>
            <Text style={[cardS.typeText, {
              color: isDraft ? colors.warning : colors.success,
            }]}>
              {isDraft ? 'Draft' : 'Shared'}
            </Text>
          </View>
          <Text style={[cardS.date, { color: colors.textSecondary }]}>
            {item.created_at ? formatShortDate(item.created_at) : '—'}
          </Text>
        </View>
        <Text style={[cardS.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.diagnosis ?? 'Prescription'}
        </Text>
        {item.patient_name && (
          <Text style={[cardS.patient, { color: colors.textSecondary }]}>
            {item.patient_name}
          </Text>
        )}
        {meds.length > 0 && (
          <Text style={[cardS.preview, { color: colors.textSecondary }]} numberOfLines={1}>
            {meds.map((m) => m.name).join(', ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Follow-up card ───────────────────────────────────────────────
function FollowUpCard({ item, colors }) {
  const statusColors = {
    scheduled: { color: '#0BA5EC', bg: '#E0F2FE' },
    completed: { color: '#12B76A', bg: '#DCFCE7' },
    cancelled: { color: '#F04438', bg: '#FEE2E2' },
    overdue:   { color: '#F79009', bg: '#FEF3C7' },
  };
  const cfg = statusColors[item.status] ?? statusColors.scheduled;

  return (
    <View style={[cardS.card, Shadow.sm, { backgroundColor: colors.surface }]}>
      <View style={[cardS.leftBar, { backgroundColor: cfg.color }]} />
      <View style={cardS.inner}>
        <View style={cardS.row1}>
          <View style={[cardS.typePill, { backgroundColor: cfg.bg }]}>
            <Text style={[cardS.typeText, { color: cfg.color }]}>
              {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
            </Text>
          </View>
          <Text style={[cardS.date, { color: colors.textSecondary }]}>
            {item.scheduled_date ? formatShortDate(item.scheduled_date) : '—'}
          </Text>
        </View>
        {item.patient_name && (
          <Text style={[cardS.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.patient_name}
          </Text>
        )}
        {item.notes && (
          <Text style={[cardS.preview, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.notes}
          </Text>
        )}
      </View>
    </View>
  );
}

const cardS = StyleSheet.create({
  card: { borderRadius: Radius.md, flexDirection: 'row', overflow: 'hidden', marginBottom: Spacing[3] },
  leftBar: { width: 4 },
  inner: { flex: 1, padding: Spacing[4], gap: 4 },
  row1: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  typePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  typeText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs },
  privatePill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 9999 },
  privateText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs },
  date: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, marginLeft: 'auto' },
  title: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.base },
  patient: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm },
  preview: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm, lineHeight: 18 },
});

// ─── Empty state ──────────────────────────────────────────────────
function EmptyState({ icon, title, body, colors }) {
  return (
    <View style={emptyS.wrap}>
      <View style={[emptyS.icon, { backgroundColor: colors.tealLight }]}>
        <Ionicons name={icon} size={30} color={colors.teal} />
      </View>
      <Text style={[emptyS.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[emptyS.body, { color: colors.textSecondary }]}>{body}</Text>
    </View>
  );
}

const emptyS = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: Spacing[12], paddingHorizontal: Spacing[8] },
  icon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4] },
  title: { fontFamily: FontFamily.nunitoSemiBold, fontSize: FontSize.md, marginBottom: Spacing[2], textAlign: 'center' },
  body: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
});

// ─── FAB ──────────────────────────────────────────────────────────
function FAB({ onPress, colors }) {
  return (
    <TouchableOpacity
      style={[fabS.btn, { backgroundColor: colors.coral }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <Ionicons name="add" size={26} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const fabS = StyleSheet.create({
  btn: {
    position: 'absolute',
    bottom: 90,
    right: Spacing[5],
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function ClinicalScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const initialTab = route.params?.tab ?? 0;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [refreshing, setRefreshing] = useState(false);

  const { data: notesData,   isLoading: ln, refetch: rn } = useQuery({ queryKey: ['doctor-notes'],         queryFn: fetchNotes });
  const { data: rxData,      isLoading: lr, refetch: rr } = useQuery({ queryKey: ['doctor-prescriptions'], queryFn: fetchPrescriptions });
  const { data: followData,  isLoading: lf, refetch: rf } = useQuery({ queryKey: ['doctor-followups'],     queryFn: fetchFollowUps });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([rn(), rr(), rf()]);
    setRefreshing(false);
  }, []);

  const notes    = notesData?.items   ?? notesData   ?? [];
  const rxList   = rxData?.items      ?? rxData      ?? [];
  const followUps = followData?.items ?? followData  ?? [];

  const openPatientPicker = (createScreen) => () => {
    navigation.navigate('PatientsTab', {
      screen: 'PatientList',
      params: { pickerMode: true, createScreen },
    });
  };

  const fabActions = [
    openPatientPicker('CreateNote'),
    openPatientPicker('CreatePrescription'),
    openPatientPicker('CreateFollowUp'),
  ];

  const renderContent = () => {
    if (activeTab === 0) {
      if (ln) return <ActivityIndicator color={colors.teal} style={{ marginTop: Spacing[8] }} />;
      if (notes.length === 0) return (
        <EmptyState icon="create-outline" title="No notes yet" body="Write consultation notes, diagnoses, and observations for your patients." colors={colors} />
      );
      return notes.map((item) => (
        <NoteCard key={item.id} item={item} onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })} colors={colors} />
      ));
    }

    if (activeTab === 1) {
      if (lr) return <ActivityIndicator color={colors.teal} style={{ marginTop: Spacing[8] }} />;
      if (rxList.length === 0) return (
        <EmptyState icon="document-text-outline" title="No prescriptions yet" body="Create prescriptions after consultations and share them directly with patients." colors={colors} />
      );
      return rxList.map((item) => (
        <PrescriptionCard key={item.id} item={item} onPress={() => {}} colors={colors} />
      ));
    }

    if (activeTab === 2) {
      if (lf) return <ActivityIndicator color={colors.teal} style={{ marginTop: Spacing[8] }} />;
      if (followUps.length === 0) return (
        <EmptyState icon="return-up-forward-outline" title="No follow-ups" body="Schedule follow-up visits for patients that need continued care." colors={colors} />
      );
      return followUps.map((item) => (
        <FollowUpCard key={item.id} item={item} colors={colors} />
      ));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Notes & Rx</Text>
      </View>

      {/* Segmented control */}
      <SegControl
        tabs={['Notes', 'Prescriptions', 'Follow-Ups']}
        active={activeTab}
        onChange={setActiveTab}
        colors={colors}
      />

      {/* Content */}
      <FlatList
        data={[]}
        ListHeaderComponent={
          <View style={styles.listContent}>
            {renderContent()}
            <View style={{ height: 120 }} />
          </View>
        }
        renderItem={null}
        keyExtractor={() => 'header'}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} colors={[colors.teal]} />
        }
      />

      {/* FAB */}
      <FAB onPress={fabActions[activeTab]} colors={colors} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[4],
  },
  title: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 22,
  },
  listContent: {
    paddingHorizontal: Spacing[5],
  },
});