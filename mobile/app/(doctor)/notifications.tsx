import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getNotifications } from '@/api/family';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { NotificationItem } from '@/components/lumina/NotificationItem';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function DoctorNotificationsScreen() {
  const { colors } = useLuminaTheme();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(1),
  });

  const items = data?.items ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Notifications" />
      {items.length > 0 ? (
        <Text style={[styles.summary, { color: colors.textSecondary }]}>
          {items.length} alert{items.length !== 1 ? 's' : ''}
        </Text>
      ) : null}
      {isLoading ? (
        <LoadingSkeleton count={5} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No notifications"
          message="Appointment updates and system alerts will appear here."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          onRefresh={onRefresh}
          refreshing={refreshing || isRefetching}
          renderItem={({ item }) => <NotificationItem item={item} unread={item.status !== 'sent'} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: { ...LuminaTypography.bodySmall, paddingHorizontal: LuminaSpacing.lg, marginBottom: LuminaSpacing.sm },
  list: { padding: LuminaSpacing.lg, paddingBottom: 40, gap: LuminaSpacing.md },
});
