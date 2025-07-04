// File: react-video-editor-main/src/services/video.ts

import { ITrackItem, ITransition } from "@designcombo/types";

interface VideoRenderOptions {
  fps: number;
  size: { width: number; height: number };
  format: string;
  quality?: number;
  crf?: number;
}

interface VideoStatus {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  url?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface VideoRenderResponse {
  video: VideoStatus;
}

interface StartRenderResponse {
  renderId: string;
  status: string;
  message: string;
}

// Backend API URL
const RENDER_API_URL =
  import.meta.env.VITE_PUBLIC_RENDER_API_URL ||
  (import.meta.env.VITE_BACKEND_URL || "http://localhost:3001") + "/render";

const STATUS_API_URL =
  import.meta.env.VITE_PUBLIC_STATUS_API_URL ||
  (import.meta.env.VITE_BACKEND_URL || "http://localhost:3001") + "/status";

export class VideoRenderService {
  private static instance: VideoRenderService;
  private constructor() {}
  
  static getInstance(): VideoRenderService {
    if (!VideoRenderService.instance) {
      VideoRenderService.instance = new VideoRenderService();
    }
    return VideoRenderService.instance;
  }

  /**
   * Start a new render job
   */
  async startRender(
    design: { trackItems: ITrackItem[]; transitions: ITransition[] },
    options: VideoRenderOptions
  ): Promise<StartRenderResponse> {
    // Debug logging
    console.log('🎬 VIDEO SERVICE - Starting render with:');
    console.log('Track Items Count:', design.trackItems.length);
    console.log('Track Items:', design.trackItems);
    
    const videoItems = design.trackItems.filter(item => item.type === 'video');
    console.log('🎥 VIDEO ITEMS IN SERVICE:', videoItems.length);
    videoItems.forEach((video, index) => {
      console.log(`  Video ${index}:`, {
        id: video.id,
        type: video.type,
        src: video.details?.src,
        display: video.display,
        position: (video.display as any).position
      });
    });
    
    // 1️⃣ Validate
    if (!Array.isArray(design.trackItems) || design.trackItems.length === 0) {
      throw new Error("ไม่มีคลิปบน timeline ให้ export");
    }

    // 2️⃣ Send payload to backend
    // Add position data to track items from editor preview positions
    const enhancedTrackItems = design.trackItems.map((item) => {
      // For video items, get position from details or use default
      if (item.type === 'video' && item.details) {
        // Check if position already exists in display
        const currentDisplay = item.display as any;
        
        // Helper function to clean position values
        const cleanPositionValue = (value: any): number => {
          if (typeof value === 'string') {
            // Remove 'px', '%', or any other units and extract the number
            const numMatch = value.match(/-?\d+\.?\d*/);
            return numMatch ? parseFloat(numMatch[0]) : 0;
          } else if (typeof value === 'number') {
            return value;
          }
          return 0;
        };
        
        // Try to get position from item details (where editor stores position)
        const editorX = cleanPositionValue(item.details.left || item.details.x || 0);
        const editorY = cleanPositionValue(item.details.top || item.details.y || 0);
        
        // If we don't have position in display but have it in details, add it
        if (!currentDisplay.position && (editorX !== 0 || editorY !== 0 || item.details.left !== undefined || item.details.top !== undefined)) {
          const position = {
            x: Math.round(editorX), // Ensure integer values
            y: Math.round(editorY)
          };
          
          console.log(`🎯 Using editor position for video ${item.id}: x=${position.x}, y=${position.y}`);
          
          return {
            ...item,
            display: {
              ...item.display,
              position
            } as any
          };
        }
        
        // If position already exists, clean it
        if (currentDisplay.position) {
          const cleanedPosition = {
            x: Math.round(cleanPositionValue(currentDisplay.position.x)),
            y: Math.round(cleanPositionValue(currentDisplay.position.y))
          };
          
          console.log(`📍 Cleaned existing position for video ${item.id}: x=${cleanedPosition.x}, y=${cleanedPosition.y}`);
          
          return {
            ...item,
            display: {
              ...item.display,
              position: cleanedPosition
            } as any
          };
        }
        
        // Default position for main video (no position specified)
        console.log(`🎬 Using default center position for video ${item.id}`);
        return {
          ...item,
          display: {
            ...item.display,
            position: { x: 0, y: 0 }
          } as any
        };
      }
      return item;
    });

    console.log('🔧 ENHANCED TRACK ITEMS WITH EDITOR POSITIONS:');
    enhancedTrackItems.filter(item => item.type === 'video').forEach((video, index) => {
      const display = video.display as any;
      console.log(`  Enhanced Video ${index}:`, {
        id: video.id,
        type: video.type,
        src: video.details?.src,
        editorPosition: {
          left: video.details?.left,
          top: video.details?.top,
          x: video.details?.x,
          y: video.details?.y,
          width: video.details?.width,
          height: video.details?.height,
          scale: video.details?.scale
        },
        display: video.display,
        finalPosition: display.position
      });
    });

    const payload = {
      design: {
        trackItems: enhancedTrackItems,
        transitions: design.transitions ?? [],
      },
      options: {
        fps: options.fps || 30,
        size: options.size,
        format: options.format || 'mp4',
        quality: options.quality || 70,
        crf: options.crf || 18
      },
    };
    
    console.log('📦 SENDING PAYLOAD TO BACKEND:', JSON.stringify(payload, null, 2));
    
    const resp = await fetch(RENDER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(`เริ่ม render ไม่สำเร็จ: ${errorData.error || resp.statusText}`);
    }

    // 3️⃣ Return the response with renderId
    const data = await resp.json();
    return data as StartRenderResponse;
  }

  /**
   * Get render status by ID
   */
  async getRenderStatus(renderId: string): Promise<VideoRenderResponse> {
    const resp = await fetch(`${STATUS_API_URL}/${renderId}`);
    
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(`ไม่สามารถดึงสถานะ render ได้: ${errorData.error || resp.statusText}`);
    }

    const data = await resp.json();
    return data as VideoRenderResponse;
  }

  /**
   * Poll render status until completion
   */
  async pollRenderStatus(
    renderId: string, 
    onProgress?: (progress: number, status: string) => void,
    pollInterval = 2000
  ): Promise<VideoRenderResponse> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const response = await this.getRenderStatus(renderId);
          const { video } = response;
          
          // Call progress callback
          if (onProgress) {
            onProgress(video.progress, video.status);
          }

          // Check if completed
          if (video.status === 'COMPLETED') {
            resolve(response);
            return;
          }
          
          // Check if failed
          if (video.status === 'FAILED') {
            reject(new Error(video.error || 'Render failed'));
            return;
          }
          
          // Continue polling
          setTimeout(poll, pollInterval);
          
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }
}

export const videoRenderService = VideoRenderService.getInstance();
