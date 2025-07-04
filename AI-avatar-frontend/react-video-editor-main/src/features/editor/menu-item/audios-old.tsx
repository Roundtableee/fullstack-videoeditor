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
import { Music, Upload, Plus } from "lucide-react";
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

  // Open file picker
  const openPicker = () => {
    setError(null);
    fileRef.current?.click();
  };

  // Upload & extract duration
  const onSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setError("กรุณาเลือกไฟล์เสียง (mp3, wav) เท่านั้น");
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const resp = await fetch(`${backend}/upload/audio`, {
        method: "POST",
        body: (() => { const fm = new FormData(); fm.append("file", file); return fm; })(),
      });
      if (!resp.ok) throw new Error(`อัปโหลดล้มเหลว (${resp.status})`);
      const { id, url, type } = await resp.json();
      if (type !== "audio") throw new Error("ไฟล์ไม่ใช่เสียง");
      const src = url.startsWith("http") ? url : `${backend}${url}`;

      // get duration via metadata
      const duration = await new Promise<number>((resolve, reject) => {
        const a = document.createElement("audio");
        a.preload = "metadata";
        a.crossOrigin = "anonymous";
        a.src = src;
        a.load();
        a.addEventListener("loadedmetadata", () =>
          resolve(Math.round(a.duration * 1000))
        );
        a.addEventListener("error", reject);
      });

      const newItem: AudioItemData = {
        id,
        type: "audio",
        name: file.name,
        details: { src },
        preview: src,
        duration,
        metadata: { author: "" }
      };
      setItems(prev => [newItem, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดขณะอัปโหลด");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Dispatch to timeline with proper display range
  const addToTimeline = (item: AudioItemData) => {
    const trackId = generateId();
    dispatch(ADD_ITEMS, {
      payload: {
        trackItems: [
          {
            id: trackId,
            type: "audio",
            display: { from: 0, to: item.duration },
            details: { src: item.details.src } as IAudioDetails,
            metadata: item.metadata || {}
          },
        ],
      },
    });
  };

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Header */}
      <div className="h-12 flex items-center px-4 text-sm font-medium text-text-primary">
        Audios
      </div>

      {/* Upload Button */}
      <div className="px-4 mb-4">
        <button
          onClick={openPicker}
          disabled={uploading}
          className={`px-4 py-2 text-white rounded-lg ${
            uploading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-500"
          }`}
        >
          {uploading ? "กำลังอัปโหลด..." : "Upload Audio"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={onSelect}
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      {/* Library */}
      <div
        ref={scrollRef}
        onWheel={onWheel}
        className="flex-1 overflow-y-auto px-4"
      >
        <ScrollArea>
          <div className="space-y-2 py-2">
            {items.length > 0 ? (
              items.map(item => (
                <AudioListItem
                  key={item.id}
                  item={item}
                  isDragging={isDragging}
                  onAdd={() => addToTimeline(item)}
                />
              ))
            ) : (
              <div className="px-4 py-6 text-center text-zinc-500">
                ไม่มีไฟล์เสียงในคลัง<br/>
                กด Upload Audio เพื่อเพิ่มไฟล์เสียง
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Separate component so its hooks (useRef) are always called in the same order
// -----------------------------------------------------------------------------
const AudioListItem: React.FC<{
  item: AudioItemData;
  isDragging: boolean;
  onAdd: () => void;
}> = ({ item, isDragging, onAdd }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePreview = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;        // or item.display.from/1000
    audioRef.current.play();
  };

  return (
    <Draggable
      data={item as IAudio}
      renderCustomPreview={
        <div className="draggable w-10 h-10 bg-gray-200 flex items-center justify-center rounded">
          <Music size={20} />
        </div>
      }
      shouldDisplayPreview={!isDragging}
    >
      <div
        onClick={() => {
          onAdd();
          handlePreview();
        }}
        className="flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-zinc-700 rounded">
            <Music size={16} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm">{item.name}</span>
            <span className="truncate text-xs text-zinc-400">
              {item.metadata?.author}
            </span>
          </div>
        </div>
        <audio
          ref={audioRef}
          src={item.preview}
          className="w-24"
          onError={e => console.error("Audio preview error:", e.currentTarget.src)}
        />
      </div>
    </Draggable>
  );
};

export default Audios;
