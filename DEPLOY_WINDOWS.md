# Hướng dẫn Deploy Cloud Functions từ Windows

## 📋 Chuẩn bị

### Bước 0: Kiểm tra đã có gì
- [ ] Node.js đã cài (kiểm tra: mở CMD gõ `node --version`)
- [ ] Git đã cài (kiểm tra: `git --version`)
- [ ] Tài khoản Firebase (console.firebase.google.com)
- [ ] Project Firebase đã tạo

---

## 🚀 HƯỚNG DẪN TỪNG BƯỚC

### **Bước 1: Mở PowerShell hoặc Command Prompt**

**Cách 1: PowerShell (Khuyến nghị)**
1. Nhấn `Windows + X`
2. Chọn "Windows PowerShell" hoặc "Terminal"

**Cách 2: Command Prompt**
1. Nhấn `Windows + R`
2. Gõ `cmd` → Enter

---

### **Bước 2: Clone/Pull code về máy**

```powershell
# Di chuyển đến thư mục làm việc (ví dụ)
cd D:\Projects

# Clone repository (nếu chưa có)
git clone https://github.com/thanhlv87/qlda-npc.git

# Hoặc nếu đã có, pull code mới nhất
cd qlda-npc
git checkout claude/code-review-session-011CUhd39WKxsDyffaeFj8ff
git pull origin claude/code-review-session-011CUhd39WKxsDyffaeFj8ff
```

**Kiểm tra:**
```powershell
dir functions
# Phải thấy: index.js, package.json, .gitignore
```

---

### **Bước 3: Cài đặt Firebase CLI**

```powershell
npm install -g firebase-tools
```

**Kiểm tra:**
```powershell
firebase --version
# Phải hiện số version, ví dụ: 14.23.0
```

⚠️ **Nếu lỗi "npm not found":** Bạn cần cài Node.js từ https://nodejs.org/

---

### **Bước 4: Đăng nhập Firebase**

```powershell
firebase login
```

**Điều gì sẽ xảy ra:**
1. Trình duyệt tự động mở
2. Chọn tài khoản Google của bạn (dùng cho Firebase)
3. Click "Allow" để cho phép Firebase CLI
4. Trình duyệt hiện "Success! You may now close this tab"
5. Quay lại PowerShell, thấy: ✔ Success! Logged in as [your-email]

**Kiểm tra đăng nhập:**
```powershell
firebase projects:list
```
Phải thấy danh sách projects Firebase của bạn.

---

### **Bước 5: Nâng cấp Firebase lên Blaze Plan**

⚠️ **BẮT BUỘC** - Cloud Functions yêu cầu Blaze plan!

1. Mở trình duyệt: https://console.firebase.google.com/
2. Chọn project của bạn (ví dụ: "qlda-npsc")
3. Click biểu tượng ⚙️ góc trên bên trái → **Usage and billing**
4. Click **Modify plan** → Chọn **Blaze (Pay as you go)**
5. Nhập thông tin thẻ tín dụng
6. Click **Continue** → **Purchase**

💡 **Yên tâm về chi phí:**
- Free tier: 2 triệu lượt gọi/tháng
- Dự án nhỏ như này: **Miễn phí 100%**
- Chỉ trả tiền khi vượt free tier
- Có thể set budget alerts

---

### **Bước 6: Initialize Firebase trong project**

```powershell
# Đảm bảo đang ở thư mục gốc của project
cd D:\Projects\qlda-npc

# Initialize Firebase
firebase init
```

**Chọn các options sau:**

```
? Which Firebase features do you want to set up?
  → Nhấn SPACE để chọn: Functions (đã có rồi)
  → Nhấn ENTER

? Please select an option:
  → Use an existing project (chọn project của bạn)

? Select a default Firebase project:
  → Chọn project của bạn (ví dụ: qlda-npsc)

? What language would you like to use to write Cloud Functions?
  → JavaScript

? Do you want to use ESLint to catch probable bugs and enforce style?
  → Yes

? File functions/package.json already exists. Overwrite?
  → No (giữ file hiện tại)

? File functions/index.js already exists. Overwrite?
  → No (giữ file hiện tại)

? File functions/.gitignore already exists. Overwrite?
  → No (giữ file hiện tại)

? Do you want to install dependencies with npm now?
  → Yes
```

**Đợi cài đặt...**

---

### **Bước 7: Cài dependencies cho Cloud Functions**

```powershell
cd functions
npm install
cd ..
```

**Kiểm tra:**
```powershell
dir functions\node_modules
# Phải thấy thư mục node_modules với nhiều packages
```

---

### **Bước 8: Deploy Cloud Functions**

```powershell
firebase deploy --only functions
```

