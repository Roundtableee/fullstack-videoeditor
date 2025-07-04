# การแก้ไข localhost ให้รองรับ Network Access

## การเปลี่ยนแปลง:

### 1. Frontend (Vite Configuration)
**ไฟล์**: `vite.config.ts`
```typescript
server: {
  host: '0.0.0.0', // Bind กับ all network interfaces
  port: 5173,
  // ... proxy config
}
```

### 2. Backend Server Configuration  
**ไฟล์**: `src/index.ts`
```typescript
// Bind server กับ all interfaces
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Video render backend server running on port ${PORT}`);
  console.log(`🌐 Server accessible at: http://localhost:${PORT} and http://0.0.0.0:${PORT}`);
});
```

### 3. อัปเดต CORS Origins
```typescript
origin: [
  'http://localhost:3000', 
  'http://localhost:5173', 
  'http://localhost:5174',
  'http://127.0.0.1:5173',    // IP address
  'http://0.0.0.0:5173'       // All interfaces
]
```

## ผลลัพธ์:

### สามารถเข้าถึงได้ผ่าน:
- ✅ `http://localhost:5173` (เดิม)
- ✅ `http://127.0.0.1:5173` (IP local)
- ✅ `http://[YOUR_IP]:5173` (Network IP)
- ✅ `http://0.0.0.0:5173` (All interfaces)

### Backend accessible ผ่าน:
- ✅ `http://localhost:3001`
- ✅ `http://127.0.0.1:3001`
- ✅ `http://[YOUR_IP]:3001`

## การหา IP Address:

### Windows:
```cmd
ipconfig
# หา IPv4 Address
```

### Linux/Mac:
```bash
ifconfig
# หรือ
ip addr show
```

## การทดสอบ:

### 1. Restart Servers:
```bash
# Backend
cd video-render-backend
npm run dev

# Frontend  
cd AI-avatar-frontend/react-video-editor-main
npm run dev
```

### 2. ทดสอบ Network Access:
- เปิด browser บนเครื่องอื่นใน network เดียวกัน
- ไปที่ `http://[YOUR_IP]:5173`
- ทดสอบการอัพโหลดและ export

### 3. ตรวจสอบ Console:
- Backend จะแสดง accessible URLs
- Frontend จะแสดง network addresses

## Security Note:
- `0.0.0.0` เปิดให้ทุก network interface เข้าถึงได้
- เหมาะสำหรับ development ใน local network
- สำหรับ production ควรระบุ IP specific
- พิจารณาใช้ firewall สำหรับ security

## ตัวอย่าง Output:
```
🚀 Video render backend server running on port 3001
🌐 Server accessible at: http://localhost:3001 and http://0.0.0.0:3001

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```
