# 🚀 HƯỚNG DẪN DEPLOY - QLDA NPSC

## 📋 MỤC LỤC
1. [Chuẩn bị trước khi deploy](#1-chuẩn-bị-trước-khi-deploy)
2. [Cấu hình Firebase](#2-cấu-hình-firebase)
3. [Cấu hình Gemini AI](#3-cấu-hình-gemini-ai)
4. [Deploy lên Firebase Hosting](#4-deploy-lên-firebase-hosting)
5. [Deploy lên Vercel](#5-deploy-lên-vercel)
6. [Deploy lên Netlify](#6-deploy-lên-netlify)
7. [Deploy lên VPS/Server](#7-deploy-lên-vpsserver)
8. [Kiểm tra sau deploy](#8-kiểm-tra-sau-deploy)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. CHUẨN BỊ TRƯỚC KHI DEPLOY

### ✅ Checklist
- [x] Code đã được pull về máy
- [ ] Node.js đã được cài đặt (v18 trở lên)
- [ ] Firebase project đã được tạo
- [ ] Gemini API key đã có
- [ ] Environment variables đã được cấu hình

### 📦 Cài đặt Dependencies

\`\`\`bash
npm install
\`\`\`

---

## 2. CẤU HÌNH FIREBASE

### Bước 1: Tạo Firebase Project

1. Truy cập: https://console.firebase.google.com/
2. Click **"Add project"** hoặc **"Tạo dự án"**
3. Đặt tên dự án (VD: `qlda-npsc`)
4. Tắt Google Analytics (không bắt buộc)
5. Click **"Create project"**

### Bước 2: Kích hoạt các dịch vụ Firebase

#### 2.1 Authentication (Đăng nhập)

1. Vào **Build** > **Authentication**
2. Click **"Get started"**
3. Chọn **Sign-in method**
4. Bật **Email/Password** và **Google**
5. Save

#### 2.2 Firestore Database (Cơ sở dữ liệu)

1. Vào **Build** > **Firestore Database**
2. Click **"Create database"**
3. Chọn **Start in production mode**
4. Chọn region gần Việt Nam (VD: `asia-southeast1`)
5. Click **"Enable"**

**Quan trọng:** Deploy Security Rules (xem bước 2.5)

#### 2.3 Storage (Lưu trữ files)

1. Vào **Build** > **Storage**
2. Click **"Get started"**
3. Chọn **Start in production mode**
4. Chọn cùng region với Firestore
5. Click **"Done"**

**Quan trọng:** Deploy Storage Rules (xem bước 2.5)

#### 2.4 Hosting (Web hosting)

1. Vào **Build** > **Hosting**
2. Click **"Get started"**
3. Follow hướng dẫn (hoặc xem phần 4)

### Bước 2.5: Deploy Security Rules

**Firestore Rules:**

Tạo file \`firestore.rules\` (đã có sẵn trong project):

\`\`\`javascript
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

    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update, delete: if isAdmin();
    }

    // Projects collection
    match /projects/{projectId} {
      allow read: if isSignedIn();
      allow create, update, delete: if isAdmin() || isDeptHead();

      match /files/{fileId} {
        allow read: if isSignedIn();
        allow write: if isSignedIn();
      }

      match /folders/{folderId} {
        allow read: if isSignedIn();
        allow write: if isSignedIn();
      }
    }

    // Reports collection
    match /reports/{reportId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isAdmin() || isDeptHead();
    }
  }
}
\`\`\`

**Storage Rules:**

\`\`\`javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /projects/{projectId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
\`\`\`

### Bước 3: Lấy Firebase Config

1. Vào **Project Settings** (⚙️ bên cạnh Project Overview)
2. Scroll xuống **"Your apps"**
3. Click icon **</>** (Web)
4. Register app với nickname (VD: `qlda-npsc-web`)
5. **COPY** tất cả config trong phần `firebaseConfig`

Config sẽ có dạng:
\`\`\`javascript
const firebaseConfig = {
  apiKey: "AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
\`\`\`

---

## 3. CẤU HÌNH GEMINI AI

### Lấy Gemini API Key

1. Truy cập: https://aistudio.google.com/app/apikey
2. Đăng nhập với Google account
3. Click **"Create API key"**
4. Chọn Google Cloud project (có thể dùng chung với Firebase)
5. **COPY** API key

---

## 4. DEPLOY LÊN FIREBASE HOSTING

### Bước 1: Cấu hình Environment Variables

Copy file template:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Mở file \`.env.local\` và điền thông tin:

\`\`\`bash
# Gemini AI
VITE_GEMINI_API_KEY=AIzaSyYourGeminiAPIKeyHere

# Firebase (từ bước 2.3)
VITE_FIREBASE_API_KEY=AIzaSyYourFirebaseAPIKeyHere
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
\`\`\`

### Bước 2: Cài đặt Firebase CLI

\`\`\`bash
npm install -g firebase-tools
\`\`\`

### Bước 3: Login Firebase

\`\`\`bash
firebase login
\`\`\`

### Bước 4: Khởi tạo Firebase

\`\`\`bash
firebase init
\`\`\`

Chọn các option:
- ✅ **Firestore**
- ✅ **Storage**
- ✅ **Hosting**

Config:
- **Firestore rules file**: Nhấn Enter (dùng mặc định `firestore.rules`)
- **Firestore indexes file**: Nhấn Enter
- **Storage rules file**: Nhấn Enter (dùng mặc định `storage.rules`)
- **Public directory**: Nhập `dist`
- **Configure as SPA**: **Yes** (y)
- **Automatic builds with GitHub**: **No** (n)

### Bước 5: Build và Deploy

\`\`\`bash
# Build
npm run build

# Deploy
firebase deploy
\`\`\`

Hoặc dùng script có sẵn:
\`\`\`bash
npm run deploy
\`\`\`

### Bước 6: Thêm Environment Variables cho Production

⚠️ **QUAN TRỌNG**: Firebase Hosting không tự động inject environment variables.

**Giải pháp:**

Thêm environment variables vào GitHub Actions (nếu dùng) hoặc tạo file \`.env.production.local\` trước khi build:

\`\`\`bash
# Tạo file .env.production.local
cat > .env.production.local << EOF
VITE_GEMINI_API_KEY=your_actual_key
VITE_FIREBASE_API_KEY=your_actual_key
VITE_FIREBASE_AUTH_DOMAIN=your_actual_domain
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_actual_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
EOF

# Build
npm run build

# Deploy
firebase deploy
\`\`\`

---

## 5. DEPLOY LÊN VERCEL

### Bước 1: Cài Vercel CLI

\`\`\`bash
npm install -g vercel
\`\`\`

### Bước 2: Login

\`\`\`bash
vercel login
\`\`\`

### Bước 3: Deploy

\`\`\`bash
vercel
\`\`\`

### Bước 4: Thêm Environment Variables

Sau khi deploy, vào Vercel Dashboard:

1. Chọn project
2. **Settings** > **Environment Variables**
3. Thêm từng variable:
   - \`VITE_GEMINI_API_KEY\`
   - \`VITE_FIREBASE_API_KEY\`
   - \`VITE_FIREBASE_AUTH_DOMAIN\`
   - \`VITE_FIREBASE_PROJECT_ID\`
   - \`VITE_FIREBASE_STORAGE_BUCKET\`
   - \`VITE_FIREBASE_MESSAGING_SENDER_ID\`
   - \`VITE_FIREBASE_APP_ID\`
4. Click **"Save"**
5. **Redeploy** project

---

## 6. DEPLOY LÊN NETLIFY

### Option A: Drag & Drop (Nhanh nhất)

1. Build project:
   \`\`\`bash
   npm run build
   \`\`\`

2. Truy cập: https://app.netlify.com/drop

3. Kéo thả folder **\`dist\`** vào trang web

4. Sau khi upload xong:
   - Vào **Site settings** > **Environment variables**
   - Thêm tất cả \`VITE_*\` variables
   - Trigger redeploy

### Option B: Netlify CLI

\`\`\`bash
# Cài CLI
npm install -g netlify-cli

# Login
netlify login

# Init
netlify init

# Build và deploy
npm run build
netlify deploy --prod --dir=dist
\`\`\`

---

## 7. DEPLOY LÊN VPS/SERVER

### Yêu cầu
- Ubuntu 20.04+ hoặc CentOS 7+
- Nginx hoặc Apache
- SSL certificate (Let's Encrypt)

### Bước 1: Build project

\`\`\`bash
npm run build
\`\`\`

### Bước 2: Upload lên server

\`\`\`bash
# Dùng SCP
scp -r dist/* user@your-server-ip:/var/www/html/qlda-npsc/

# Hoặc dùng rsync
rsync -avz dist/* user@your-server-ip:/var/www/html/qlda-npsc/
\`\`\`

### Bước 3: Cấu hình Nginx

Tạo file \`/etc/nginx/sites-available/qlda-npsc\`:

\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/html/qlda-npsc;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
\`\`\`

Enable site:
\`\`\`bash
sudo ln -s /etc/nginx/sites-available/qlda-npsc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
\`\`\`

### Bước 4: Setup SSL với Let's Encrypt

\`\`\`bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
\`\`\`

---

## 8. KIỂM TRA SAU DEPLOY

### ✅ Checklist

- [ ] Website load được
- [ ] Login bằng Google hoạt động
- [ ] Login bằng Email/Password hoạt động
- [ ] Tạo user mới được
- [ ] Admin có thể approve user
- [ ] Tạo project mới được
- [ ] Upload files hoạt động
- [ ] Xem báo cáo hoạt động
- [ ] Tạo báo cáo mới được
- [ ] Upload ảnh trong báo cáo hoạt động
- [ ] AI Summary (Gemini) hoạt động
- [ ] Real-time updates hoạt động (thử mở 2 browser)
- [ ] PWA install prompt xuất hiện
- [ ] Responsive trên mobile
- [ ] Service Worker hoạt động (offline mode)

### Test Commands

\`\`\`bash
# Test preview locally trước khi deploy
npm run build
npm run preview

# Open http://localhost:4173
\`\`\`

---

## 9. TROUBLESHOOTING

### Lỗi: "Firebase configuration is missing"

**Nguyên nhân:** Environment variables chưa được set hoặc sai prefix

**Giải pháp:**
1. Kiểm tra file \`.env.local\` có đúng format không
2. Tất cả variables phải bắt đầu bằng \`VITE_\`
3. Restart dev server sau khi thay đổi env:
   \`\`\`bash
   npm run dev
   \`\`\`

### Lỗi: "Permission denied" khi đọc/ghi Firestore

**Nguyên nhân:** Security rules chưa được deploy

**Giải pháp:**
\`\`\`bash
firebase deploy --only firestore:rules
firebase deploy --only storage
\`\`\`

### Lỗi: "AI Summary không hoạt động"

**Nguyên nhân:**
- Gemini API key sai hoặc chưa được set
- Quota đã hết
- Model name sai

**Giải pháp:**
1. Kiểm tra \`VITE_GEMINI_API_KEY\` trong env
2. Check quota tại: https://aistudio.google.com/
3. Xem log trong browser console (F12)

### Lỗi: "Upload files thất bại"

**Nguyên nhân:** Storage rules chưa được cấu hình

**Giải pháp:**
1. Deploy storage rules (xem bước 2.5)
2. Kiểm tra Storage bucket có đúng trong Firebase config không

### Website bị lỗi 404 sau khi deploy

**Nguyên nhân:** Server chưa được config cho SPA

**Giải pháp:**
- Firebase Hosting: Đảm bảo đã chọn "Configure as SPA"
- Vercel/Netlify: Tự động handle
- VPS/Nginx: Kiểm tra \`try_files\` directive trong config

### Environment variables không hoạt động trên production

**Nguyên nhân:** Vite chỉ inject env vars lúc build time

**Giải pháp:**
1. Set env vars **TRƯỚC KHI** build
2. Hoặc dùng hosting platform's env vars feature
3. Rebuild và redeploy

---

## 📚 TÀI LIỆU THAM KHẢO

- [Vite Documentation](https://vitejs.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

## 🎯 KẾT LUẬN

Sau khi hoàn thành các bước trên, ứng dụng QLDA-NPSC của bạn đã sẵn sàng hoạt động trên production!

**Các bước tiếp theo:**
1. Tạo tài khoản Admin đầu tiên
2. Approve user mới
3. Tạo projects và bắt đầu quản lý

**Lưu ý bảo mật:**
- ✅ Không commit file \`.env.local\` lên Git
- ✅ Rotate API keys định kỳ
- ✅ Monitor Firebase usage để tránh vượt quota
- ✅ Backup Firestore database định kỳ
- ✅ Review Security Rules thường xuyên

---

**Chúc bạn deploy thành công! 🚀**

Nếu gặp vấn đề, hãy kiểm tra phần Troubleshooting hoặc xem browser console (F12) để debug.
