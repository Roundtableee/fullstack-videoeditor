# การแก้ไขปัญหา Video CORS และ Range Requests

## ปัญหาที่พบ:
```
GET http://localhost:3001/uploads/videos/xxx.mp4 
net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin 206 (Partial Content)
```

เกิดจากการที่ browser block Cross-Origin requests สำหรับ video files ที่ใช้ Range requests (HTTP 206)

## สาเหตุ:
1. CORS policy ไม่รองรับ Range headers
2. Static file serving ไม่มี CORS headers ที่เหมาะสม
3. ไม่รองรับ Partial Content responses สำหรับ video streaming

## การแก้ไข:

### 1. เพิ่ม CORS Headers สำหรับ Video Streaming
```typescript
app.use(cors({
  origin: [...],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept-Ranges', 'Content-Range'],
  exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges']
}));
```

### 2. เพิ่ม Middleware สำหรับ Static Files
```typescript
app.use('/uploads', (req, res, next) => {
  // Set CORS headers สำหรับ static files
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Range, Content-Length');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

## สิ่งที่แก้ไขได้:
- ✅ รองรับ HTTP Range requests (206 Partial Content)
- ✅ รองรับ video streaming และ progressive download
- ✅ รองรับ Cross-Origin requests สำหรับ video files
- ✅ Handle preflight OPTIONS requests
- ✅ Expose headers ที่จำเป็นสำหรับ video playback

## การทดสอบ:
1. Restart backend server
2. อัพโหลดไฟล์วิดีโอใหม่
3. ลากวิดีโอไปไว้บน timeline
4. ตรวจสอบว่าไม่มี CORS error แล้ว

## HTTP Headers ที่สำคัญ:
- `Range`: สำหรับ partial content requests
- `Accept-Ranges`: แจ้งว่ารองรับ range requests  
- `Content-Range`: ระบุ byte range ที่ส่งกลับ
- `Content-Length`: ขนาดของ content
- `Access-Control-Expose-Headers`: อนุญาตให้ frontend อ่าน headers
