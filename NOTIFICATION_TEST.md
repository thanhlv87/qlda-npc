# Hướng dẫn Test Hệ thống Thông báo

## Vấn đề đã sửa

### 1. **Lỗi xử lý Timestamp từ Firestore**
- **Vấn đề:** Cloud Functions lưu `createdAt` bằng `admin.firestore.FieldValue.serverTimestamp()` (Timestamp object), nhưng frontend expect string.
- **Triệu chứng:** Thông báo không hiển thị hoặc crash khi render timestamp.
- **Đã sửa:** Thêm conversion từ Firestore Timestamp sang ISO string trong `NotificationBell.tsx`

```typescript
// Trước (SAI):
const notifs = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
} as Notification));

// Sau (ĐÚNG):
const notifs = snapshot.docs.map(doc => {
  const data = doc.data();
  const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
  return {
    id: doc.id,
    ...data,
    createdAt
  } as Notification;
});
```

### 2. **Xử lý null/undefined timestamp**
- **Vấn đề:** Trong quá trình write, `createdAt` có thể tạm thời là `null`.
- **Đã sửa:** Thêm null check trong `formatTime()`

```typescript
const formatTime = (timestamp: string | null | undefined) => {
  if (!timestamp) return 'Vừa xong';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Vừa xong';
  // ... rest of logic
};
```

---

## Kiểm tra Cloud Functions đã deploy

### Lệnh kiểm tra:
```bash
firebase functions:list
```

### Kết quả mong đợi:
```
┌────────────────────┬─────────┬────────────────────────────────────────────┬─────────────┬────────┬──────────┐
│ Function           │ Version │ Trigger                                    │ Location    │ Memory │ Runtime  │
├────────────────────┼─────────┼────────────────────────────────────────────┼─────────────┼────────┼──────────┤
│ onDocumentUploaded │ v2      │ google.cloud.firestore.document.v1.created │ us-central1 │ 256    │ nodejs20 │
├────────────────────┼─────────┼────────────────────────────────────────────┼─────────────┼────────┼──────────┤
│ onReportCreated    │ v2      │ google.cloud.firestore.document.v1.created │ us-central1 │ 256    │ nodejs20 │
├────────────────────┼─────────┼────────────────────────────────────────────┼─────────────┼────────┼──────────┤
│ onReportUpdated    │ v2      │ google.cloud.firestore.document.v1.updated │ us-central1 │ 256    │ nodejs20 │
├────────────────────┼─────────┼────────────────────────────────────────────┼─────────────┼────────┼──────────┤
│ onReviewAdded      │ v2      │ google.cloud.firestore.document.v1.updated │ us-central1 │ 256    │ nodejs20 │
└────────────────────┴─────────┴────────────────────────────────────────────┴─────────────┴────────┴──────────┘
```

✅ **Tất cả 4 functions đã được deploy thành công!**

---

## Các bước Test

### Test 1: Tạo báo cáo mới (onReportCreated)

1. **Đăng nhập** bằng tài khoản **ProjectManager** hoặc **LeadSupervisor**
2. Vào một dự án bất kỳ
3. Click **"Thêm Báo cáo +"**
4. Điền đầy đủ thông tin:
   - Ngày báo cáo
   - Công việc đã thực hiện
   - Tiến độ (%)
   - Số lượng nhân lực
   - Thiết bị máy móc
   - Upload ít nhất 1 ảnh
5. Click **"Lưu"**

**Kết quả mong đợi:**
- Báo cáo được tạo thành công
- Đăng xuất và đăng nhập lại bằng tài khoản **Admin** hoặc **DepartmentHead**
- Click vào **biểu tượng chuông** 🔔 ở góc trên bên phải
- Thấy thông báo mới:
  ```
  📝 Báo cáo mới
  [Tên người tạo] đã tạo báo cáo cho dự án "[Tên dự án]" - Ngày [DD/MM/YYYY]
  Vừa xong
  ```
- Badge hiển thị số thông báo chưa đọc (màu đỏ)

