// Notification Service for Gmail Vault PWA
// Uses browser Notification API for simple alerts

class NotificationService {
  constructor() {
    this.permission = Notification.permission;
    this.isSupported = 'Notification' in window;
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Show a simple notification
  async showNotification(title, options = {}) {
    if (!this.isSupported) {
      console.warn('Notifications not supported');
      return null;
    }

    // Request permission if not already granted
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return null;
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'gmail-vault',
      renotify: false,
      requireInteraction: false,
      silent: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto-close after 5 seconds if not set to require interaction
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  // Show success notification
  async showSuccess(message, options = {}) {
    return this.showNotification('✅ Gmail Vault', {
      body: message,
      icon: '/favicon.ico',
      tag: 'success',
      ...options
    });
  }

  // Show error notification
  async showError(message, options = {}) {
    return this.showNotification('❌ Gmail Vault', {
      body: message,
      icon: '/favicon.ico',
      tag: 'error',
      requireInteraction: true, // Keep error notifications visible
      ...options
    });
  }

  // Show info notification
  async showInfo(message, options = {}) {
    return this.showNotification('ℹ️ Gmail Vault', {
      body: message,
      icon: '/favicon.ico',
      tag: 'info',
      ...options
    });
  }

  // Show offline reminder
  async showOfflineReminder() {
    return this.showInfo('You are currently offline. Your data will sync when you reconnect to the internet.', {
      tag: 'offline-reminder',
      requireInteraction: false,
      silent: true
    });
  }

  // Show sync notification
  async showSyncNotification(message = 'Data synchronized successfully') {
    return this.showSuccess(message, {
      tag: 'sync',
      silent: true
    });
  }

  // Check if notifications are supported
  isNotificationSupported() {
    return this.isSupported;
  }

  // Get current permission status
  getPermissionStatus() {
    return this.permission;
  }

  // Check online status
  isOnline() {
    return navigator.onLine;
  }

  // Show appropriate notification based on online status
  async checkAndNotifyOnlineStatus() {
    if (!this.isOnline()) {
      await this.showOfflineReminder();
      return false;
    }
    return true;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
