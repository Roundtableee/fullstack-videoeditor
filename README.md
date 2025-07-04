# Video Render with Copilot

ระบบการ render วิดีโอที่เชื่อมต่อกับ React Video Editor พร้อม backend สำหรับการประมวลผลวิดีโอ

## 🎯 คุณสมบัติหลัก

- **React Video Editor**: Editor สำหรับตัดต่อวิดีโอแบบ real-time
- **Node.js Backend**: API สำหรับการ render วิดีโอ
- **Job Queue System**: จัดการงาน render หลายงานพร้อมกัน
- **Real-time Progress**: ติดตามความคืบหน้าการ render แบบ real-time
- **FFmpeg Integration**: ประมวลผลวิดีโอด้วย FFmpeg
- **Docker Support**: รองรับการ deploy ด้วย Docker

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm หรือ yarn
- Docker (สำหรับการ deploy)

### การติดตั้ง

```bash
# Clone repository
git clone <repository-url>
cd render-with-copilot

# Install dependencies สำหรับทั้ง frontend และ backend
npm run install:all

# Copy environment files
cp video-render-backend/.env.example video-render-backend/.env
cp AI-avatar-frontend/react-video-editor-main/.env.example AI-avatar-frontend/react-video-editor-main/.env
```

### การรัน Development

```bash
# Start both frontend and backend
npm run dev

# หรือรันแยกกัน
npm run dev:backend   # Backend: http://localhost:3001
npm run dev:frontend  # Frontend: http://localhost:5173
```

### การรัน Production

```bash
# Build both projects
npm run build

# Start production servers
npm start
```

### การรันด้วย Docker

```bash
# Build and start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## 📁 โครงสร้างโปรเจค

```
render-with-copilot/
├── video-render-backend/          # Node.js Backend
│   ├── src/
│   │   ├── routes/                # API Routes
│   │   ├── services/              # Business Logic
│   │   ├── middleware/            # Express Middleware
│   │   └── types/                 # TypeScript Types
│   ├── package.json
│   └── Dockerfile
├── AI-avatar-frontend/
│   └── react-video-editor-main/   # React Video Editor
│       ├── src/
│       │   ├── features/editor/   # Editor Features
│       │   ├── services/          # API Services
│       │   └── components/        # UI Components
│       └── package.json
├── docker-compose.yml             # Docker Configuration
├── package.json                   # Root Package File
└── README.md
```

## 🔧 API Documentation

### Backend Endpoints

#### Start Render Job
```http
POST /render
Content-Type: application/json

{
  \"design\": {
    \"trackItems\": [...],
    \"transitions\": [...]
  },
  \"options\": {
    \"fps\": 30,
    \"size\": { \"width\": 1920, \"height\": 1080 },
    \"format\": \"mp4\"
  }
}
```

**Response:**
```json
{
  \"renderId\": \"uuid-v4\",
  \"status\": \"PENDING\",
  \"message\": \"Render job has been queued\"
}
```

#### Get Render Status
```http
GET /status/{renderId}
```

**Response:**
```json
{
  \"video\": {
    \"id\": \"uuid-v4\",
    \"status\": \"COMPLETED\",
    \"progress\": 100,
    \"url\": \"http://localhost:3001/outputs/uuid-v4.mp4\"
  }
}
```

### Status Values
- `PENDING`: งานอยู่ในคิว
- `PROCESSING`: กำลัง render
- `COMPLETED`: render เสร็จสิ้น
- `FAILED`: render ล้มเหลว

## 🎮 การใช้งาน Frontend

1. **เปิด Video Editor**: http://localhost:5173
2. **เพิ่มคลิปวิดีโอ**: ลากไฟล์วิดีโอลงใน timeline
3. **ตัดต่อวิดีโอ**: ใช้เครื่องมือตัดต่อต่างๆ
4. **Export วิดีโอ**: คลิกปุ่ม \"Export Video\"
5. **ติดตามความคืบหน้า**: ดู progress bar การ render
6. **Download วิดีโอ**: เมื่อ render เสร็จจะแสดงลิงก์ download

## ⚙️ Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
REDIS_URL=redis://localhost:6379
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
MAX_CONCURRENT_RENDERS=2
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
REMOTION_CONCURRENCY=1
REMOTION_QUALITY=70
REMOTION_CRF=18
```

### Frontend (.env)
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_PUBLIC_RENDER_API_URL=http://localhost:3001/render
VITE_PUBLIC_STATUS_API_URL=http://localhost:3001/status
```

## 🔄 การ Deploy

### Docker Deployment

```bash
# Production deployment
docker-compose up -d

# Scale backend services
docker-compose up -d --scale video-render-backend=3
```

### Manual Deployment

1. **Backend:**
   ```bash
   cd video-render-backend
   npm run build
   npm start
   ```

2. **Frontend:**
   ```bash
   cd AI-avatar-frontend/react-video-editor-main
   npm run build
   # Serve dist/ folder with your web server
   ```

## 🧪 การ Test

```bash
# Test backend API
curl -X POST http://localhost:3001/render \\
  -H \"Content-Type: application/json\" \\
  -d '{\"design\":{\"trackItems\":[],\"transitions\":[]},\"options\":{\"fps\":30,\"size\":{\"width\":1920,\"height\":1080},\"format\":\"mp4\"}}'

# Test health check
curl http://localhost:3001/health
```

## 📝 สิ่งที่ควรพัฒนาเพิ่มเติม

### Backend
- [ ] เพิ่ม Remotion สำหรับการ render จริง
- [ ] ใช้ Redis สำหรับ job queue ใน production
- [ ] เพิ่ม authentication และ authorization
- [ ] เพิ่ม WebSocket สำหรับ real-time updates
- [ ] เพิ่ม file upload สำหรับ media assets
- [ ] เพิ่ม caching และ optimization

### Frontend
- [ ] เพิ่ม UI สำหรับ export settings
- [ ] เพิ่ม preview ก่อน export
- [ ] เพิ่ม history การ export
- [ ] เพิ่ม error handling ที่ดีขึ้น
- [ ] เพิ่ม drag & drop สำหรับไฟล์
- [ ] เพิ่ม keyboard shortcuts

## 🐛 การแก้ไขปัญหา

### Backend ไม่สามารถ start ได้
```bash
# ตรวจสอบ port ว่าถูกใช้งานอยู่หรือไม่
lsof -i :3001

# ตรวจสอบ logs
npm run dev:backend
```

### Frontend ไม่สามารถเชื่อมต่อ Backend
1. ตรวจสอบ `VITE_BACKEND_URL` ใน `.env`
2. ตรวจสอบ CORS settings ใน backend
3. ตรวจสอบ backend ว่าทำงานอยู่หรือไม่

### การ Render ล้มเหลว
1. ตรวจสอบ FFmpeg ติดตั้งถูกต้องหรือไม่
2. ตรวจสอบ permissions ของ output directory
3. ตรวจสอบ memory และ disk space

## 📞 Support

หากมีปัญหาหรือข้อสงสัย สามารถ:
1. เปิด Issue ใน repository
2. ตรวจสอบ logs ด้วย `npm run docker:logs`
3. ดู API documentation ใน README ของแต่ละ service

## 📄 License

MIT License
