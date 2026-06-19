import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { listFamilyMembers } from '@/api/family';
import { useActivePatient } from '@/hooks/useActivePatient';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { triggerHaptic } from '@/utils/haptics';

export function FamilySwitcher() {
  const { colors } = useLuminaTheme();
  const { activePatientName, guardianPatientId, activePatientId, switchToGuardian, switchToFamilyMember } =
    useActivePatient();
  const [open, setOpen] = useState(false);

  const { data: members } = useQuery({
    queryKey: ['family-members'],
    queryFn: listFamilyMembers,
    enabled: !!guardianPatientId,
  });

  if (!guardianPatientId) return null;

  const initials = (activePatientName ?? 'Y').charAt(0).toUpperCase();

  return (
    <>
      <Pressable
        style={[styles.chip, { backgroundColor: colors.primarySoft, borderColor: colors.borderSubtle }]}
        onPress={() => {
          triggerHaptic('light');
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Switch family profile"
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Viewing as</Text>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {activePatientName}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surfaceElevated }, LuminaShadow.lg]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Switch profile</Text>
            <ScrollView>
              <ProfileRow
                name="You (primary)"
                subtitle="Guardian account"
                active={activePatientId === guardianPatientId}
                onPress={async () => {
                  await switchToGuardian();
                  triggerHaptic('success');
                  setOpen(false);
                }}
                colors={colors}
              />
              {(members ?? []).map((m) => (
                <ProfileRow
                  key={m.id}
                  name={m.nickname || m.full_name}
                  subtitle={m.relationship}
                  active={activePatientId === m.dependent?.patient_id}
                  onPress={async () => {
                    const pid = m.dependent?.patient_id;
                    if (pid) {
                      await switchToFamilyMember(pid, m.nickname || m.full_name);
                      triggerHaptic('success');
                      setOpen(false);
                    }
                  }}
                  colors={colors}
                />
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function ProfileRow({
  name,
  subtitle,
  active,
  onPress,
  colors,
}: {
  name: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
}) {
  return (
    <Pressable
      style={[styles.row, active && { backgroundColor: colors.primarySoft }]}
      onPress={onPress}
      accessibilityState={{ selected: active }}
    >
      <View style={[styles.rowAvatar, { backgroundColor: active ? colors.primary : colors.secondarySoft }]}>
        <Text style={{ color: active ? colors.onPrimary : colors.secondary, fontWeight: '700' }}>{name.charAt(0)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowName, { color: colors.text }]}>{name}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>{subtitle}</Text>
      </View>
      {active ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.md,
    padding: LuminaSpacing.md,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    marginBottom: LuminaSpacing.lg,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  label: { ...LuminaTypography.overline, fontSize: 10 },
  name: { ...LuminaTypography.h3, fontSize: 15 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: LuminaRadius.xxl, borderTopRightRadius: LuminaRadius.xxl, padding: LuminaSpacing.xxl, maxHeight: '70%' },
  sheetTitle: { ...LuminaTypography.h2, marginBottom: LuminaSpacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: LuminaSpacing.md, padding: LuminaSpacing.md, borderRadius: LuminaRadius.md },
  rowAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontWeight: '600', fontSize: 16 },
});
