# การแก้ไขปัญหา CORS และ 404 Error

## ปัญหาที่พบ:
1. **CORS Error**: Backend ไม่อนุญาต frontend (port 5174) เข้าถึง
2. **404 Error**: URL `/upload/video` ไม่ถูกต้อง ควรเป็น `/upload/single`

## การแก้ไข:

### 1. แก้ไข CORS ใน Backend
**ไฟล์**: `video-render-backend/src/index.ts`
- เพิ่ม port 5174 ใน ALLOWED_ORIGINS
- เพิ่ม HTTP methods: DELETE, PUT, OPTIONS

**ไฟล์**: `video-render-backend/.env`
- เพิ่ม `ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000`

### 2. แก้ไข URL ใน Frontend  
**ไฟล์**: `src/features/editor/menu-item/videos.tsx`
- เปลี่ยนจาก `/upload/video` เป็น `/upload/single`

### 3. กำหนด Port ใน Vite Config
**ไฟล์**: `vite.config.ts`
- กำหนด `port: 5173` เพื่อให้แน่ใจว่าใช้ port ที่ถูกต้อง

## วิธีทดสอบ:
1. Restart backend: `npm run dev` (ใน video-render-backend)
2. Restart frontend: `npm run dev` (ใน react-video-editor-main)
3. เปิด http://localhost:5173
4. ลองอัพโหลดไฟล์ผ่าน Media Library

## URLs ที่ถูกต้อง:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Upload API: http://localhost:3001/upload/single
- Multiple Upload: http://localhost:3001/upload/multiple

## หมายเหตุ:
- Backend รองรับทั้ง single และ multiple file upload
- ใช้ `/upload/single` สำหรับไฟล์เดียว
- ใช้ `/upload/multiple` สำหรับหลายไฟล์พร้อมกัน
