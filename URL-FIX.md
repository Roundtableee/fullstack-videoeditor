# การแก้ไขปัญหา URL ไฟล์ที่อัพโหลด

## ปัญหาที่พบ:
URL ไฟล์ที่ upload แล้วมีโครงสร้างผิด:
```
❌ http://localhost:3001/uploadsuploads/videos/filename.mp4
✅ http://localhost:3001/uploads/videos/filename.mp4
```

## สาเหตุ:
- การสร้าง relativePath ใน upload.ts ไม่ถูกต้อง
- Static file serving path มีปัญหา

## การแก้ไข:

### 1. แก้ไข URL Generation ใน upload.ts
```typescript
// เดิม
const relativePath = req.file.path.replace(process.env.UPLOAD_DIR || './uploads', '');
const fileUrl = `${baseUrl}/uploads${relativePath.replace(/\\/g, '/')}`;

// ใหม่
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
const relativePath = path.relative(uploadDir, req.file.path);
const fileUrl = `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;
```

### 2. แก้ไข Static File Serving ใน index.ts
```typescript
// เดิม
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ใหม่
const uploadDirPath = path.resolve(uploadDir);
app.use('/uploads', express.static(uploadDirPath));
```

## ทดสอบการแก้ไข:
1. Restart backend server
2. Upload ไฟล์ใหม่
3. ตรวจสอบ URL ที่ได้รับ
4. ทดสอบเปิด URL ใน browser

## ตัวอย่าง URL ที่ถูกต้อง:
- Video: `http://localhost:3001/uploads/videos/uuid.mp4`
- Audio: `http://localhost:3001/uploads/audio/uuid.mp3`  
- Image: `http://localhost:3001/uploads/images/uuid.jpg`

## การตรวจสอบ:
```bash
# ตรวจสอบ directory structure
ls video-render-backend/uploads/
ls video-render-backend/uploads/videos/

# ทดสอบ static serving
curl http://localhost:3001/uploads/videos/[filename]
```
