import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Video, 
  Music, 
  Image as ImageIcon, 
  Plus,
  Filter,
  Grid3X3,
  List,
  Upload,
  FolderOpen,
  Download,
  Trash2
} from 'lucide-react';
import { UploadedFile, fileUploadService } from '@/services/upload';
import FileUpload from './FileUpload';
import MediaCard from './MediaCard';
import { cn } from '@/lib/utils';

interface MediaLibraryProps {
  onMediaSelect: (file: UploadedFile) => void;
  className?: string;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onMediaSelect,
  className
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<UploadedFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'video' | 'audio' | 'image'>('all');
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Filter files based on search term and type
  useEffect(() => {
    let filtered = files;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(file => file.type === selectedType);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFiles(filtered);
  }, [files, searchTerm, selectedType]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const uploadedFiles = await fileUploadService.getUploadedFiles();
      setFiles(uploadedFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUploaded = (uploadedFiles: UploadedFile[]) => {
    setFiles(prev => [...uploadedFiles, ...prev]);
    setShowUpload(false);
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await fileUploadService.deleteFile(fileId);
      setFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const getTypeStats = () => {
    const stats = {
      all: files.length,
      video: files.filter(f => f.type === 'video').length,
      audio: files.filter(f => f.type === 'audio').length,
      image: files.filter(f => f.type === 'image').length,
    };
    return stats;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const getFilePreview = (file: UploadedFile) => {
    if (file.type === 'image') {
      return (
        <img 
          src={file.url} 
          alt={file.filename}
          className="w-full h-32 object-cover rounded"
        />
      );
    } else if (file.type === 'video') {
      return (
        <video 
          src={file.url}
          className="w-full h-32 object-cover rounded"
          muted
          onMouseEnter={(e) => {
            const video = e.target as HTMLVideoElement;
            video.currentTime = 1; // Show frame at 1 second
          }}
        />
      );
    } else {
      return (
        <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
          {getFileIcon(file.type)}
          <span className="ml-2 text-sm text-muted-foreground">
            {file.type.toUpperCase()}
          </span>
        </div>
      );
    }
  };

  const stats = getTypeStats();

  return (
    <div className={cn("h-full flex flex-col bg-gray-50/50", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <FolderOpen className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Media Library</h2>
            <p className="text-sm text-gray-500">{stats.all} files total</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
          
          <Button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Media
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="p-4 bg-white border-b border-gray-200">
          <FileUpload onFilesUploaded={handleFilesUploaded} />
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white border-b border-gray-200">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search your media files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        {/* Type filters */}
        <div className="flex gap-1">
          {([
            { key: 'all' as const, label: 'All', icon: Filter, count: stats.all },
            { key: 'video' as const, label: 'Videos', icon: Video, count: stats.video },
            { key: 'audio' as const, label: 'Audio', icon: Music, count: stats.audio },
            { key: 'image' as const, label: 'Images', icon: ImageIcon, count: stats.image },
          ]).map(({ key, label, icon: Icon, count }) => (
            <Button
              key={key}
              variant={selectedType === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(key)}
              className={cn(
                "flex items-center gap-2",
                selectedType === key 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "border-gray-300 hover:bg-gray-50"
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
              <Badge 
                variant="secondary" 
                className={cn(
                  "ml-1 text-xs",
                  selectedType === key 
                    ? "bg-blue-700/20 text-blue-100" 
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500">Loading media files...</p>
            </div>
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="p-4">
            <div className={cn(
              "gap-4",
              viewMode === 'grid' 
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" 
                : "flex flex-col space-y-2"
            )}>
              {filteredFiles.map((file) => (
                <MediaCard
                  key={file.id}
                  id={file.id}
                  type={file.type as 'video' | 'audio' | 'image'}
                  title={file.filename}
                  url={file.url}
                  size={file.size}
                  onSelect={() => onMediaSelect(file)}
                  onDelete={() => handleDeleteFile(file.id)}
                  className={viewMode === 'list' ? "flex-row" : ""}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4 max-w-md">
              <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {searchTerm || selectedType !== 'all' 
                    ? 'No matching files found' 
                    : 'No media files yet'
                  }
                </h3>
                <p className="text-gray-500">
                  {searchTerm || selectedType !== 'all'
                    ? 'Try adjusting your search or filter settings.'
                    : 'Upload your first video, audio, or image file to get started.'
                  }
                </p>
              </div>
              
              {!searchTerm && selectedType === 'all' && (
                <Button 
                  onClick={() => setShowUpload(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Media Files
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaLibrary;
