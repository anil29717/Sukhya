import React, { useState } from 'react';
import {
  Alert,
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { createVital } from '@/api/medications';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { useActivePatient } from '@/hooks/useActivePatient';
import { LuminaFontFamily, LuminaRadius, LuminaShadow, LuminaSpacing } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { VITAL_TYPES } from '@/utils/vitalTypes';
import { triggerHaptic } from '@/utils/haptics';

export default function AddVitalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors } = useLuminaTheme({ role: 'patient' });
  const { activePatientId } = useActivePatient();

  const [vitalType, setVitalType] = useState('blood_pressure');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [valueFocused, setValueFocused] = useState(false);
  const [notesFocused, setNotesFocused] = useState(false);

  const selected = VITAL_TYPES.find((v) => v.key === vitalType)!;
  const canSave = !!value.trim();

  const mutation = useMutation({
    mutationFn: () =>
      createVital({
        vital_type: vitalType,
        value: value.trim(),
        unit: selected.unit,
        notes: notes.trim() || undefined,
        patient_id: activePatientId ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitals'] });
      triggerHaptic('medium');
      router.back();
    },
    onError: () => Alert.alert('Error', 'Could not save vital reading.'),
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Add Vital Reading" subtitle="Log a new health measurement" role="patient" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.body}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionLabel, { color: colors.coral }]}>VITAL TYPE</Text>
          <View style={styles.typeGrid}>
            {VITAL_TYPES.map((t) => {
              const isSelected = vitalType === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => { triggerHaptic('light'); setVitalType(t.key); }}
                  style={[
                    styles.typeTile,
                    LuminaShadow.sm,
                    {
                      backgroundColor: isSelected ? t.bg : colors.neutral100,
                      borderColor: isSelected ? t.color + '55' : 'transparent',
                      borderWidth: isSelected ? 1.5 : 0,
                    },
                  ]}
                >
                  <View style={[styles.typeIcon, { backgroundColor: isSelected ? t.color + '22' : t.bg }]}>
                    <Ionicons name={t.icon} size={18} color={t.color} />
                  </View>
                  <Text
                    style={[
                      styles.typeLabel,
                      { color: isSelected ? t.color : colors.textSecondary },
                      isSelected && { fontFamily: LuminaFontFamily.dmSansMedium },
                    ]}
                    numberOfLines={2}
                  >
                    {t.label}
                  </Text>
                  {isSelected ? (
                    <View style={[styles.typeCheck, { backgroundColor: t.color }]}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.coral }]}>READING</Text>
          <View style={styles.inputBlock}>
            <Text style={[styles.inputLabel, { color: colors.textBody }]}>
              Value <Text style={{ color: colors.textMuted }}>({selected.unit})</Text>
            </Text>
            <View
              style={[
                styles.valueWrap,
                LuminaShadow.sm,
                {
                  backgroundColor: colors.neutral100,
                  borderColor: valueFocused ? colors.coral : 'transparent',
                  borderWidth: valueFocused ? 1.5 : 0,
                },
              ]}
            >
              <TextInput
                style={[styles.valueInput, { color: colors.text }]}
                value={value}
                onChangeText={setValue}
                placeholder={selected.placeholder}
                placeholderTextColor={colors.textHint}
                keyboardType={vitalType === 'blood_pressure' ? 'numbers-and-punctuation' : 'decimal-pad'}
                onFocus={() => setValueFocused(true)}
                onBlur={() => setValueFocused(false)}
                autoFocus
              />
              <Text style={[styles.valueUnit, { color: colors.textMuted }]}>{selected.unit}</Text>
            </View>
            <Text style={[styles.inputHint, { color: colors.textMuted }]}>
              e.g. {selected.placeholder} for {selected.label.toLowerCase()}
            </Text>
          </View>

          <View style={styles.inputBlock}>
            <Text style={[styles.inputLabel, { color: colors.textBody }]}>
              Notes{' '}
              <Text style={{ color: colors.textMuted, fontFamily: LuminaFontFamily.dmSansRegular }}>
                (optional)
              </Text>
            </Text>
            <View
              style={[
                styles.notesWrap,
                {
                  backgroundColor: colors.neutral100,
                  borderColor: notesFocused ? colors.coral : 'transparent',
                  borderWidth: notesFocused ? 1.5 : 0,
                },
              ]}
            >
              <TextInput
                style={[styles.notesInput, { color: colors.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="How are you feeling?"
                placeholderTextColor={colors.textHint}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                onFocus={() => setNotesFocused(true)}
                onBlur={() => setNotesFocused(false)}
              />
            </View>
          </View>

          <View style={[styles.tipBanner, { backgroundColor: colors.tealSoft, borderColor: colors.teal + '33' }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.teal} />
            <Text style={[styles.tipText, { color: colors.teal }]}>
              Regular readings help your doctor spot trends and adjust your care plan.
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
            {mutation.isPending ? (
              <Text style={[styles.saveBtnText, { color: '#FFFFFF' }]}>Saving…</Text>
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={canSave ? '#FFFFFF' : colors.textMuted}
                />
                <Text
                  style={[
                    styles.saveBtnText,
                    { color: canSave ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  Save Reading
                </Text>
              </>
            )}
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
  sectionLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: LuminaSpacing.lg,
  },
  typeTile: {
    width: '31%',
    flexGrow: 1,
    minWidth: '30%',
    maxWidth: '33%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: LuminaRadius.lg,
    gap: 6,
    position: 'relative',
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: LuminaRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  typeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBlock: { marginBottom: LuminaSpacing.lg },
  inputLabel: {
    fontFamily: LuminaFontFamily.dmSansMedium,
    fontSize: 13,
    marginBottom: 8,
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: LuminaRadius.xl,
    paddingHorizontal: 16,
    height: 64,
    gap: 8,
  },
  valueInput: {
    flex: 1,
    fontFamily: LuminaFontFamily.dmMonoMedium,
    fontSize: 28,
    letterSpacing: -0.5,
    padding: 0,
  },
  valueUnit: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 14,
  },
  inputHint: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
  },
  notesWrap: {
    borderRadius: LuminaRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 88,
  },
  notesInput: {
    fontFamily: LuminaFontFamily.dmSansRegular,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 64,
    padding: 0,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: LuminaRadius.lg,
    borderWidth: 1,
    marginBottom: LuminaSpacing.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: LuminaRadius.lg,
    gap: 8,
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
  },
});
