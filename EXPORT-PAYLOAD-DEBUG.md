# Export Payload Debugging Guide

## 🔍 ปัญหา: วิดีโอที่ export ออกมาไม่มีเนื้อหา

### การแก้ไขที่ทำ:

#### 1. อัปเดต Backend Render Service
**ปัญหาเดิม**: สร้างวิดีโอสีดำเปล่า ๆ ไม่ใช้ข้อมูล trackItems
**การแก้ไข**: ใช้ข้อมูลจริงจาก trackItems ที่ส่งมา

```typescript
// เดิม - สร้างวิดีโอสีดำเท่านั้น
const command = ffmpeg()
  .input(`color=c=black:size=${width}x${height}:duration=${duration / 1000}:rate=${fps}`)
  .inputFormat('lavfi')

// ใหม่ - ใช้ข้อมูลจริงจาก trackItems
const videoTracks = job.design.trackItems.filter(item => 
  item.type === 'video' && item.details?.src
);
const audioTracks = job.design.trackItems.filter(item => 
  item.type === 'audio' && item.details?.src  
);
const imageTracks = job.design.trackItems.filter(item => 
  item.type === 'image' && item.details?.src
);

if (videoTracks.length > 0) {
  // ใช้วิดีโอจริง
  command = command.input(resolveMediaPath(videoTracks[0].details.src))
} else if (imageTracks.length > 0) {
  // ใช้รูปภาพสร้างวิดีโอ
  command = command.input(resolveMediaPath(imageTracks[0].details.src))
    .inputOptions(['-loop 1', '-t', `${duration / 1000}`])
}

if (audioTracks.length > 0) {
  // เพิ่มเสียง
  command = command.input(resolveMediaPath(audioTracks[0].details.src))
}
```

#### 2. เพิ่ม Debug Logging
**Frontend**: แสดง payload ที่ส่งไป
**Backend**: แสดง payload ที่ได้รับ

#### 3. แก้ไข Media Path Resolution
```typescript
const resolveMediaPath = (src: string): string => {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src; // External URL
  }
  
  if (src.startsWith('/uploads/')) {
    // Local upload - convert to absolute path
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    return path.join(uploadDir, src.replace('/uploads/', ''));
  }
  
  return src;
};
```

## 🧪 การ Debug

### 1. ตรวจสอบ Console Logs

#### Frontend Console:
```
=== EXPORT DEBUG ===
Timeline data: {
  trackItems: [...],
  transitions: [...],
  size: { width: 1920, height: 1080 },
  duration: 10000,
  fps: 30
}
TrackItems details:
  0: {
    id: "...",
    type: "video",
    details: { src: "/uploads/videos/abc123.mp4" },
    display: { from: 0, to: 5000 }
  }
====================
```

#### Backend Console:
```
=== RENDER REQUEST DEBUG ===
Full request body: {
  "design": {
    "trackItems": [...],
    "transitions": [...]
  },
  "options": {...}
}
Design trackItems count: 1
TrackItems details:
  0: type=video, details.src=/uploads/videos/abc123.mp4, display={"from":0,"to":5000}
============================
```

### 2. ตรวจสอบ Track Items

#### ข้อมูลที่ควรมี:
- ✅ `trackItems` ไม่ใช่ array ว่าง
- ✅ แต่ละ item มี `type` (video/audio/image)
- ✅ แต่ละ item มี `details.src` ที่ถูกต้อง
- ✅ แต่ละ item มี `display.from` และ `display.to`

#### ข้อมูลที่อาจทำให้ไม่ทำงาน:
- ❌ `trackItems = []` (array ว่าง)
- ❌ `details.src = undefined` หรือ `null`
- ❌ `details.src` ไม่ใช่ path ที่ถูกต้อง
- ❌ ไฟล์ไม่อยู่ใน server

### 3. ตรวจสอบไฟล์ใน Server

```bash
# ตรวจสอบโฟลเดอร์ uploads
ls -la video-render-backend/uploads/
ls -la video-render-backend/uploads/videos/
ls -la video-render-backend/uploads/audio/
ls -la video-render-backend/uploads/images/
```

### 4. ตรวจสอบ FFmpeg Command

ดู log ใน backend console:
```
FFmpeg command: ffmpeg -i /path/to/video.mp4 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black" ...
```

## 🔧 วิธีทดสอบ

### 1. เพิ่ม Media เข้า Timeline
1. อัปโหลดวิดีโอหรือรูปภาพ
2. ลากเข้า timeline
3. ตรวจสอบว่ามี track items ใน timeline

### 2. Export และดู Logs
1. กดปุ่ม Export
2. เปิด Browser Console (F12)
3. เปิด Backend Console/Logs
4. ดู debug information

### 3. ตรวจสอบ Output
1. ดาวน์โหลดวิดีโอที่ export แล้ว
2. เล่นดูว่ามีเนื้อหาหรือไม่
3. ตรวจสอบขนาดไฟล์ (ถ้าเล็กมากอาจเป็นวิดีโอเปล่า)

## 🎯 Expected Behavior

### เมื่อมี Video Track:
- ✅ ใช้วิดีโอจริงเป็น input
- ✅ Scale ให้พอดีกับขนาด output
- ✅ เพิ่มเสียงถ้ามี

### เมื่อมี Image Track อย่างเดียว:
- ✅ ใช้รูปภาพสร้างวิดีโอ (loop)
- ✅ ตั้ง duration ตาม display.to - display.from
- ✅ Scale ให้พอดีกับขนาด output

### เมื่อมี Audio Track:
- ✅ รวมเสียงกับวิดีโอ
- ✅ ใช้ `-shortest` เพื่อให้จบตาม track ที่สั้นที่สุด

### เมื่อไม่มี Media:
- ⚠️ สร้างวิดีโอสีดำ (fallback)

## 🚨 Common Issues

### Issue 1: TrackItems ว่าง
```javascript
// ตรวจสอบใน frontend
const timelineData = getTimelineData();
console.log('TrackItems count:', timelineData.trackItems.length);
```

### Issue 2: ไฟล์ path ไม่ถูกต้อง
```javascript
// ตรวจสอบ details.src
trackItems.forEach(item => {
  console.log(`${item.type}: ${item.details?.src}`);
});
```

### Issue 3: ไฟล์ไม่อยู่ใน server
```bash
# ตรวจสอบว่าไฟล์มีจริง
ls -la video-render-backend/uploads/videos/filename.mp4
```

## ✅ Verification Checklist

- [ ] Frontend ส่ง trackItems ที่ไม่ใช่ array ว่าง
- [ ] แต่ละ trackItem มี details.src ที่ถูกต้อง  
- [ ] Backend ได้รับ payload ถูกต้อง
- [ ] FFmpeg ใช้ไฟล์จริงเป็น input (ไม่ใช่ color=black)
- [ ] Output video มีเนื้อหาจริง ไม่ใช่วิดีโอเปล่า
