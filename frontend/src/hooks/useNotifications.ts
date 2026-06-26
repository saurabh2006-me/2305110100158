/**
 * Custom React Hooks
 * @module hooks/useNotifications
 */

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { notificationApi } from '../api/notifications';
import { useNotificationStore } from '../store/notificationStore';
import { Log } from '../api/client';
import type { Notification, NotificationType, NotificationPriority } from '../types';

export function useNotifications(params?: {
  page?: number;
  limit?: number;
  notification_type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
  search?: string;
}) {
  const { setNotifications, setLoading, setError, setPagination } = useNotificationStore();

  return useQuery(
    ['notifications', params],
    async () => {
      setLoading(true);
      try {
        const response = await notificationApi.getNotifications(params || {});
        const { data, pagination } = response.data;
        setNotifications(data);
        setPagination(pagination.page, pagination.totalPages, pagination.hasNext, pagination.hasPrev);
        setError(null);
        Log('frontend', 'info', 'hook', 'Notifications fetched', { count: data.length });
        return response.data;
      } catch (error) {
        const message = (error as Error).message;
        setError(message);
        Log('frontend', 'error', 'hook', 'Failed to fetch notifications', { error: message });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    {
      keepPreviousData: true,
      staleTime: 30000,
      refetchInterval: 60000
    }
  );
}

export function useInfiniteNotifications(limit: number = 20) {
  return useQuery(
    ['notifications-infinite'],
    async ({ pageParam }: { pageParam?: string }) => {
      const response = await notificationApi.getNotificationsCursor({ 
        cursor: pageParam, 
        limit 
      });
      return response.data;
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  );
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { markAsRead: markAsReadStore } = useNotificationStore();

  return useMutation(
    (id: string) => notificationApi.markAsRead(id),
    {
      onSuccess: (_, id) => {
        markAsReadStore(id);
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['unread-count']);
        Log('frontend', 'info', 'hook', 'Notification marked as read', { id });
      },
      onError: (error, id) => {
        Log('frontend', 'error', 'hook', 'Failed to mark as read', { id, error: (error as Error).message });
      }
    }
  );
}

export function useBulkMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation(
    (ids: string[]) => notificationApi.bulkMarkAsRead(ids),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['unread-count']);
      }
    }
  );
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { deleteNotification: deleteFromStore } = useNotificationStore();

  return useMutation(
    (id: string) => notificationApi.deleteNotification(id),
    {
      onSuccess: (_, id) => {
        deleteFromStore(id);
        queryClient.invalidateQueries(['notifications']);
      }
    }
  );
}

export function useUnreadCount() {
  return useQuery(
    ['unread-count'],
    async () => {
      const response = await notificationApi.getUnreadCount();
      return response.data.data.count;
    },
    {
      refetchInterval: 30000
    }
  );
}

export function useWebSocket() {
  const queryClient = useQueryClient();

  // WebSocket connection logic
  // Connect to ws://localhost:5001?token=...
  // Listen for notification events and invalidate queries

  return null;
}
