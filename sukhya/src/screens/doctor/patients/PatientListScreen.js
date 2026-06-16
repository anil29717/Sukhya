import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../../hooks/useTheme';
import { FontFamily, FontSize } from '../../../theme/typography';
import { Spacing, Radius, Shadow } from '../../../theme/spacing';
import { apiFetch } from '../../../api/client';

// ─── API ──────────────────────────────────────────────────────────
const fetchPatients = (search) =>
  apiFetch(`/patients?page=1&page_size=50${search ? `&search=${encodeURIComponent(search)}` : ''}`);

// ─── Condition chip config ────────────────────────────────────────
const CONDITION_COLORS = {
  diabetes:     { bg: '#FEF3C7', color: '#B45309' },
  hypertension: { bg: '#FEE2E2', color: '#B91C1C' },
  asthma:       { bg: '#E0F2FE', color: '#0369A1' },
  heart:        { bg: '#FEE2E2', color: '#B91C1C' },
  thyroid:      { bg: '#EDE9FE', color: '#6D28D9' },
  default:      { bg: '#F1F3F5', color: '#495057' },
};

function getConditionColor(condition) {
  const key = condition?.toLowerCase();
  for (const k of Object.keys(CONDITION_COLORS)) {
    if (key?.includes(k)) return CONDITION_COLORS[k];
  }
  return CONDITION_COLORS.default;
}

