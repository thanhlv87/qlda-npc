# Hướng dẫn cài đặt Push Notifications (Thông báo đẩy)

## Bước 1: Lấy VAPID Key từ Firebase Console

1. Truy cập Firebase Console: https://console.firebase.google.com/
2. Chọn project **qlda-npsc**
3. Click vào biểu tượng ⚙️ (Settings) > **Project settings**
4. Chọn tab **Cloud Messaging**
5. Cuộn xuống phần **Web configuration**
6. Tìm phần **Web Push certificates**
7. Nếu chưa có key, click **Generate key pair**
8. Copy **Key pair** (chuỗi ký tự bắt đầu bằng "B...")

## Bước 2: Cập nhật .env file

Mở file `.env` và thay thế `your_vapid_key_here` bằng key vừa copy:

```
VITE_FIREBASE_VAPID_KEY=BNj8... (key của bạn)
```

## Bước 3: Deploy lại ứng dụng

```bash
npm run build
firebase deploy --only hosting
```

## Bước 4: Cập nhật Cloud Functions để gửi Push Notifications

File `functions/index.js` cần được cập nhật để gửi FCM messages khi tạo notifications.

### Thêm vào đầu file functions/index.js:

```javascript
const admin = require('firebase-admin');
```

### Cập nhật các Cloud Functions:

Thêm đoạn code gửi FCM message vào mỗi function (onReportCreated, onReportUpdated, onReviewAdded, onDocumentUploaded):

```javascript
// Example for onReportCreated
exports.onReportCreated = onDocumentCreated('reports/{reportId}', async (event) => {
  // ... existing code to create notifications ...

  // NEW: Send FCM push notifications
  const fcmPromises = [];

  for (const userId of usersToNotify) {
    // Get user's FCM token
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;

    if (fcmToken) {
      const message = {
        notification: {
          title: 'Báo cáo mới',
          body: `${reporterName} đã tạo báo cáo cho dự án ${projectName}`,
        },
        data: {
          type: 'report_created',
          projectId: report.projectId,
          reportId: reportId,
        },
        token: fcmToken,
      };

      fcmPromises.push(
        admin.messaging().send(message).catch(error => {
          console.error(`Failed to send FCM to ${userId}:`, error);
          // If token is invalid, remove it
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            return admin.firestore().collection('users').doc(userId).update({
              fcmToken: null,
              fcmTokenUpdatedAt: null
            });
          }
        })
      );
    }
  }

  await Promise.all(fcmPromises);
});
```

## Bước 5: Deploy Cloud Functions

```bash
cd functions
npm install
firebase deploy --only functions
```

## Bước 6: Test Push Notifications

1. Đăng nhập vào ứng dụng
2. Cho phép notifications khi trình duyệt hỏi
3. Kiểm tra Console log: "FCM token obtained and saved: ..."
4. Tạo báo cáo mới từ tài khoản khác
5. Đóng/minimize ứng dụng
6. Kiểm tra xem có nhận được thông báo đẩy không

## Lưu ý quan trọng:

### HTTPS Required
- Push notifications chỉ hoạt động trên HTTPS
- Localhost được hỗ trợ cho development
- Production phải dùng HTTPS

### Browser Support
- Chrome, Firefox, Edge: Hỗ trợ đầy đủ
- Safari (iOS): KHÔNG hỗ trợ Web Push Notifications
- Safari (macOS): Hỗ trợ từ version 16+

### Service Worker
- File `sw.js` đã được cấu hình sẵn
- Service Worker tự động xử lý background notifications
- Click vào notification sẽ mở ứng dụng và điều hướng đến dự án

## Troubleshooting

### Không nhận được thông báo:
1. Kiểm tra permission: `Notification.permission` phải là `"granted"`
2. Kiểm tra FCM token đã được lưu trong Firestore: `users/{userId}/fcmToken`
3. Kiểm tra Cloud Function logs: `firebase functions:log`
4. Kiểm tra Service Worker đã registered: DevTools > Application > Service Workers

### Token không được tạo:
1. Kiểm tra VAPID key trong .env
2. Kiểm tra messaging được import và initialize đúng
3. Kiểm tra console errors

### Cloud Functions lỗi:
1. Kiểm tra admin.messaging() đã được initialize
2. Kiểm tra fcmToken không null/undefined
3. Kiểm tra message format đúng theo FCM spec
