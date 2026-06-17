import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { createDoctorNote } from '@/api/doctorNotes';
import { LuminaButton, LuminaInput } from '@/components/lumina/LuminaButton';
import { LuminaCard } from '@/components/lumina/LuminaCard';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { TabBar } from '@/components/lumina/MetricCard';
import { LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

const NOTE_TYPES = [
  { key: 'consultation', label: 'Consultation' },
  { key: 'follow_up', label: 'Follow-Up' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'observation', label: 'Observation' },
] as const;

type NoteType = (typeof NOTE_TYPES)[number]['key'];

export default function CreateNoteScreen() {
  const { patientId, appointmentId } = useLocalSearchParams<{ patientId: string; appointmentId?: string }>();
  const router = useRouter();
  const { colors } = useLuminaTheme();
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
      <ScreenHeader title="Clinical Note" />
      <TabBar tabs={NOTE_TYPES.map((t) => ({ key: t.key, label: t.label }))} active={noteType} onChange={setNoteType} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <LuminaCard>
          <LuminaInput label="Title" value={title} onChangeText={setTitle} placeholder="Brief summary" />
          <LuminaInput label="Clinical observation" value={content} onChangeText={setContent} multiline placeholder="Examination findings, assessment..." />
          <LuminaInput label="Follow-up instructions" value={followUpInstructions} onChangeText={setFollowUpInstructions} multiline />
        </LuminaCard>
        <LuminaButton label="Save Note" onPress={() => {
          if (!title.trim() || !content.trim()) {
            Alert.alert('Required', 'Title and clinical observation are required.');
            return;
          }
          createMutation.mutate();
        }} loading={createMutation.isPending} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: LuminaSpacing.lg, gap: LuminaSpacing.md, paddingBottom: 40 },
});