// ─── Condition chip ───────────────────────────────────────────────
function ConditionChip({ label }) {
  const { bg, color } = getConditionColor(label);
  return (
    <View style={[condStyles.chip, { backgroundColor: bg }]}>
      <Text style={[condStyles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const condStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  text: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
  },
});

// ─── Filter chip ──────────────────────────────────────────────────
function FilterChip({ label, active, onPress, colors }) {
  return (
    <TouchableOpacity
      style={[
        filterStyles.chip,
        {
          backgroundColor: active ? colors.teal : colors.surface,
          borderColor: active ? colors.teal : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          filterStyles.text,
          { color: active ? '#FFFFFF' : colors.textSecondary },
          active && { fontFamily: FontFamily.dmSansMedium },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const filterStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
});

// ─── Patient card ─────────────────────────────────────────────────
function PatientCard({ item, onPress, colors }) {
  const initials = (item.full_name ?? 'P')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const conditions = item.medical_conditions
    ? item.medical_conditions.split(',').map((c) => c.trim()).filter(Boolean)
    : [];

  const hasFollowUp = item.has_pending_followup;

  return (
    <TouchableOpacity
      style={[cardStyles.card, Shadow.sm, { backgroundColor: colors.surface }]}
      onPress={() => onPress(item)}
      activeOpacity={0.82}
    >
      {/* Main row */}
      <View style={cardStyles.mainRow}>
        {/* Avatar */}
        <View style={[cardStyles.avatar, { backgroundColor: colors.tealLight }]}>
          <Text style={[cardStyles.avatarText, { color: colors.teal }]}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={cardStyles.info}>
          <Text style={[cardStyles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.full_name ?? 'Patient'}
          </Text>
          <Text style={[cardStyles.meta, { color: colors.textSecondary }]}>
            {[
              item.age && `${item.age} yrs`,
              item.gender,
              item.blood_group,
            ]
              .filter(Boolean)
              .join(' • ') || 'No details'}
          </Text>
          {item.last_appointment_date && (
            <Text style={[cardStyles.lastVisit, { color: colors.textSecondary }]}>
              Last visit: {item.last_appointment_date}
            </Text>
          )}
        </View>

        {/* Right */}
        <View style={cardStyles.right}>
          {hasFollowUp && (
            <View style={cardStyles.followUpDot}>
              <View style={[cardStyles.dot, { backgroundColor: colors.warning }]} />
              <Text style={[cardStyles.followUpText, { color: colors.warning }]}>
                Follow-up
              </Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </View>
      </View>

      {/* Condition chips */}
      {conditions.length > 0 && (
        <>
          <View style={[cardStyles.divider, { backgroundColor: colors.border }]} />
          <View style={cardStyles.chipsRow}>
            {conditions.slice(0, 3).map((c, i) => (
              <ConditionChip key={i} label={c} />
            ))}
            {conditions.length > 3 && (
              <View style={[condStyles.chip, { backgroundColor: colors.neutral100 ?? '#F1F3F5' }]}>
                <Text style={[condStyles.text, { color: colors.textSecondary }]}>
                  +{conditions.length - 3}
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 17,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: FontFamily.dmSansSemiBold,
    fontSize: FontSize.base,
  },
  meta: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
  lastVisit: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.xs,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  followUpDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  followUpText: {
    fontFamily: FontFamily.dmSansMedium,
    fontSize: FontSize.xs,
  },
  divider: {
    height: 1,
    marginVertical: Spacing[3],
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});

// ─── Skeleton card ────────────────────────────────────────────────
function SkeletonCard({ colors }) {
  return (
    <View style={[cardStyles.card, Shadow.sm, { backgroundColor: colors.surface }]}>
      <View style={cardStyles.mainRow}>
        <View style={[cardStyles.avatar, { backgroundColor: colors.border }]} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ width: '60%', height: 14, borderRadius: 6, backgroundColor: colors.border }} />
          <View style={{ width: '40%', height: 11, borderRadius: 6, backgroundColor: colors.border }} />
        </View>
      </View>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────
function EmptyState({ search, colors }) {
  return (
    <View style={emptyStyles.container}>
      <View style={[emptyStyles.icon, { backgroundColor: colors.tealLight }]}>
        <Ionicons name="people-outline" size={32} color={colors.teal} />
      </View>
      <Text style={[emptyStyles.title, { color: colors.textPrimary }]}>
        {search ? 'No patients found' : 'No patients yet'}
      </Text>
      <Text style={[emptyStyles.body, { color: colors.textSecondary }]}>
        {search
          ? `No results for "${search}". Try a different name.`
          : 'Patients will appear here after your first appointments.'}
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing[12],
    paddingHorizontal: Spacing[8],
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    fontFamily: FontFamily.nunitoSemiBold,
    fontSize: FontSize.md,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  body: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function PatientListScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { pickerMode, createScreen } = route.params ?? {};

  const [searchQuery, setSearchQuery]   = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing]     = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  const debounceTimer = useState(null);
  const handleSearch = (text) => {
    setSearchQuery(text);
    clearTimeout(debounceTimer[0]);
    debounceTimer[0] = setTimeout(() => setDebouncedSearch(text), 400);
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['patients', debouncedSearch],
    queryFn: () => fetchPatients(debouncedSearch),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const patients = data?.items ?? data ?? [];

  // Client-side filter
  const filtered = patients.filter((p) => {
    if (activeFilter === 'followup') return p.has_pending_followup;
    if (activeFilter === 'recent') {
      const last = p.last_appointment_date;
      if (!last) return false;
      const diff = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }
    return true;
  });

  const filters = [
    { value: 'all',      label: 'All' },
    { value: 'recent',   label: 'Recent' },
    { value: 'followup', label: 'Follow-up Due' },
  ];

  const handlePatientPress = (patient) => {
    if (pickerMode && createScreen) {
      navigation.navigate('ClinicalTab', {
        screen: createScreen,
        params: {
          patientId: patient.id,
          patientName: patient.full_name,
        },
      });
      return;
    }
    navigation.navigate('PatientDetail', { patientId: patient.id });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bg }]}>
        {pickerMode ? (
          <TouchableOpacity
            style={styles.pickerBackBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {pickerMode ? 'Select Patient' : 'My Patients'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {pickerMode
              ? 'Choose a patient to continue'
              : 'From your appointment history'}
          </Text>
        </View>
        {!pickerMode ? (
          <TouchableOpacity
            style={[styles.sortBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Ionicons name="swap-vertical-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.sortBtn} />
        )}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: searchFocused ? colors.teal : colors.border,
              borderWidth: searchFocused ? 1.5 : 1,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={searchFocused ? colors.teal : colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary, fontFamily: FontFamily.dmSansRegular }]}
            placeholder="Search by name or condition..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => { setSearchQuery(''); setDebouncedSearch(''); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      {!pickerMode && (
      <View style={styles.filtersRow}>
        {filters.map((f) => (
          <FilterChip
            key={f.value}
            label={f.label}
            active={activeFilter === f.value}
            onPress={() => setActiveFilter(f.value)}
            colors={colors}
          />
        ))}
      </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.listPad}>
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} colors={colors} />)}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.listPad, filtered.length === 0 && { flex: 1 }]}
          renderItem={({ item }) => (
            <PatientCard
              item={item}
              onPress={handlePatientPress}
              colors={colors}
            />
          )}
          ListEmptyComponent={<EmptyState search={debouncedSearch} colors={colors} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.teal}
              colors={[colors.teal]}
            />
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
  },
  title: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 22,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FontFamily.dmSansRegular,
    fontSize: FontSize.sm,
  },
  sortBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[2],
  },

  // ── Search ──
  searchWrap: {
    paddingHorizontal: Spacing[5],
    marginBottom: Spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    height: '100%',
  },

  // ── Filters ──
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[5],
    gap: 8,
    marginBottom: Spacing[4],
  },

  // ── List ──
  listPad: {
    paddingHorizontal: Spacing[5],
  },
});