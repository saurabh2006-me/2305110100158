/**
 * Zustand Notification Store
 * @module store/notificationStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Notification, NotificationType, NotificationPriority, ThemeMode } from '../types';

interface NotificationState {
  notifications: Notification[];
  priorityNotifications: Notification[];
  unreadCount: number;
  selectedNotification: Notification | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    type?: NotificationType;
    priority?: NotificationPriority;
    isRead?: boolean;
    search?: string;
  };
  theme: ThemeMode;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;

  setNotifications: (notifications: Notification[]) => void;
  setPriorityNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  setSelectedNotification: (notification: Notification | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<NotificationState['filters']>) => void;
  setPagination: (page: number, totalPages: number, hasNext: boolean, hasPrev: boolean) => void;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  toggleTheme: () => void;
  reset: () => void;
}

const initialState = {
  notifications: [],
  priorityNotifications: [],
  unreadCount: 0,
  selectedNotification: null,
  isLoading: false,
  error: null,
  filters: {},
  theme: 'light' as ThemeMode,
  page: 1,
  totalPages: 1,
  hasNext: false,
  hasPrev: false
};

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setNotifications: (notifications) => set({ notifications }),
        setPriorityNotifications: (priorityNotifications) => set({ priorityNotifications }),
        setUnreadCount: (unreadCount) => set({ unreadCount }),
        setSelectedNotification: (selectedNotification) => set({ selectedNotification }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
        setPagination: (page, totalPages, hasNext, hasPrev) => 
          set({ page, totalPages, hasNext, hasPrev }),

        markAsRead: (id) => set((state) => ({
          notifications: state.notifications.map(n => 
            n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1)
        })),

        deleteNotification: (id) => set((state) => ({
          notifications: state.notifications.filter(n => n._id !== id)
        })),

        toggleTheme: () => set((state) => ({ 
          theme: state.theme === 'light' ? 'dark' : 'light' 
        })),

        reset: () => set(initialState)
      }),
      { name: 'notification-store' }
    )
  )
);
