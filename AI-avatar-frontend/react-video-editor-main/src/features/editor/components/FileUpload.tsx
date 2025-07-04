import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  File, 
  Video, 
  Music, 
  Image as ImageIcon, 
  X, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { fileUploadService, UploadedFile } from '@/services/upload';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  className?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  uploadedFile?: UploadedFile;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  acceptedTypes = ['video/*', 'audio/*', 'image/*'],
  maxFiles = 10,
  maxSize = 500 * 1024 * 1024, // 500MB
  className
}) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Filter out unsupported files
    const supportedFiles = acceptedFiles.filter(file => {
      if (!fileUploadService.isSupportedFileType(file)) {
        console.warn(`Unsupported file type: ${file.type}`);
        return false;
      }
      if (file.size > maxSize) {
        console.warn(`File too large: ${file.name} (${fileUploadService.formatFileSize(file.size)})`);
        return false;
      }
      return true;
    });

    if (supportedFiles.length === 0) {
      return;
    }

    // Initialize upload progress tracking
    const initialUploads: UploadProgress[] = supportedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploads(prev => [...prev, ...initialUploads]);

    // Upload files concurrently
    const uploadPromises = supportedFiles.map(async (file, index) => {
      try {
        const uploadedFile = await fileUploadService.uploadFile(file, (progress) => {
          setUploads(prev => prev.map((upload, i) => {
            if (i === prev.length - supportedFiles.length + index) {
              return { ...upload, progress };
            }
            return upload;
          }));
        });

        // Mark as completed
        setUploads(prev => prev.map((upload, i) => {
          if (i === prev.length - supportedFiles.length + index) {
            return { 
              ...upload, 
              progress: 100, 
              status: 'completed',
              uploadedFile 
            };
          }
          return upload;
        }));

        return uploadedFile;

      } catch (error) {
        // Mark as error
        setUploads(prev => prev.map((upload, i) => {
          if (i === prev.length - supportedFiles.length + index) {
            return { 
              ...upload, 
              status: 'error',
              error: error instanceof Error ? error.message : 'Upload failed'
            };
          }
          return upload;
        }));
        return null;
      }
    });

    // Wait for all uploads to complete
    const results = await Promise.allSettled(uploadPromises);
    const successfulUploads = results
      .filter((result): result is PromiseFulfilledResult<UploadedFile> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

    if (successfulUploads.length > 0) {
      onFilesUploaded(successfulUploads);
    }

  }, [maxSize, onFilesUploaded]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    maxSize,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  });

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(upload => upload.status === 'uploading'));
  };

  const getFileIcon = (file: File) => {
    const type = fileUploadService.getFileTypeCategory(file);
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div className={cn(
        "border-2 border-dashed transition-colors cursor-pointer rounded-lg bg-card text-card-foreground shadow-sm",
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
      )}>
        <div className="flex flex-col items-center justify-center p-6" {...getRootProps()}>
          <input {...getInputProps()} />
          <Upload className={cn(
            "h-10 w-10 mb-2 transition-colors",
            isDragActive ? "text-primary" : "text-muted-foreground"
          )} />
          <p className="text-sm text-center text-muted-foreground mb-2">
            {isDragActive 
              ? "Drop files here..."
              : "Drag & drop files here, or click to select"
            }
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Supports: Video, Audio, Images (Max {maxFiles} files, {fileUploadService.formatFileSize(maxSize)} each)
          </p>
          <Button variant="outline" size="sm" className="mt-3">
            Browse Files
          </Button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Uploading Files</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompleted}
                  disabled={!uploads.some(u => u.status === 'completed')}
                >
                  Clear Completed
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {uploads.map((upload, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFileIcon(upload.file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {upload.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fileUploadService.formatFileSize(upload.file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    {upload.status === 'uploading' && (
                      <Progress value={upload.progress} className="flex-1" />
                    )}
                    {upload.status === 'completed' && (
                      <p className="text-sm text-green-600">Completed</p>
                    )}
                    {upload.status === 'error' && (
                      <p className="text-sm text-red-600 truncate" title={upload.error}>
                        {upload.error}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(upload.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUpload(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
