interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  url: string;
  type: 'video' | 'audio' | 'image';
}

interface UploadResponse {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  url: string;
  path: string;
  type: string;
}

const UPLOAD_API_URL = 
  import.meta.env.VITE_PUBLIC_UPLOAD_API_URL ||
  (import.meta.env.VITE_BACKEND_URL || "http://localhost:3001") + "/upload";

export class FileUploadService {
  private static instance: FileUploadService;
  
  private constructor() {}
  
  static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  /**
   * Upload a single file
   */
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadedFile> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response: UploadResponse = JSON.parse(xhr.responseText);
            resolve({
              id: response.id,
              filename: response.filename,
              size: response.size,
              mimetype: response.mimetype,
              url: response.url,
              type: response.type as 'video' | 'audio' | 'image'
            });
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.error || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', `${UPLOAD_API_URL}/single`);
      xhr.send(formData);
    });
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<UploadedFile[]> {
    const uploads = files.map((file, index) => 
      this.uploadFile(file, onProgress ? (progress) => onProgress(index, progress) : undefined)
    );
    
    return Promise.all(uploads);
  }

  /**
   * Get file info by ID
   */
  async getFileInfo(fileId: string): Promise<UploadedFile> {
    const response = await fetch(`${UPLOAD_API_URL}/${fileId}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get file info');
    }
    
    return response.json();
  }

  /**
   * Delete file by ID
   */
  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${UPLOAD_API_URL}/${fileId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete file');
    }
  }

  /**
   * Check if file type is supported
   */
  isSupportedFileType(file: File): boolean {
    const supportedTypes = [
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ];
    
    return supportedTypes.includes(file.type);
  }

  /**
   * Get file type category
   */
  getFileTypeCategory(file: File): 'video' | 'audio' | 'image' | 'unknown' {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    return 'unknown';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get list of all uploaded files
   */
  async getUploadedFiles(): Promise<UploadedFile[]> {
    try {
      const response = await fetch(`${UPLOAD_API_URL}/list`);
      
      if (!response.ok) {
        // If endpoint doesn't exist, return empty array
        if (response.status === 404) {
          return [];
        }
        throw new Error('Failed to get uploaded files');
      }
      
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.warn('Failed to get uploaded files:', error);
      return [];
    }
  }
}

export const fileUploadService = FileUploadService.getInstance();

export type { UploadedFile, UploadResponse };
