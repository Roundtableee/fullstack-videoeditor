// File: react-video-editor-main/src/features/editor/menu-item/videos-new.tsx

import React, { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Draggable from "@/components/shared/draggable";
import { VIDEOS as STATIC_VIDEOS } from "../data/video";
import { dispatch } from "@designcombo/events";
import { ADD_VIDEO } from "@designcombo/state";
import { IVideo, IVideoDetails } from "@designcombo/types";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import { fileUploadService, UploadedFile } from "@/services/upload";
import MediaCard from "../components/MediaCard";
import FileUpload from "../components/FileUpload";
import { 
  Video, 
  Search, 
  Plus, 
  Upload,
  Play,
  Clock,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Videos: React.FC = () => {
  const isDragging = useIsDraggingOverTimeline();
  const [library, setLibrary] = useState<Partial<IVideo>[]>([...STATIC_VIDEOS]);
  const [uploadedVideos, setUploadedVideos] = useState<UploadedFile[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUploadedVideos();
  }, []);

  const loadUploadedVideos = async () => {
    try {
      setLoading(true);
      const files = await fileUploadService.getUploadedFiles();
      const videoFiles = files.filter(file => file.type === 'video');
      setUploadedVideos(videoFiles);
    } catch (error) {
      console.error('Failed to load uploaded videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    const videoFiles = files.filter(file => file.type === 'video');
    setUploadedVideos(prev => [...videoFiles, ...prev]);
    setShowUpload(false);
  };

  const addToTimeline = (item: IVideo) => {
    console.log("Adding to timeline:", item);
    dispatch(ADD_VIDEO, {
      payload: item,
      options: { resourceId: "main", scaleMode: "fit" },
    });
  };

  const handleVideoSelect = (file: UploadedFile) => {
    const videoItem: IVideo = {
      id: file.id,
      type: "video",
      name: file.filename,
      preview: file.url,
      duration: 5000, // Default duration
      display: {
        from: 0,
        to: 5000
      },
      details: {
        src: file.url,
        width: 1920,
        height: 1080
      } as IVideoDetails,
      metadata: {
        filename: file.filename
      }
    };
    addToTimeline(videoItem);
  };

  const handleStaticVideoSelect = (item: Partial<IVideo>) => {
    if (item.id && item.name && item.preview && item.details?.src) {
      const videoItem: IVideo = {
        ...item,
        type: "video",
        display: item.display || {
          from: 0,
          to: item.duration || 5000
        }
      } as IVideo;
      addToTimeline(videoItem);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      await fileUploadService.deleteFile(videoId);
      setUploadedVideos(prev => prev.filter(video => video.id !== videoId));
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  // Filter videos based on search
  const filteredStaticVideos = library.filter(video => 
    video.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
  );
  
  const filteredUploadedVideos = uploadedVideos.filter(video =>
    video.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalVideos = filteredStaticVideos.length + filteredUploadedVideos.length;

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Video className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Video Library</h2>
            <p className="text-sm text-gray-500">{totalVideos} videos available</p>
          </div>
        </div>
        
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Video
        </Button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="p-4 bg-white border-b border-gray-200">
          <FileUpload onFilesUploaded={handleFilesUploaded} />
        </div>
      )}

      {/* Search */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-6">
          {/* Uploaded Videos Section */}
          {(filteredUploadedVideos.length > 0 || !searchTerm) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-gray-900">Your Videos</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredUploadedVideos.length}
                </Badge>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredUploadedVideos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredUploadedVideos.map((video) => (
                    <Draggable
                      key={video.id}
                      data={() => ({
                        type: "video",
                        id: video.id,
                        name: video.filename,
                        preview: video.url,
                        duration: 5000,
                        display: { from: 0, to: 5000 },
                        details: {
                          src: video.url,
                          width: 1920,
                          height: 1080
                        },
                        metadata: {
                          filename: video.filename
                        }
                      })}
                      className={cn(
                        "cursor-grab active:cursor-grabbing",
                        isDragging && "opacity-50"
                      )}
                    >
                      <MediaCard
                        id={video.id}
                        type="video"
                        title={video.filename}
                        url={video.url}
                        size={video.size}
                        onSelect={() => handleVideoSelect(video)}
                        onDelete={() => handleDeleteVideo(video.id)}
                      />
                    </Draggable>
                  ))}
                </div>
              ) : !searchTerm ? (
                <div className="text-center py-8">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No uploaded videos yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowUpload(true)}
                  >
                    Upload Your First Video
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {/* Static Videos Section */}
          {(filteredStaticVideos.length > 0 || !searchTerm) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-gray-900">Stock Videos</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredStaticVideos.length}
                </Badge>
              </div>
              
              {filteredStaticVideos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredStaticVideos.map((video, index) => (
                    <Draggable
                      key={video.id || index}
                      data={() => ({
                        ...video,
                        type: "video",
                        display: video.display || {
                          from: 0,
                          to: video.duration || 5000
                        }
                      })}
                      className={cn(
                        "cursor-grab active:cursor-grabbing",
                        isDragging && "opacity-50"
                      )}
                    >
                      <div
                        onClick={() => handleStaticVideoSelect(video)}
                        className="group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden hover:border-gray-300 hover:-translate-y-1"
                      >
                        <div className="aspect-video bg-gray-100 overflow-hidden rounded-t-xl">
                          <img 
                            src={video.preview} 
                            alt={video.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white/90 rounded-full p-2">
                              <Play className="h-6 w-6 text-gray-800" />
                            </div>
                          </div>

                          <div className="absolute top-2 left-2 bg-blue-100 text-blue-700 border border-blue-200 text-xs px-2 py-1 rounded-md flex items-center gap-1 font-medium">
                            <Video className="h-3 w-3" />
                            VIDEO
                          </div>

                          {video.duration && (
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.floor((video.duration || 0) / 1000)}s
                            </div>
                          )}
                        </div>

                        <div className="p-3">
                          <h3 className="font-medium text-sm text-gray-900 truncate" title={video.name}>
                            {video.name}
                          </h3>
                        </div>
                      </div>
                    </Draggable>
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="text-center py-8">
                  <Filter className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No stock videos match your search</p>
                </div>
              ) : null}
            </div>
          )}

          {/* No results state */}
          {totalVideos === 0 && searchTerm && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
              <p className="text-gray-500 mb-4">
                No videos match your search term "{searchTerm}".
              </p>
              <Button 
                variant="outline"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
