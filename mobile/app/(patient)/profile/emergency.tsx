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
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

function ContactField({
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

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'patient' });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-me'],
    queryFn: getMyPatientProfile,
  });

  useEffect(() => {
    if (patient) {
      setName(patient.emergency_contact_name ?? '');
      setPhone(patient.emergency_contact_phone ?? '');
    }
  }, [patient]);

  const mutation = useMutation({
    mutationFn: () =>
      updateMyProfile({
        emergency_contact_name: name,
        emergency_contact_phone: phone,
      }),
    onSuccess: () => {
      triggerHaptic('medium');
      queryClient.invalidateQueries({ queryKey: ['patient-me'] });
      router.back();
    },
  });

  const canSave = !!name.trim() && !!phone.trim();
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Emergency Contacts" role="patient" />
        <LoadingSkeleton count={3} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Emergency Contacts"
        subtitle="Who to reach in an emergency"
        role="patient"
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroCard, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
            <View style={[styles.heroIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="call-outline" size={28} color="#F04438" />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Primary contact</Text>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
              Stored on your patient profile. Family members manage their own contacts separately.
            </Text>
          </View>

          {name ? (
            <View style={[styles.previewCard, LuminaShadow.sm, { backgroundColor: colors.surface }]}>
              <View style={[styles.previewAvatar, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.previewInitials, { color: '#F04438' }]}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={[styles.previewPhone, { color: colors.textSecondary }]}>
                  {phone || 'Add phone number'}
                </Text>
              </View>
              <View style={[styles.emergencyBadge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.emergencyBadgeText, { color: '#F04438' }]}>SOS</Text>
              </View>
            </View>
          ) : null}

          <Text style={[styles.sectionLabel, { color: colors.coral }]}>CONTACT DETAILS</Text>

          <ContactField
            label="Contact name"
            icon="person-outline"
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            colors={colors}
            focused={nameFocused}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
          />
          <ContactField
            label="Contact phone"
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

          <View style={[styles.tipBanner, { backgroundColor: colors.tealSoft, borderColor: colors.teal + '33' }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.teal} />
            <Text style={[styles.tipText, { color: colors.teal }]}>
              Only shared with your care team during emergencies. Never sold or used for marketing.
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
            <Text style={[styles.saveBtnText, { color: canSave ? '#FFFFFF' : colors.textMuted }]}>
              {mutation.isPending ? 'Saving…' : 'Save contact'}
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
  heroCard: {
    alignItems: 'center',
    padding: LuminaSpacing.xl,
    borderRadius: LuminaRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    marginBottom: LuminaSpacing.lg,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: LuminaFontFamily.nunitoBold,
    fontSize: 18,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: LuminaSpacing.lg,
    borderRadius: LuminaRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    marginBottom: LuminaSpacing.lg,
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewInitials: { fontFamily: LuminaFontFamily.nunitoBold, fontSize: 16 },
  previewName: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 15 },
  previewPhone: { fontFamily: LuminaFontFamily.dmMonoMedium, fontSize: 13, marginTop: 2 },
  emergencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: LuminaRadius.full,
  },
  emergencyBadgeText: { fontFamily: LuminaFontFamily.dmSansBold, fontSize: 10, letterSpacing: 0.5 },
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
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
