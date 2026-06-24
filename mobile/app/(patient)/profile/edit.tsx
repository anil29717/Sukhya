import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getMyPatientProfile, updateMyProfile } from '@/api/patients';
import { client } from '@/api/client';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function ProfileField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  colors,
  focused,
  onFocus,
  onBlur,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <View style={fieldStyles.block}>
      <Text style={[fieldStyles.label, { color: colors.textBody }]}>{label}</Text>
      <View
        style={[
          fieldStyles.wrap,
          LuminaShadow.sm,
          {
            backgroundColor: colors.neutral100,
            borderColor: focused ? colors.coral : 'transparent',
            borderWidth: focused ? 1.5 : 0,
          },
        ]}
      >
        <View style={[fieldStyles.iconWrap, { backgroundColor: focused ? colors.coralSoft : colors.surface }]}>
          <Ionicons name={icon} size={16} color={focused ? colors.coral : colors.textSecondary} />
        </View>
        <TextInput
          style={[fieldStyles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textHint}
          keyboardType={keyboardType}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  block: { marginBottom: LuminaSpacing.lg },
  label: { fontFamily: LuminaFontFamily.dmSansMedium, fontSize: 13, marginBottom: 8 },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: LuminaRadius.xl,
    paddingHorizontal: 6,
    height: 56,
    gap: 4,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 15,
    paddingRight: 12,
    paddingVertical: 0,
  },
});

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'patient' });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-me'],
    queryFn: getMyPatientProfile,
  });

  useEffect(() => {
    if (patient) {
      setFullName(patient.user.full_name);
      setPhone(patient.user.phone ?? '');
      setBloodGroup(patient.blood_group ?? '');
    }
  }, [patient]);

  const mutation = useMutation({
    mutationFn: async () => {
      await client.put('/users/me', { full_name: fullName, phone: phone || null });
      await updateMyProfile({ blood_group: bloodGroup || undefined });
    },
    onSuccess: () => {
      triggerHaptic('medium');
      queryClient.invalidateQueries({ queryKey: ['patient-me'] });
      router.back();
    },
  });

  const canSave = !!fullName.trim();
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Edit Profile" role="patient" />
        <LoadingSkeleton count={3} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Edit Profile" subtitle="Update your personal details" role="patient" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar preview */}
          <View style={[styles.previewCard, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
            <View style={[styles.previewAvatar, { backgroundColor: colors.coralSoft }]}>
              <Text style={[styles.previewInitials, { color: colors.coral }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={1}>
                {fullName || 'Your name'}
              </Text>
              <Text style={[styles.previewSub, { color: colors.textSecondary }]}>
                Changes apply to your health profile
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.coral }]}>PERSONAL INFO</Text>
          <ProfileField
            label="Full name"
            icon="person-outline"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            colors={colors}
            focused={nameFocused}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
          />
          <ProfileField
            label="Phone number"
            icon="call-outline"
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            colors={colors}
            focused={phoneFocused}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
          />

          <Text style={[styles.sectionLabel, { color: colors.coral }]}>BLOOD GROUP</Text>
          <View style={styles.bloodGrid}>
            {BLOOD_GROUPS.map((bg) => {
              const selected = bloodGroup === bg;
              return (
                <Pressable
                  key={bg}
                  onPress={() => { triggerHaptic('light'); setBloodGroup(bg); }}
                  style={[
                    styles.bloodChip,
                    LuminaShadow.sm,
                    {
                      backgroundColor: selected ? colors.tealSoft : colors.neutral100,
                      borderColor: selected ? colors.teal : 'transparent',
                      borderWidth: selected ? 1.5 : 0,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.bloodChipText,
                      { color: selected ? colors.teal : colors.textSecondary },
                      selected && { fontFamily: LuminaFontFamily.dmSansSemiBold },
                    ]}
                  >
                    {bg}
                  </Text>
                  {selected ? (
                    <View style={[styles.bloodCheck, { backgroundColor: colors.teal }]}>
                      <Ionicons name="checkmark" size={8} color="#FFFFFF" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.tipBanner, { backgroundColor: colors.tealSoft, borderColor: colors.teal + '33' }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.teal} />
            <Text style={[styles.tipText, { color: colors.teal }]}>
              Your profile is encrypted and stored securely under DPDPA 2023.
            </Text>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <Pressable
            onPress={() => canSave && mutation.mutate()}
            disabled={!canSave || mutation.isPending}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: canSave ? colors.coral : colors.neutral100,
                opacity: pressed && canSave ? 0.92 : 1,
              },
              canSave && styles.saveBtnShadow,
            ]}
          >
            <Text
              style={[
                styles.saveBtnText,
                { color: canSave ? '#FFFFFF' : colors.textMuted },
              ]}
            >
              {mutation.isPending ? 'Saving…' : 'Save changes'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  scroll: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingBottom: LuminaSpacing.lg,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: LuminaSpacing.lg,
    borderRadius: LuminaRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    marginBottom: LuminaSpacing.lg,
  },
  previewAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInitials: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 20 },
  previewName: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 16 },
  previewSub: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 12, marginTop: 2 },
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: LuminaSpacing.lg,
  },
  bloodChip: {
    width: '22%',
    flexGrow: 1,
    minWidth: '21%',
    maxWidth: '24%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: LuminaRadius.lg,
    position: 'relative',
  },
  bloodChipText: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 14 },
  bloodCheck: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: LuminaSpacing.xl,
    paddingTop: LuminaSpacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: LuminaRadius.lg,
  },
  saveBtnShadow: {
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnText: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 16 },
});
