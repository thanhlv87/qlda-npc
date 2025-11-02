import { db, firebase } from './firebase';
import type { Notification } from '../types';

export const notificationService = {
  // Request notification permission (for PWA)
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    if (!db) return;
    try {
      const notifRef = db.collection('users').doc(userId).collection('notifications').doc(notificationId);
      await notifRef.update({ read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    if (!db) return;
    try {
      const notificationsRef = db.collection('users').doc(userId).collection('notifications');
      const unreadSnapshot = await notificationsRef.where('read', '==', false).get();

      const batch = db.batch();
      unreadSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  // Delete notification
  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    if (!db) return;
    try {
      await db.collection('users').doc(userId).collection('notifications').doc(notificationId).delete();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },

  // Create notification manually (will be replaced by Cloud Functions)
  async createNotification(userId: string, notification: Omit<Notification, 'id'>): Promise<void> {
    if (!db || !firebase) return;
    try {
      await db.collection('users').doc(userId).collection('notifications').add({
        ...notification,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  },

  // Helper: Get users who should receive notification for a project
  async getUsersToNotify(projectId: string): Promise<string[]> {
    if (!db) return [];
    try {
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) return [];

      const project = projectDoc.data();
      if (!project) return [];

      const userIdsToNotify = new Set<string>();

      // Get all admins
      const adminsSnapshot = await db.collection('users').where('role', '==', 'Admin').get();
      adminsSnapshot.docs.forEach(doc => userIdsToNotify.add(doc.id));

      // Get all department heads
      const deptHeadsSnapshot = await db.collection('users').where('role', '==', 'DepartmentHead').get();
      deptHeadsSnapshot.docs.forEach(doc => userIdsToNotify.add(doc.id));

      // Get project managers
      if (project.projectManagerIds) {
        project.projectManagerIds.forEach((id: string) => userIdsToNotify.add(id));
      }

      return Array.from(userIdsToNotify);
    } catch (error) {
      console.error('Error getting users to notify:', error);
      return [];
    }
  }
};