**Điều gì sẽ xảy ra:**
```
=== Deploying to 'qlda-npsc'...

i  deploying functions
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
✔  functions: required API cloudbuild.googleapis.com is enabled
i  functions: preparing codebase default for deployment
i  functions: preparing functions directory for uploading...
i  functions: packaged functions (X KB) for uploading
✔  functions: functions folder uploaded successfully
i  functions: creating Node.js 18 function onReportCreated(us-central1)...
i  functions: creating Node.js 18 function onReportUpdated(us-central1)...
i  functions: creating Node.js 18 function onReviewAdded(us-central1)...
i  functions: creating Node.js 18 function onDocumentUploaded(us-central1)...
✔  functions[onReportCreated(us-central1)]: Successful create operation.
✔  functions[onReportUpdated(us-central1)]: Successful create operation.
✔  functions[onReviewAdded(us-central1)]: Successful create operation.
✔  functions[onDocumentUploaded(us-central1)]: Successful create operation.

✔  Deploy complete!
```

⏱️ **Thời gian:** ~2-5 phút

---

### **Bước 9: Kiểm tra Deploy thành công**

```powershell
# Xem danh sách functions
firebase functions:list

# Xem logs
firebase functions:log
```

**Output mong đợi:**
```
┌──────────────────────────┬────────────┐
│ Function                 │ Status     │
├──────────────────────────┼────────────┤
│ onReportCreated          │ Active     │
│ onReportUpdated          │ Active     │
│ onReviewAdded            │ Active     │
│ onDocumentUploaded       │ Active     │
└──────────────────────────┴────────────┘
```

---

### **Bước 10: Test thử ngay!**

1. **Mở webapp:** https://qlda-npc.vercel.app/
2. **Đăng nhập** với tài khoản LeadSupervisor hoặc ProjectManager
3. **Tạo báo cáo mới** cho một dự án
4. **Đăng nhập lại** với tài khoản Admin hoặc DepartmentHead
5. **Kiểm tra icon chuông** ở góc trên → Phải có thông báo mới!

**Xem logs real-time:**
```powershell
firebase functions:log --only onReportCreated
```

Bạn sẽ thấy:
```
Function execution started
New report created: {reportId}
Notifying X users: [userIds]
Created X notifications successfully
Function execution took XXX ms
```

---

## 🐛 Troubleshooting

### ❌ Lỗi: "npm: command not found"
**Giải pháp:** Cài Node.js từ https://nodejs.org/ (chọn phiên bản LTS)

### ❌ Lỗi: "firebase: command not found"
**Giải pháp:**
```powershell
npm install -g firebase-tools
# Restart PowerShell sau khi cài
```

### ❌ Lỗi: "Billing account not configured"
**Giải pháp:** Nâng cấp lên Blaze plan (xem Bước 5)

### ❌ Lỗi: "Permission denied" khi deploy
**Giải pháp:**
```powershell
firebase login --reauth
# Đăng nhập lại
```

### ❌ Lỗi: "Failed to install dependencies"
**Giải pháp:**
```powershell
cd functions
rm -r node_modules
npm cache clean --force
npm install
cd ..
```

### ❌ Deploy bị timeout
**Giải pháp:**
```powershell
# Deploy từng function một
firebase deploy --only functions:onReportCreated
firebase deploy --only functions:onReportUpdated
firebase deploy --only functions:onReviewAdded
firebase deploy --only functions:onDocumentUploaded
```

---

## 📊 Xem logs và monitoring

### Xem logs trong PowerShell:
```powershell
# Logs tất cả functions
firebase functions:log

# Logs function cụ thể
firebase functions:log --only onReportCreated

# Real-time logs
firebase functions:log --follow
```

### Xem trên Firebase Console:
1. Mở https://console.firebase.google.com/
2. Chọn project → Functions
3. Tab "Logs" để xem chi tiết
4. Tab "Dashboard" để xem metrics (invocations, errors, etc.)

---

## ✅ Checklist hoàn thành

- [ ] Node.js đã cài
- [ ] Firebase CLI đã cài (`firebase --version`)
- [ ] Đã đăng nhập Firebase (`firebase login`)
- [ ] Đã nâng cấp lên Blaze plan
- [ ] Code đã pull về máy
- [ ] `firebase init` thành công
- [ ] Dependencies đã cài (`cd functions && npm install`)
- [ ] Deploy thành công (`firebase deploy --only functions`)
- [ ] 4 functions đang Active (`firebase functions:list`)
- [ ] Test thử tạo báo cáo → có thông báo

---

## 🎯 Các lệnh quan trọng cần nhớ

```powershell
# Deploy lại sau khi sửa code
firebase deploy --only functions

# Xem logs
firebase functions:log

# Xem danh sách functions
firebase functions:list

# Xóa 1 function
firebase functions:delete onReportCreated

# Deploy lại tất cả
firebase deploy
```

---

## 💰 Chi phí

**Miễn phí cho dự án này!**

Ước tính với 50 users:
- ~1,000 invocations/tháng
- Hoàn toàn trong free tier (2 triệu/tháng)
- **Chi phí: $0**

---

## 📞 Support

Nếu gặp vấn đề, gửi:
1. Screenshot lỗi
2. Output của `firebase --version`
3. Output của `firebase functions:log`

---

**🎉 Chúc bạn deploy thành công!**
