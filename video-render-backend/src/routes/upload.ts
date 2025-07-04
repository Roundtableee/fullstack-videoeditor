import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    // Create subdirectories based on file type
    let subDir = 'misc';
    if (file.mimetype.startsWith('video/')) {
      subDir = 'videos';
    } else if (file.mimetype.startsWith('audio/')) {
      subDir = 'audio';
    } else if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    }
    
    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow video, audio, and image files
    const allowedMimes = [
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  }
});

// Upload single file
router.post('/single', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    // แก้ไขการสร้าง URL - ใช้ path relative จาก uploads directory
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
    const relativePath = path.relative(uploadDir, req.file.path);
    const fileUrl = `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;

    // Debug logging
    console.log('Upload Debug:');
    console.log('- Upload Dir:', uploadDir);
    console.log('- File Path:', req.file.path);
    console.log('- Relative Path:', relativePath);
    console.log('- Final URL:', fileUrl);

    const response = {
      id: path.parse(req.file.filename).name,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: fileUrl,
      path: req.file.path,
      type: req.file.mimetype.split('/')[0] // video, audio, image
    };

    res.json(response);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    });
  }
});

// Upload multiple files
router.post('/multiple', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
    const response = req.files.map(file => {
      const relativePath = path.relative(uploadDir, file.path);
      const fileUrl = `${baseUrl}/uploads/${relativePath.replace(/\\/g, '/')}`;
      
      return {
        id: path.parse(file.filename).name,
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: fileUrl,
        path: file.path,
        type: file.mimetype.split('/')[0]
      };
    });

    res.json(response);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    });
  }
});

// Get file info by ID
router.get('/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    
    // Search for file in subdirectories
    const subDirs = ['videos', 'audio', 'images', 'misc'];
    let foundFile = null;
    
    for (const subDir of subDirs) {
      const dirPath = path.join(uploadDir, subDir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        const file = files.find(f => path.parse(f).name === fileId);
        if (file) {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          const relativePath = filePath.replace(uploadDir, '');
          
          foundFile = {
            id: fileId,
            filename: file,
            size: stats.size,
            url: `${baseUrl}/uploads${relativePath.replace(/\\/g, '/')}`,
            path: filePath,
            createdAt: stats.birthtime,
            updatedAt: stats.mtime
          };
          break;
        }
      }
    }
    
    if (!foundFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(foundFile);
    
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get file info' 
    });
  }
});

// Delete file
router.delete('/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    
    // Search for file in subdirectories
    const subDirs = ['videos', 'audio', 'images', 'misc'];
    let deleted = false;
    
    for (const subDir of subDirs) {
      const dirPath = path.join(uploadDir, subDir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        const file = files.find(f => path.parse(f).name === fileId);
        if (file) {
          const filePath = path.join(dirPath, file);
          fs.unlinkSync(filePath);
          deleted = true;
          break;
        }
      }
    }
    
    if (!deleted) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({ message: 'File deleted successfully' });
    
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to delete file' 
    });
  }
});

// List all uploaded files
router.get('/list', async (req: Request, res: Response) => {
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const files: any[] = [];
    
    // Search for files in subdirectories
    const subDirs = ['videos', 'audio', 'images', 'misc'];
    
    for (const subDir of subDirs) {
      const dirPath = path.join(uploadDir, subDir);
      if (fs.existsSync(dirPath)) {
        const dirFiles = fs.readdirSync(dirPath);
        
        for (const fileName of dirFiles) {
          const filePath = path.join(dirPath, fileName);
          const stats = fs.statSync(filePath);
          
          if (stats.isFile()) {
            const ext = path.extname(fileName).toLowerCase();
            const fileId = path.parse(fileName).name;
            
            // Determine file type
            let type = 'misc';
            let mimetype = 'application/octet-stream';
            
            if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) {
              type = 'video';
              mimetype = `video/${ext.slice(1)}`;
            } else if (['.mp3', '.wav', '.ogg'].includes(ext)) {
              type = 'audio';
              mimetype = `audio/${ext.slice(1)}`;
            } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
              type = 'image';
              mimetype = `image/${ext.slice(1)}`;
            }
            
            files.push({
              id: fileId,
              filename: fileName,
              size: stats.size,
              mimetype,
              url: `/uploads/${subDir}/${fileName}`,
              type,
              uploadedAt: stats.birthtime
            });
          }
        }
      }
    }
    
    // Sort by upload date (newest first)
    files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
    res.json({ files });
    
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to list files' 
    });
  }
});

export default router;
