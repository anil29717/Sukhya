import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { searchPatients } from '@/api/patients';
import { calcAge, PatientListItem } from '@/api/types';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { SearchBar } from '@/components/lumina/SearchBar';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function DoctorPatientsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['patients', debouncedSearch],
    queryFn: () => searchPatients({ search: debouncedSearch || undefined, page: 1 }),
  });

  const patients = data?.items ?? [];
  const showSkeleton = isLoading || (isFetching && debouncedSearch !== search);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + LuminaSpacing.md }]}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          Patients
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {data?.total ?? patients.length} in your care network
        </Text>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or ID..." />
      </View>

      {showSkeleton ? (
        <LoadingSkeleton count={6} />
      ) : patients.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title={debouncedSearch ? 'No matches' : 'No patients yet'}
          message={debouncedSearch ? `Nothing found for "${debouncedSearch}"` : 'Patients appear after their first appointment'}
        />
      ) : (
        <FlatList
          style={styles.list}
          data={patients}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <PatientCard item={item} onPress={() => router.push(`/(doctor)/patients/${item.id}` as never)} />
          )}
        />
      )}
    </View>
  );
}

function PatientCard({ item, onPress }: { item: PatientListItem; onPress: () => void }) {
  const { colors } = useLuminaTheme();
  const age = calcAge(item.date_of_birth);
  const initials = item.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Pressable style={[styles.card, { backgroundColor: colors.surfaceElevated }, LuminaShadow.sm]} onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: colors.text }]}>{item.full_name}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
          {[age != null ? `${age} yrs` : null, item.gender, item.blood_group].filter(Boolean).join(' · ') || '—'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: LuminaSpacing.lg, paddingBottom: LuminaSpacing.md, gap: LuminaSpacing.sm },
  title: { ...LuminaTypography.display, fontSize: 28 },
  subtitle: { ...LuminaTypography.bodySmall },
  list: { flex: 1 },
  listContent: { padding: LuminaSpacing.lg, paddingBottom: 100, gap: LuminaSpacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LuminaSpacing.md,
    borderRadius: LuminaRadius.xl,
    padding: LuminaSpacing.lg,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  name: { ...LuminaTypography.label, fontSize: 16 },
});
