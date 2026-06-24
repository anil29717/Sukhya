import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createDoctorNote } from '@/api/doctorNotes';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaFontFamily, LuminaRadius, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

const NOTE_TYPES = [
  { key: 'consultation', label: 'Consultation', color: '#0D9B76', bg: '#E6F7F2' },
  { key: 'follow_up', label: 'Follow-up', color: '#F79009', bg: '#FEF3C7' },
  { key: 'diagnosis', label: 'Diagnosis', color: '#0BA5EC', bg: '#E0F2FE' },
  { key: 'observation', label: 'Observation', color: '#12B76A', bg: '#DCFCE7' },
] as const;

type NoteType = (typeof NOTE_TYPES)[number]['key'];

function NoteTypeChip({
  label,
  active,
  color,
  bg,
  onPress,
  inactiveTextColor,
  inactiveBorderColor,
}: {
  label: string;
  active: boolean;
  color: string;
  bg: string;
  onPress: () => void;
  inactiveTextColor: string;
  inactiveBorderColor: string;
}) {
  return (
    <Pressable
      onPress={() => { triggerHaptic('light'); onPress(); }}
      style={[
        chipStyles.chip,
        {
          backgroundColor: active ? bg : 'transparent',
          borderColor: active ? color : inactiveBorderColor,
        },
      ]}
    >
      <Text
        style={[chipStyles.text, { color: active ? color : inactiveTextColor }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 9999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 13,
  },
});

export default function CreateNoteScreen() {
  const { patientId, appointmentId } = useLocalSearchParams<{ patientId: string; appointmentId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme({ role: 'doctor' });
  const [noteType, setNoteType] = useState<NoteType>('consultation');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      createDoctorNote({
        patient_id: parseInt(patientId!, 10),
        appointment_id: appointmentId ? parseInt(appointmentId, 10) : undefined,
        note_type: noteType,
        title: title.trim(),
        content: followUpInstructions ? `${content}\n\nFollow-up: ${followUpInstructions}` : content,
      }),
    onSuccess: () => {
      router.replace({ pathname: '/(doctor)/success', params: { type: 'note_saved' } });
    },
    onError: () => Alert.alert('Error', 'Could not save note. Ensure you have consultation access with this patient.'),
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Clinical Note" role="doctor" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
        style={styles.chipBar}
      >
        {NOTE_TYPES.map((t) => (
          <NoteTypeChip
            key={t.key}
            label={t.label}
            active={noteType === t.key}
            color={t.color}
            bg={t.bg}
            onPress={() => setNoteType(t.key)}
            inactiveTextColor={colors.textSecondary}
            inactiveBorderColor={colors.border}
          />
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LuminaCard>
          <LuminaInput label="Title" value={title} onChangeText={setTitle} placeholder="Brief summary" />
          <LuminaInput
            label="Clinical observation"
            value={content}
            onChangeText={setContent}
            multiline
            placeholder="Examination findings, assessment..."
          />
          <LuminaInput
            label="Follow-up instructions"
            value={followUpInstructions}
            onChangeText={setFollowUpInstructions}
            multiline
          />
        </LuminaCard>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <LuminaButton
          label="Save Note"
          role="doctor"
          onPress={() => {
            if (!title.trim() || !content.trim()) {
              Alert.alert('Required', 'Title and clinical observation are required.');
              return;
            }
            createMutation.mutate();
          }}
          loading={createMutation.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chipBar: { flexGrow: 0, marginBottom: LuminaSpacing.sm },
  chipScroll: {
    paddingHorizontal: LuminaSpacing.xl,
    gap: 8,
    paddingVertical: LuminaSpacing.sm,
  },
  scroll: { paddingHorizontal: LuminaSpacing.xl, gap: LuminaSpacing.md },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
