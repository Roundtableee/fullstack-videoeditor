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
- Frontend: http://localhost:5173
- Backend API: http://localhost:3002

## 🏗️ Architecture

### Frontend (React + Vite)
- **Technology**: React 18, TypeScript, Tailwind CSS
- **Features**: 
  - Drag-and-drop timeline interface
  - Real-time preview canvas
  - Media upload and management
  - Progress tracking UI

### Backend (Node.js + Express)
- **Technology**: Node.js, Express, TypeScript
- **Features**:
  - FFmpeg video processing
  - Job queue management
  - Real-time progress updates
  - Media file handling

### Video Processing Pipeline
1. **Input Processing**: Validate and prepare media files
2. **Composition**: Create timeline with accurate positioning
3. **Rendering**: FFmpeg processing with filter chains
4. **Progress Tracking**: Real-time status updates
5. **Output**: High-quality MP4 video files

## 📁 Project Structure

```
render-with-copilot/
├── AI-avatar-frontend/
│   └── react-video-editor-main/    # React frontend
│       ├── src/
│       │   ├── components/         # UI components
│       │   ├── features/          # Feature modules
│       │   └── services/          # API services
│       └── vite.config.ts
├── video-render-backend/           # Node.js backend
│   ├── src/
│   │   ├── services/              # Core services
│   │   ├── routes/                # API routes
│   │   └── types/                 # TypeScript types
│   ├── outputs/                   # Rendered videos
│   └── uploads/                   # Uploaded media
└── README.md
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
- **Precise Positioning**: Use pixel coordinates for exact placement
- **Multi-layer Composition**: Layer multiple videos and images
- **Timeline Editing**: Trim and arrange clips with frame precision
- **Custom Text**: Add titles and captions with full styling control

## 🔧 API Reference

### Render Endpoint
```javascript
POST /api/render
{
  "design": {
    "trackItems": [...],  // Timeline items
    "transitions": [...]  // Transition effects
  },
  "options": {
    "fps": 30,
    "size": { "width": 1920, "height": 1080 },
    "format": "mp4",
    "quality": "high"
  }
}
```

### Status Endpoint
```javascript
GET /api/status/:renderId
{
  "status": "PROCESSING",
  "progress": 75,
  "url": "/outputs/video.mp4"
}
```

## ⚠️ Known Issues

### Image Position & Scale Accuracy
- **Issue**: Image positions and sizes may not match preview exactly in final render
- **Status**: Currently under investigation
- **Workaround**: Test renders with small clips before final export
- **Details**: 
  - Frontend uses DOM-based positioning
  - Backend uses FFmpeg coordinate system
  - Minor discrepancies in scaling calculations
  - Working on unified positioning system

### Other Limitations
- Large video files may take extended processing time
- Some video codecs may require transcoding
- Text rendering may vary slightly between preview and output

## 🛠️ Development

### Running in Development Mode
```bash
# Terminal 1: Backend
cd video-render-backend
npm run dev

# Terminal 2: Frontend  
cd AI-avatar-frontend/react-video-editor-main
npm run dev
```

### Available Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run test` - Run tests
- `npm run lint` - Code linting

### Environment Variables
Create `.env` files in both frontend and backend directories:

**Backend (.env)**
```
PORT=3002
OUTPUT_DIR=./outputs
UPLOAD_DIR=./uploads
```

**Frontend (.env)**
```
VITE_BACKEND_URL=http://localhost:3002
VITE_PUBLIC_RENDER_API_URL=http://localhost:3002/render
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
