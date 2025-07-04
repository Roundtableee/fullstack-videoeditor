import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Music, 
  Image as ImageIcon, 
  Play,
  Pause,
  Download,
  Trash2,
  Clock,
  FileText,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaCardProps {
  id: string;
  type: 'video' | 'audio' | 'image';
  title: string;
  url: string;
  preview?: string;
  duration?: number;
  size?: number;
  author?: string;
  onSelect: () => void;
  onDelete?: () => void;
  onPreview?: () => void;
  className?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  id,
  type,
  title,
  url,
  preview,
  duration,
  size,
  author,
  onSelect,
  onDelete,
  onPreview,
  className
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formatDuration = (ms?: number) => {
    if (!ms) return null;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'video':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'audio':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'image':
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const renderPreview = () => {
    if (type === 'image') {
      return (
        <img 
          src={preview || url} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      );
    } 
    
    if (type === 'video') {
      return (
        <div className="relative w-full h-full">
          <video 
            src={url}
            className="w-full h-full object-cover"
            muted
            onMouseEnter={(e) => {
              const video = e.target as HTMLVideoElement;
              if (!isPlaying) {
                video.currentTime = 1;
              }
            }}
            onLoadedMetadata={(e) => {
              const video = e.target as HTMLVideoElement;
              video.currentTime = Math.min(video.duration * 0.2, 2);
            }}
          />
          
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 rounded-full p-2">
              <Play className="h-6 w-6 text-gray-800" />
            </div>
          </div>
        </div>
      );
    }
    
    if (type === 'audio') {
      return (
        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
          <div className="text-center text-white">
            <Music className="h-8 w-8 mx-auto mb-2" />
            <div className="text-xs font-medium">Audio File</div>
          </div>
        </div>
      );
    }
  };

  return (
    <div 
      className={cn(
        "group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden",
        "hover:border-gray-300 hover:-translate-y-1",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Preview area */}
      <div className="aspect-video bg-gray-100 overflow-hidden rounded-t-xl">
        {renderPreview()}
        
        {/* Duration badge for video/audio */}
        {duration && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(duration)}
          </div>
        )}

        {/* Type badge */}
        <div className={cn(
          "absolute top-2 left-2 border text-xs px-2 py-1 rounded-md flex items-center gap-1 font-medium",
          getTypeColor()
        )}>
          {getTypeIcon()}
          {type.toUpperCase()}
        </div>
      </div>

      {/* Content area */}
      <div className="p-3">
        <div className="space-y-2">
          {/* Title */}
          <h3 className="font-medium text-sm text-gray-900 truncate" title={title}>
            {title}
          </h3>
          
          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              {author && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {author}
                </span>
              )}
              {size && (
                <span>{formatFileSize(size)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons - visible on hover */}
        <div className={cn(
          "flex justify-between items-center mt-3 transition-opacity duration-200",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onPreview?.();
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                window.open(url, '_blank');
              }}
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
          </div>

          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