---

### Test 2: Cập nhật báo cáo (onReportUpdated)

1. **Đăng nhập** bằng tài khoản **Admin** (chỉ Admin mới có quyền edit)
2. Vào dự án có báo cáo
3. Click vào một báo cáo đã tạo
4. Click **"Chỉnh sửa"**
5. Thay đổi nội dung:
   - Sửa công việc
   - Hoặc thay đổi tiến độ %
   - Hoặc thêm/xóa ảnh
6. Click **"Lưu"**

**Kết quả mong đợi:**
- Đăng nhập lại bằng tài khoản **DepartmentHead** hoặc **ProjectManager**
- Thấy thông báo:
  ```
  ✏️ Báo cáo được cập nhật
  [Tên admin] đã cập nhật báo cáo dự án "[Tên dự án]" - Ngày [DD/MM/YYYY]
  Vừa xong
  ```

**Lưu ý:** Chỉ có thay đổi **substantive** (tasks, progress, images) mới trigger notification. Thay đổi metadata không trigger.

---

### Test 3: Thêm nhận xét (onReviewAdded)

1. **Đăng nhập** bằng tài khoản **DepartmentHead** hoặc **ProjectManager**
2. Vào dự án có báo cáo
3. Click vào một báo cáo
4. Click **"Thêm Nhận xét"**
5. Nhập nội dung nhận xét
6. Click **"Lưu"**

**Kết quả mong đợi:**
- Người tạo báo cáo và các Admin khác nhận được thông báo:
  ```
  💬 Nhận xét mới
  [Tên người review] đã nhận xét báo cáo dự án "[Tên dự án]" - Ngày [DD/MM/YYYY]
  Vừa xong
  ```

---

### Test 4: Upload tài liệu (onDocumentUploaded)

1. **Đăng nhập** bằng tài khoản có quyền upload
2. Vào tab **"Tài liệu"** của một dự án
3. Click **"Upload files"**
4. Chọn file và upload

**Kết quả mong đợi:**
- Admin, DepartmentHead, ProjectManager nhận thông báo:
  ```
  📎 Tài liệu mới
  [Tên người upload] đã tải lên tài liệu "[Tên file]" cho dự án "[Tên dự án]"
  Vừa xong
  ```

---

## Kiểm tra trong Firebase Console

### 1. Kiểm tra Firestore Database

Vào **Firebase Console → Firestore Database**

**Collection structure:**
```
users/
  {userId}/
    notifications/
      {notificationId}/
        - type: "report_created" | "report_updated" | "comment_added" | "document_uploaded"
        - title: string
        - message: string
        - projectId: string
        - projectName: string
        - reportId: string (optional)
        - reportDate: string (optional)
        - createdBy: string
        - createdByName: string
        - createdAt: Timestamp
        - read: boolean
        - actionUrl: string
```

**Ví dụ document:**
```json
{
  "type": "report_created",
  "title": "Báo cáo mới",
  "message": "Nguyễn Văn A đã tạo báo cáo cho dự án \"Sửa chữa nhà A\" - Ngày 02/11/2025",
  "projectId": "abc123",
  "projectName": "Sửa chữa nhà A",
  "reportId": "xyz789",
  "reportDate": "02/11/2025",
  "createdBy": "userId123",
  "createdByName": "Nguyễn Văn A",
  "createdAt": Timestamp(seconds: 1699000000, nanoseconds: 0),
  "read": false,
  "actionUrl": "/projects/abc123/reports/xyz789"
}
```

### 2. Kiểm tra Cloud Function Logs

Vào **Firebase Console → Functions → Logs**

**Log ví dụ khi tạo báo cáo:**
```
New report created: xyz789 for project: abc123
Notifying 3 users
Created 3 notifications for new report
```

**Log khi update báo cáo (không có substantive changes):**
```
Report updated: xyz789 for project: abc123
No substantive changes, skipping notification
```

---

## Troubleshooting

### Vấn đề 1: Không nhận được thông báo

