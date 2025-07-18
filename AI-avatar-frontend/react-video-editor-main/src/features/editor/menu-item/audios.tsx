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
import { Music, Upload, Plus, Play, Trash2 } from "lucide-react";
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
  metadata?: { 
    author?: string;
    filename?: string;
    originalname?: string;
    size?: number;
    uploadedAt?: string;
  };
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
    
    // Load uploaded audio files from localStorage
    loadUploadedAudiosFromStorage();
  }, []);

  const loadUploadedAudiosFromStorage = () => {
    try {
      const savedAudios = localStorage.getItem('uploadedAudios');
      if (savedAudios) {
        const audioFiles: UploadedFile[] = JSON.parse(savedAudios);
        setUploadedAudios(audioFiles);
        console.log('Loaded', audioFiles.length, 'audio files from localStorage');
      }
    } catch (error) {
      console.error('Failed to load uploaded audios from localStorage:', error);
    }
  };

  const saveUploadedAudiosToStorage = (audioFiles: UploadedFile[]) => {
    try {
      localStorage.setItem('uploadedAudios', JSON.stringify(audioFiles));
      console.log('Saved', audioFiles.length, 'audio files to localStorage');
    } catch (error) {
      console.error('Failed to save uploaded audios to localStorage:', error);
    }
  };

  const handleFilesUploaded = (files: UploadedFile[]) => {
    const audioFiles = files.filter(file => file.type === 'audio');
    const updatedAudios = [...uploadedAudios, ...audioFiles];
    setUploadedAudios(updatedAudios);
    saveUploadedAudiosToStorage(updatedAudios);
    setShowUpload(false);
  };

  const convertUploadedToAudioItem = (file: UploadedFile): AudioItemData => ({
    id: file.id,
    type: "audio",
    name: file.filename, // ใช้ filename ที่ decoded จาก backend สำหรับชื่อไฟล์ภาษาไทย
    details: { src: file.url },
    preview: file.url,
    duration: 5000, // Default duration, could be extracted from metadata
    metadata: { 
      author: "Uploaded",
      filename: file.filename, // ชื่อไฟล์ภาษาไทยที่ถูกต้อง
      originalname: file.filename, // สำหรับ backward compatibility
      size: file.size,
      uploadedAt: new Date().toISOString()
    }
  });

  // Wheel scroll support
  const onWheelScroll = (e: React.WheelEvent) => {
    e.preventDefault();
    scrollRef.current?.scrollBy({ top: e.deltaY, behavior: "auto" });
  };

  // Combine static and uploaded audios
  const allAudios = [
    ...items,
    ...uploadedAudios.map(convertUploadedToAudioItem)
  ];

  const handleDeleteAudio = async (audio: AudioItemData, event: React.MouseEvent) => {
    event.stopPropagation(); // ป้องกันไม่ให้ trigger การ click ของ parent
    
    try {
      // ตรวจสอบว่าเป็น uploaded file หรือไม่
      const uploadedFile = uploadedAudios.find(file => file.id === audio.id);
      
      if (uploadedFile) {
        // ลบจาก uploadedAudios state
        const updatedAudios = uploadedAudios.filter(file => file.id !== audio.id);
        setUploadedAudios(updatedAudios);
        saveUploadedAudiosToStorage(updatedAudios);
        
        // ลบไฟล์จาก backend
        try {
          await fileUploadService.deleteFile(audio.id);
          console.log('Audio deleted from server:', audio.id);
        } catch (error) {
          console.warn('Failed to delete from server:', error);
          // ไม่ต้อง revert localStorage เพราะ user อาจต้องการลบแค่จาก local
        }
      } else {
        // ถ้าเป็น static file ไม่สามารถลบได้
        alert('ไม่สามารถลบไฟล์เสียงเริ่มต้นของระบบได้');
      }
      
    } catch (error) {
      console.error('Error deleting audio:', error);
      alert('เกิดข้อผิดพลาดในการลบไฟล์เสียง');
    }
  };

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
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-xl font-medium flex items-center gap-2 text-white">
          <Music className="h-5 w-5" />
          Audio Library
        </h3>
        <Button
          onClick={() => setShowUpload(!showUpload)}
          size="sm"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Plus className="h-4 w-4" />
          Add Audio
        </Button>
      </div>

      {/* Upload Section */}
      {showUpload && (
        <div className="p-4 border-b border-gray-700 bg-gray-800">
          <FileUpload 
            onFilesUploaded={handleFilesUploaded}
            acceptedTypes={['audio/*']}
            maxFiles={5}
            maxSize={100 * 1024 * 1024} // 100MB
          />
        </div>
      )}

      {/* Audio List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4"
        onWheel={onWheelScroll}
      >
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading audios...</div>
          ) : allAudios.length > 0 ? (
            allAudios.map((audio) => (
              <AudioListItem
                key={audio.id}
                audio={audio}
                isDragging={isDragging}
                onAdd={() => addToTimeline(audio)}
                onDeleteAudio={handleDeleteAudio}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No audio files</h3>
              <p className="text-gray-400 mb-4">
                Upload your first audio file to get started.
              </p>
              <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-500 text-white">
                <Upload className="h-4 w-4 mr-2" />
                Upload Audio
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Separate component for audio list item
const AudioListItem: React.FC<{
  audio: AudioItemData;
  isDragging: boolean;
  onAdd: () => void;
  onDeleteAudio: (audio: AudioItemData, event: React.MouseEvent) => void;
}> = ({ audio, isDragging, onAdd, onDeleteAudio }) => {
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
      <div className="group relative">
        <div
          className={`
            cursor-grab active:cursor-grabbing rounded-lg border border-gray-600 
            bg-gray-800 p-3 hover:shadow-md transition-shadow
            ${isDragging ? "opacity-50" : ""}
          `}
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Music className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {audio.name}
              </p>
              <p className="text-xs text-gray-400">
                {audio.metadata?.author && `${audio.metadata.author} • `}
                {Math.round(audio.duration / 1000)}s
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePreview}
                className="h-8 w-8 p-0 border-gray-600 bg-gray-700 hover:bg-gray-600 text-white"
              >
                <Play className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                onClick={onAdd}
                className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white"
              >
                Add
              </Button>
            </div>
          </div>
          <audio ref={audioRef} preload="none" src={audio.details.src} />
        </div>
        
        {/* Delete button - แสดงเฉพาะ uploaded files */}
        {audio.id && (
          <button
            onClick={(e) => onDeleteAudio(audio, e)}
            className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
            title="ลบไฟล์เสียง"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </Draggable>
  );
};
