// File: react-video-editor-main/src/features/editor/menu-item/audios-enhanced.tsx

import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Draggable from "@/components/shared/draggable";
import { dispatch } from "@designcombo/events";
import { ADD_ITEMS } from "@designcombo/state";
import { IAudio, IAudioDetails } from "@designcombo/types";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import { generateId } from "@designcombo/timeline";
import { Music, Upload, Plus, Play, Pause, Search, Filter, Volume2 } from "lucide-react";
import { getAudioList } from "../data/audio";
import { fileUploadService, UploadedFile } from "@/services/upload";
import FileUpload from "../components/FileUpload";
import MediaCard from "../components/MediaCard";
import { cn } from "@/lib/utils";

interface AudioItemData {
  id: string;
  type: "audio";
  name: string;
  details: IAudioDetails;
  preview: string;
  duration: number;
  metadata?: { author?: string };
}

export const AudiosEnhanced: React.FC = () => {
  const isDragging = useIsDraggingOverTimeline();
  const [items, setItems] = useState<AudioItemData[]>([]);
  const [uploadedAudios, setUploadedAudios] = useState<UploadedFile[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Load static audio items
    const staticItems = getAudioList().map(a => ({
      id: a.id || generateId(),
      type: "audio" as const,
      name: a.name || "",
      details: { src: a.details?.src || "" },
      preview: a.details?.src || "",
      duration: a.duration ?? 5000,
      metadata: a.metadata || {}
    }));
    setItems(staticItems);
    
    // Load uploaded audio files
    loadUploadedAudios();
  }, []);

  const loadUploadedAudios = async () => {
    try {
      setLoading(true);
      const files = await fileUploadService.getUploadedFiles();
      const audioFiles = files.filter(file => file.type === 'audio');
      setUploadedAudios(audioFiles);
    } catch (error) {
      console.error('Failed to load uploaded audios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    const audioFiles = files.filter(file => file.type === 'audio');
    setUploadedAudios(prev => [...audioFiles, ...prev]);
    setShowUpload(false);
  };

  const addToTimeline = (audioData: any) => {
    const audioItem: IAudio = {
      id: audioData.id,
      type: "audio",
      name: audioData.name || audioData.filename,
      duration: audioData.duration || 5000,
      display: {
        from: 0,
        to: audioData.duration || 5000
      },
      details: {
        src: audioData.src || audioData.url
      },
      metadata: audioData.metadata || {}
    };

    console.log("Adding audio to timeline:", audioItem);
    dispatch(ADD_ITEMS, { 
      payload: [audioItem], 
      options: { resourceId: "main" } 
    });
  };

  const handleUploadedAudioSelect = (file: UploadedFile) => {
    addToTimeline({
      id: file.id,
      filename: file.filename,
      url: file.url,
      duration: 5000, // Default duration
      metadata: { filename: file.filename }
    });
  };

  const handleStaticAudioSelect = (item: AudioItemData) => {
    addToTimeline({
      id: item.id,
      name: item.name,
      src: item.details.src,
      duration: item.duration,
      metadata: item.metadata
    });
  };

  const handleDeleteAudio = async (audioId: string) => {
    try {
      await fileUploadService.deleteFile(audioId);
      setUploadedAudios(prev => prev.filter(audio => audio.id !== audioId));
    } catch (error) {
      console.error('Failed to delete audio:', error);
    }
  };

  const handlePlayAudio = (audioUrl: string, audioId: string) => {
    if (playingAudio === audioId) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudio(null);
    } else {
      // Start playing
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingAudio(audioId);
      }
    }
  };

  // Filter audios based on search
  const filteredStaticAudios = items.filter(audio => 
    audio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    audio.metadata?.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredUploadedAudios = uploadedAudios.filter(audio =>
    audio.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAudios = filteredStaticAudios.length + filteredUploadedAudios.length;

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Hidden audio element for preview */}
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingAudio(null)}
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <Music className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Audio Library</h2>
            <p className="text-sm text-gray-500">{totalAudios} audio files available</p>
          </div>
        </div>
        
        <Button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Audio
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
            placeholder="Search audio files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-6">
          {/* Uploaded Audio Section */}
          {(filteredUploadedAudios.length > 0 || !searchTerm) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-gray-900">Your Audio Files</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredUploadedAudios.length}
                </Badge>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                </div>
              ) : filteredUploadedAudios.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredUploadedAudios.map((audio) => (
                    <Draggable
                      key={audio.id}
                      data={() => ({
                        type: "audio",
                        id: audio.id,
                        name: audio.filename,
                        duration: 5000,
                        display: { from: 0, to: 5000 },
                        details: { src: audio.url },
                        metadata: { filename: audio.filename }
                      })}
                    >
                      <div className="relative">
                        <MediaCard
                          id={audio.id}
                          type="audio"
                          title={audio.filename}
                          url={audio.url}
                          size={audio.size}
                          onSelect={() => handleUploadedAudioSelect(audio)}
                          onDelete={() => handleDeleteAudio(audio.id)}
                          onPreview={() => handlePlayAudio(audio.url, audio.id)}
                        />
                        
                        {/* Play button overlay */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAudio(audio.url, audio.id);
                          }}
                          className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow-md hover:bg-white transition-colors"
                        >
                          {playingAudio === audio.id ? (
                            <Pause className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Play className="h-4 w-4 text-purple-600" />
                          )}
                        </button>
                      </div>
                    </Draggable>
                  ))}
                </div>
              ) : !searchTerm ? (
                <div className="text-center py-8">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No uploaded audio files yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowUpload(true)}
                  >
                    Upload Your First Audio
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {/* Static Audio Section */}
          {(filteredStaticAudios.length > 0 || !searchTerm) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-gray-900">Stock Audio</h3>
                <Badge variant="secondary" className="text-xs">
                  {filteredStaticAudios.length}
                </Badge>
              </div>
              
              {filteredStaticAudios.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredStaticAudios.map((audio) => (
                    <Draggable
                      key={audio.id}
                      data={() => audio}
                    >
                      <div className="relative">
                        <div
                          onClick={() => handleStaticAudioSelect(audio)}
                          className="group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden hover:border-gray-300 hover:-translate-y-1"
                        >
                          <div className="aspect-video bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                            <div className="text-center text-white">
                              <Volume2 className="h-12 w-12 mx-auto mb-2" />
                              <div className="text-xs font-medium">Audio File</div>
                            </div>
                          </div>

                          <div className="absolute top-2 left-2 bg-purple-100 text-purple-700 border border-purple-200 text-xs px-2 py-1 rounded-md flex items-center gap-1 font-medium">
                            <Music className="h-3 w-3" />
                            AUDIO
                          </div>

                          <div className="p-3">
                            <h3 className="font-medium text-sm text-gray-900 truncate" title={audio.name}>
                              {audio.name}
                            </h3>
                            {audio.metadata?.author && (
                              <p className="text-xs text-gray-500 mt-1">
                                by {audio.metadata.author}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Play button overlay */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayAudio(audio.details.src, audio.id);
                          }}
                          className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow-md hover:bg-white transition-colors"
                        >
                          {playingAudio === audio.id ? (
                            <Pause className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Play className="h-4 w-4 text-purple-600" />
                          )}
                        </button>
                      </div>
                    </Draggable>
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="text-center py-8">
                  <Filter className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No stock audio matches your search</p>
                </div>
              ) : null}
            </div>
          )}

          {/* No results state */}
          {totalAudios === 0 && searchTerm && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audio files found</h3>
              <p className="text-gray-500 mb-4">
                No audio files match your search term "{searchTerm}".
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
