// File: react-video-editor-main/src/features/editor/menu-item/videos.tsx

import React, { useState, useRef, ChangeEvent } from "react";
import Draggable from "@/components/shared/draggable";
import { VIDEOS as STATIC_VIDEOS } from "../data/video";
import { dispatch } from "@designcombo/events";
import { ADD_VIDEO } from "@designcombo/state";
import { IVideo, IVideoDetails } from "@designcombo/types";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import { generateId } from "@designcombo/timeline";

export const Videos: React.FC = () => {
  const isDragging = useIsDraggingOverTimeline();
  const [library, setLibrary] = useState<Partial<IVideo>[]>([...STATIC_VIDEOS]);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addToTimeline = (item: IVideo) => {
    console.log("Adding to timeline:", item);
    dispatch(ADD_VIDEO, {
      payload: item,
      options: { resourceId: "main", scaleMode: "fit" },
    });
  };

  const onFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file);
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      alert("กรุณาเลือกไฟล์วิดีโอเท่านั้น (mp4, webm, mov, avi)");
      e.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      // 1) เตรียม upload endpoint ที่ถูกต้อง
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const uploadEndpoint = `${backendUrl}/upload/single`;

      console.log("Uploading video to:", uploadEndpoint);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(uploadEndpoint, {
        method: "POST",
        body: formData,
        // ไม่ต้องใส่ Content-Type header เพราะ browser จะใส่ให้อัตโนมัติพร้อม boundary
      });
      console.log("Upload response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`อัปโหลดวิดีโอล้มเหลว (status ${response.status}): ${errorData.error || 'Unknown error'}`);
      }

      const data: { id: string; url: string; type: string; filename: string; size: number } = await response.json();
      console.log("Upload response JSON:", data);

      if (data.type !== "video") {
        throw new Error("ไฟล์ที่อัปโหลดไม่ใช่วิดีโอ");
      }

      // 2) สร้าง URL ที่ถูกต้องสำหรับ streaming
      let videoUrl: string;
      if (data.url.startsWith("http")) {
        videoUrl = data.url;
      } else {
        // ลบ leading slash ถ้ามี แล้วใส่ backendUrl
        const cleanPath = data.url.startsWith("/") ? data.url : `/${data.url}`;
        videoUrl = `${backendUrl}${cleanPath}`;
      }
      console.log("Final videoUrl used:", videoUrl);

      // 3) สร้าง <video> element แบบซ่อน เพื่ออ่าน metadata (duration)
      const { duration } = await new Promise<{ duration: number }>((resolve, reject) => {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.crossOrigin = "anonymous";

        console.log("Setting video.src to:", videoUrl);
        v.src = videoUrl;

        v.onloadedmetadata = () => {
          const ms = Math.round(v.duration * 1000);
          console.log("Successfully loaded metadata, duration (ms):", ms);
          resolve({ duration: ms });
        };

        v.onerror = (err) => {
          console.error("Error loading metadata, video.src was:", v.src, err);
          reject(err);
        };
      });

      // 4) สร้าง thumbnail preview จาก videoUrl
      const preview = await new Promise<string>((resolve, reject) => {
        const v = document.createElement("video");
        v.crossOrigin = "anonymous";
        v.preload = "metadata";

        console.log("Setting video.src for thumbnail:", videoUrl);
        v.src = videoUrl;

        v.onloadedmetadata = () => {
          console.log("Video metadata loaded for thumbnail, seeking to 0");
          v.currentTime = 0;
        };

        v.onseeked = () => {
          const c = document.createElement("canvas");
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          const ctx = c.getContext("2d")!;
          ctx.drawImage(v, 0, 0, c.width, c.height);
          const dataUrl = c.toDataURL("image/png");
          console.log("Generated thumbnail data URL length:", dataUrl.length);
          resolve(dataUrl);
        };

        v.onerror = (err) => {
          console.error("Error generating thumbnail, video.src was:", v.src, err);
          reject(err);
        };
      });

      // 5) สร้างไอเท็มใหม่และอัปเดต library
      const newItem: Partial<IVideo> = {
        id: data.id,
        type: "video",
        name: data.filename || file.name,
        details: { src: videoUrl } as IVideoDetails,
        preview,
        duration,
        metadata: {
          previewUrl: preview,
          filename: data.filename || file.name,
          size: data.size,
          uploadedAt: new Date().toISOString(),
        },
      };

      console.log("New video item:", newItem);
      console.log("Adding to library...");
      
      // เพิ่มเข้า library state โดยใส่ไว้ที่ตำแหน่งแรก
      setLibrary(prev => [newItem as IVideo, ...prev]);
      console.log("Video added to library successfully");
    } catch (err: any) {
      console.error("Upload or thumbnail error:", err);
      
      // ให้ error message ที่ดีขึ้น
      let errorMessage = "ไม่สามารถอัปโหลดหรือประมวลผลวิดีโอได้";
      if (err.message) {
        if (err.message.includes("NetworkError") || err.message.includes("fetch")) {
          errorMessage = "ไม่สามารถเชื่อมต่อกับ server ได้ กรุณาตรวจสอบว่า backend server ทำงานอยู่";
        } else if (err.message.includes("status 413")) {
          errorMessage = "ไฟล์วิดีโอมีขนาดใหญ่เกินไป (max 500MB)";
        } else if (err.message.includes("status 415")) {
          errorMessage = "รูปแบบไฟล์ไม่ถูกต้อง กรุณาใช้ไฟล์ mp4, webm, mov หรือ avi";
        } else {
          errorMessage = err.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsUploading(false);
      // รีเซ็ต file input เพื่อให้สามารถเลือกไฟล์เดิมได้อีก
      e.target.value = "";
    }
  };

  const onWheelScroll = (e: React.WheelEvent) => {
    e.preventDefault();
    scrollRef.current?.scrollBy({ top: e.deltaY, behavior: "auto" });
  };

  console.log("Rendering Videos component, library:", library);

  return (
    <div className="flex flex-col h-screen">
      <div className="h-12 flex items-center px-4 text-sm font-medium text-text-primary">
        Videos
      </div>

      <div className="mb-4 px-4">
        <label className={`inline-block px-4 py-2 text-white rounded-lg transition-colors ${
          isUploading 
            ? "bg-gray-400 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-500 cursor-pointer"
        }`}>
          {isUploading ? "กำลังอัปโหลด..." : "Upload Video"}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={onFileSelected}
            disabled={isUploading}
          />
        </label>
        {isUploading && (
          <p className="mt-2 text-sm text-gray-500">
            กำลังอัปโหลดและประมวลผลวิดีโอ กรุณารอสักครู่...
          </p>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4"
        onWheel={onWheelScroll}
      >
        <div className="space-y-4">
          {library.map((video) => {
            console.log("Rendering video preview:", video);
            return (
              <Draggable
                key={video.id}
                data={video}
                renderCustomPreview={
                  <div
                    style={{
                      backgroundImage: `url(${video.preview})`,
                      backgroundSize: "cover",
                      width: "40px",
                      height: "40px",
                    }}
                    className="draggable rounded"
                  />
                }
                shouldDisplayPreview={!isDragging}
              >
                <div
                  onClick={() => addToTimeline(video as IVideo)}
                  className="flex w-full items-center justify-center overflow-hidden bg-background pb-2 rounded-lg"
                >
                  <img
                    draggable={false}
                    crossOrigin="anonymous"
                    src={video.preview!}
                    alt={video.name || "Video"}
                    className="aspect-video w-[160px] object-cover rounded-md"
                    onError={(e) =>
                      console.error("Video preview image load error:", e.currentTarget.src)
                    }
                  />
                </div>
              </Draggable>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Videos;
