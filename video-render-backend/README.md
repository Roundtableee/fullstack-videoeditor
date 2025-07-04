# Video Render Backend

Backend service for rendering videos from the video editor timeline data.

## Features

- **Video Rendering**: Convert timeline data to MP4 videos
- **Job Queue**: Handle multiple render jobs concurrently
- **Real-time Status**: WebSocket and REST API for job status
- **FFmpeg Integration**: Video processing using FFmpeg
- **Future Remotion Support**: Ready for Remotion integration

## Quick Start

### Prerequisites

- Node.js 18+ 
- FFmpeg (automatically installed via ffmpeg-static)
- Optional: Redis for production job queue

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Production

```bash
# Build the project
npm run build

# Start production server
npm start
```

## API Endpoints

### Start Render Job

```http
POST /render
Content-Type: application/json

{
  "design": {
    "trackItems": [
      {
        "id": "item1",
        "type": "video",
        "display": { "from": 0, "to": 5000 },
        "trim": { "from": 0, "to": 5000 },
        "details": {
          "src": "https://example.com/video.mp4",
          "width": 1920,
          "height": 1080
        }
      }
    ],
    "transitions": []
  },
  "options": {
    "fps": 30,
    "size": { "width": 1920, "height": 1080 },
    "format": "mp4"
  }
}
```

**Response:**
```json
{
  "renderId": "uuid-v4",
  "status": "PENDING",
  "message": "Render job has been queued"
}
```

### Get Render Status

```http
GET /status/{renderId}
```

**Response:**
```json
{
  "video": {
    "id": "uuid-v4",
    "status": "COMPLETED",
    "progress": 100,
    "url": "http://localhost:3001/outputs/uuid-v4.mp4",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:01:00.000Z"
  }
}
```

### Status Values

- `PENDING`: Job is in queue
- `PROCESSING`: Currently rendering
- `COMPLETED`: Render finished successfully  
- `FAILED`: Render failed with error

## Environment Variables

```env
NODE_ENV=development
PORT=3001

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Directories
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs

# Rendering
MAX_CONCURRENT_RENDERS=2
RENDER_TIMEOUT=300000

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Video Quality
REMOTION_CONCURRENCY=1
REMOTION_QUALITY=70
REMOTION_CRF=18
```

## Architecture

```
src/
├── index.ts              # Main server setup
├── types/                # TypeScript interfaces
├── routes/               # API route handlers
│   ├── render.ts         # Start render jobs
│   └── status.ts         # Get job status
├── services/             # Business logic
│   ├── renderService.ts  # Video rendering logic
│   ├── jobQueue.ts       # Job queue management
│   └── storage.ts        # Data storage
└── middleware/           # Express middleware
    └── errorHandler.ts   # Error handling
```

## Integration with Frontend

The backend is designed to work with the React video editor:

1. **Frontend** sends timeline data to `/render`
2. **Backend** queues the job and returns `renderId`
3. **Frontend** polls `/status/{renderId}` for updates
4. **Backend** processes video and provides download URL

## Current Implementation

The current version uses FFmpeg to create basic videos. For production:

1. **Replace FFmpeg with Remotion** for timeline rendering
2. **Add Redis** for persistent job queue
3. **Add WebSocket** real-time updates
4. **Add authentication** for user management
5. **Add file upload** for media assets

## Development Notes

- The render service currently creates a basic black video as a demo
- Production implementation should use Remotion for proper timeline rendering
- Job storage is in-memory; use Redis/MongoDB for production
- Error handling is basic; enhance for production use

## Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

### Manual Deployment

1. Build the project: `npm run build`
2. Copy `dist/`, `package.json`, and `.env` to server
3. Run `npm ci --only=production`
4. Start with PM2: `pm2 start dist/index.js`
