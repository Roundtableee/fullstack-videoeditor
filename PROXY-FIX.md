# การแก้ไขปัญหา CORS ด้วย Proxy (วิธีที่ 3)

## สาเหตุปัญหา:
Browser block cross-origin requests สำหรับ video files เนื่องจาก:
- Frontend: http://localhost:5173 
- Backend: http://localhost:3001
- ต่าง origin กัน (different ports)

## วิธีแก้ไข: ใช้ Vite Proxy

แทนที่จะแก้ CORS ที่ backend ให้ใช้ proxy ใน frontend เพื่อให้ทุก request ดูเหมือนมาจาก origin เดียวกัน

## การเปลี่ยนแปลง:

### 1. อัปเดต Vite Configuration
**ไฟล์**: `vite.config.ts`
```typescript
server: {
  port: 5173,
  proxy: {
    "/api": {
      target: "http://localhost:3001",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ""),
    },
    "/uploads": {
      target: "http://localhost:3001",
      changeOrigin: true,
    },
    "/outputs": {
      target: "http://localhost:3001",
      changeOrigin: true,
    },
  },
}
```

### 2. อัปเดต Environment Variables
**ไฟล์**: `.env` และ `.env.example`
```bash
# เดิม
VITE_BACKEND_URL=http://localhost:3001
VITE_PUBLIC_UPLOAD_API_URL=http://localhost:3001/upload

# ใหม่ 
VITE_BACKEND_URL=/api
VITE_PUBLIC_UPLOAD_API_URL=/api/upload
```

## วิธีการทำงาน:

### Request Routing:
```
Frontend Request: http://localhost:5173/api/upload/single
↓ (Vite Proxy)
Backend Request: http://localhost:3001/upload/single

Frontend Request: http://localhost:5173/uploads/videos/file.mp4  
↓ (Vite Proxy)
Backend Request: http://localhost:3001/uploads/videos/file.mp4
```

### ข้อดี:
- ✅ ไม่มีปัญหา CORS (same origin)
- ✅ ไม่ต้องแก้ไข backend CORS config
- ✅ Video files โหลดได้ปกติ
- ✅ รองรับ range requests อัตโนมัติ

## การทดสอบ:

### 1. Restart Frontend Server:
```bash
cd AI-avatar-frontend/react-video-editor-main
npm run dev
```

### 2. ทดสอบ URLs:
- API: `http://localhost:5173/api/upload/single`
- Video: `http://localhost:5173/uploads/videos/filename.mp4`
- ทั้งหมดจะ route ไป backend อัตโนมัติ

### 3. ทดสอบ Video:
- อัพโหลดไฟล์วิดีโอ
- ลากไปไว้บน timeline
- ตรวจสอบว่าไม่มี CORS errors

## Expected Results:
- ✅ ไม่มี `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin`
- ✅ Video URLs ใช้ same origin (localhost:5173)
- ✅ Video streaming ทำงานปกติ
- ✅ Timeline preview แสดงผลได้

## หมายเหตุ:
- Proxy ทำงานเฉพาะใน development mode
- สำหรับ production ต้องตั้งค่า reverse proxy ที่ web server
