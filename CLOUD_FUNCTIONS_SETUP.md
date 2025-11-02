# Hướng dẫn cài đặt Firebase Cloud Functions - Hệ thống thông báo

## Tổng quan
Cloud Functions này sẽ tự động tạo thông báo khi:
- 📝 Báo cáo mới được tạo
- ✏️ Báo cáo được cập nhật
- 💬 Nhận xét/Review được thêm vào
- 📎 Tài liệu mới được tải lên

## Điều kiện tiên quyết

### 1. Nâng cấp Firebase lên Blaze Plan
Cloud Functions yêu cầu Firebase Blaze Plan (pay-as-you-go).

**Chi phí dự kiến:**
- Free tier: 2 triệu lượt gọi/tháng, 400,000 GB-giây, 200,000 GHz-giây
- Dự án nhỏ: Miễn phí hoặc < $5/tháng
- Billing chỉ tính khi vượt free tier

**Các bước nâng cấp:**
1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Click vào biểu tượng ⚙️ (Settings) → **Usage and billing**
4. Click **Modify plan** → Chọn **Blaze plan**
5. Nhập thông tin thanh toán (credit card)
6. Click **Purchase**

⚠️ **Lưu ý:**
- Bạn có thể đặt billing alert để được thông báo khi chi phí vượt mức
- Dự án nhỏ thường không vượt free tier
- Có thể downgrade về Spark plan bất cứ lúc nào

### 2. Cài đặt Firebase CLI

```bash
# Cài đặt Firebase CLI toàn cầu
npm install -g firebase-tools

# Kiểm tra phiên bản
firebase --version

# Đăng nhập vào Firebase
firebase login
```

## Cài đặt và Triển khai

### Bước 1: Khởi tạo Firebase Functions

```bash
# Từ thư mục gốc của project
cd /path/to/qlda-npc

# Khởi tạo Firebase (nếu chưa)
firebase init

# Chọn các tùy chọn sau:
# ◉ Functions: Configure a Cloud Functions directory and its files
# ◯ Firestore, Hosting, Storage (nếu chưa init)
#
# ? What language would you like to use to write Cloud Functions?
#   → JavaScript
#
# ? Do you want to use ESLint?
#   → Yes (khuyến nghị)
#
# ? Do you want to install dependencies with npm now?
#   → Yes
```

**Lưu ý:** Nếu bạn đã có thư mục `functions/` với code, Firebase sẽ hỏi có ghi đè không. Chọn **No** để giữ code hiện tại.

### Bước 2: Cài đặt dependencies

```bash
# Di chuyển vào thư mục functions
cd functions

# Cài đặt các dependencies cần thiết
npm install firebase-admin@^12.0.0 firebase-functions@^4.5.0

# Quay lại thư mục gốc
cd ..
```

### Bước 3: Kiểm tra file cấu hình

Đảm bảo file `firebase.json` ở thư mục gốc có cấu hình functions:

```json
{
  "functions": {
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run lint"
    ],
    "source": "functions"
  }
}
```

Nếu chưa có, thêm section `functions` vào file.

### Bước 4: Test local (Tùy chọn - Khuyến nghị)

```bash
# Khởi động Firebase Emulator
firebase emulators:start

# Hoặc chỉ chạy functions emulator
firebase emulators:start --only functions,firestore

# Emulator sẽ chạy trên:
# - Functions: http://localhost:5001
# - Firestore: http://localhost:8080
# - Emulator UI: http://localhost:4000
```

**Test thủ công:**
1. Mở webapp ở chế độ dev: `npm run dev`
2. Kết nối tới Firestore emulator (cần config trong firebase.ts)
3. Tạo báo cáo mới hoặc comment
4. Kiểm tra logs trong Emulator UI

### Bước 5: Deploy Cloud Functions

```bash
# Deploy tất cả functions
firebase deploy --only functions

# Hoặc deploy từng function riêng lẻ
firebase deploy --only functions:onReportCreated
firebase deploy --only functions:onReportUpdated
firebase deploy --only functions:onReviewAdded
firebase deploy --only functions:onDocumentUploaded
```

**Output mong đợi:**
```
✔  functions[onReportCreated(us-central1)] Successful create operation.
✔  functions[onReportUpdated(us-central1)] Successful create operation.
✔  functions[onReviewAdded(us-central1)] Successful create operation.
✔  functions[onDocumentUploaded(us-central1)] Successful create operation.

✔  Deploy complete!
```

### Bước 6: Kiểm tra Functions đã deploy

```bash
# Xem danh sách functions
firebase functions:list

# Xem logs real-time
firebase functions:log

# Xem logs của function cụ thể
firebase functions:log --only onReportCreated
```

## Testing End-to-End

### Test 1: Báo cáo mới (report_created)
1. Đăng nhập với tài khoản LeadSupervisor hoặc ProjectManager
2. Tạo báo cáo mới cho một dự án
3. Đăng nhập với tài khoản Admin/DepartmentHead
4. Kiểm tra icon chuông thông báo (phải có badge đỏ)
5. Click vào chuông, xem thông báo mới

**Kiểm tra logs:**
```bash
firebase functions:log --only onReportCreated
```

### Test 2: Cập nhật báo cáo (report_updated)
1. Chỉnh sửa một báo cáo đã tồn tại
2. Thay đổi nội dung tasks hoặc progressPercentage
3. Kiểm tra thông báo ở tài khoản khác

