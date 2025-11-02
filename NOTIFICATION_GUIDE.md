# 🔔 HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG THÔNG BÁO

## 📋 MỤC TIÊU

Khi có người:
- ✅ Tạo báo cáo mới
- ✅ Cập nhật báo cáo
- ✅ Thêm nhận xét vào báo cáo
- ✅ Upload tài liệu mới

→ Thông báo tới: **Admin, DepartmentHead, ProjectManager** của dự án đó

---

## 🏗️ KIẾN TRÚC TỔNG QUAN

```
User Action (Report/Comment)
    ↓
Firestore Trigger (Cloud Function)
    ↓
Query users cần nhận thông báo
    ↓
Gửi đồng thời:
    ├─→ In-App Notification (Firestore)
    ├─→ Push Notification (FCM)
    └─→ Email (Optional)
```

---

## 📦 BƯỚC 1: CÀI ĐẶT DEPENDENCIES

```bash
npm install firebase-admin
```

---

## 🗂️ BƯỚC 2: CẬP NHẬT DATA MODEL

### File: `types.ts`

Thêm vào cuối file:

```typescript
export interface Notification {
  id: string;
  type: 'report_created' | 'report_updated' | 'comment_added' | 'document_uploaded' | 'user_mentioned';
  title: string;
  message: string;
  projectId: string;
  projectName: string;
  reportId?: string;
  reportDate?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string; // URL to navigate when clicked
}

export interface UserNotificationSettings {
  userId: string;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  notificationTypes: {
    reportCreated: boolean;
    reportUpdated: boolean;
    commentAdded: boolean;
    documentUploaded: boolean;
  };
  fcmTokens: string[]; // Array of FCM tokens (multiple devices)
}
```

---

## 🔧 BƯỚC 3: TẠO NOTIFICATION SERVICE

### File: `services/notificationService.ts`

```typescript
import { db } from './firebase';
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

  // Get FCM token
  async getFCMToken(): Promise<string | null> {
    try {
      // Note: Requires firebase-messaging
      // Will implement after enabling Firebase Messaging
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },

  // Save FCM token to user's document
  async saveFCMToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        fcmTokens: firebase.firestore.FieldValue.arrayUnion(token)
      });
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  },

  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      const notifRef = db.collection('users').doc(userId).collection('notifications').doc(notificationId);
      await notifRef.update({ read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
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
    try {
      await db.collection('users').doc(userId).collection('notifications').doc(notificationId).delete();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },

  // Create in-app notification (called by Cloud Function)
  async createNotification(userId: string, notification: Omit<Notification, 'id'>): Promise<void> {
    try {
      await db.collection('users').doc(userId).collection('notifications').add(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }
};
```

---

## 🎨 BƯỚC 4: TẠO NOTIFICATION UI COMPONENTS

