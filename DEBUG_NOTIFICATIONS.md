# Debug Hệ thống Thông báo - Checklist

## ✅ Đã hoàn thành

1. **Cloud Functions deployed** ✓
   - onReportCreated
   - onReportUpdated
   - onReviewAdded
   - onDocumentUploaded

2. **Frontend code fixed** ✓
   - Timestamp conversion
   - Null handling

3. **Firestore rules deployed** ✓
   - Users có thể read/update notifications của họ
   - Cloud Functions có thể create notifications

---

## 🔍 Các bước kiểm tra khi thông báo không hoạt động

### Bước 1: Kiểm tra Cloud Function có chạy không

**Cách 1: Firebase Console**
1. Vào https://console.firebase.google.com/project/qlda-npsc/functions
2. Click vào tab **"Logs"**
3. Tạo một báo cáo mới trong app
4. Xem có log nào mới xuất hiện không?

**Các log cần tìm:**
```
New report created: [reportId] for project: [projectId]
Notifying X users
Created X notifications for new report
```

**Nếu KHÔNG thấy log:**
- Cloud Function không được trigger
- Kiểm tra trigger config trong functions/index.js
- Verify collection path: `reports/{reportId}`

**Nếu CÓ log nhưng có ERROR:**
- Đọc error message
- Thường gặp:
  - "Permission denied" → IAM permissions issue
  - "Document not found" → Project/User không tồn tại
  - "Undefined property" → Data structure sai

---

### Bước 2: Kiểm tra Firestore Database

**Vào:** https://console.firebase.google.com/project/qlda-npsc/firestore

**Kiểm tra collections:**

#### 2.1 Collection `reports`
- Tạo báo cáo → Check có document mới không?
- Document phải có fields:
  ```
  projectId: string
  submittedBy: string
  date: string (DD/MM/YYYY)
  tasks: string
  images: array
  progressPercentage: number
  ```

#### 2.2 Collection `projects/{projectId}`
- Verify project tồn tại
- Check fields:
  ```
  name: string
  projectManagerIds: array
  leadSupervisorIds: array (optional)
  ```

#### 2.3 Collection `users`
- Query users với `role == 'Admin'`
- Query users với `role == 'DepartmentHead'`
- Verify ít nhất có 1 admin

**Nếu KHÔNG có admin:**
```javascript
// Cloud Function sẽ không tạo notification
// Vì: getUsersToNotify() returns empty array
```

#### 2.4 Collection `users/{userId}/notifications` ⭐ QUAN TRỌNG
**Đây là nơi notifications được lưu!**

**Sau khi tạo báo cáo, check:**
1. Lấy userId của admin (hoặc department head)
2. Vào: `users/{adminUserId}/notifications`
3. Có documents mới không?

**Nếu CÓ documents:**
- ✅ Cloud Function hoạt động!
- ❌ Frontend không đọc được → Check NotificationBell component
- Check Browser Console (F12) có lỗi không?

**Nếu KHÔNG CÓ documents:**
- ❌ Cloud Function không tạo được notification
- Đọc logs trong Firebase Console
- Check IAM permissions

---

### Bước 3: Kiểm tra IAM Permissions (Google Cloud)

**Vấn đề:** Cloud Functions cần quyền để ghi vào Firestore

**Kiểm tra:**
1. Vào https://console.cloud.google.com/iam-admin/iam?project=qlda-npsc
2. Tìm service account: `[project-id]@appspot.gserviceaccount.com`
3. Verify có role: **"Cloud Datastore User"** hoặc **"Firebase Admin"**

**Nếu thiếu quyền, thêm role:**
1. Click "Edit" (icon bút chì)
2. "Add another role"
3. Chọn: **"Cloud Datastore User"**
4. Save

**Hoặc dùng gcloud CLI:**
```bash
gcloud projects add-iam-policy-binding qlda-npsc \
  --member=serviceAccount:qlda-npsc@appspot.gserviceaccount.com \
  --role=roles/datastore.user
```

---

### Bước 4: Test trực tiếp trong Firestore (Manual test)

**Tạo notification thủ công để verify rules:**

1. Vào Firebase Console → Firestore
2. Collection: `users/{yourAdminUserId}/notifications`
3. Add document (auto-ID):
```json
{
  "type": "report_created",
  "title": "Test notification",
  "message": "This is a test",
  "projectId": "test",
  "projectName": "Test Project",
  "createdBy": "testuser",
  "createdByName": "Test User",
  "createdAt": [timestamp] (chọn timestamp type),
  "read": false,
  "actionUrl": "/test"
}
```

4. **Login vào app với admin user**
5. Click chuông 🔔
6. Có thấy notification "Test notification" không?

