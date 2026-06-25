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
const createPrescription = (payload) =>
  apiFetch('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

const sharePrescription = (id) =>
  apiFetch(`/prescriptions/${id}/share`, { method: 'POST' });

// ─── Frequency options ────────────────────────────────────────────
const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Weekly',
];

// ─── Validity options ─────────────────────────────────────────────
const VALIDITY_OPTIONS = [
  { label: '7 days',  value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: 'Custom',  value: 0 },
];

// ─── Medicine row ─────────────────────────────────────────────────
function MedicineRow({ index, item, onChange, onRemove, canRemove, colors }) {
  const [nameFocused, setNameFocused]   = useState(false);
  const [doseFocused, setDoseFocused]   = useState(false);
  const [durFocused, setDurFocused]     = useState(false);
  const [instFocused, setInstFocused]   = useState(false);
  const [freqOpen, setFreqOpen]         = useState(false);

  const update = (field, value) => onChange(index, { ...item, [field]: value });

  return (
    <View style={[medS.card, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {/* Header row */}
      <View style={medS.headerRow}>
        <Text style={[medS.medNum, { color: colors.teal }]}>Medicine {index + 1}</Text>
        {canRemove && (
          <TouchableOpacity onPress={() => onRemove(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Medicine name */}
      <View
        style={[
          medS.input,
          { borderColor: nameFocused ? colors.teal : colors.border, borderWidth: nameFocused ? 1.5 : 1 },
        ]}
      >
        <TextInput
          style={[medS.inputText, { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular }]}
          placeholder="Medicine name"
          placeholderTextColor={colors.textSecondary}
          value={item.name}
          onChangeText={(v) => update('name', v)}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          autoCapitalize="words"
        />
      </View>

      {/* Dosage + Frequency + Duration */}
      <View style={medS.threeCol}>
        <View style={{ flex: 1 }}>
          <Text style={[medS.subLabel, { color: colors.textSecondary }]}>DOSAGE</Text>
          <View style={[medS.subInput, { borderColor: doseFocused ? colors.teal : colors.border, borderWidth: doseFocused ? 1.5 : 1 }]}>
            <TextInput
              style={[medS.subInputText, { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular }]}
              placeholder="10mg"
              placeholderTextColor={colors.textSecondary}
              value={item.dosage}
              onChangeText={(v) => update('dosage', v)}
              onFocus={() => setDoseFocused(true)}
              onBlur={() => setDoseFocused(false)}
            />
          </View>
        </View>

        <View style={{ flex: 1.4 }}>
          <Text style={[medS.subLabel, { color: colors.textSecondary }]}>FREQUENCY</Text>
          <TouchableOpacity
            style={[medS.subInput, medS.dropdownBtn, { borderColor: freqOpen ? colors.teal : colors.border, borderWidth: freqOpen ? 1.5 : 1 }]}
            onPress={() => setFreqOpen(!freqOpen)}
          >
            <Text
              style={[medS.subInputText, { color: item.frequency ? colors.textPrimary : colors.textSecondary, fontFamily: FontFamily.dmSansRegular }]}
              numberOfLines={1}
            >
              {item.frequency || 'Select'}
            </Text>
            <Ionicons name={freqOpen ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textSecondary} />
          </TouchableOpacity>
          {freqOpen && (
            <View style={[medS.dropdown, Shadow.md, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[medS.dropdownItem, { borderBottomColor: colors.border }, item.frequency === f && { backgroundColor: colors.tealLight }]}
                  onPress={() => { update('frequency', f); setFreqOpen(false); }}
                >
                  <Text style={[medS.dropdownText, { color: item.frequency === f ? colors.teal : colors.textPrimary }]}>{f}</Text>
                  {item.frequency === f && <Ionicons name="checkmark" size={14} color={colors.teal} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[medS.subLabel, { color: colors.textSecondary }]}>DURATION</Text>
          <View style={[medS.subInput, { borderColor: durFocused ? colors.teal : colors.border, borderWidth: durFocused ? 1.5 : 1 }]}>
            <TextInput
              style={[medS.subInputText, { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular }]}
              placeholder="7 days"
              placeholderTextColor={colors.textSecondary}
              value={item.duration}
              onChangeText={(v) => update('duration', v)}
              onFocus={() => setDurFocused(true)}
              onBlur={() => setDurFocused(false)}
            />
          </View>
        </View>
      </View>

      {/* Instructions */}
      <View style={[medS.instrInput, { borderColor: instFocused ? colors.teal : colors.border, borderWidth: instFocused ? 1.5 : 1 }]}>
        <TextInput
          style={[medS.instrText, { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular }]}
          placeholder="Instructions (e.g. Take after meals)"
          placeholderTextColor={colors.textSecondary}
          value={item.instructions}
          onChangeText={(v) => update('instructions', v)}
          onFocus={() => setInstFocused(true)}
          onBlur={() => setInstFocused(false)}
          autoCapitalize="sentences"
        />
      </View>
    </View>
  );
}

const medS = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing[3],
    marginBottom: Spacing[3],
    gap: Spacing[2],
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  medNum: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm },
  input: {
    height: 46,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
    justifyContent: 'center',
  },
  inputText: { fontSize: FontSize.base },
  threeCol: { flexDirection: 'row', gap: Spacing[2] },
  subLabel: { fontFamily: FontFamily.dmSansMedium, fontSize: 10, letterSpacing: 0.5, marginBottom: 4 },
  subInput: { height: 40, borderRadius: Radius.sm, paddingHorizontal: Spacing[2], justifyContent: 'center' },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subInputText: { fontSize: FontSize.sm, flex: 1 },
  dropdown: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    borderRadius: Radius.sm,
    borderWidth: 1,
    zIndex: 999,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[3],
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dropdownText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm },
  instrInput: {
    height: 40,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
    justifyContent: 'center',
  },
  instrText: { fontSize: FontSize.sm },
});

// ─── Section label ────────────────────────────────────────────────
function SectionLabel({ text, colors }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.teal }]}>{text}</Text>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function CreatePrescriptionScreen({ navigation, route }) {
  const { patientId, patientName, appointmentId } = route.params ?? {};
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();

  const [diagnosis, setDiagnosis]         = useState('');
  const [instructions, setInstructions]   = useState('');
  const [shareNow, setShareNow]           = useState(false);
  const [validityDays, setValidityDays]   = useState(30);
  const [followUpToggle, setFollowUpToggle] = useState(false);
  const [followUpDate, setFollowUpDate]   = useState('');
  const [diagFocused, setDiagFocused]     = useState(false);
  const [instFocused, setInstFocused]     = useState(false);

  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' },
  ]);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const updateMedicine = (index, updated) => {
    const copy = [...medicines];
    copy[index] = updated;
    setMedicines(copy);
  };

  const removeMedicine = (index) => {
    Alert.alert('Remove medicine?', 'This medicine will be removed from the prescription.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setMedicines(medicines.filter((_, i) => i !== index));
      }},
    ]);
  };

  const isValid = diagnosis.trim().length > 0 &&
    medicines.some((m) => m.name.trim().length > 0);

  const mutation = useMutation({
    mutationFn: async (shouldShare) => {
      const rx = await createPrescription({
        patient_id:     patientId,
        appointment_id: appointmentId ?? undefined,
        diagnosis:      diagnosis.trim(),
        medications:    medicines.filter((m) => m.name.trim().length > 0),
        instructions:   instructions.trim() || undefined,
        valid_days:     validityDays || undefined,
      });
      if (shouldShare && rx?.id) {
        await sharePrescription(rx.id);
      }
      return rx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline', patientId] });
      navigation.goBack();
    },
    onError: (err) => {
      Alert.alert('Error', err.message ?? 'Failed to save prescription. Please try again.');
    },
  });

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
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>New Prescription</Text>
          <TouchableOpacity
            onPress={() => mutation.mutate(false)}
            disabled={!isValid || mutation.isPending}
          >
            <Text style={[styles.saveBtn, { color: isValid ? colors.textSecondary : colors.border }]}>
              Draft
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Patient context */}
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
                    Appointment #{appointmentId}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Diagnosis */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <SectionLabel text="DIAGNOSIS" colors={colors} />
            <View
              style={[
                styles.inputWrap,
                { borderColor: diagFocused ? colors.teal : colors.border, borderWidth: diagFocused ? 1.5 : 1 },
              ]}
            >
              <TextInput
                style={[styles.inputText, { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular }]}
                placeholder="e.g. Seasonal allergic rhinitis"
                placeholderTextColor={colors.textSecondary}
                value={diagnosis}
                onChangeText={setDiagnosis}
                onFocus={() => setDiagFocused(true)}
                onBlur={() => setDiagFocused(false)}
                autoCapitalize="sentences"
                multiline
              />
            </View>
          </View>

          {/* Medications */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <SectionLabel text="MEDICATIONS" colors={colors} />
            {medicines.map((m, i) => (
              <MedicineRow
                key={i}
                index={i}
                item={m}
                onChange={updateMedicine}
                onRemove={removeMedicine}
                canRemove={medicines.length > 1}
                colors={colors}
              />
            ))}
            <TouchableOpacity
              style={[styles.addMedBtn, { borderColor: colors.teal, backgroundColor: colors.tealLight }]}
              onPress={addMedicine}
            >
              <Ionicons name="add" size={18} color={colors.teal} />
              <Text style={[styles.addMedText, { color: colors.teal }]}>Add another medicine</Text>
            </TouchableOpacity>
          </View>

          {/* Additional instructions */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <SectionLabel text="ADDITIONAL INSTRUCTIONS" colors={colors} />
            <View
              style={[
                styles.textareaWrap,
                { borderColor: instFocused ? colors.teal : colors.border, borderWidth: instFocused ? 1.5 : 1 },
              ]}
            >
              <TextInput
                style={[styles.textareaText, { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular }]}
                placeholder="General instructions, dietary advice, lifestyle notes..."
                placeholderTextColor={colors.textSecondary}
                value={instructions}
                onChangeText={setInstructions}
                onFocus={() => setInstFocused(true)}
                onBlur={() => setInstFocused(false)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                autoCapitalize="sentences"
              />
            </View>
          </View>

          {/* Validity */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <SectionLabel text="VALID FOR" colors={colors} />
            <View style={styles.validityRow}>
              {VALIDITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.validityChip,
                    {
                      backgroundColor: validityDays === opt.value ? colors.teal : colors.bg,
                      borderColor: validityDays === opt.value ? colors.teal : colors.border,
                    },
                  ]}
                  onPress={() => setValidityDays(opt.value)}
                >
                  <Text style={[
                    styles.validityText,
                    { color: validityDays === opt.value ? '#FFFFFF' : colors.textSecondary },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Follow-up */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <SectionLabel text="FOLLOW-UP" colors={colors} />
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                  Recommend a follow-up visit
                </Text>
              </View>
              <Switch
                value={followUpToggle}
                onValueChange={setFollowUpToggle}
                trackColor={{ false: colors.border, true: colors.teal }}
                thumbColor="#FFFFFF"
              />
            </View>
            {followUpToggle && (
              <View style={[styles.followUpInput, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                <TextInput
                  style={[{ color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.base }]}
                  placeholder="Follow-up date (YYYY-MM-DD)"
                  placeholderTextColor={colors.textSecondary}
                  value={followUpDate}
                  onChangeText={setFollowUpDate}
                />
              </View>
            )}
          </View>

          {/* Sharing */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <SectionLabel text="SHARING" colors={colors} />
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
                  Share with patient now
                </Text>
                <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                  You can always share later from the prescription detail.
                </Text>
              </View>
              <Switch
                value={shareNow}
                onValueChange={setShareNow}
                trackColor={{ false: colors.border, true: colors.teal }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btnDraft, { borderColor: isValid ? colors.teal : colors.border }]}
              onPress={() => mutation.mutate(false)}
              disabled={!isValid || mutation.isPending}
            >
              <Text style={[styles.btnDraftText, { color: isValid ? colors.teal : colors.textSecondary }]}>
                Save as Draft
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnShare, { backgroundColor: isValid ? colors.coral : colors.border }]}
              onPress={() => mutation.mutate(true)}
              disabled={!isValid || mutation.isPending}
              activeOpacity={0.88}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.btnShareText}>
                  {shareNow ? 'Save & Share' : 'Save'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.dpdpaNote, { color: colors.textSecondary }]}>
            Prescription data is stored securely under DPDPA 2023 guidelines.
          </Text>

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
  contextAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  contextAvatarText: { fontFamily: FontFamily.nunitoBold, fontSize: 14, color: '#FFFFFF' },
  contextFor: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base },
  contextAppt: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, marginTop: 1 },

  card: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3] },
  sectionLabel: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.xs, letterSpacing: 0.8, marginBottom: Spacing[3] },

  inputWrap: { borderRadius: Radius.sm, paddingHorizontal: Spacing[3], paddingVertical: Spacing[3], minHeight: 52 },
  inputText: { fontSize: FontSize.base, lineHeight: 22 },

  addMedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addMedText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base },

  textareaWrap: { borderRadius: Radius.sm, padding: Spacing[3], minHeight: 80 },
  textareaText: { fontSize: FontSize.base, lineHeight: 22, minHeight: 60 },

  validityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  validityChip: { paddingHorizontal: 16, height: 36, borderRadius: 9999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  validityText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  toggleLabel: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base, marginBottom: 2 },
  toggleDesc: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },

  followUpInput: { marginTop: Spacing[3], height: 48, borderRadius: Radius.sm, borderWidth: 1, paddingHorizontal: Spacing[3], justifyContent: 'center' },

  btnRow: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[3] },
  btnDraft: { flex: 1, height: 54, borderRadius: Radius.lg, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  btnDraftText: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base },
  btnShare: { flex: 1.4, height: 54, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  btnShareText: { fontFamily: FontFamily.dmSansSemiBold, fontSize: FontSize.md, color: '#FFFFFF' },

  dpdpaNote: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs, textAlign: 'center', lineHeight: 18 },
});