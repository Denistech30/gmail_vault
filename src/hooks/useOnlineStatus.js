import { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasShownOfflineReminder, setHasShownOfflineReminder] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setHasShownOfflineReminder(false);
      
      // Show sync notification when coming back online
      await notificationService.showSyncNotification('Back online! Data will sync automatically.');
    };

    const handleOffline = async () => {
      setIsOnline(false);
      
      // Show offline reminder (only once per offline session)
      if (!hasShownOfflineReminder) {
        await notificationService.showOfflineReminder();
        setHasShownOfflineReminder(true);
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status and show reminder if offline
    if (!navigator.onLine && !hasShownOfflineReminder) {
      handleOffline();
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasShownOfflineReminder]);

  return {
    isOnline,
    showOfflineReminder: () => notificationService.showOfflineReminder(),
    showSyncNotification: (message) => notificationService.showSyncNotification(message)
  };
}
