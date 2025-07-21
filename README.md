# Video Editor Platform

A full-stack video editing platform with real-time preview and professional rendering capabilities.

## 🎬 Features

### Core Video Editing
- **Multi-track Timeline**: Support for video, audio, image, and text tracks
- **Real-time Preview**: Live preview of edits with accurate positioning
- **Professional Export**: High-quality video rendering with FFmpeg
- **Progress Tracking**: Real-time render progress with detailed status updates

### Media Support
- **Video Files**: MP4, WebM, MOV support with timeline editing
- **Images**: JPG, PNG with positioning, scaling, and crop support
- **Audio**: Background music and voiceover integration
- **Text Overlays**: Custom text with font, size, and positioning controls

### Advanced Editing
- **Precise Positioning**: Pixel-perfect positioning for all elements
- **Scaling & Transforms**: Resize and transform media elements
- **Timeline Control**: Drag-and-drop editing with precise timing
- **Layer Management**: Multi-layer composition with proper z-index

### Technical Features
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live preview updates as you edit
- **Efficient Rendering**: Optimized FFmpeg processing pipeline
- **Progress Monitoring**: Real-time render progress with percentage completion

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- FFmpeg installed and accessible in PATH
- Modern web browser with WebGL support

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd render-with-copilot
```

2. **Setup Backend**
```bash
cd video-render-backend
npm install
npm run dev
```

3. **Setup Frontend**
```bash
cd AI-avatar-frontend/react-video-editor-main
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173 (Vite dev server)
- Backend API: http://localhost:3001 (Express server)
- WebSocket: ws://localhost:3001 (Real-time updates)

## 🏗️ Architecture

### System Overview
- **Monorepo Structure**: Single repository with multiple packages
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + FFmpeg
- **Communication**: REST API + WebSocket for real-time updates
- **File Handling**: Multer for uploads, FFmpeg for processing

### Frontend (React + Vite)
- **Port**: 5173 (development)
- **Technology Stack**: 
  - React 18 with TypeScript
  - Vite for build tooling and HMR
  - Tailwind CSS for styling
  - Zustand for state management
  - Canvas API for real-time preview
- **Key Features**: 
  - Drag-and-drop timeline interface
  - Real-time preview canvas with accurate positioning
  - Media upload and library management
  - Progress tracking UI with WebSocket updates
  - Responsive design for mobile/desktop

### Backend (Node.js + Express)
- **Port**: 3001 (development)
- **Technology Stack**:
  - Node.js with Express framework
  - TypeScript for type safety
  - FFmpeg for video processing
  - Socket.io for real-time communication
  - Multer for file upload handling
- **Key Features**:
  - RESTful API for media operations
  - FFmpeg video processing pipeline
  - Job queue management with progress tracking
  - Real-time WebSocket updates
  - File storage management (uploads/outputs)

### Communication Flow
1. **File Upload**: Frontend → Backend (Multer) → File System
2. **Render Request**: Frontend → Backend → FFmpeg Processing
3. **Progress Updates**: Backend → Frontend (WebSocket)
4. **File Download**: Frontend ← Backend ← File System

### Video Processing Pipeline
1. **Input Processing**: Validate and prepare media files
2. **Composition**: Create timeline with accurate positioning
3. **Rendering**: FFmpeg processing with filter chains
4. **Progress Tracking**: Real-time status updates
5. **Output**: High-quality MP4 video files

## 📁 Project Structure

