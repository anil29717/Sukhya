import { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { usePendingDoctorDisplay } from '../../hooks/usePendingDoctorDisplay';
import { FontFamily, FontSize } from '../../theme/typography';
import { Spacing, Radius, Shadow } from '../../theme/spacing';

// ─── Timeline step ────────────────────────────────────────────────
function TimelineStep({ step, title, description, status, isLast, colors }) {
  // status: 'done' | 'current' | 'pending'
  const dotBg =
    status === 'done'    ? colors.success :
    status === 'current' ? colors.warning :
    colors.border;

  const dotIcon =
    status === 'done'    ? 'checkmark' :
    status === 'current' ? 'time-outline' :
    null;

  return (
    <View style={tlStyles.row}>
      {/* Left: dot + line */}
      <View style={tlStyles.lineCol}>
        <View style={[tlStyles.dot, { backgroundColor: dotBg }]}>
          {dotIcon && (
            <Ionicons name={dotIcon} size={11} color="#FFFFFF" />
          )}
          {!dotIcon && (
            <View style={[tlStyles.dotInner, { backgroundColor: colors.textSecondary }]} />
          )}
        </View>
        {!isLast && (
          <View style={[tlStyles.line, { backgroundColor: colors.border }]} />
        )}
      </View>

      {/* Right: content */}
      <View style={tlStyles.content}>
        <View style={tlStyles.titleRow}>
          <Text
            style={[
              tlStyles.title,
              { color: status === 'pending' ? colors.textSecondary : colors.textPrimary },
            ]}
          >
            {title}
          </Text>
          {status === 'current' && (
            <View style={[tlStyles.badge, { backgroundColor: colors.warningBg }]}>
              <Text style={[tlStyles.badgeText, { color: colors.warning }]}>In Progress</Text>
            </View>
          )}
          {status === 'done' && (
            <View style={[tlStyles.badge, { backgroundColor: colors.successBg }]}>
              <Text style={[tlStyles.badgeText, { color: colors.success }]}>Done</Text>
            </View>
          )}
        </View>
        <Text
          style={[
            tlStyles.description,
            { color: colors.textSecondary },
            !isLast && { marginBottom: Spacing[5] },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}

const tlStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  lineCol: {
    alignItems: 'center',
    width: 32,
    marginRight: Spacing[3],
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.5,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    minHeight: 28,
  },
  content: {
    flex: 1,
    paddingTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.base,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  badgeText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
  },
  description: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});

// ─── Profile detail row ───────────────────────────────────────────
function ProfileRow({ icon, label, value, colors }) {
  return (
    <View style={[rowStyles.row, { borderBottomColor: colors.border }]}>
      <View style={[rowStyles.iconWrap, { backgroundColor: colors.tealLight }]}>
        <Ionicons name={icon} size={16} color={colors.teal} />
      </View>
      <View style={rowStyles.texts}>
        <Text style={[rowStyles.label, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[rowStyles.value, { color: colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    gap: Spacing[3],
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  texts: {
    flex: 1,
  },
  label: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    marginBottom: 1,
  },
  value: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.base,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function DoctorPendingScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { display, logout, isAuthenticated } = usePendingDoctorDisplay();

  const handleLogout = async () => {
    const wasAuthenticated = isAuthenticated;
    await logout();
    if (!wasAuthenticated) {
      navigation.replace('Login');
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@sukhya.in?subject=Doctor%20Registration%20Enquiry');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top: Logo + Status ── */}
        <View style={styles.topSection}>
          <View style={[styles.logoMark, { backgroundColor: colors.teal }]}>
            <Text style={styles.logoMarkText}>S</Text>
          </View>
          <Text style={[styles.appName, { color: colors.teal }]}>Sukhya</Text>
        </View>

        {/* ── Status card ── */}
        <View style={[styles.statusCard, Shadow.md, { backgroundColor: colors.surface }]}>
          {/* Teal accent bar at top */}
          <View style={[styles.accentBar, { backgroundColor: colors.teal }]} />

          <View style={styles.statusCardContent}>
            {/* Badge */}
            <View style={[styles.statusBadge, { backgroundColor: colors.warningBg }]}>
              <Ionicons name="time-outline" size={13} color={colors.warning} />
              <Text style={[styles.statusBadgeText, { color: colors.warning }]}>
                Under Review
              </Text>
            </View>

            <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
              Application submitted
            </Text>
            <Text style={[styles.statusBody, { color: colors.textSecondary }]}>
              Our team is reviewing your credentials. This usually takes{' '}
              <Text style={{ fontFamily: FontFamily.dmSansSemiBold, color: colors.textPrimary }}>
                24–48 hours.
              </Text>
            </Text>
          </View>
        </View>

        {/* ── Submitted profile summary ── */}
        <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.teal }]}>
            YOUR SUBMITTED DETAILS
          </Text>

          {/* Doctor avatar + name */}
          <View style={styles.doctorRow}>
            <View style={[styles.avatar, { backgroundColor: colors.tealLight }]}>
              <Text style={[styles.avatarText, { color: colors.teal }]}>
                {display.fullName
                  ? display.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  : 'DR'}
              </Text>
            </View>
            <View>
              <Text style={[styles.doctorName, { color: colors.textPrimary }]}>
                {display.fullName}
              </Text>
              <Text style={[styles.doctorMeta, { color: colors.textSecondary }]}>
                {display.email}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <ProfileRow
            icon="medical-outline"
            label="Specialization"
            value={display.specialization}
            colors={colors}
          />
          <ProfileRow
            icon="business-outline"
            label="Hospital / Clinic"
            value={display.hospital}
            colors={colors}
          />
          <ProfileRow
            icon="card-outline"
            label="License Number"
            value={display.licenseNumber}
            colors={colors}
          />
          <ProfileRow
            icon="briefcase-outline"
            label="Experience"
            value={display.experience}
            colors={colors}
          />
        </View>

        {/* ── What happens next ── */}
        <View style={[styles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.teal }]}>
            WHAT HAPPENS NEXT
          </Text>

          <TimelineStep
            step={1}
            title="Documents submitted"
            description="Your registration details have been received successfully."
            status="done"
            colors={colors}
          />
          <TimelineStep
            step={2}
            title="Under admin review"
            description="Our team is verifying your medical license and credentials."
            status="current"
            colors={colors}
          />
          <TimelineStep
            step={3}
            title="Account activated"
            description="You'll receive an email once your account is approved and ready."
            status="pending"
            isLast
            colors={colors}
          />
        </View>

        {/* ── Email notification info ── */}
        <View style={[styles.infoCard, { backgroundColor: colors.tealLight }]}>
          <Ionicons name="mail-outline" size={18} color={colors.teal} style={{ marginTop: 1 }} />
          <Text style={[styles.infoText, { color: colors.tealDark }]}>
            We'll notify you at{' '}
            <Text style={{ fontFamily: FontFamily.dmSansSemiBold }}>
              {display.email}
            </Text>{' '}
            when your account is activated.
          </Text>
        </View>

        {/* ── Action buttons ── */}
        <TouchableOpacity
          style={[styles.btnOutline, { borderColor: colors.teal }]}
          onPress={handleContactSupport}
          activeOpacity={0.8}
        >
          <Ionicons name="headset-outline" size={18} color={colors.teal} />
          <Text style={[styles.btnOutlineText, { color: colors.teal }]}>
            Contact Support
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnGhost}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.btnGhostText, { color: colors.textSecondary }]}>
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* ── DPDPA ── */}
        <Text style={[styles.dpdpaNote, { color: colors.textSecondary }]}>
          Questions about your data? Email{' '}
          <Text
            style={{ color: colors.teal }}
            onPress={() => Linking.openURL('mailto:privacy@sukhya.in')}
          >
            privacy@sukhya.in
          </Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[10],
  },

  // ── Top logo ──
  topSection: {
    alignItems: 'center',
    paddingTop: Spacing[6],
    marginBottom: Spacing[5],
  },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  logoMarkText: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: 26,
    color: '#FFFFFF',
  },
  appName: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.lg,
  },

  // ── Status card ──
  statusCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing[3],
  },
  accentBar: {
    height: 6,
    width: '100%',
  },
  statusCardContent: {
    padding: Spacing[5],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: Spacing[3],
  },
  statusBadgeText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
  },
  statusTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 22,
    lineHeight: 30,
    marginBottom: Spacing[2],
  },
  statusBody: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.base,
    lineHeight: 24,
  },

  // ── Cards ──
  card: {
    borderRadius: Radius.lg,
    padding: Spacing[5],
    marginBottom: Spacing[3],
  },
  sectionLabel: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginBottom: Spacing[4],
  },

  // ── Doctor row ──
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 20,
  },
  doctorName: {
    fontFamily: FontFamily.nunitoSemiBold,
    fontSize: FontSize.md,
    marginBottom: 2,
  },
  doctorMeta: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
  divider: {
    height: 1,
    marginBottom: Spacing[2],
  },

  // ── Info card ──
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius.md,
    marginBottom: Spacing[4],
  },
  infoText: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    lineHeight: 20,
    flex: 1,
  },

  // ── Buttons ──
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing[3],
  },
  btnOutlineText: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.base,
  },
  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    marginBottom: Spacing[5],
  },
  btnGhostText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.base,
  },

  // ── DPDPA ──
  dpdpaNote: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});