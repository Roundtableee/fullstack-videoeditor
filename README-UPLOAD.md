# React Video Editor with File Upload & Backend Rendering

โปรเจคนี้เป็น video editor ที่สร้างด้วย React และ Remotion ที่รองรับการอัพโหลดไฟล์ (รูปภาพ, วิดีโอ, เสียง) จากเครื่องผู้ใช้ และการ export วิดีโอผ่าน backend

## ✨ คุณสมบัติหลัก

- 🎬 **Video Editor**: ตัดต่อวิดีโอแบบ drag & drop
- 📁 **File Upload**: อัพโหลดไฟล์ รูปภาพ, วิดีโอ, เสียง จากเครื่องผู้ใช้
- 📚 **Media Library**: จัดการไฟล์ที่อัพโหลดแล้ว
- 🎵 **Timeline**: จัดเรียงคลิปและ transitions
- 🎨 **Effects & Transitions**: เอฟเฟกต์และการเปลี่ยนผ่าน
- 📤 **Video Export**: export วิดีโอผ่าน backend แบบ real-time
- ⚡ **Real-time Preview**: ดูผลลัพธ์แบบ real-time

## 🏗️ โครงสร้างโปรเจค

```
├── AI-avatar-frontend/
│   └── react-video-editor-main/     # Frontend (React + Vite)
│       ├── src/
│       │   ├── features/editor/
│       │   │   ├── components/
│       │   │   │   ├── FileUpload.tsx      # Component สำหรับอัพโหลดไฟล์
│       │   │   │   ├── MediaLibrary.tsx    # แสดงไฟล์ที่อัพโหลด
│       │   │   │   └── MediaManager.tsx    # รวม Upload + Library + Export
│       │   │   ├── hooks/
│       │   │   │   └── useMediaImport.ts   # Hook สำหรับเพิ่มไฟล์ลง timeline
│       │   │   └── store/
│       │   │       └── use-download-state.ts # จัดการการ export
│       │   └── services/
│       │       ├── upload.ts               # API สำหรับอัพโหลดไฟล์
│       │       └── video.ts                # API สำหรับ render วิดีโอ
│       └── .env                            # Environment variables
└── video-render-backend/                   # Backend (Node.js + Express)
    ├── src/
    │   ├── routes/
    │   │   ├── upload.ts                   # API สำหรับอัพโหลดไฟล์
    │   │   ├── render.ts                   # API สำหรับ render วิดีโอ
    │   │   └── status.ts                   # API สำหรับติดตามสถานะ
    │   ├── services/
    │   │   └── renderService.ts            # Logic การ render วิดีโอ
    │   └── index.ts                        # Entry point
    ├── uploads/                            # โฟลเดอร์เก็บไฟล์ที่อัพโหลด
    ├── outputs/                            # โฟลเดอร์เก็บวิดีโอที่ render แล้ว
    └── .env                                # Environment variables
```

## 🚀 การติดตั้งและใช้งาน

### วิธีที่ 1: ใช้ Setup Script (แนะนำ)

สำหรับ **Windows PowerShell**:
```powershell
.\setup.ps1
```

สำหรับ **Linux/Mac**:
```bash
chmod +x setup.sh
./setup.sh
```

### วิธีที่ 2: ติดตั้งแบบแยกส่วน

#### 1. Setup Backend
```bash
cd video-render-backend
npm install
cp .env.example .env  # แก้ไข .env ตามต้องการ
npm run dev
```

#### 2. Setup Frontend  
```bash
cd AI-avatar-frontend/react-video-editor-main
npm install
cp .env.example .env  # แก้ไข .env ตามต้องการ
npm run dev
```

### วิธีที่ 3: ใช้ VS Code Tasks

1. เปิดโปรเจคใน VS Code
2. กด `Ctrl+Shift+P` (หรือ `Cmd+Shift+P` บน Mac)
3. พิมพ์ "Tasks: Run Task"
4. เลือก "Start Development Servers"