```
render-with-copilot/
├── .git/                          # Git repository
├── .gitignore                     # Git ignore rules
├── .vscode/                       # VS Code settings
├── package.json                   # Root package.json (monorepo)
├── docker-compose.yml             # Docker compose configuration
├── README.md                      # Main documentation
│
├── AI-avatar-frontend/            # Frontend applications
│   ├── .gitignore                 # Frontend git ignore
│   ├── docker-compose.yml         # Frontend docker config
│   └── react-video-editor-main/   # Main React video editor
│       ├── .env.example           # Environment variables example
│       ├── package.json           # Frontend dependencies
│       ├── vite.config.ts         # Vite configuration
│       ├── tsconfig.json          # TypeScript config
│       ├── tailwind.config.js     # Tailwind CSS config
│       ├── index.html             # HTML entry point
│       ├── public/                # Static assets
│       └── src/                   # Frontend source code
│           ├── app.tsx            # Main app component
│           ├── main.tsx           # Entry point
│           ├── index.css          # Global styles
│           ├── assets/            # Images, icons, etc.
│           ├── components/        # Reusable UI components
│           │   ├── ui/            # Base UI components
│           │   ├── shared/        # Shared components
│           │   └── color-picker/  # Color picker component
│           ├── features/          # Feature-based modules
│           │   └── editor/        # Video editor feature
│           │       ├── components/    # Editor components
│           │       ├── control-item/  # Control panels
│           │       ├── data/          # Static data
│           │       ├── hooks/         # React hooks
│           │       ├── menu-item/     # Menu components
│           │       ├── player/        # Video player
│           │       ├── scene/         # Canvas scene
│           │       ├── store/         # State management
│           │       ├── timeline/      # Timeline components
│           │       └── utils/         # Utility functions
│           ├── services/          # API services
│           │   ├── upload.ts      # File upload service
│           │   ├── video.ts       # Video processing service
│           │   └── tts.ts         # Text-to-speech service
│           ├── utils/             # Utility functions
│           └── lib/               # External libraries
│
├── video-render-backend/          # Backend Node.js service
│   ├── .env                       # Environment variables (local)
│   ├── .env.example               # Environment variables example
│   ├── package.json               # Backend dependencies
│   ├── tsconfig.json              # TypeScript config
│   ├── Dockerfile                 # Docker build file
│   ├── uploads/                   # Uploaded media files
│   │   ├── videos/                # Video uploads
│   │   ├── audio/                 # Audio uploads
│   │   ├── images/                # Image uploads
│   │   └── misc/                  # Other file types
│   ├── outputs/                   # Rendered video files
│   │   └── *.mp4                  # Generated videos
│   └── src/                       # Backend source code
│       ├── index.ts               # Main server entry point
│       ├── middleware/            # Express middleware
│       │   └── errorHandler.ts   # Error handling
│       ├── routes/                # API route handlers
│       │   ├── render.ts          # Video rendering endpoints
│       │   ├── upload.ts          # File upload endpoints
│       │   ├── status.ts          # Job status endpoints
│       │   └── stream.ts          # File streaming endpoints
│       ├── services/              # Business logic services
│       │   ├── renderService.ts   # Video rendering logic
│       │   ├── jobQueue.ts        # Job queue management
│       │   └── storage.ts         # File storage management
│       └── types/                 # TypeScript type definitions
│           └── index.ts           # Shared types
│
└── node_modules/                  # Dependencies (auto-generated)
```

## 🎯 Usage

### Basic Workflow
1. **Upload Media**: Add video, audio, and image files
2. **Arrange Timeline**: Drag elements to create your composition
3. **Position Elements**: Use the canvas to position and scale media
4. **Add Text**: Create text overlays with custom styling
5. **Preview**: Use real-time preview to check your work
6. **Export**: Render high-quality video with progress tracking

### Advanced Features

- **Multi-layer Composition**: Layer multiple videos and images
- **Timeline Editing**: Trim and arrange clips with frame precision
- **Custom Text**: Add titles and captions with full styling control

## 🔧 API Reference

### Base URL
- Development: `http://localhost:3001`
- Frontend Proxy: `/api` (proxied to backend)

### Upload Endpoints
```javascript
// Upload media files
POST /upload
Content-Type: multipart/form-data
Body: FormData with file(s)

Response: {
  "files": [
    {
      "id": "uuid",
      "originalName": "video.mp4",
      "filename": "stored-filename.mp4",
      "mimetype": "video/mp4",
      "size": 12345678,
      "url": "/uploads/videos/stored-filename.mp4"
    }
  ]
}

// Get uploaded files list
GET /upload/list
Response: {
  "files": [...] // Array of uploaded files
}

// Delete uploaded file
DELETE /upload/:fileId
Response: {
  "message": "File deleted successfully"
}
```

