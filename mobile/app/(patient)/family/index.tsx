import React, { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { listFamilyMembers, createFamilyMember, deleteFamilyMember } from '@/api/family';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingState } from '@/components/lumina/ErrorState';
import { LuminaButton } from '@/components/lumina/LuminaButton';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaRadius, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

const RELATIONSHIPS = ['parent', 'child', 'spouse', 'sibling', 'other'];

export default function FamilyScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme();
  const { switchToFamilyMember, switchToGuardian, activePatientId, guardianPatientId } = useActivePatient();
  const [modalVisible, setModalVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('child');

  const { data: members, isLoading } = useQuery({ queryKey: ['family-members'], queryFn: listFamilyMembers });

  const createMutation = useMutation({
    mutationFn: () => createFamilyMember({ full_name: fullName, relationship }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
      setModalVisible(false);
      setFullName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFamilyMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family-members'] }),
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Family Management" />
      <Pressable style={[styles.selfCard, { backgroundColor: colors.accentTealLight, borderColor: colors.accentTeal }]} onPress={switchToGuardian}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>My Profile {activePatientId === guardianPatientId ? '(Active)' : ''}</Text>
      </Pressable>
      {isLoading ? (
        <LoadingState />
      ) : !members?.length ? (
        <EmptyState icon="people-outline" title="No family members" actionLabel="Add Member" onAction={() => setModalVisible(true)} />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push(`/(patient)/family/${item.id}`)}>
              <View style={[styles.avatar, { backgroundColor: colors.accentBlue }]}>
                <Ionicons name="person" size={24} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: colors.text }]}>{item.full_name}</Text>
                <Text style={{ color: colors.textSecondary, textTransform: 'capitalize' }}>{item.relationship}</Text>
              </View>
              <Pressable
                onPress={() => {
                  const pid = item.dependent?.patient_id;
                  if (pid) switchToFamilyMember(pid, item.full_name);
                }}
              >
                <Text style={{ color: colors.accentTeal, fontWeight: '600', fontSize: 12 }}>Switch</Text>
              </Pressable>
            </Pressable>
          )}
        />
      )}
      <View style={styles.fab}>
        <LuminaButton label="Add Family Member" icon="add" onPress={() => setModalVisible(true)} />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Family Member</Text>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} placeholder="Full name" placeholderTextColor={colors.textMuted} value={fullName} onChangeText={setFullName} />
            <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>{RELATIONSHIPS.map((r) => (
              <Pressable key={r} style={[styles.relChip, { backgroundColor: relationship === r ? colors.navy : colors.background, borderColor: colors.border }]} onPress={() => setRelationship(r)}>
                <Text style={{ color: relationship === r ? colors.onPrimary : colors.text, textTransform: 'capitalize' }}>{r}</Text>
              </Pressable>
            ))}</ScrollView>
            <LuminaButton label="Add Member" onPress={() => createMutation.mutate()} loading={createMutation.isPending} />
            <Pressable onPress={() => setModalVisible(false)}><Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 12 }}>Cancel</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  selfCard: { margin: LuminaSpacing.lg, padding: LuminaSpacing.md, borderRadius: LuminaRadius.md, borderWidth: 1 },
  list: { padding: LuminaSpacing.lg, paddingBottom: 100, gap: LuminaSpacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.md, padding: LuminaSpacing.lg, borderRadius: LuminaRadius.lg, borderWidth: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  name: { ...LuminaTypography.h3 },
  fab: { position: 'absolute', bottom: 24, left: LuminaSpacing.lg, right: LuminaSpacing.lg },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { padding: LuminaSpacing.xl, borderTopLeftRadius: LuminaRadius.xl, borderTopRightRadius: LuminaRadius.xl },
  modalTitle: { ...LuminaTypography.h2, marginBottom: LuminaSpacing.lg },
  input: { borderWidth: 1, borderRadius: LuminaRadius.md, padding: LuminaSpacing.md, marginBottom: LuminaSpacing.md },
  relChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: LuminaRadius.full, borderWidth: 1 },
});
