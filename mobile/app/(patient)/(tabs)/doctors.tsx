import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listDoctors } from '@/api/doctors';
import { formatDoctorName } from '@/api/types';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { LuminaButton, LuminaChip } from '@/components/lumina/LuminaButton';
import { SearchBar } from '@/components/lumina/SearchBar';
import { LuminaRadius, LuminaShadow, LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';
import { triggerHaptic } from '@/utils/haptics';

const SPECIALIZATIONS = ['All', 'Cardiology', 'Pediatrics', 'Dermatology', 'General Medicine', 'Neurology'];

export default function DoctorsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useLuminaTheme();
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', search, selectedSpecialty],
    queryFn: () =>
      listDoctors({
        search: search || undefined,
        specialization: selectedSpecialty !== 'All' ? selectedSpecialty : undefined,
      }),
  });

  const doctors = data?.items ?? [];

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          Find care
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Trusted specialists · book in minutes
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search name or specialty..."
        />
      </View>

      <FlatList
        data={SPECIALIZATIONS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        keyExtractor={(item) => item}
        style={styles.filterRow}
        renderItem={({ item }) => (
          <LuminaChip
            label={item}
            active={selectedSpecialty === item}
            onPress={() => setSelectedSpecialty(item)}
          />
        )}
      />

      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <FlatList
          style={styles.list}
          data={doctors}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.doctorList}
          ListEmptyComponent={
            <EmptyState
              icon="medical-outline"
              title="No doctors found"
              message="Try adjusting your search or filters."
              actionLabel="Clear filters"
              onAction={() => {
                setSearch('');
                setSelectedSpecialty('All');
              }}
            />
          }
          renderItem={({ item }) => (
            <View style={[styles.doctorCard, { backgroundColor: colors.surfaceElevated }, LuminaShadow.md]}>
              <Pressable
                style={styles.cardBody}
                onPress={() => router.push(`/(patient)/doctors/${item.id}`)}
              >
                <View style={[styles.doctorAvatar, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="person" size={26} color={colors.primary} />
                </View>
                <View style={styles.doctorMeta}>
                  <Text style={[styles.doctorName, { color: colors.text }]}>
                    {formatDoctorName(item.full_name ?? item.user?.full_name)}
                  </Text>
                  <Text style={[styles.doctorSpecialization, { color: colors.secondary }]}>
                    {item.specialization}
                  </Text>
                  <Text style={[styles.doctorExp, { color: colors.textMuted }]}>
                    {item.experience_years ?? 0} yrs · ${item.consultation_fee ?? '—'}
                  </Text>
                </View>
              </Pressable>
              <View style={styles.actions}>
                <LuminaButton
                  label="Book"
                  size="sm"
                  icon="calendar-outline"
                  onPress={() => {
                    triggerHaptic('light');
                    router.push({ pathname: '/(patient)/book', params: { doctorId: String(item.id) } });
                  }}
                />
                <LuminaButton
                  label="Profile"
                  size="sm"
                  variant="outline"
                  onPress={() => router.push(`/(patient)/doctors/${item.id}`)}
                />
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: LuminaSpacing.lg, paddingTop: LuminaSpacing.md, marginBottom: LuminaSpacing.md },
  title: { ...LuminaTypography.display, fontSize: 30 },
  subtitle: { ...LuminaTypography.body, marginTop: 4 },
  searchWrap: { paddingHorizontal: LuminaSpacing.lg, marginBottom: LuminaSpacing.md },
  filterRow: { marginBottom: LuminaSpacing.md, maxHeight: 48, flexGrow: 0 },
  filterList: { paddingHorizontal: LuminaSpacing.lg, gap: LuminaSpacing.sm },
  list: { flex: 1 },
  doctorList: { paddingHorizontal: LuminaSpacing.lg, paddingBottom: 120, gap: LuminaSpacing.md },
  doctorCard: { borderRadius: LuminaRadius.xl, overflow: 'hidden' },
  cardBody: { flexDirection: 'row', gap: LuminaSpacing.md, padding: LuminaSpacing.lg, alignItems: 'center' },
  doctorAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  doctorMeta: { flex: 1 },
  doctorName: { ...LuminaTypography.h3, fontSize: 17 },
  doctorSpecialization: { ...LuminaTypography.label, fontWeight: '600', marginTop: 2 },
  doctorExp: { fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', gap: LuminaSpacing.sm, padding: LuminaSpacing.lg, paddingTop: 0 },
});