### Render Endpoints
```javascript
// Start video rendering
POST /render
Content-Type: application/json
Body: {
  "design": {
    "trackItems": [
      {
        "id": "uuid",
        "type": "video|image|text|audio",
        "src": "file-path-or-url",
        "startTime": 0,
        "duration": 5000,
        "position": { "x": 100, "y": 100 },
        "size": { "width": 640, "height": 480 },
        "properties": { /* type-specific props */ }
      }
    ],
    "canvasSize": { "width": 1920, "height": 1080 },
    "duration": 10000,
    "fps": 30
  },
  "options": {
    "format": "mp4",
    "quality": "high",
    "preset": "fast"
  }
}

Response: {
  "jobId": "render-job-uuid",
  "status": "QUEUED",
  "message": "Render job created successfully"
}
```

### Status Endpoints
```javascript
// Get render status
GET /status/:jobId
Response: {
  "jobId": "render-job-uuid",
  "status": "QUEUED|PROCESSING|COMPLETED|FAILED",
  "progress": 75, // 0-100
  "currentStep": "Processing video track 2/3",
  "outputUrl": "/outputs/final-video.mp4", // when completed
  "error": "Error message", // when failed
  "createdAt": "2024-01-01T00:00:00Z",
  "completedAt": "2024-01-01T00:05:30Z"
}

// Get all job statuses
GET /status
Response: {
  "jobs": [...] // Array of all jobs
}
```

### File Access Endpoints
```javascript
// Stream/download uploaded files
GET /uploads/:category/:filename
// Examples:
// /uploads/videos/video.mp4
// /uploads/images/image.jpg
// /uploads/audio/audio.mp3

// Stream/download rendered videos
GET /outputs/:filename
// Example: /outputs/rendered-video.mp4
```

### WebSocket Events
```javascript
// Connect to WebSocket
const socket = io('http://localhost:3001');

// Listen for render progress
socket.on('render-progress', (data) => {
  console.log(`Job ${data.jobId}: ${data.progress}%`);
  console.log(`Status: ${data.status}`);
  console.log(`Step: ${data.currentStep}`);
});

// Listen for render completion
socket.on('render-complete', (data) => {
  console.log(`Job ${data.jobId} completed!`);
  console.log(`Output: ${data.outputUrl}`);
});

// Listen for render errors
socket.on('render-error', (data) => {
  console.error(`Job ${data.jobId} failed: ${data.error}`);
});
```

## ⚠️ Known Issues & Troubleshooting

### Common Issues

#### Port Conflicts
- **Problem**: `EADDRINUSE: address already in use`
- **Solution**: Check if ports 3001 (backend) or 5173 (frontend) are in use
```bash
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Kill process if needed
taskkill /PID <process-id> /F
```

#### CORS Issues
- **Problem**: Cross-origin requests blocked
- **Solution**: Ensure ALLOWED_ORIGINS in backend .env includes frontend URL
- **Check**: Backend logs should show allowed origins on startup

#### File Upload Issues
- **Problem**: Upload fails or files not found
- **Solution**: Check upload directory permissions and paths
```bash
# Ensure upload directories exist
mkdir -p video-render-backend/uploads/videos
mkdir -p video-render-backend/uploads/images
mkdir -p video-render-backend/uploads/audio
mkdir -p video-render-backend/outputs
```

#### FFmpeg Issues
- **Problem**: Video rendering fails
- **Solution**: Ensure FFmpeg is installed and accessible
```bash
# Test FFmpeg installation
ffmpeg -version

# Windows: Add FFmpeg to PATH or install via chocolatey
choco install ffmpeg
```

### Image Position & Scale Accuracy
- **Issue**: Image positions and sizes may not match preview exactly in final render
- **Status**: Under active development
- **Workaround**: Test renders with small clips before final export
- **Technical Details**: 
  - Frontend uses DOM-based positioning (CSS pixels)
  - Backend uses FFmpeg coordinate system (video pixels)
  - Minor discrepancies in scaling calculations between preview and render
  - Working on unified positioning system with consistent coordinate mapping

