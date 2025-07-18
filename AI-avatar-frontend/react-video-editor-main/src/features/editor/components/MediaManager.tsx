import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Library, 
  Video,
  X
} from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import FileUpload from './FileUpload';
import { UploadedFile } from '@/services/upload';
import { useMediaImport } from '../hooks/useMediaImport';
import { cn } from '@/lib/utils';

interface MediaManagerProps {
  className?: string;
}

export const MediaManager: React.FC<MediaManagerProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('library');
  const { addMediaToTimeline } = useMediaImport();

  const handleMediaSelect = (file: UploadedFile) => {
    addMediaToTimeline(file);
    setIsOpen(false);
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    files.forEach(file => addMediaToTimeline(file));
    setActiveTab('library'); // Switch to library after upload
  };

  if (!isOpen) {
    // Removed Media Library and Export Video buttons
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Media Manager Modal */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Media Manager</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="library" className="flex items-center gap-2">
                  <Library className="h-4 w-4" />
                  Library
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="library" className="mt-4">
                <MediaLibrary 
                  onMediaSelect={handleMediaSelect}
                />
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <FileUpload 
                  onFilesUploaded={handleFilesUploaded}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick access toolbar component
export const MediaToolbar: React.FC<{ className?: string }> = ({ className }) => {
  const { addMediaToTimeline } = useMediaImport();

  const handleQuickUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,audio/*,image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      // Convert FileList to UploadedFile format (simplified for demo)
      Array.from(files).forEach(file => {
        const mockUploadedFile: UploadedFile = {
          id: `temp_${Date.now()}_${Math.random()}`,
          filename: file.name,
          size: file.size,
          mimetype: file.type,
          url: URL.createObjectURL(file), // Temporary URL
          type: file.type.split('/')[0] as 'video' | 'audio' | 'image'
        };
        
        addMediaToTimeline(mockUploadedFile);
      });
    };
    
    input.click();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        onClick={handleQuickUpload}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        Quick Upload
      </Button>
      
    </div>
  );
};

export default MediaManager;
