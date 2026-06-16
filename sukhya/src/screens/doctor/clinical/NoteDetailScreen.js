import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { formatShortDate, formatRelative } from '../../../utils/format';

const fetchNote = (id) => apiFetch(`/doctor-notes/${id}`);

const NOTE_TYPES = {
  consultation: { color: '#0D9B76', bg: '#E6F7F2', label: 'Consultation' },
  diagnosis:    { color: '#0BA5EC', bg: '#E0F2FE', label: 'Diagnosis' },
  follow_up:    { color: '#F79009', bg: '#FEF3C7', label: 'Follow-up' },
  observation:  { color: '#12B76A', bg: '#DCFCE7', label: 'Observation' },
  private:      { color: '#7C3AED', bg: '#EDE9FE', label: 'Private' },
};

export default function NoteDetailScreen({ navigation, route }) {
  const { noteId } = route.params ?? {};
  const { colors, isDark } = useTheme();

  const {
    data: note,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['doctor-note', noteId],
    queryFn: () => fetchNote(noteId),
    enabled: !!noteId,
  });

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const cfg = NOTE_TYPES[note?.note_type] ?? NOTE_TYPES.consultation;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !note) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Note</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Could not load this note.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Note Detail</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.teal} />
        }
      >
        <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
          <View style={styles.metaRow}>
            <View style={[styles.typePill, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.typeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            {note.is_private && (
              <View style={[styles.privatePill, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="lock-closed" size={11} color="#7C3AED" />
                <Text style={styles.privateText}>Private</Text>
              </View>
            )}
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>{note.title}</Text>

          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {note.created_at ? formatShortDate(note.created_at) : '—'}
            {note.created_at ? ` · ${formatRelative(note.created_at)}` : ''}
          </Text>

          {note.doctor_name && (
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              By {note.doctor_name}
            </Text>
          )}

          {note.appointment_id != null && (
            <Text style={[styles.meta, { color: colors.teal }]}>
              Linked to appointment #{note.appointment_id}
            </Text>
          )}
        </View>

        <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.teal }]}>CONTENT</Text>
          <Text style={[styles.content, { color: colors.textPrimary }]}>
            {note.content ?? 'No content.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[3] },
  errorText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.nunitoSemiBold,
    fontSize: 18,
  },
  scroll: { padding: Spacing[5], gap: Spacing[3], paddingBottom: Spacing[8] },
  card: { borderRadius: Radius.lg, padding: Spacing[4] },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing[3] },
  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  typeText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs },
  privatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  privateText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs, color: '#7C3AED' },
  title: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 22,
    marginBottom: Spacing[2],
  },
  meta: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  sectionLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
  },
  content: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.base,
    lineHeight: 24,
  },
});