### Performance Considerations
- **Large Files**: Videos over 100MB may require extended processing time
- **Concurrent Renders**: Limited by MAX_CONCURRENT_RENDERS setting
- **Memory Usage**: Monitor system memory during intensive rendering
- **Disk Space**: Outputs directory can grow large with multiple renders

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+ with npm
- FFmpeg installed system-wide
- Sufficient disk space for uploads/outputs
- Reverse proxy (nginx/Apache) for production
- SSL certificate for HTTPS

### Environment Setup
```bash
# Backend production .env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
UPLOAD_DIR=/app/uploads
OUTPUT_DIR=/app/outputs
MAX_CONCURRENT_RENDERS=4
RENDER_TIMEOUT=600000

# Frontend production .env
VITE_BACKEND_URL=https://api.your-domain.com
VITE_PUBLIC_RENDER_API_URL=https://api.your-domain.com/render
VITE_PUBLIC_STATUS_API_URL=https://api.your-domain.com/status
VITE_PUBLIC_UPLOAD_API_URL=https://api.your-domain.com/upload
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d --build

# Or use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

### Security Checklist
- [ ] Environment variables properly configured
- [ ] CORS origins restricted to production domains
- [ ] HTTPS enabled with valid SSL certificates
- [ ] File upload size limits configured
- [ ] Directory permissions properly set
- [ ] Sensitive files excluded from git (.env, uploads/, outputs/)

For detailed deployment instructions, see `PRODUCTION-DEPLOYMENT-CHECKLIST.md`

## 🛠️ Development

### Development Ports
- **Frontend (Vite)**: http://localhost:5173
- **Backend (Express)**: http://localhost:3001
- **WebSocket**: ws://localhost:3001
- **Proxy**: Frontend proxies `/api` requests to backend

### Running in Development Mode
```bash
# Method 1: Run separately
# Terminal 1: Backend
cd video-render-backend
npm install
npm run dev

# Terminal 2: Frontend  
cd AI-avatar-frontend/react-video-editor-main
npm install
npm run dev

# Method 2: Using root package.json (if available)
npm run dev  # Runs both frontend and backend concurrently
```

### Available Scripts

**Backend Scripts:**
- `npm run dev` - Development server with hot reload (tsx watch)
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Production server (requires build first)
- `npm run lint` - ESLint code checking
- `npm run lint:fix` - Auto-fix ESLint issues

**Frontend Scripts:**
- `npm run dev` - Vite development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - ESLint checking

### Development Features
- **Hot Module Replacement (HMR)**: Instant updates without page refresh
- **TypeScript**: Full type checking and IntelliSense
- **Auto-restart**: Backend restarts automatically on file changes
- **Proxy Setup**: Frontend automatically proxies API calls to backend
- **Error Overlay**: Detailed error messages in development

### Environment Variables
Create `.env` files in both frontend and backend directories:

**Backend (.env)**
```bash
# Server Configuration
NODE_ENV=development
PORT=3001

# CORS Origins
FRONTEND_URL=http://localhost:5173
DEV_URL_1=http://localhost:5173
DEV_URL_2=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# File Storage
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs

# Video Rendering Settings
MAX_CONCURRENT_RENDERS=2
RENDER_TIMEOUT=300000
REMOTION_CONCURRENCY=1
REMOTION_QUALITY=70
REMOTION_CRF=18

# Optional: Redis for job queue
REDIS_URL=redis://localhost:6379
```

**Frontend (.env)**
```bash
# Backend API URLs (using proxy)
VITE_BACKEND_URL=/api
VITE_PUBLIC_RENDER_API_URL=/api/render
VITE_PUBLIC_STATUS_API_URL=/api/status
VITE_PUBLIC_UPLOAD_API_URL=/api/upload

# For direct connection (development)
# VITE_BACKEND_URL=http://localhost:3001
# VITE_PUBLIC_RENDER_API_URL=http://localhost:3001/render
# VITE_PUBLIC_STATUS_API_URL=http://localhost:3001/status
# VITE_PUBLIC_UPLOAD_API_URL=http://localhost:3001/upload
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the [Known Issues](#️-known-issues) section
- Open an issue on GitHub
- Contact the development team

---

**Note**: This is an active development project. Some features may be experimental or under refinement.
