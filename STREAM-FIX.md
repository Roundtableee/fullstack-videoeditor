# การแก้ไขปัญหา Video CORS - วิธีที่ 2

## ปัญหา:
ปัญหา CORS สำหรับ video files ยังคงอยู่ แม้จะแก้ไข CORS headers แล้ว

## วิธีแก้ไขใหม่:
สร้าง custom streaming endpoint แทนการใช้ express.static()

## การเปลี่ยนแปลง:

### 1. สร้าง Custom Stream Route
**ไฟล์**: `src/routes/stream.ts`
- Handle video streaming ด้วย fs.createReadStream()
- รองรับ Range requests (HTTP 206) 
- Set CORS headers ที่เหมาะสม
- Set Content-Type ตาม file extension

### 2. อัปเดต Main Server  
**ไฟล์**: `src/index.ts`
- ใช้ `/uploads` route แทน express.static()
- Import และใช้ streamRoutes

## คุณสมบัติใหม่:

### Custom Video Streaming:
```typescript
// รองรับ Range requests
if (range) {
  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  const chunksize = (end - start) + 1;
  
  res.status(206);
  res.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
  res.header('Content-Length', chunksize.toString());
}
```

### CORS Headers:
```typescript
res.header('Access-Control-Allow-Origin', '*');
res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
res.header('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Range, Content-Length, Content-Type');
res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
```

## การทดสอบ:
1. Restart backend server
2. อัพโหลดไฟล์วิดีโอใหม่  
3. ลองเปิด URL ใน browser: `http://localhost:3001/uploads/videos/filename.mp4`
4. ลากวิดีโอไปไว้บน timeline
5. ตรวจสอบ Network tab ใน Developer Tools

## Expected Results:
- ✅ ไม่มี CORS errors
- ✅ Video streaming ทำงานได้ (HTTP 200/206)
- ✅ รองรับ seeking และ partial loading
- ✅ Timeline แสดง video preview ได้

## URLs ที่ใช้งาน:
- Video: `GET /uploads/videos/filename.mp4`
- Audio: `GET /uploads/audio/filename.mp3`  
- Image: `GET /uploads/images/filename.jpg`
