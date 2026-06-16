import { useState, useRef } from 'react';
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
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useTheme } from '../../hooks/useTheme';
import { registerDoctorApi } from '../../api/auth';
import { saveUserRole } from '../../utils/roleStorage';
import { savePendingProfile } from '../../utils/pendingProfileStorage';
import { setSavedRole } from '../../store/authSlice';
import { getApiErrorMessage, applyValidationErrors } from '../../utils/apiErrors';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, Radius, Shadow } from '../../theme/spacing';

// ─── Specializations list ─────────────────────────────────────────
const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Neurologist',
  'Orthopaedic',
  'Gynaecologist',
  'Paediatrician',
  'Psychiatrist',
  'ENT Specialist',
  'Ophthalmologist',
  'Urologist',
  'Dentist',
  'Diabetologist',
  'Gastroenterologist',
  'Pulmonologist',
  'Other',
];

// ─── Password strength ────────────────────────────────────────────
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (password.length >= 8)               score++;
  if (/[A-Z]/.test(password))             score++;
  if (/[0-9]/.test(password))             score++;
  if (/[^A-Za-z0-9]/.test(password))      score++;

  const levels = [
    { score: 1, label: 'Weak',   color: '#F04438' },
    { score: 2, label: 'Fair',   color: '#F79009' },
    { score: 3, label: 'Good',   color: '#0BA5EC' },
    { score: 4, label: 'Strong', color: '#12B76A' },
  ];
  return levels[score - 1] ?? { score: 0, label: '', color: 'transparent' };
}

function PasswordStrengthBar({ password, colors }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <View style={strengthStyles.container}>
      <View style={strengthStyles.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              strengthStyles.bar,
              { backgroundColor: i <= score ? color : colors.border },
            ]}
          />
        ))}
      </View>
      {label ? (
        <Text style={[strengthStyles.label, { color }]}>{label}</Text>
      ) : null}
    </View>
  );
}

const strengthStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
    minWidth: 44,
    textAlign: 'right',
  },
});

