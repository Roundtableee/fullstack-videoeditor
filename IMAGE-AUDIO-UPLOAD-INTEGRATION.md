# Image และ Audio Upload Integration

## 🎯 การอัปเดตที่ทำ

### 1. อัปเดต FileUploadService
- ✅ เพิ่ม `getUploadedFiles()` method สำหรับดึงรายการไฟล์ที่อัปโหลดแล้ว
- ✅ รองรับ audio และ image file types
- ✅ เชื่อมต่อกับ backend `/upload/list` endpoint

### 2. อัปเดต Audio Component (`audios.tsx`)
**เดิม**: ใช้ custom upload logic และ static data เท่านั้น
**ใหม่**: 
- ✅ ใช้ `FileUpload` component แทน manual file picker
- ✅ โหลดไฟล์ audio ที่อัปโหลดแล้วจาก backend
- ✅ รวม static audios กับ uploaded audios
- ✅ UI ใหม่ที่สวยงามและใช้งานง่าย
- ✅ มีปุ่ม Preview และ Add to Timeline
- ✅ รองรับ drag and drop เข้า timeline

### 3. อัปเดต Image Component (`images.tsx`)
**เดิม**: ใช้ custom upload logic และ static data เท่านั้น
**ใหม่**:
- ✅ ใช้ `FileUpload` component แทน manual file picker
- ✅ โหลดไฟล์ image ที่อัปโหลดแล้วจาก backend
- ✅ รวม static images กับ uploaded images
- ✅ Grid layout สำหรับแสดง thumbnails
- ✅ Preview และ Add to Timeline
- ✅ รองรับ drag and drop เข้า timeline

### 4. อัปเดต Backend (`upload.ts`)
- ✅ เพิ่ม `/upload/list` endpoint สำหรับดึงรายการไฟล์ทั้งหมด
- ✅ แยกไฟล์ตาม type (videos, audio, images)
- ✅ ส่งข้อมูล metadata เช่น file size, upload date, mimetype
- ✅ เรียงลำดับตาม upload date (ใหม่สุดก่อน)

## 🔧 Technical Details

### FileUpload Service
```typescript
// เพิ่ม method ใหม่
async getUploadedFiles(): Promise<UploadedFile[]> {
  const response = await fetch(`${UPLOAD_API_URL}/list`);
  const data = await response.json();
  return data.files || [];
}
```

### Audio Component Structure
```tsx
const Audios = () => {
  const [items, setItems] = useState<AudioItemData[]>([]);           // Static audios
  const [uploadedAudios, setUploadedAudios] = useState<UploadedFile[]>([]);  // Uploaded audios
  const [showUpload, setShowUpload] = useState(false);
  
  // รวม static + uploaded
  const allAudios = [...items, ...uploadedAudios.map(convertUploadedToAudioItem)];
  
  return (
    <div>
      {/* Header with Add Audio button */}
      {/* FileUpload component when showUpload=true */}
      {/* List of all audios with preview/add buttons */}
    </div>
  );
};
```

### Image Component Structure
```tsx
const Images = () => {
  const [library, setLibrary] = useState<Partial<IImage>[]>([]);     // Static images
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);  // Uploaded images
  const [showUpload, setShowUpload] = useState(false);
  
  // รวม static + uploaded
  const allImages = [...library, ...uploadedImages.map(convertUploadedToImage)];
  
  return (
    <div>
      {/* Header with Add Image button */}
      {/* FileUpload component when showUpload=true */}
      {/* Grid of all images with hover actions */}
    </div>
  );
};
```

### Backend List Endpoint
```typescript
GET /upload/list

Response:
{
  "files": [
    {
      "id": "uuid",
      "filename": "audio.mp3",
      "size": 1024000,
      "mimetype": "audio/mp3",
      "url": "/uploads/audio/uuid.mp3",
      "type": "audio",
      "uploadedAt": "2025-06-29T..."
    }
  ]
}
```

## 🎨 UI/UX Features

### Audio Panel
- 📂 Collapsible upload section
- 🎵 Audio icon และ metadata display
- ▶️ Preview button สำหรับเล่นเสียง
- ➕ Add button สำหรับเพิ่มเข้า timeline
- 🖱️ Drag and drop support

### Image Panel
- 📂 Collapsible upload section  
- 🖼️ Grid layout with thumbnails
- 🎭 Hover overlay with actions
- ➕ Add button สำหรับเพิ่มเข้า timeline
- 🖱️ Drag and drop support

## 🔄 Data Flow

```
1. User uploads file via FileUpload component
   ↓
2. File uploaded to backend /upload endpoint
   ↓
3. Backend saves file to /uploads/{type}/{uuid}.ext
   ↓
4. Frontend receives upload response
   ↓
5. File added to uploadedAudios/uploadedImages state
   ↓
6. UI re-renders showing new file
   ↓
7. User can preview, add to timeline, or drag to timeline
```

## ✅ Benefits

1. **Unified UI**: ทุก file type ใช้ FileUpload component เดียวกัน
2. **Better UX**: Progress bars, error handling, preview features
3. **Persistence**: ไฟล์ที่อัปโหลดจะอยู่ใน library ถาวร
4. **Flexibility**: รองรับทั้ง static และ user-uploaded files
5. **Consistency**: API และ UI patterns เหมือนกันทุก component

## 🧪 Testing Checklist

- [ ] อัปโหลด audio files (mp3, wav)
- [ ] อัปโหลด image files (jpg, png, gif)  
- [ ] ดู audio/image library แสดงไฟล์ที่อัปโหลด
- [ ] Preview audio playback
- [ ] Preview image thumbnails
- [ ] Add to timeline จาก library
- [ ] Drag and drop เข้า timeline
- [ ] Refresh page และไฟล์ยังอยู่ใน library

## 🔮 Future Enhancements

1. **Audio Duration Detection**: แยก audio duration จริงจาก metadata
2. **Image Dimensions**: แสดง resolution ของ image
3. **File Management**: delete, rename files จาก UI
4. **Bulk Upload**: อัปโหลดหลายไฟล์พร้อมกัน
5. **Thumbnails**: สร้าง video thumbnails อัตโนมัติ
