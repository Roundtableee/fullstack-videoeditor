// File: react-video-editor-main/src/features/editor/menu-item/audios.tsx

import React, { useState, useEffect, useRef } from "react";
import Draggable from "@/components/shared/draggable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { dispatch } from "@designcombo/events";
import { ADD_ITEMS } from "@designcombo/state";
import { IAudio, IAudioDetails } from "@designcombo/types";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import { generateId } from "@designcombo/timeline";
import { Music, Upload, Plus, Play } from "lucide-react";
import { getAudioList } from "../data/audio";
import { fileUploadService, UploadedFile } from "@/services/upload";
import FileUpload from "../components/FileUpload";

interface AudioItemData {
  id: string;
  type: "audio";
  name: string;
  details: IAudioDetails;
  preview: string;
  duration: number;       // in ms
  metadata?: { author?: string };
}

export const Audios: React.FC = () => {
  const isDragging = useIsDraggingOverTimeline();
  const [items, setItems] = useState<AudioItemData[]>([]);
  const [uploadedAudios, setUploadedAudios] = useState<UploadedFile[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load static list once
  useEffect(() => {
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
    setUploadedAudios(prev => [...prev, ...audioFiles]);
    setShowUpload(false);
  };

  const convertUploadedToAudioItem = (file: UploadedFile): AudioItemData => ({
    id: file.id,
    type: "audio",
    name: file.filename,
    details: { src: file.url },
    preview: file.url,
    duration: 5000, // Default duration, could be extracted from metadata
    metadata: { author: "Uploaded" }
  });

  // Wheel scroll support
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    scrollRef.current?.scrollBy({ top: e.deltaY, behavior: "auto" });
  };

  // Combine static and uploaded audios
  const allAudios = [
    ...items,
    ...uploadedAudios.map(convertUploadedToAudioItem)
  ];

  // Add audio to timeline
  const addToTimeline = (audio: AudioItemData) => {
    const trackId = generateId();
    dispatch(ADD_ITEMS, {
      payload: {
        trackItems: [
          {
            id: trackId,
            type: "audio",
            display: { from: 0, to: audio.duration },
            details: { src: audio.details.src } as IAudioDetails,
            metadata: audio.metadata || {}
          },
        ],
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Music className="h-5 w-5" />
          Audio Library
        </h3>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Audio
        </Button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="p-4 border-b bg-white">
          <FileUpload 
            onFilesUploaded={handleFilesUploaded}
            acceptedTypes={['audio/*']}
            maxFiles={5}
            maxSize={100 * 1024 * 1024} // 100MB
          />
        </div>
      )}

      {/* Audio List */}
      <ScrollArea className="flex-1" ref={scrollRef} onWheel={onWheel}>
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading audios...</div>
          ) : allAudios.length > 0 ? (
            allAudios.map((audio) => (
              <AudioListItem
                key={audio.id}
                audio={audio}
                isDragging={isDragging}
                onAdd={() => addToTimeline(audio)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No audio files</h3>
              <p className="text-gray-500 mb-4">
                Upload your first audio file to get started.
              </p>
              <Button onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Audio
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// Separate component for audio list item
const AudioListItem: React.FC<{
  audio: AudioItemData;
  isDragging: boolean;
  onAdd: () => void;
}> = ({ audio, isDragging, onAdd }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(console.error);
  };

  return (
    <Draggable
      data={{
        id: generateId(),
        type: "audio",
        name: audio.name,
        details: audio.details,
        preview: audio.preview,
        duration: audio.duration,
        metadata: audio.metadata
      }}
    >
      <div
        className={`
          cursor-grab active:cursor-grabbing rounded-lg border border-gray-200 
          bg-white p-3 hover:shadow-md transition-shadow
          ${isDragging ? "opacity-50" : ""}
        `}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Music className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {audio.name}
            </p>
            <p className="text-xs text-gray-500">
              {audio.metadata?.author && `${audio.metadata.author} • `}
              {Math.round(audio.duration / 1000)}s
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePreview}
              className="h-8 w-8 p-0"
            >
              <Play className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              onClick={onAdd}
              className="h-8 px-3 text-xs"
            >
              Add
            </Button>
          </div>
        </div>
        <audio ref={audioRef} preload="none" src={audio.details.src} />
      </div>
    </Draggable>
  );
};
