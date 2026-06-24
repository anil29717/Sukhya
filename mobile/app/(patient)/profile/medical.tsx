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

import { getMyPatientProfile, updateMedicalInfo } from '@/api/patients';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

type MedicalFieldProps = {
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  colors: ReturnType<typeof useLuminaTheme>['colors'];
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
};

function MedicalField({
  label,
  hint,
  icon,
  value,
  onChangeText,
  placeholder,
  colors,
  focused,
  onFocus,
  onBlur,
}: MedicalFieldProps) {
  return (
    <View style={fieldStyles.block}>
      <View style={fieldStyles.labelRow}>
        <Text style={[fieldStyles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[fieldStyles.hint, { color: colors.textMuted }]}>{hint}</Text>
      </View>
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
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  block: { marginBottom: LuminaSpacing.lg },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontFamily: LuminaFontFamily.dmSansSemiBold, fontSize: 14 },
  hint: { fontFamily: LuminaFontFamily.dmSansRegular, fontSize: 11 },
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: LuminaRadius.xl,
    padding: 6,
    gap: 4,
    minHeight: 120,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: LuminaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  input: {
    flex: 1,
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 12,
    paddingRight: 12,
    paddingBottom: 12,
    minHeight: 108,
  },
});

export default function MedicalInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'patient' });

  const [allergies, setAllergies] = useState('');
  const [history, setHistory] = useState('');
  const [conditions, setConditions] = useState('');
  const [focused, setFocused] = useState<'allergies' | 'history' | 'conditions' | null>(null);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-me'],
    queryFn: getMyPatientProfile,
  });

  useEffect(() => {
    if (patient) {
      setAllergies(patient.allergies ?? '');
      setHistory(patient.medical_history ?? '');
      setConditions(patient.existing_conditions ?? '');
    }
  }, [patient]);

  const mutation = useMutation({
    mutationFn: () =>
      updateMedicalInfo({
        allergies,
        medical_history: history,
        existing_conditions: conditions,
      }),
    onSuccess: () => {
      triggerHaptic('medium');
      queryClient.invalidateQueries({ queryKey: ['patient-me'] });
      router.back();
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Medical Information" role="patient" />
        <LoadingSkeleton count={3} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Medical Information"
        subtitle="Allergies, history & conditions"
        role="patient"
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.infoBanner, { backgroundColor: colors.tealSoft, borderColor: colors.teal + '33' }]}>
            <Ionicons name="medical-outline" size={18} color={colors.teal} />
            <Text style={[styles.infoText, { color: colors.teal }]}>
              This information is shared with your doctors during visits to help them provide safer care.
            </Text>
          </View>

          <Text style={[styles.sectionLabel, { color: colors.coral }]}>HEALTH RECORD</Text>

          <MedicalField
            label="Allergies"
            hint="Required for safety"
            icon="warning-outline"
            value={allergies}
            onChangeText={setAllergies}
            placeholder="e.g. Penicillin, shellfish, latex..."
            colors={colors}
            focused={focused === 'allergies'}
            onFocus={() => setFocused('allergies')}
            onBlur={() => setFocused(null)}
          />
          <MedicalField
            label="Medical history"
            hint="Past events"
            icon="time-outline"
            value={history}
            onChangeText={setHistory}
            placeholder="e.g. Appendectomy (2015), broken arm (2018)..."
            colors={colors}
            focused={focused === 'history'}
            onFocus={() => setFocused('history')}
            onBlur={() => setFocused(null)}
          />
          <MedicalField
            label="Chronic conditions"
            hint="Ongoing"
            icon="pulse-outline"
            value={conditions}
            onChangeText={setConditions}
            placeholder="e.g. Hypertension, Type 2 diabetes..."
            colors={colors}
            focused={focused === 'conditions'}
            onFocus={() => setFocused('conditions')}
            onBlur={() => setFocused(null)}
          />
        </ScrollView>

        <View
          style={[
            styles.footer,
            { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <Pressable
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.coral, opacity: pressed ? 0.92 : 1 },
              styles.saveBtnShadow,
            ]}
          >
            <Text style={styles.saveBtnText}>
              {mutation.isPending ? 'Saving…' : 'Update information'}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: LuminaRadius.xl,
    borderWidth: 1,
    marginBottom: LuminaSpacing.lg,
  },
  infoText: {
    flex: 1,
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: LuminaSpacing.md,
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
  saveBtnText: {
    fontFamily: LuminaFontFamily.dmSansSemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
