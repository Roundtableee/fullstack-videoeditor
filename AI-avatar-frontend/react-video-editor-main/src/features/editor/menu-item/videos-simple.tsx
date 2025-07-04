import React, { useRef, useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Draggable from "@/components/shared/draggable";
import { VIDEOS } from "../data/video";
import { dispatch } from "@designcombo/events";
import { ADD_VIDEO } from "@designcombo/state";
import { IVideo } from "@designcombo/types";
import { useIsDraggingOverTimeline } from "../hooks/is-dragging-over-timeline";
import { fileUploadService, UploadedFile } from "@/services/upload";

export const Videos: React.FC = () => {
  const isDragging = useIsDraggingOverTimeline();
  const [library, setLibrary] = useState<Partial<IVideo>[]>([...VIDEOS]);
  const [uploadedVideos, setUploadedVideos] = useState<UploadedFile[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUploadedVideos();
  }, []);

  const loadUploadedVideos = async () => {
    try {
      const files = await fileUploadService.getUploadedFiles();
      const videoFiles = files.filter(file => file.type === 'video');
      setUploadedVideos(videoFiles);
    } catch (error) {
      console.error('Failed to load uploaded videos:', error);
    }
  };

  const addToTimeline = (item: IVideo) => {
    dispatch(ADD_VIDEO, {
      payload: item,
      options: { resourceId: "main", scaleMode: "fit" },
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const file = files[0];
      const uploadedFile = await fileUploadService.uploadFile(file);
      
      if (uploadedFile.type === 'video') {
        setUploadedVideos(prev => [uploadedFile, ...prev]);
        
        // Add to library as well
        const videoItem: Partial<IVideo> = {
          id: uploadedFile.id,
          type: "video",
          name: uploadedFile.filename,
          preview: uploadedFile.url,
          duration: 5000,
          details: {
            src: uploadedFile.url,
            width: 1920,
            height: 1080
          } as any
        };
        
        setLibrary(prev => [videoItem, ...prev]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload video');
    } finally {
      event.target.value = "";
    }
  };

  const onWheelScroll = (e: React.WheelEvent) => {
    e.preventDefault();
    scrollRef.current?.scrollBy({ top: e.deltaY, behavior: "auto" });
  };

  // Combine uploaded videos and static videos
  const allVideos = [
    ...uploadedVideos.map(video => ({
      id: video.id,
      name: video.filename,
      preview: video.url,
      duration: 5000,
      details: {
        src: video.url,
        width: 1920,
        height: 1080
      } as any
    })),
    ...library
  ];

  return (
    <div className="flex flex-col h-screen">
      <div className="h-12 flex items-center px-4 text-sm font-medium text-text-primary">
        Videos
      </div>

      <div className="mb-4 px-4">
        <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-500">
          Upload Video
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4"
        onWheel={onWheelScroll}
      >
        <div className="space-y-4">
          {allVideos.map((video, index) => {
            return (
              <Draggable
                key={video.id || index}
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
                  className="flex w-full items-center justify-center overflow-hidden bg-background pb-2 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
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
