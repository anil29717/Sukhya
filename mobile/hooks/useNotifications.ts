import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { getNotifications } from '@/api/family';
import { Notification } from '@/api/types';
import { dismissNotificationId, getDismissedNotificationIds } from '@/api/storage';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

type NotificationsCache = {
  items: Notification[];
  dismissedIds: number[];
};

async function loadNotifications(): Promise<NotificationsCache> {
  const [response, dismissedIds] = await Promise.all([
    getNotifications(1, 100),
    getDismissedNotificationIds(),
  ]);
  return {
    items: response.items ?? [],
    dismissedIds,
  };
}

function visibleItems(items: Notification[], dismissedIds: number[]) {
  const dismissed = new Set(dismissedIds);
  return items.filter((n) => !dismissed.has(n.id));
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const [extraDismissed, setExtraDismissed] = useState<number[]>([]);

  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: loadNotifications,
  });

  const dismissedIds = useMemo(() => {
    const fromCache = query.data?.dismissedIds ?? [];
    if (!extraDismissed.length) return fromCache;
    return [...new Set([...fromCache, ...extraDismissed])];
  }, [query.data?.dismissedIds, extraDismissed]);

  const items = useMemo(
    () => visibleItems(query.data?.items ?? [], dismissedIds),
    [query.data?.items, dismissedIds],
  );

  const unreadCount = items.length;

  const refreshDismissed = useCallback(async () => {
    const ids = await getDismissedNotificationIds();
    queryClient.setQueryData<NotificationsCache>(NOTIFICATIONS_QUERY_KEY, (prev) =>
      prev ? { ...prev, dismissedIds: ids } : prev,
    );
    setExtraDismissed([]);
  }, [queryClient]);

  useFocusEffect(
    useCallback(() => {
      refreshDismissed();
    }, [refreshDismissed]),
  );

  const dismiss = useCallback(
    async (notification: Notification) => {
      await dismissNotificationId(notification.id);
      setExtraDismissed((prev) =>
        prev.includes(notification.id) ? prev : [...prev, notification.id],
      );
      queryClient.setQueryData<NotificationsCache>(NOTIFICATIONS_QUERY_KEY, (prev) => {
        if (!prev) return prev;
        const nextDismissed = prev.dismissedIds.includes(notification.id)
          ? prev.dismissedIds
          : [...prev.dismissedIds, notification.id];
        return { ...prev, dismissedIds: nextDismissed };
      });
    },
    [queryClient],
  );

  return {
    items,
    unreadCount,
    dismissedIds,
    dismiss,
    refreshDismissed,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    error: query.error,
  };
}
