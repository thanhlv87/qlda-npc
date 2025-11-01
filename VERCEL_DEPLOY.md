# 🚀 HƯỚNG DẪN DEPLOY LÊN VERCEL

## CHUẨN BỊ

### 1. Lấy Firebase Config

1. Vào https://console.firebase.google.com/
2. Chọn project của bạn (hoặc tạo mới)
3. Click **⚙️ Project Settings**
4. Scroll xuống **"Your apps"** > Click **</>** (Web)
5. Copy tất cả thông tin trong `firebaseConfig`

### 2. Lấy Gemini API Key

1. Vào https://aistudio.google.com/app/apikey
2. Click **"Create API key"**
3. Copy API key

### 3. Enable Firebase Services

Trong Firebase Console:

**Authentication:**
- Build > Authentication > Get started
- Enable: **Google** và **Email/Password**

**Firestore:**
- Build > Firestore Database > Create database
- Chọn **Production mode**
- Chọn region: **asia-southeast1**

**Storage:**
- Build > Storage > Get started
- Chọn **Production mode**

---

## DEPLOY LÊN VERCEL

### Cách 1: Deploy qua Vercel Website (Khuyến nghị - Dễ nhất)

#### Bước 1: Push code lên GitHub

```bash
# Đảm bảo đang ở branch main
git checkout main

# Merge code từ Claude branch
git merge claude/code-review-session-011CUhd39WKxsDyffaeFj8ff

# Push lên GitHub
git push origin main
```

#### Bước 2: Import vào Vercel

1. Vào https://vercel.com/
2. Click **"Add New"** > **"Project"**
3. Import GitHub repository: **thanhlv87/qlda-npc**
4. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** ./
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

#### Bước 3: Thêm Environment Variables

Trong trang import, scroll xuống **"Environment Variables"**:

Thêm các biến sau (copy từ Firebase Config):

```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc...
VITE_GEMINI_API_KEY=AIzaSy...
```

#### Bước 4: Deploy

Click **"Deploy"** và đợi khoảng 1-2 phút!

---

### Cách 2: Deploy qua Vercel CLI (Nhanh)

#### Bước 1: Cài Vercel CLI

```bash
npm install -g vercel
```

#### Bước 2: Login

```bash
vercel login
```

Chọn phương thức login (GitHub/Email)

#### Bước 3: Deploy

```bash
vercel
```

Trả lời các câu hỏi:
- **Set up and deploy?** → **Y**
- **Which scope?** → Chọn account của bạn
- **Link to existing project?** → **N**
- **Project name?** → `qlda-npc` (hoặc tên bạn muốn)
- **Directory?** → `.` (Enter)
- **Override settings?** → **N**

#### Bước 4: Thêm Environment Variables

Sau khi deploy xong, vào Vercel Dashboard:

1. Chọn project **qlda-npc**
2. Click **Settings** tab
3. Click **Environment Variables** bên trái
4. Thêm từng biến:

**Name:** `VITE_FIREBASE_API_KEY`
**Value:** `AIzaSy...` (từ Firebase)
**Environment:** Production, Preview, Development (check cả 3)
Click **Save**

Lặp lại cho:
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GEMINI_API_KEY`

#### Bước 5: Redeploy

Sau khi thêm environment variables:

```bash
vercel --prod
```

Hoặc trên Vercel Dashboard: **Deployments** > **...** > **Redeploy**

---

## SETUP FIREBASE SECURITY RULES

### 1. Deploy Firestore Rules

Tạo file `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return isSignedIn() && getUserData().role == 'Admin';
    }

    function isDeptHead() {
      return isSignedIn() && getUserData().role == 'DepartmentHead';
    }

    // Users
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update, delete: if isAdmin();
    }

    // Projects
    match /projects/{projectId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin() || isDeptHead();

      match /files/{fileId} {
        allow read, write: if isSignedIn();
      }

      match /folders/{folderId} {
        allow read, write: if isSignedIn();
      }
    }

    // Reports
    match /reports/{reportId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isAdmin() || isDeptHead();
    }
  }
}
```

Deploy:
```bash
firebase deploy --only firestore:rules
```

### 2. Deploy Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projects/{projectId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

Deploy:
```bash
firebase deploy --only storage
```

---

## KIỂM TRA SAU KHI DEPLOY

### ✅ Checklist

Mở website Vercel của bạn và test:

- [ ] Website load được (không lỗi 404)
- [ ] Login bằng Google hoạt động
- [ ] Login bằng Email/Password hoạt động
- [ ] Tạo user mới (sẽ pending approval)
- [ ] Đăng nhập bằng tài khoản Admin (nếu có)
- [ ] Approve user mới
- [ ] Tạo project
- [ ] Upload files
- [ ] Tạo báo cáo
- [ ] Upload ảnh trong báo cáo
- [ ] AI Summary hoạt động
- [ ] Mobile responsive

### Nếu có lỗi:

**1. Lỗi: "Firebase configuration is missing"**
→ Check environment variables trên Vercel dashboard có đủ không

**2. Lỗi: "Permission denied" khi login**
→ Deploy Firebase rules (xem phần trên)

**3. Lỗi: "AI Summary không hoạt động"**
→ Check `VITE_GEMINI_API_KEY` đã đúng chưa

**4. Lỗi 404 khi reload trang**
→ Vercel tự động handle, nếu vẫn lỗi thì thêm file `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## CUSTOM DOMAIN (Tùy chọn)

### Thêm domain của bạn:

1. Vào Vercel Dashboard
2. Chọn project > **Settings** > **Domains**
3. Thêm domain (VD: `qlda.yourcompany.com`)
4. Cấu hình DNS theo hướng dẫn của Vercel

---

## TÓM TẮT

### Deploy nhanh nhất (Cách 1 - Qua Website):

1. Push code lên GitHub
2. Import vào Vercel
3. Thêm Environment Variables
4. Deploy!

### Domain của bạn:

Sau khi deploy xong, Vercel sẽ cho bạn URL:
```
https://qlda-npc.vercel.app
```

hoặc

```
https://your-project-abc123.vercel.app
```

---

**Xong! Dự án của bạn đã live trên Vercel! 🎉**

Nếu gặp vấn đề gì, check:
- Vercel Dashboard > Project > Logs
- Browser Console (F12)
- Firebase Console > Firestore/Storage
