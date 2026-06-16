import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';
import { setUser } from '../../../store/authSlice';

// ─── API ──────────────────────────────────────────────────────────
const fetchDoctorMe  = () => apiFetch('/doctors/me');
const fetchUserMe    = () => apiFetch('/users/me');
const updateUserMe   = (payload) => apiFetch('/users/me',    { method: 'PUT', body: JSON.stringify(payload) });
const updateDoctorMe = (payload) => apiFetch('/doctors/me',  { method: 'PUT', body: JSON.stringify(payload) });

// ─── Specializations ──────────────────────────────────────────────
const SPECIALIZATIONS = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist',
  'Orthopaedic', 'Gynaecologist', 'Paediatrician', 'Psychiatrist',
  'ENT Specialist', 'Ophthalmologist', 'Urologist', 'Dentist',
  'Diabetologist', 'Gastroenterologist', 'Pulmonologist', 'Other',
];

// ─── Form input ───────────────────────────────────────────────────
function FormInput({
  label, placeholder, value, onChangeText, keyboardType = 'default',
  autoCapitalize = 'sentences', multiline = false, editable = true,
  prefix, error, colors,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={inputS.wrap}>
      <Text style={[inputS.label, { color: colors.textBody ?? colors.textPrimary }]}>{label}</Text>
      <View
        style={[
          inputS.field,
          multiline && { height: 80, alignItems: 'flex-start', paddingVertical: 12 },
          {
            backgroundColor: editable ? colors.bg : colors.neutral100 ?? '#F1F3F5',
            borderColor: error ? colors.error : focused ? colors.teal : colors.border,
            borderWidth: focused || error ? 1.5 : 1,
          },
        ]}
      >
        {prefix && (
          <Text style={[inputS.prefix, { color: colors.textSecondary }]}>{prefix}</Text>
        )}
        <TextInput
          style={[
            inputS.input,
            { color: editable ? colors.textPrimary : colors.textSecondary, fontFamily: FontFamily.dmSansRegular },
            multiline && { textAlignVertical: 'top' },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
          editable={editable}
        />
      </View>
      {error && (
        <View style={inputS.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={[inputS.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const inputS = StyleSheet.create({
  wrap: { marginBottom: Spacing[4] },
  label: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm, marginBottom: Spacing[2] },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
  },
  prefix: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.base, marginRight: 4 },
  input: { flex: 1, fontSize: FontSize.base, height: '100%' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing[1] },
  errorText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.xs },
});

// ─── Specialization picker ────────────────────────────────────────
function SpecPicker({ value, onSelect, colors }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={spS.wrap}>
      <Text style={[spS.label, { color: colors.textBody ?? colors.textPrimary }]}>
        Medical Specialty
      </Text>
      <TouchableOpacity
        style={[
          spS.btn,
          {
            backgroundColor: colors.bg,
            borderColor: open ? colors.teal : colors.border,
            borderWidth: open ? 1.5 : 1,
          },
        ]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Ionicons name="medical-outline" size={17} color={value ? colors.teal : colors.textSecondary} style={{ marginRight: 8 }} />
        <Text style={[spS.value, { color: value ? colors.textPrimary : colors.textSecondary }]}>
          {value || 'Select specialization'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      {open && (
        <View style={[spS.dropdown, Shadow.md, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {SPECIALIZATIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  spS.option,
                  { borderBottomColor: colors.border },
                  value === s && { backgroundColor: colors.tealLight },
                ]}
                onPress={() => { onSelect(s); setOpen(false); }}
              >
                <Text style={[spS.optionText, { color: value === s ? colors.teal : colors.textPrimary }]}>
                  {s}
                </Text>
                {value === s && <Ionicons name="checkmark" size={15} color={colors.teal} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const spS = StyleSheet.create({
  wrap: { marginBottom: Spacing[4] },
  label: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm, marginBottom: Spacing[2] },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
  },
  value: { flex: 1, fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.base },
  dropdown: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 999,
    marginTop: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  optionText: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.base },
});

// ─── Section label ────────────────────────────────────────────────
function SectionLabel({ text, colors }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.teal }]}>{text}</Text>
  );
}

// ─── Toast ────────────────────────────────────────────────────────
function Toast({ message, type }) {
  if (!message) return null;
  const color = type === 'error' ? '#F04438' : '#12B76A';
  const icon  = type === 'error' ? 'alert-circle' : 'checkmark-circle';
  return (
    <View style={[toastS.toast, { backgroundColor: '#1A1D27' }]}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={toastS.text}>{message}</Text>
    </View>
  );
}

const toastS = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 110,
    left: Spacing[5],
    right: Spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing[4],
    borderRadius: Radius.md,
    zIndex: 999,
  },
  text: { fontFamily: FontFamily.dmSansMedium, fontSize: FontSize.sm, color: '#FFFFFF', flex: 1 },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function EditDoctorProfileScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const toastTimer = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    clearTimeout(toastTimer[0]);
    toastTimer[0] = setTimeout(() => setToast({ message: '', type: 'success' }), 3000);
  };

  // ── Form state ──
  const [fullName, setFullName]               = useState('');
  const [phone, setPhone]                     = useState('');
  const [specialization, setSpecialization]   = useState('');
  const [qualification, setQualification]     = useState('');
  const [experience, setExperience]           = useState('');
  const [fee, setFee]                         = useState('');
  const [bio, setBio]                         = useState('');
  const [isDirty, setIsDirty]                 = useState(false);

  // ── Errors ──
  const [errors, setErrors] = useState({});
  const syncedKeyRef = useRef(null);

  // ── Fetch data ──
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doctor-me-edit'],
    queryFn: async () => {
      const [user, doctor] = await Promise.all([fetchUserMe(), fetchDoctorMe()]);
      return { user, doctor };
    },
  });

  useEffect(() => {
    if (!data || isDirty) return;
    const syncKey = `${data.user?.id ?? ''}:${data.user?.updated_at ?? ''}:${data.doctor?.updated_at ?? ''}`;
    if (syncedKeyRef.current === syncKey) return;
    syncedKeyRef.current = syncKey;

    const { user, doctor } = data;
    setFullName(user?.full_name ?? '');
    setPhone(user?.phone ?? '');
    setSpecialization(doctor?.specialization ?? '');
    setQualification(doctor?.qualification ?? '');
    setExperience(
      doctor?.experience_years != null
        ? String(doctor.experience_years)
        : doctor?.years_experience != null
          ? String(doctor.years_experience)
          : ''
    );
    setFee(doctor?.consultation_fee ? String(doctor.consultation_fee) : '');
    setBio(doctor?.bio ?? '');
  }, [data, isDirty]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const markDirty = (setter) => (value) => {
    setter(value);
    setIsDirty(true);
  };

  // ── Validation ──
  const validate = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (phone && !/^[6-9]\d{9}$/.test(phone.replace(/\s/g, '')))
      errs.phone = 'Enter a valid 10-digit Indian mobile number';
    if (experience && isNaN(Number(experience)))
      errs.experience = 'Must be a number';
    if (fee && isNaN(Number(fee)))
      errs.fee = 'Must be a valid amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Save mutation ──
  const mutation = useMutation({
    mutationFn: async () => {
      // Update basic user profile
      const updatedUser = await updateUserMe({
        full_name: fullName.trim(),
        phone:     phone.trim() || undefined,
      });

      // Update doctor profile
      const updatedDoctor = await updateDoctorMe({
        specialization:    specialization || undefined,
        qualification:     qualification.trim() || undefined,
        experience_years:  experience ? parseInt(experience, 10) : undefined,
        consultation_fee:  fee ? parseFloat(fee) : undefined,
        bio:               bio.trim() || undefined,
      });

      return { user: updatedUser, doctor: updatedDoctor };
    },
    onSuccess: ({ user }) => {
      // Update Redux user state
      dispatch(setUser(user));
      queryClient.invalidateQueries({ queryKey: ['doctor-me'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-me-edit'] });
      setIsDirty(false);
      showToast('Profile updated successfully');
    },
    onError: (err) => {
      if (err.code === 422 && Array.isArray(err.detail)) {
        const fieldErrors = {};
        err.detail.forEach((e) => {
          const field = e.loc?.[e.loc.length - 1];
          if (field) fieldErrors[field] = e.msg;
        });
        setErrors(fieldErrors);
        showToast('Please fix the errors below', 'error');
      } else {
        showToast(err.message ?? 'Failed to save profile. Please try again.', 'error');
      }
    },
  });

  const handleSave = () => {
    if (!validate()) return;
    mutation.mutate();
  };

  const handleBack = () => {
    if (isDirty) {
      Alert.alert(
        'Unsaved changes',
        'You have unsaved changes. Discard them?',
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!isDirty || mutation.isPending}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color={colors.teal} />
            ) : (
              <Text style={[styles.saveBtn, { color: isDirty ? colors.teal : colors.textSecondary }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.teal} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />
            }
          >
            {/* Avatar section */}
            <View style={[styles.avatarSection, Shadow.sm, { backgroundColor: colors.surface }]}>
              <View style={[styles.avatar, { backgroundColor: colors.tealLight }]}>
                <Text style={[styles.avatarText, { color: colors.teal }]}>
                  {fullName ? fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'DR'}
                </Text>
              </View>
              <View>
                <Text style={[styles.avatarName, { color: colors.textPrimary }]}>
                  {fullName || 'Your Name'}
                </Text>
                <Text style={[styles.avatarSpec, { color: colors.textSecondary }]}>
                  {specialization || 'Specialization not set'}
                </Text>
              </View>
            </View>

            {/* Personal details */}
            <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
              <SectionLabel text="PERSONAL DETAILS" colors={colors} />

              <FormInput
                label="Full Name"
                placeholder="Dr. Priya Sharma"
                value={fullName}
                onChangeText={markDirty(setFullName)}
                autoCapitalize="words"
                error={errors.fullName}
                colors={colors}
              />

              <FormInput
                label="Phone Number"
                placeholder="98765 43210"
                value={phone}
                onChangeText={markDirty(setPhone)}
                keyboardType="phone-pad"
                autoCapitalize="none"
                prefix="+91"
                error={errors.phone}
                colors={colors}
              />
            </View>

            {/* Professional details */}
            <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
              <SectionLabel text="PROFESSIONAL DETAILS" colors={colors} />

              <SpecPicker
                value={specialization}
                onSelect={(v) => { setSpecialization(v); setIsDirty(true); }}
                colors={colors}
              />

              <FormInput
                label="Qualification"
                placeholder="MBBS, MD — Cardiology"
                value={qualification}
                onChangeText={markDirty(setQualification)}
                autoCapitalize="characters"
                colors={colors}
              />

              {/* Experience + Fee side by side */}
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <FormInput
                    label="Experience (years)"
                    placeholder="8"
                    value={experience}
                    onChangeText={markDirty(setExperience)}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    error={errors.experience}
                    colors={colors}
                  />
                </View>
                <View style={{ width: Spacing[3] }} />
                <View style={{ flex: 1 }}>
                  <FormInput
                    label="Consultation Fee"
                    placeholder="500"
                    value={fee}
                    onChangeText={markDirty(setFee)}
                    keyboardType="decimal-pad"
                    autoCapitalize="none"
                    prefix="₹"
                    error={errors.fee}
                    colors={colors}
                  />
                </View>
              </View>
            </View>

            {/* Bio */}
            <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
              <SectionLabel text="BIO" colors={colors} />
              <FormInput
                label="About yourself"
                placeholder="Brief description of your expertise, experience, and approach to patient care..."
                value={bio}
                onChangeText={markDirty(setBio)}
                multiline
                colors={colors}
              />
              <Text style={[styles.bioHint, { color: colors.textSecondary }]}>
                Visible to patients on your public profile.
              </Text>
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[
                styles.saveFullBtn,
                { backgroundColor: isDirty && !mutation.isPending ? colors.coral : colors.border },
              ]}
              onPress={handleSave}
              disabled={!isDirty || mutation.isPending}
              activeOpacity={0.88}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveFullBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: Spacing[10] }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <Toast message={toast.message} type={toast.type} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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

  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontFamily: FontFamily.nunitoBold, fontSize: 24 },
  avatarName: { fontFamily: FontFamily.nunitoSemiBold, fontSize: FontSize.md, marginBottom: 3 },
  avatarSpec: { fontFamily: FontFamily.dmSansRegular, fontSize: FontSize.sm },

  card: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3] },
  sectionLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginBottom: Spacing[4],
  },

  twoCol: { flexDirection: 'row', alignItems: 'flex-start' },

  bioHint: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    marginTop: -Spacing[2],
    lineHeight: 16,
  },

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