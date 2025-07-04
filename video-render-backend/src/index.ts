import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import renderRoutes from './routes/render';
import statusRoutes from './routes/status';
import uploadRoutes from './routes/upload';
import streamRoutes from './routes/stream';
import { initializeJobQueue } from './services/jobQueue';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000', 
      'http://localhost:5173', 
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://0.0.0.0:5173'
    ],
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS']
  }
});

const PORT = process.env.PORT || 3001;

// Ensure directories exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const outputDir = process.env.OUTPUT_DIR || './outputs';

[uploadDir, outputDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
  frameguard: false,  // Disable X-Frame-Options header
  crossOriginResourcePolicy: false  // Disable Cross-Origin-Resource-Policy from Helmet
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow any origin
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000', 
      'http://localhost:5173', 
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://0.0.0.0:5173'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept-Ranges', 'Content-Range'],
  exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving with custom CORS handling
const uploadDirPath = path.resolve(uploadDir);
const outputDirPath = path.resolve(outputDir);

// Static file serving for rendered videos with CORS
app.use('/outputs', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Range, Content-Length, Content-Type');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
  res.header('Accept-Ranges', 'bytes');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.resolve(outputDir)));

// Routes
app.use('/render', renderRoutes);
app.use('/status', statusRoutes);
app.use('/upload', uploadRoutes);
app.use('/uploads', streamRoutes);

// Health check
app.get('/health', (req: any, res: any) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('subscribe', (renderId: string) => {
    socket.join(`render_${renderId}`);
    console.log(`Client ${socket.id} subscribed to render ${renderId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to other modules
app.set('io', io);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: any, res: any) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize job queue
initializeJobQueue().catch(console.error);

// Start server
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Video render backend server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`📁 Output directory: ${outputDir}`);
  console.log(`🌐 CORS origins: ${process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173'}`);
  console.log(`🌐 Server accessible at: http://localhost:${PORT} and http://0.0.0.0:${PORT}`);
});

export { io };