### Test 3: Thêm nhận xét (comment_added)
1. Vào chi tiết một báo cáo
2. Thêm nhận xét/comment mới
3. Kiểm tra thông báo

### Test 4: Tải tài liệu (document_uploaded)
1. Vào tab Documents của một dự án
2. Tải lên file mới
3. Kiểm tra thông báo

## Cấu trúc Notification trong Firestore

Notifications được lưu tại:
```
users/{userId}/notifications/{notificationId}
```

**Schema:**
```javascript
{
  type: 'report_created' | 'report_updated' | 'comment_added' | 'document_uploaded',
  title: 'Tiêu đề thông báo',
  message: 'Nội dung chi tiết...',
  projectId: 'project123',
  projectName: 'Tên dự án',
  reportId: 'report456',  // optional
  reportDate: '2025-01-15',  // optional
  createdBy: 'userId789',
  createdByName: 'Nguyễn Văn A',
  createdAt: Timestamp,
  read: false,
  actionUrl: '/projects/123/reports/456'
}
```

## Monitoring và Logs

### Xem logs trên Firebase Console
1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project
3. Functions → Logs
4. Filter theo function name hoặc severity

### Xem metrics
1. Functions → Dashboard
2. Theo dõi:
   - Invocations (Số lần gọi)
   - Execution time (Thời gian thực thi)
   - Memory usage (Bộ nhớ sử dụng)
   - Errors (Lỗi)

### Set up alerts
1. Cloud Console → Monitoring → Alerting
2. Create Policy → Condition:
   - Resource: Cloud Function
   - Metric: Execution count, Error count
   - Threshold: Tùy chỉnh
3. Notification channel: Email hoặc SMS

## Troubleshooting

### Lỗi: "Billing account not configured"
**Nguyên nhân:** Chưa nâng cấp lên Blaze plan

**Giải pháp:**
1. Nâng cấp lên Blaze plan (xem phần "Nâng cấp Firebase")
2. Đợi vài phút để billing được kích hoạt
3. Deploy lại: `firebase deploy --only functions`

### Lỗi: "Function execution took too long"
**Nguyên nhân:** Function chạy quá 60 giây (timeout mặc định)

**Giải pháp:**
```javascript
exports.onReportCreated = functions
  .runWith({ timeoutSeconds: 120 })  // Tăng timeout
  .firestore
  .document('reports/{reportId}')
  .onCreate(async (snap, context) => {
    // ...
  });
```

### Lỗi: "Permission denied" khi query Firestore
**Nguyên nhân:** Firestore Security Rules chặn Cloud Functions

**Giải pháp:**
Thêm rule cho Cloud Functions trong `firestore.rules`:
```
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow Cloud Functions to read/write
    match /{document=**} {
      allow read, write: if request.auth != null || request.auth.token.admin == true;
    }
  }
}
```

### Không nhận được thông báo
**Kiểm tra:**
1. Function có chạy không? → Xem logs
2. Notification có được tạo trong Firestore không? → Check trên Console
3. Frontend có subscribe đúng collection không? → Check NotificationBell.tsx
4. User có role phù hợp không? → Chỉ Admin, DepartmentHead, PM nhận thông báo

**Debug:**
```bash
# Xem logs chi tiết
firebase functions:log --only onReportCreated

# Kiểm tra trong log:
# - "New report created: {reportId}" → Function triggered
# - "Notifying X users" → Query users thành công
# - "Created X notifications" → Notifications được tạo
```

### Function không trigger
**Nguyên nhân:** Document path không khớp

**Kiểm tra:**
- `onReportCreated`: Chỉ trigger khi tạo document trong `reports/` collection
- `onReviewAdded`: Chỉ trigger khi update document trong `projects/` collection
- `onDocumentUploaded`: Chỉ trigger khi tạo document trong `projects/{id}/files/` subcollection

## Quản lý Chi phí

### Ước tính chi phí cho 100 users
**Giả định:**
- 10 báo cáo mới/ngày = 300/tháng
- 20 updates/ngày = 600/tháng
- 30 comments/ngày = 900/tháng
- 5 documents/ngày = 150/tháng

**Tổng invocations:** ~2,000/tháng

**Chi phí:**
- Invocations: 2,000 (trong free tier 2M) = $0
- Compute time: ~10 giây/invocation × 2,000 = 20,000 GB-giây (trong free tier) = $0

**→ Miễn phí hoàn toàn!**

### Reduce costs (nếu cần)
1. **Batch notifications**: Gom nhiều thông báo trong 1 function
2. **Limit notifications**: Chỉ notify users quan tâm
3. **Reduce frequency**: Debounce updates (không notify mọi update nhỏ)
4. **Set budget alerts**: Để kiểm soát chi phí

## Uninstall/Rollback

### Xóa tất cả functions
```bash
firebase functions:delete onReportCreated
firebase functions:delete onReportUpdated
firebase functions:delete onReviewAdded
firebase functions:delete onDocumentUploaded
```

### Downgrade về Spark plan
1. Firebase Console → Settings → Usage and billing
2. Modify plan → Spark (Free)
3. Confirm downgrade

**Lưu ý:** Mất tất cả Cloud Functions sau khi downgrade!

## Support
- Firebase Docs: https://firebase.google.com/docs/functions
- Stack Overflow: `firebase-cloud-functions` tag
- Firebase Discord: https://discord.gg/firebase

## Changelog
- **2025-01-15**: Initial setup với 4 functions cơ bản
- **Future**: Thêm push notifications cho iOS/Android
