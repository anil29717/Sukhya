import React, { useState, useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';

import { getNotifications } from '@/api/family';
import { getDismissedNotificationIds, dismissNotificationId } from '@/api/storage';
import { Notification } from '@/api/types';
import { EmptyState } from '@/components/lumina/EmptyState';
import { LoadingSkeleton } from '@/components/lumina/ErrorState';
import { NotificationItem } from '@/components/lumina/NotificationItem';
import { ScreenHeader } from '@/components/lumina/ScreenHeader';
import { LuminaSpacing, LuminaTypography } from '@/theme/lumina';
import { useLuminaTheme } from '@/theme/useLuminaTheme';

export default function NotificationsScreen() {
  const { colors } = useLuminaTheme();
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getDismissedNotificationIds().then(setDismissed);
    }, [])
  );

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(1),
  });

  const items = (data?.items ?? []).filter((n) => !dismissed.includes(n.id));
  const unreadCount = items.length;

  const handleDismiss = async (n: Notification) => {
    await dismissNotificationId(n.id);
    setDismissed((prev) => [...prev, n.id]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Notifications" />
      {unreadCount > 0 ? (
        <Text style={[styles.summary, { color: colors.textSecondary }]}>
          {unreadCount} unread · tap to mark as read
        </Text>
      ) : null}
      {isLoading ? (
        <LoadingSkeleton count={5} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="All caught up"
          message="You're up to date. Appointment reminders and health updates will appear here."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          onRefresh={onRefresh}
          refreshing={refreshing || isRefetching}
          renderItem={({ item }) => (
            <NotificationItem item={item} unread onPress={() => handleDismiss(item)} />
          )}
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
