import { useState, useEffect, useCallback } from 'react';
import InventoryNotificationService, { Notification, NotificationSettings } from '@/services/inventoryNotificationService';

export function useInventoryNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [highCount, setHighCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  const notificationService = InventoryNotificationService.getInstance();

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(notificationService.getUnreadCount());
      setCriticalCount(notificationService.getCriticalCount());
      setHighCount(notificationService.getHighCount());
    });

    // Carregar configurações iniciais
    setSettings(notificationService.getSettings());

    return unsubscribe;
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    notificationService.markAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    notificationService.deleteNotification(notificationId);
  }, []);

  const clearAll = useCallback(() => {
    notificationService.clearAll();
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    notificationService.updateSettings(newSettings);
    setSettings(notificationService.getSettings());
  }, []);

  const checkLowStock = useCallback((items: any[]) => {
    notificationService.checkLowStock(items);
  }, []);

  const onRequestCreated = useCallback((request: any) => {
    notificationService.onRequestCreated(request);
  }, []);

  const onRequestApproved = useCallback((request: any) => {
    notificationService.onRequestApproved(request);
  }, []);

  const onRequestRejected = useCallback((request: any, reason?: string) => {
    notificationService.onRequestRejected(request, reason);
  }, []);

  const onOrderCreated = useCallback((order: any) => {
    notificationService.onOrderCreated(order);
  }, []);

  const onOrderCompleted = useCallback((order: any) => {
    notificationService.onOrderCompleted(order);
  }, []);

  return {
    notifications,
    unreadCount,
    criticalCount,
    highCount,
    settings,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updateSettings,
    checkLowStock,
    onRequestCreated,
    onRequestApproved,
    onRequestRejected,
    onOrderCreated,
    onOrderCompleted
  };
}