### File: `components/NotificationBell.tsx`

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import type { Notification, User } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationBellProps {
  currentUser: User;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ currentUser }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen to notifications
    const unsubscribe = db
      .collection('users')
      .doc(currentUser.id)
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .onSnapshot(snapshot => {
        const notifs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Notification));

        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      });

    return () => unsubscribe();
  }, [currentUser.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      await notificationService.markAsRead(currentUser.id, notif.id);
    }

    // Navigate to the relevant page
    if (notif.actionUrl) {
      // Will implement navigation logic
      console.log('Navigate to:', notif.actionUrl);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(currentUser.id);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'report_created':
        return '📝';
      case 'report_updated':
        return '✏️';
      case 'comment_added':
        return '💬';
      case 'document_uploaded':
        return '📎';
      default:
        return '🔔';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return \`\${minutes} phút trước\`;
    if (hours < 24) return \`\${hours} giờ trước\`;
    if (days < 7) return \`\${days} ngày trước\`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-800">Thông báo ({unreadCount})</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={\`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors \${
                    !notif.read ? 'bg-blue-50' : ''
                  }\`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl flex-shrink-0">{getNotificationIcon(notif.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={\`text-sm font-semibold text-gray-800 \${!notif.read ? 'font-bold' : ''}\`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTime(notif.createdAt)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
                Xem tất cả thông báo
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
```

---

## 🔗 BƯỚC 5: THÊM NOTIFICATION BELL VÀO HEADER

### File: `components/Header.tsx`

Thêm import:
```typescript
import NotificationBell from './NotificationBell.tsx';
```

Thêm vào Desktop Menu (sau user name):
```typescript
<div className="hidden sm:flex items-center space-x-4">
    <NotificationBell currentUser={user} />  {/* ← Thêm dòng này */}
    <div>
        <span className="font-medium">Chào, {user.name} ({user.role || 'Chờ duyệt'})</span>
    </div>
    <button
        onClick={onLogout}
        className="bg-accent hover:opacity-90 text-white font-bold py-2 px-4 rounded transition-colors"
    >
        Đăng xuất
    </button>
</div>
```

Thêm vào Mobile Menu (trong dropdown):
```typescript
<div className="sm:hidden">
    <div className="flex items-center space-x-2">
        <NotificationBell currentUser={user} />  {/* ← Thêm dòng này */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none p-1">
            {isMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
    </div>
</div>
```

---

## ☁️ BƯỚC 6: TẠO FIREBASE CLOUD FUNCTIONS

### File: `functions/index.js` (Tạo folder mới `functions/`)

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Helper function to get users who should be notified
async function getUsersToNotify(projectId) {
  const projectDoc = await db.collection('projects').doc(projectId).get();
  if (!projectDoc.exists) return [];

  const project = projectDoc.data();
  const userIdsToNotify = new Set();

  // Get all admins
  const adminsSnapshot = await db.collection('users').where('role', '==', 'Admin').get();
  adminsSnapshot.docs.forEach(doc => userIdsToNotify.add(doc.id));

  // Get all department heads
  const deptHeadsSnapshot = await db.collection('users').where('role', '==', 'DepartmentHead').get();
  deptHeadsSnapshot.docs.forEach(doc => userIdsToNotify.add(doc.id));

  // Get project managers
  if (project.projectManagerIds) {
    project.projectManagerIds.forEach(id => userIdsToNotify.add(id));
  }

  // Get lead supervisors
  if (project.leadSupervisorIds) {
    project.leadSupervisorIds.forEach(id => userIdsToNotify.add(id));
  }

  return Array.from(userIdsToNotify);
}

// Trigger when a new report is created
exports.onReportCreated = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap, context) => {
    const report = snap.data();
    const reportId = context.params.reportId;

    // Get project info
    const projectDoc = await db.collection('projects').doc(report.projectId).get();
    if (!projectDoc.exists) return null;

    const project = projectDoc.data();
    const projectName = project.name;

    // Get reporter info
    const reporterDoc = await db.collection('users').doc(report.submittedBy).get();
    const reporterName = reporterDoc.exists ? reporterDoc.data().name : 'Người dùng';

    // Get users to notify
    const userIds = await getUsersToNotify(report.projectId);

    // Remove the reporter from notification list
    const usersToNotify = userIds.filter(id => id !== report.submittedBy);

    // Create notifications
    const batch = db.batch();

    usersToNotify.forEach(userId => {
      const notifRef = db.collection('users').doc(userId).collection('notifications').doc();
      batch.set(notifRef, {
        type: 'report_created',
        title: 'Báo cáo mới',
        message: \`\${reporterName} đã tạo báo cáo cho dự án "\${projectName}" - Ngày \${report.date}\`,
        projectId: report.projectId,
        projectName: projectName,
        reportId: reportId,
        reportDate: report.date,
        createdBy: report.submittedBy,
        createdByName: reporterName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
        actionUrl: \`/projects/\${report.projectId}/reports/\${reportId}\`
      });
    });

    await batch.commit();

    console.log(\`Created \${usersToNotify.length} notifications for new report\`);
    return null;
  });

// Trigger when a report is updated
exports.onReportUpdated = functions.firestore
  .document('reports/{reportId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const reportId = context.params.reportId;

    // Check if substantive changes were made
    const hasSubstantiveChange =
      before.tasks !== after.tasks ||
      before.progressPercentage !== after.progressPercentage ||
      JSON.stringify(before.images) !== JSON.stringify(after.images);

    if (!hasSubstantiveChange) return null;

    // Get project info
    const projectDoc = await db.collection('projects').doc(after.projectId).get();
    if (!projectDoc.exists) return null;

    const project = projectDoc.data();
    const projectName = project.name;

    // Get updater info
    const updaterDoc = await db.collection('users').doc(after.submittedBy).get();
    const updaterName = updaterDoc.exists ? updaterDoc.data().name : 'Người dùng';

    // Get users to notify
    const userIds = await getUsersToNotify(after.projectId);
    const usersToNotify = userIds.filter(id => id !== after.submittedBy);

    // Create notifications
    const batch = db.batch();

    usersToNotify.forEach(userId => {
      const notifRef = db.collection('users').doc(userId).collection('notifications').doc();
      batch.set(notifRef, {
        type: 'report_updated',
        title: 'Báo cáo được cập nhật',
        message: \`\${updaterName} đã cập nhật báo cáo dự án "\${projectName}" - Ngày \${after.date}\`,
        projectId: after.projectId,
        projectName: projectName,
        reportId: reportId,
        reportDate: after.date,
        createdBy: after.submittedBy,
        createdByName: updaterName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
        actionUrl: \`/projects/\${after.projectId}/reports/\${reportId}\`
      });
    });

    await batch.commit();

    console.log(\`Created \${usersToNotify.length} notifications for updated report\`);
    return null;
  });

// Trigger when a review/comment is added
exports.onReviewAdded = functions.firestore
  .document('projects/{projectId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const projectId = context.params.projectId;

    // Check if reviews were added
    const beforeReviews = before.reviews || {};
    const afterReviews = after.reviews || {};

    // Find new reviews
    let newReviews = [];
    for (const reportId in afterReviews) {
      const beforeArray = beforeReviews[reportId] || [];
      const afterArray = afterReviews[reportId] || [];

      if (afterArray.length > beforeArray.length) {
        const newReview = afterArray[afterArray.length - 1];
        newReviews.push({ reportId, review: newReview });
      }
    }

    if (newReviews.length === 0) return null;

    const projectName = after.name;

    // Process each new review
    for (const { reportId, review } of newReviews) {
      // Get report info
      const reportDoc = await db.collection('reports').doc(reportId).get();
      if (!reportDoc.exists) continue;

      const report = reportDoc.data();

      // Get users to notify
      const userIds = await getUsersToNotify(projectId);
      const usersToNotify = userIds.filter(id => id !== review.reviewedById);

      // Create notifications
      const batch = db.batch();

      usersToNotify.forEach(userId => {
        const notifRef = db.collection('users').doc(userId).collection('notifications').doc();
        batch.set(notifRef, {
          type: 'comment_added',
          title: 'Nhận xét mới',
          message: \`\${review.reviewedByName} đã nhận xét báo cáo dự án "\${projectName}" - Ngày \${report.date}\`,
          projectId: projectId,
          projectName: projectName,
          reportId: reportId,
          reportDate: report.date,
          createdBy: review.reviewedById,
          createdByName: review.reviewedByName,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
          actionUrl: \`/projects/\${projectId}/reports/\${reportId}\`
        });
      });

      await batch.commit();
      console.log(\`Created \${usersToNotify.length} notifications for new comment\`);
    }

    return null;
  });
```

### File: `functions/package.json`

```json
{
  "name": "functions",
  "scripts": {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "dependencies": {
    "firebase-admin": "^11.11.0",
    "firebase-functions": "^4.5.0"
  }
}
```

---

## 🚀 BƯỚC 7: DEPLOY

### 1. Init Firebase Functions

```bash
firebase init functions

# Chọn:
# - JavaScript
# - ESLint: No (hoặc Yes nếu muốn)
# - npm install: Yes
```

### 2. Upgrade to Blaze Plan

Cloud Functions cần Blaze plan (pay-as-you-go):

```bash
# Vào Firebase Console > Settings > Usage and billing
# Upgrade to Blaze plan (free tier vẫn có, chỉ pay khi vượt quota)
```

### 3. Deploy Functions

```bash
cd functions
npm install
cd ..

firebase deploy --only functions
```

### 4. Deploy Frontend

```bash
npm run build
# Deploy lên Vercel như bình thường
```

---

## 📱 BƯỚC 8: HỖ TRỢ iOS (PWA)

### Lưu ý về iOS:
- iOS Safari hỗ trợ Web Push từ **iOS 16.4+**
- Cần Add to Home Screen để nhận push notifications
- Cần HTTPS (Vercel tự động có)

### Service Worker cho iOS

File \`sw.js\` đã có sẵn, chỉ cần thêm:

```javascript
// Handle push notifications
self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.message || data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.actionUrl || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Thông báo', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there's already a window open
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
```

---

## ✅ BƯỚC 9: TESTING

### Test In-App Notifications:

1. Login với 2 accounts (Admin và PM)
2. Với PM: Tạo báo cáo mới
3. Với Admin: Kiểm tra thông báo bell icon
4. Click thông báo → Kiểm tra navigation

### Test Push Notifications (Desktop):

1. Click "Allow" khi browser hỏi notification permission
2. Tạo báo cáo mới
3. Kiểm tra desktop notification popup

### Test trên iOS:

1. Mở Safari trên iPhone (iOS 16.4+)
2. Vào https://qlda-npc.vercel.app
3. Tap Share → Add to Home Screen
4. Mở app từ Home Screen
5. Grant notification permission
6. Test tạo báo cáo → Kiểm tra notification

---

## 📊 GIÁM SÁT

### Firebase Console:

1. **Functions Logs:**
   - Firebase Console > Functions > Logs
   - Xem functions có chạy không
   - Check errors

2. **Firestore:**
   - Kiểm tra collection \`users/{userId}/notifications\`
   - Verify notifications được tạo

3. **Usage:**
   - Functions > Usage
   - Monitor function invocations
   - Check costs

---

## 💰 CHI PHÍ

### Firebase Blaze Plan:

**Free tier (mỗi tháng):**
- 2M function invocations
- 400K GB-seconds
- 200K CPU-seconds

**Ước tính cho app của bạn:**
- ~100 báo cáo/ngày
- ~3 notifications/report (avg 3 users notified)
- = 300 function calls/day
- = 9,000 function calls/month
- → **Hoàn toàn trong free tier!**

Chỉ pay khi vượt quota (rất hiếm xảy ra).

---

## 🎯 TÓM TẮT STEPS

1. ✅ Update \`types.ts\` - Thêm Notification types
2. ✅ Tạo \`services/notificationService.ts\`
3. ✅ Tạo \`components/NotificationBell.tsx\`
4. ✅ Update \`components/Header.tsx\` - Thêm bell icon
5. ✅ Tạo \`functions/index.js\` - Cloud Functions
6. ✅ \`firebase init functions\`
7. ✅ Upgrade to Blaze plan
8. ✅ \`firebase deploy --only functions\`
9. ✅ Deploy frontend lên Vercel
10. ✅ Test trên web và iOS

---

## 🐛 TROUBLESHOOTING

**Functions không trigger:**
- Check Firestore indexes
- Check function logs
- Verify Blaze plan enabled

**Notifications không hiển thị:**
- Check Firestore \`users/{id}/notifications\` collection
- Verify user permissions
- Check browser console errors

**iOS không nhận push:**
- Verify iOS 16.4+
- Check app đã Add to Home Screen chưa
- Grant notification permission

---

**Bạn muốn tôi implement code ngay không? Hay giữ lại hướng dẫn này để bạn tự làm sau?** 🚀
