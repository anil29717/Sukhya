import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';

// ─── API ──────────────────────────────────────────────────────────
const createNote = (payload) =>
  apiFetch('/doctor-notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// ─── Note types ───────────────────────────────────────────────────
const NOTE_TYPES = [
  { value: 'consultation', label: 'Consultation', color: '#0D9B76', bg: '#E6F7F2' },
  { value: 'diagnosis',    label: 'Diagnosis',    color: '#0BA5EC', bg: '#E0F2FE' },
  { value: 'follow_up',    label: 'Follow-up',    color: '#F79009', bg: '#FEF3C7' },
  { value: 'observation',  label: 'Observation',  color: '#12B76A', bg: '#DCFCE7' },
  { value: 'private',      label: 'Private',      color: '#7C3AED', bg: '#EDE9FE' },
];

// ─── Type chip ────────────────────────────────────────────────────
function TypeChip({ item, active, onPress }) {
  return (
    <TouchableOpacity
      style={[
        chipS.chip,
        {
          backgroundColor: active ? item.bg : 'transparent',
          borderColor: active ? item.color : '#E9ECEF',
          borderWidth: 1.5,
        },
      ]}
      onPress={() => onPress(item.value)}
      activeOpacity={0.8}
    >
      <Text style={[chipS.text, { color: active ? item.color : '#868E96' }]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

const chipS = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function CreateNoteScreen({ navigation, route }) {
  const { patientId, patientName, appointmentId } = route.params ?? {};
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();

  const [noteType, setNoteType]       = useState('consultation');
  const [title, setTitle]             = useState('');
  const [content, setContent]         = useState('');
  const [isVisible, setIsVisible]     = useState(true);
  const [titleFocused, setTitleFocused]   = useState(false);
  const [contentFocused, setContentFocused] = useState(false);

  const selectedType = NOTE_TYPES.find((t) => t.value === noteType);
  const isPrivate = noteType === 'private';
  const charCount = content.length;
  const hasContent = title.trim().length > 0 && content.trim().length > 0;

  const mutation = useMutation({
    mutationFn: () =>
      createNote({
        patient_id:     patientId,
        appointment_id: appointmentId ?? undefined,
        note_type:      noteType,
        title:          title.trim(),
        content:        content.trim(),
        is_private:     isPrivate || !isVisible,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-notes'] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline', patientId] });
      navigation.goBack();
    },
    onError: (err) => {
      Alert.alert('Error', err.message ?? 'Failed to save note. Please try again.');
    },
  });

  const handleBack = () => {
    if (hasContent) {
      Alert.alert(
        'Discard note?',
        'Your note has unsaved content. Are you sure you want to go back?',
        [
          { text: 'Keep editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>New Note</Text>
          <TouchableOpacity
            onPress={() => mutation.mutate()}
            disabled={!hasContent || mutation.isPending}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color={colors.teal} />
            ) : (
              <Text style={[
                styles.saveBtn,
                { color: hasContent ? colors.teal : colors.textSecondary },
              ]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Patient context strip */}
          {patientName && (
            <View style={[styles.contextStrip, { backgroundColor: colors.tealLight }]}>
              <View style={[styles.contextAvatar, { backgroundColor: colors.teal }]}>
                <Text style={styles.contextAvatarText}>
                  {patientName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[styles.contextFor, { color: colors.teal }]}>For: {patientName}</Text>
                {appointmentId && (
                  <Text style={[styles.contextAppt, { color: colors.tealDark ?? colors.teal }]}>
                    Linked to appointment #{appointmentId}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Note type selector */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.teal }]}>NOTE TYPE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
            >
              {NOTE_TYPES.map((t) => (
                <TypeChip
                  key={t.value}
                  item={t}
                  active={noteType === t.value}
                  onPress={setNoteType}
                />
              ))}
            </ScrollView>

            {/* Private warning */}
            {isPrivate && (
              <View style={[styles.privateWarn, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="lock-closed-outline" size={14} color="#B45309" />
                <Text style={[styles.privateWarnText, { color: '#B45309' }]}>
                  This note will not be visible to the patient.
                </Text>
              </View>
            )}
          </View>

          {/* Title */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.teal }]}>TITLE</Text>
            <View
              style={[
                styles.inputWrap,
                {
                  backgroundColor: colors.bg,
                  borderColor: titleFocused ? colors.teal : colors.border,
                  borderWidth: titleFocused ? 1.5 : 1,
                },
              ]}
            >
              <TextInput
                style={[styles.titleInput, { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular }]}
                placeholder="e.g. Initial consultation summary"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
                onFocus={() => setTitleFocused(true)}
                onBlur={() => setTitleFocused(false)}
                autoCapitalize="sentences"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Content */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionLabel, { color: colors.teal }]}>NOTE CONTENT</Text>
            <View
              style={[
                styles.contentWrap,
                {
                  backgroundColor: colors.bg,
                  borderColor: contentFocused ? colors.teal : colors.border,
                  borderWidth: contentFocused ? 1.5 : 1,
                },
              ]}
            >
              <TextInput
                style={[styles.contentInput, { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular }]}
                placeholder="Write your clinical notes here..."
                placeholderTextColor={colors.textSecondary}
                value={content}
                onChangeText={setContent}
                onFocus={() => setContentFocused(true)}
                onBlur={() => setContentFocused(false)}
                multiline
                textAlignVertical="top"
                autoCapitalize="sentences"
              />
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                {charCount} / 2000
              </Text>
            </View>
          </View>

          {/* Visibility toggle */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                  Visible to patient
                </Text>
                <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                  Patient can read this note in their app
                </Text>
              </View>
              <Switch
                value={isPrivate ? false : isVisible}
                onValueChange={isPrivate ? undefined : setIsVisible}
                trackColor={{ false: colors.border, true: colors.teal }}
                thumbColor="#FFFFFF"
                disabled={isPrivate}
              />
            </View>
            {isPrivate && (
              <Text style={[styles.toggleHint, { color: colors.textSecondary }]}>
                Private notes are always hidden from patients.
              </Text>
            )}
          </View>

          {/* Linked appointment */}
          {appointmentId && (
            <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                    Linked appointment
                  </Text>
                  <Text style={[styles.toggleDesc, { color: colors.teal }]}>
                    Appointment #{appointmentId}
                  </Text>
                </View>
                <TouchableOpacity>
                  <Text style={[styles.changeLink, { color: colors.teal }]}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.saveFullBtn,
              { backgroundColor: hasContent && !mutation.isPending ? colors.coral : colors.border },
            ]}
            onPress={() => mutation.mutate()}
            disabled={!hasContent || mutation.isPending}
            activeOpacity={0.88}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveFullBtnText}>Save Note</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: Spacing[8] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.nunitoBold, fontSize: 18, flex: 1, textAlign: 'center' },
  saveBtn: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base },

  scroll: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4] },

  contextStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: Radius.md,
    marginBottom: Spacing[3],
  },
  contextAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  contextAvatarText: { fontFamily: FontFamily.nunitoBold, fontSize: 14, color: '#FFFFFF' },
  contextFor: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base },
  contextAppt: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, marginTop: 1 },

  card: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3] },
  sectionLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
  },

  privateWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing[3],
    borderRadius: Radius.sm,
    marginTop: Spacing[3],
  },
  privateWarnText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm, flex: 1 },

  inputWrap: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
    height: 52,
    justifyContent: 'center',
  },
  titleInput: { fontSize: FontSize.base, height: '100%' },

  contentWrap: {
    borderRadius: Radius.sm,
    padding: Spacing[3],
    minHeight: 180,
  },
  contentInput: {
    fontSize: FontSize.base,
    lineHeight: 24,
    minHeight: 140,
  },
  charCount: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    textAlign: 'right',
    marginTop: Spacing[2],
  },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  toggleLabel: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base, marginBottom: 2 },
  toggleDesc: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },
  toggleHint: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, marginTop: Spacing[2] },
  changeLink: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm },

  saveFullBtn: {
    height: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  saveFullBtnText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.md,
    color: '#FFFFFF',
  },
});