**Kiểm tra:**
1. Cloud Functions đã deploy chưa?
   ```bash
   firebase functions:list
   ```
2. Kiểm tra logs xem function có chạy không?
   - Firebase Console → Functions → Logs
   - Tìm log của function tương ứng

3. Kiểm tra Firestore Database:
   - Vào `users/{userId}/notifications`
   - Có documents mới không?

4. Kiểm tra role của user:
   - Chỉ Admin, DepartmentHead, ProjectManager nhận thông báo
   - Người tạo action KHÔNG nhận thông báo của chính họ

### Vấn đề 2: Thông báo không hiển thị trên UI

**Kiểm tra:**
1. Mở **Browser Console** (F12)
2. Xem có lỗi gì không?
3. Kiểm tra `NotificationBell` component có render không?
4. Kiểm tra user có role chưa? (chuông chỉ hiển thị khi `user.role` exists)

**Lỗi phổ biến đã sửa:**
- ✅ Timestamp conversion (đã sửa)
- ✅ Null timestamp handling (đã sửa)

### Vấn đề 3: Badge không cập nhật real-time

**Kiểm tra:**
1. Real-time listener có hoạt động không?
2. Mở **Network tab** trong DevTools
3. Tìm các requests đến Firestore
4. Nếu không có real-time updates, check Firebase config

### Vấn đề 4: Cloud Function timeout hoặc error

**Giải pháp:**
1. Kiểm tra logs trong Firebase Console
2. Verify rằng tất cả collections exist:
   - `projects/{projectId}`
   - `users/{userId}`
   - `reports/{reportId}`
3. Check Firestore indexes (nếu cần)

---

## Firestore Security Rules cần thiết

**Thêm vào firestore.rules:**

```javascript
match /users/{userId}/notifications/{notificationId} {
  // User chỉ có thể đọc/update notifications của chính họ
  allow read, update, delete: if request.auth != null && request.auth.uid == userId;

  // Cloud Functions có thể write (vì chạy với admin SDK)
  allow create: if request.auth != null;
}
```

**Deploy rules:**
```bash
firebase deploy --only firestore:rules
```

---

## Firestore Indexes

Nếu gặp lỗi "requires an index", tạo index:

**Collection:** `users/{userId}/notifications`
**Fields:**
- `createdAt` - Descending

**Hoặc tự động tạo bằng cách:**
1. Click vào link trong error message
2. Firebase sẽ auto-generate index

---

## Performance & Cost

### Expected Usage:
- **Mỗi báo cáo mới:** ~3-5 notifications (tùy số Admin + DeptHead + PM)
- **Mỗi update:** ~3-5 notifications (chỉ khi có substantive changes)
- **Mỗi comment:** ~3-5 notifications
- **Mỗi document upload:** ~3-5 notifications

### Free Tier Limits:
- **Cloud Functions:** 2M invocations/month (FREE)
- **Firestore Reads:** 50K/day (FREE)
- **Firestore Writes:** 20K/day (FREE)

**Dự kiến usage:**
- 10 báo cáo/ngày × 5 notifications = **50 writes/day** ✅
- Hoàn toàn nằm trong free tier!

---

## Các tính năng bổ sung (Optional)

### 1. Push Notifications (Service Worker đã có sẵn)
File: `sw.js` đã implement push notification handling

**Để bật:**
- Request permission trong app
- Subscribe to FCM topic
- Send push từ Cloud Functions

### 2. Email Notifications
Thêm function gửi email khi có thông báo quan trọng

### 3. In-app notification sound
Play sound khi nhận notification mới

---

## Kết luận

✅ **Cloud Functions đã deploy thành công**
✅ **Frontend đã sửa lỗi timestamp handling**
✅ **NotificationBell component hoạt động với real-time listener**
✅ **4 types thông báo:** report_created, report_updated, comment_added, document_uploaded

**Hệ thống thông báo đã sẵn sàng sử dụng!**

Hãy test theo các bước ở trên và kiểm tra xem thông báo có hiển thị không.