**Nếu THẤY:**
- ✅ Frontend hoạt động!
- ✅ Firestore rules OK!
- ❌ Vấn đề ở Cloud Function

**Nếu KHÔNG THẤY:**
- ❌ Frontend có lỗi
- Mở Browser Console (F12)
- Tìm error messages

---

### Bước 5: Kiểm tra Frontend

**Mở Browser Console (F12) khi đăng nhập:**

**Errors phổ biến:**

#### Error 1: Permission denied
```
FirebaseError: Missing or insufficient permissions
```
**Giải pháp:**
- Firestore rules chặn read
- Verify user đã login (request.auth != null)
- Check userId đúng không

#### Error 2: Cannot read property 'toDate'
```
TypeError: Cannot read property 'toDate' of undefined
```
**Giải pháp:**
- ✅ Đã fix rồi (timestamp conversion)
- Nếu vẫn gặp → hard refresh (Ctrl+Shift+R)

#### Error 3: NotificationBell not rendering
```
(Không có chuông icon trên header)
```
**Kiểm tra:**
- User có role không? (`user.role` must exist)
- Header.tsx có import NotificationBell?
- Check line: `{user.role && <NotificationBell currentUser={user} />}`

---

### Bước 6: Kiểm tra Real-time Listener

**Test real-time updates:**

1. Login admin trên 2 tabs/windows
2. Tab 1: Giữ nguyên (xem notifications)
3. Tab 2: Tạo báo cáo mới
4. Tab 1: Có notification mới xuất hiện ngay lập tức không?

**Nếu KHÔNG real-time:**
- Check Firebase connection
- Network tab → có WebSocket connection không?
- Firestore onSnapshot có lỗi không?

---

## 🔧 Quick Fixes

### Fix 1: Redeploy Cloud Functions
```bash
cd functions
npm install
firebase deploy --only functions
```

### Fix 2: Clear Firestore cache
```bash
firebase firestore:delete --all-collections --yes
# ⚠️ CAREFUL: Xóa hết data!
# Chỉ dùng cho testing
```

### Fix 3: Recreate Firestore index
Nếu có error "requires an index":
1. Click vào link trong error
2. Tạo index tự động
3. Đợi vài phút để index build

### Fix 4: Hard refresh frontend
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

---

## 📊 Expected Data Flow

```
1. User tạo báo cáo
   ↓
2. Firestore: reports/{reportId} created
   ↓
3. Cloud Function: onReportCreated triggered
   ↓
4. Function queries:
   - projects/{projectId} (get project name)
   - users (where role == Admin/DepartmentHead)
   - users/{submittedBy} (get reporter name)
   ↓
5. Function creates batch write:
   - users/{userId1}/notifications/{notifId1}
   - users/{userId2}/notifications/{notifId2}
   - ...
   ↓
6. Frontend: onSnapshot listener detects new docs
   ↓
7. NotificationBell updates:
   - Convert Timestamp to ISO string
   - Update notifications array
   - Update unread count
   ↓
8. UI: Badge shows number, dropdown shows list
```

---

## 🎯 Kiểm tra cuối cùng

### Checklist before saying "không hoạt động":

- [ ] Cloud Functions deployed? (`firebase functions:list`)
- [ ] Firestore rules deployed? (Check firebase.json has "firestore" config)
- [ ] Có ít nhất 1 user với `role: 'Admin'` trong Firestore?
- [ ] Project có `projectManagerIds` array?
- [ ] Report có field `submittedBy` với valid userId?
- [ ] Mở Browser Console → có error gì không?
- [ ] Mở Firebase Console → Functions → Logs → có logs không?
- [ ] Mở Firestore → `users/{adminId}/notifications` → có documents không?
- [ ] Thử manual create notification → có hiển thị không?
- [ ] Hard refresh browser (Ctrl+Shift+R)?

---

## 💡 Câu hỏi Debug

**Khi báo "không hoạt động", cần trả lời:**

1. ✅ Báo cáo có được tạo thành công không?
   - Có documents trong `reports` collection?

2. ✅ Cloud Function có chạy không?
   - Check logs: https://console.firebase.google.com/project/qlda-npsc/functions/logs

3. ✅ Notifications có được tạo trong Firestore không?
   - Check: `users/{adminUserId}/notifications`
   - Có documents không?

4. ✅ Frontend có đọc được notifications không?
   - Mở Browser Console
   - Có error gì?

5. ✅ User đang test có role phù hợp không?
   - Admin/DepartmentHead mới nhận notification
   - Người tạo report KHÔNG nhận notification của chính họ

**Trả lời 5 câu trên sẽ tìm ra được vấn đề!**
