import { messaging, db } from './firebase';

export const fcmService = {
  /**
   * Request notification permission and get FCM token
   * @param userId - User ID to save token for
   * @returns FCM token or null if permission denied
   */
  async requestPermissionAndGetToken(userId: string): Promise<string | null> {
    if (!messaging || !db) {
      console.log('Messaging not available');
      return null;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Get FCM token
      const token = await messaging.getToken({
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });

      if (token) {
        console.log('FCM token obtained:', token);

        // Save token to user document
        await db.collection('users').doc(userId).update({
          fcmToken: token,
          fcmTokenUpdatedAt: new Date().toISOString()
        });

        return token;
      }

      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },

  /**
   * Setup foreground message listener
   * This handles notifications when app is open
   */
  setupForegroundListener(callback: (payload: any) => void) {
    if (!messaging) return () => {};

    const unsubscribe = messaging.onMessage((payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });

    return unsubscribe;
  },

  /**
   * Remove FCM token when user logs out
   */
  async removeToken(userId: string) {
    if (!messaging || !db) return;

    try {
      await messaging.deleteToken();

      // Remove token from user document
      await db.collection('users').doc(userId).update({
        fcmToken: null,
        fcmTokenUpdatedAt: null
      });

      console.log('FCM token removed');
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }
};