## 🌐 URL และ Port

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **File Upload API**: http://localhost:3001/upload
- **Video Render API**: http://localhost:3001/render
- **Status API**: http://localhost:3001/status

## 📋 การใช้งาน

### 1. อัพโหลดไฟล์

1. คลิกปุ่ม "Media Library" ใน navbar
2. เลือกแท็บ "Upload"
3. Drag & drop ไฟล์ หรือคลิกเพื่อเลือกไฟล์
4. รองรับไฟล์ประเภท:
   - **วิดีโอ**: MP4, WebM, QuickTime, AVI
   - **เสียง**: MP3, WAV, OGG
   - **รูปภาพ**: JPEG, PNG, GIF, WebP

### 2. จัดการ Media Library

1. ดูไฟล์ที่อัพโหลดแล้วในแท็บ "Library"
2. คลิกไฟล์เพื่อเพิ่มลง timeline
3. ลบไฟล์ที่ไม่ต้องการได้

### 3. ตัดต่อวิดีโอ

1. เพิ่มไฟล์ลง timeline จาก Media Library
2. จัดเรียงคลิป, ปรับความยาว, เพิ่ม transitions
3. ใช้ tools ต่าง ๆ ในการตัดต่อ

### 4. Export วิดีโอ

1. คลิกปุ่ม "Export" ใน navbar
2. เลือกรูปแบบ (MP4/JSON)
3. คลิก "Export" เพื่อเริ่มการ render
4. ติดตามความคืบหน้าแบบ real-time
5. ดาวน์โหลดวิดีโอเมื่อเสร็จสิ้น

## ⚙️ Environment Variables

### Frontend (.env)
```bash
VITE_BACKEND_URL=http://localhost:3001
VITE_PUBLIC_RENDER_API_URL=http://localhost:3001/render
VITE_PUBLIC_STATUS_API_URL=http://localhost:3001/status
VITE_PUBLIC_UPLOAD_API_URL=http://localhost:3001/upload
```

### Backend (.env)
```bash
PORT=3001
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
MAX_FILE_SIZE=500
```

## 📁 โครงสร้างไฟล์ที่อัพโหลด

```
uploads/
├── videos/         # ไฟล์วิดีโอ
├── audio/          # ไฟล์เสียง
├── images/         # ไฟล์รูปภาพ
└── misc/           # ไฟล์อื่น ๆ

outputs/
└── rendered_videos/ # วิดีโอที่ render แล้ว
```

## 🔧 การพัฒนา

### การเพิ่มไฟล์ประเภทใหม่

1. แก้ไข `fileFilter` ใน `upload.ts` (backend)
2. อัปเดต `isSupportedFileType` ใน `upload.ts` (frontend)
3. เพิ่ม preview component ใน `MediaLibrary.tsx`

### การเพิ่ม Export Format

1. แก้ไข `videoRenderService.ts` (backend)
2. อัปเดต export options ใน `navbar.tsx` (frontend)

## 🐛 การแก้ไขปัญหา

### ปัญหา CORS
ตรวจสอบ `ALLOWED_ORIGINS` ใน backend `.env`

### ปัญหาการอัพโหลดไฟล์
- ตรวจสอบขนาดไฟล์ (จำกัดที่ 500MB)
- ตรวจสอบประเภทไฟล์ที่รองรับ

### ปัญหาการ Export
- ตรวจสอบว่ามีคลิปใน timeline หรือไม่
- ตรวจสอบ backend logs สำหรับ error messages

## 📚 เทคโนโลยีที่ใช้

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **Remotion** - Video rendering engine  
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Radix UI** - UI components

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **Multer** - File upload handling
- **Socket.io** - Real-time communication
- **UUID** - Unique IDs generation

## 📝 License

MIT License - ดูรายละเอียดเพิ่มเติมในไฟล์ LICENSE