// ─── Reusable Input ───────────────────────────────────────────────
function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'words',
  leftIcon,
  rightElement,
  infoText,
  colors,
  multiline = false,
  prefix,
}) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
    ? colors.teal
    : colors.border;

  return (
    <View style={{ marginBottom: Spacing[4] }}>
      <View style={styles.labelRow}>
        <Text style={[styles.inputLabel, { color: colors.textBody }]}>{label}</Text>
        {infoText && (
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => {}} // tooltip — future
          >
            <Ionicons name="information-circle-outline" size={15} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {infoText && (
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>{infoText}</Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          multiline && { height: 80, alignItems: 'flex-start', paddingVertical: 12 },
          {
            backgroundColor: colors.surface,
            borderColor,
            borderWidth: focused || error ? 1.5 : 1,
          },
        ]}
      >
        {prefix && (
          <Text style={[styles.prefix, { color: colors.textSecondary }]}>{prefix}</Text>
        )}
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? colors.teal : colors.textSecondary}
            style={styles.inputLeftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular },
            prefix && { paddingLeft: 0 },
            multiline && { textAlignVertical: 'top' },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textHint}
          value={value}
          onChangeText={onChangeText}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          onFocus={() => setFocused(true)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
        />
        {rightElement}
      </View>
      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Specialization Picker (simple modal-style overlay) ──────────
function SpecializationPicker({ value, onSelect, colors }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginBottom: Spacing[4] }}>
      <View style={styles.labelRow}>
        <Text style={[styles.inputLabel, { color: colors.textBody }]}>Medical Specialty</Text>
        <Ionicons name="information-circle-outline" size={15} color={colors.textSecondary} />
      </View>
      <Text style={[styles.infoText, { color: colors.textSecondary }]}>
        Used to match you with relevant patients
      </Text>
      <TouchableOpacity
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: open ? colors.teal : colors.border,
            borderWidth: open ? 1.5 : 1,
          },
        ]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.8}
      >
        <Ionicons
          name="medical-outline"
          size={18}
          color={value ? colors.teal : colors.textSecondary}
          style={styles.inputLeftIcon}
        />
        <Text
          style={[
            styles.input,
            {
              fontFamily: FontFamily.dmSansRegular,
              color: value ? colors.textPrimary : colors.textHint,
              height: undefined,
              paddingTop: 0,
              paddingBottom: 0,
              lineHeight: FontSize.base + 4,
            },
          ]}
        >
          {value || 'Select your specialization'}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {open && (
        <View
          style={[
            styles.dropdownList,
            Shadow.md,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {SPECIALIZATIONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.dropdownItem,
                  value === s && { backgroundColor: colors.tealLight },
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => { onSelect(s); setOpen(false); }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    { color: value === s ? colors.teal : colors.textPrimary },
                    value === s && { fontFamily: FontFamily.dmSansSemiBold },
                  ]}
                >
                  {s}
                </Text>
                {value === s && (
                  <Ionicons name="checkmark" size={16} color={colors.teal} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── Section label ────────────────────────────────────────────────
function SectionLabel({ text, colors }) {
  return (
    <Text style={[styles.sectionLabel, { color: colors.teal }]}>{text}</Text>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function RegisterScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword]        = useState(false);
  const [showConfirmPwd, setShowConfirmPwd]     = useState(false);
  const [isLoading, setIsLoading]              = useState(false);
  const [apiError, setApiError]                = useState('');
  const [consentChecked, setConsentChecked]    = useState(false);
  const [consentError, setConsentError]        = useState(false);
  const [watchedPassword, setWatchedPassword]  = useState('');

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    setError,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirm_password: '',
      specialization: '',
      license_number: '',
      hospital_name: '',
      years_experience: '',
      consultation_fee: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data) => {
    if (!consentChecked) {
      setConsentError(true);
      return;
    }
    setIsLoading(true);
    setApiError('');
    try {
      await registerDoctorApi({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        full_name: data.full_name.trim(),
        phone: data.phone.trim(),
        language_preference: 'en',
      });

      await saveUserRole('doctor');
      dispatch(setSavedRole('doctor'));
      await savePendingProfile({
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        specialization: data.specialization,
        license_number: data.license_number.trim(),
        hospital_name: data.hospital_name.trim(),
        years_experience: data.years_experience,
        consultation_fee: data.consultation_fee,
      });

      navigation.replace('DoctorPending');
    } catch (err) {
      if (err.code === 422) {
        applyValidationErrors(err.detail, setError);
        setApiError('Please fix the errors below and try again.');
      } else {
        setApiError(getApiErrorMessage(err, {
          409: 'An account with this email already exists. Please sign in.',
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoSmall, { backgroundColor: colors.teal }]}>
              <Text style={styles.logoSmallText}>S</Text>
            </View>
            <Text style={[styles.heading, { color: colors.textPrimary }]}>
              Create your doctor account
            </Text>
            <Text style={[styles.subtext, { color: colors.textSecondary }]}>
              Your profile will be reviewed before activation.
            </Text>
          </View>

          {/* API error */}
          {apiError ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.errorBg }]}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.errorBannerText, { color: colors.error }]}>
                {apiError}
              </Text>
              <TouchableOpacity
                onPress={() => setApiError('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ── Personal Details ── */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
            <SectionLabel text="PERSONAL DETAILS" colors={colors} />

            <Controller
              control={control}
              name="full_name"
              rules={{ required: 'Full name is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Full Name"
                  placeholder="Dr. Priya Sharma"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.full_name?.message}
                  leftIcon="person-outline"
                  autoCapitalize="words"
                  colors={colors}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Email Address"
                  placeholder="doctor@hospital.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon="mail-outline"
                  colors={colors}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              rules={{
                required: 'Phone number is required',
                pattern: {
                  value: /^[6-9]\d{9}$/,
                  message: 'Enter a valid 10-digit Indian mobile number',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Phone Number"
                  placeholder="98765 43210"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.phone?.message}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  prefix="+91  "
                  colors={colors}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={{
                required: 'Password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' },
                pattern: {
                  value: /^(?=.*[A-Z])(?=.*[0-9])/,
                  message: 'Must include at least one uppercase letter and one number',
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <FormInput
                    label="Password"
                    placeholder="Create a strong password"
                    value={value}
                    onChangeText={(v) => { onChange(v); setWatchedPassword(v); }}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    leftIcon="lock-closed-outline"
                    rightElement={
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    }
                    colors={colors}
                  />
                  <View style={{ marginTop: -Spacing[3], marginBottom: Spacing[4] }}>
                    <PasswordStrengthBar password={value} colors={colors} />
                  </View>
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirm_password"
              rules={{
                required: 'Please confirm your password',
                validate: (val) =>
                  val === getValues('password') || 'Passwords do not match',
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirm_password?.message}
                  secureTextEntry={!showConfirmPwd}
                  autoCapitalize="none"
                  leftIcon="lock-closed-outline"
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowConfirmPwd(!showConfirmPwd)}
                      style={styles.eyeBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showConfirmPwd ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  }
                  colors={colors}
                />
              )}
            />
          </View>

          {/* ── Professional Details ── */}
          <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface, marginTop: Spacing[3] }]}>
            <SectionLabel text="PROFESSIONAL DETAILS" colors={colors} />

            <Controller
              control={control}
              name="specialization"
              rules={{ required: 'Specialization is required' }}
              render={({ field: { onChange, value } }) => (
                <SpecializationPicker
                  value={value}
                  onSelect={onChange}
                  colors={colors}
                />
              )}
            />
            {errors.specialization && (
              <View style={[styles.errorRow, { marginTop: -Spacing[3], marginBottom: Spacing[3] }]}>
                <Ionicons name="alert-circle" size={13} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.specialization.message}
                </Text>
              </View>
            )}

            <Controller
              control={control}
              name="license_number"
              rules={{ required: 'License number is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Medical License Number"
                  placeholder="MCI-XXXX-2018"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.license_number?.message}
                  autoCapitalize="characters"
                  leftIcon="card-outline"
                  infoText="Required for verification. Not shown to patients."
                  colors={colors}
                />
              )}
            />

            <Controller
              control={control}
              name="hospital_name"
              rules={{ required: 'Hospital or clinic name is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <FormInput
                  label="Hospital / Clinic Name"
                  placeholder="Apollo Hospital, New Delhi"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.hospital_name?.message}
                  leftIcon="business-outline"
                  infoText="Your primary place of practice"
                  colors={colors}
                />
              )}
            />

            {/* Experience + Fee — side by side */}
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="years_experience"
                  rules={{
                    required: 'Required',
                    pattern: { value: /^\d+$/, message: 'Numbers only' },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormInput
                      label="Experience (years)"
                      placeholder="8"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.years_experience?.message}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      colors={colors}
                    />
                  )}
                />
              </View>
              <View style={{ width: Spacing[3] }} />
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="consultation_fee"
                  rules={{
                    required: 'Required',
                    pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Invalid amount' },
                  }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormInput
                      label="Consultation Fee"
                      placeholder="500"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.consultation_fee?.message}
                      keyboardType="decimal-pad"
                      autoCapitalize="none"
                      prefix="₹  "
                      colors={colors}
                    />
                  )}
                />
              </View>
            </View>
          </View>

          {/* ── DPDPA Consent ── */}
          <View
            style={[
              styles.consentCard,
              Shadow.sm,
              {
                backgroundColor: colors.surface,
                borderColor: consentError ? colors.error : colors.border,
                borderWidth: consentError ? 1.5 : 1,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.consentRow}
              onPress={() => {
                setConsentChecked(!consentChecked);
                setConsentError(false);
              }}
              activeOpacity={0.8}
            >
              {/* Custom checkbox */}
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: consentChecked ? colors.teal : 'transparent',
                    borderColor: consentError
                      ? colors.error
                      : consentChecked
                      ? colors.teal
                      : colors.border,
                  },
                ]}
              >
                {consentChecked && (
                  <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                )}
              </View>

              <Text style={[styles.consentText, { color: colors.textBody }]}>
                I consent to Sukhya collecting and processing my professional information
                to provide healthcare matching services.{' '}
                <Text style={{ color: colors.teal }}>Privacy Policy</Text>
                {'  '}
                <Text style={{ color: colors.teal }}>Terms of Service</Text>
              </Text>
            </TouchableOpacity>

            {consentError && (
              <View style={[styles.errorRow, { marginTop: Spacing[2] }]}>
                <Ionicons name="alert-circle" size={13} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  Please accept the consent to continue
                </Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.dpdpaNote, { color: colors.textSecondary }]}>
              You have the right to access, correct, or withdraw your data at any time via{' '}
              <Text style={{ color: colors.teal }}>Settings {'>'} Privacy</Text>.
            </Text>
          </View>

          {/* ── Create Account button ── */}
          <TouchableOpacity
            style={[
              styles.btnPrimary,
              {
                backgroundColor: isLoading || !consentChecked || !isValid
                  ? colors.textHint
                  : colors.coral,
                marginTop: Spacing[5],
              },
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading || !consentChecked || !isValid}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Sign in link */}
          <TouchableOpacity
            style={styles.signInRow}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.signInText, { color: colors.textSecondary }]}>
              Already registered?{' '}
            </Text>
            <Text style={[styles.signInLink, { color: colors.teal }]}>Sign in</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing[8] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[8],
  },

  backBtn: {
    marginTop: Spacing[3],
    marginBottom: Spacing[4],
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing[5],
  },
  logoSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  logoSmallText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  heading: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 24,
    lineHeight: 32,
    marginBottom: Spacing[1],
  },
  subtext: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  // ── Error banner ──
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing[3],
    borderRadius: Radius.sm,
    marginBottom: Spacing[4],
  },
  errorBannerText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    flex: 1,
    lineHeight: 18,
  },

  // ── Card ──
  card: {
    borderRadius: Radius.lg,
    padding: Spacing[5],
  },
  sectionLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginBottom: Spacing[4],
  },

  // ── Input ──
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  inputLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.sm,
  },
  infoText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    marginBottom: Spacing[2],
    lineHeight: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
  },
  inputLeftIcon: {
    marginRight: Spacing[2],
  },
  prefix: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.base,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
    marginLeft: Spacing[2],
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing[1],
  },
  errorText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
  },

  // ── Two column ──
  twoCol: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  // ── Dropdown ──
  dropdownList: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    borderRadius: Radius.md,
    borderWidth: 1,
    zIndex: 999,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.base,
  },

  // ── Consent ──
  consentCard: {
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginTop: Spacing[3],
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  consentText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    lineHeight: 20,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing[3],
  },
  dpdpaNote: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },

  // ── Buttons ──
  btnPrimary: {
    height: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F05A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  btnPrimaryText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.md,
    color: '#FFFFFF',
  },
  signInRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[4],
    paddingVertical: 4,
  },
  signInText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
  signInLink: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.sm,
  },
});