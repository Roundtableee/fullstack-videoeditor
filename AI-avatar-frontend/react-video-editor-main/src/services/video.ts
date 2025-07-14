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
    // ใช้ขนาด canvas จาก options ที่ส่งมา (ไม่ดึงจาก DOM)
    const finalSize = {
      width: options.size?.width || 1920,
      height: options.size?.height || 1080
    };
    console.log('🎯 FINAL CANVAS SIZE:', finalSize);

    // ✅ TEXT POSITION SCALE FIX: คำนวณ scale จาก UI canvas → composition
    let scaleX = 1, scaleY = 1;
    if (typeof window !== 'undefined') {
      const canvasEl = document.querySelector('.editor-canvas, canvas') as HTMLElement;
      const rect = canvasEl?.getBoundingClientRect();
      if (rect?.width && rect?.height) {
        scaleX = finalSize.width / rect.width;
        scaleY = finalSize.height / rect.height;
        console.log('🔍 Text position scale:', scaleX, scaleY);
      }
    }

    // map ตำแหน่งและขนาดให้ normalize เสมอ
    const enhancedTrackItems = design.trackItems.map((item) => {
      if ((item.type === 'video' || item.type === 'image' || item.type === 'text') && item.details) {
        // Normalize position and size
        const getNum = (v: any) => (typeof v === 'string' ? parseFloat(v) : (typeof v === 'number' ? v : 0));
        let rawX = getNum(item.details.left ?? item.details.x ?? 0);
        let rawY = getNum(item.details.top ?? item.details.y ?? 0);
        // ถ้าเป็น text ให้ apply scale จาก UI → composition
        if (item.type === 'text') {
          rawX = Math.round(rawX * scaleX);
          rawY = Math.round(rawY * scaleY);
        }
        const x = rawX;
        const y = rawY;
        const position = { x, y };
        let details = { ...item.details, x, y };
        // Extract width and height values for normalization
        const width = getNum(item.details.width);
        const height = getNum(item.details.height);
        if (width && height) {
          details = { ...details, width, height };
        }
        
        // ✅ TEXT POSITION ใช้ COMPOSITION SIZE โดยตรง
        // ไม่ต้องส่ง originalCanvas size เพราะ backend จะใช้ job.options.size
        
        return {
          ...item,
          display: { ...item.display, position },
          details
        };
      }
      return item;
    });

    console.log('🔧 ENHANCED TRACK ITEMS WITH EDITOR POSITIONS:');
    enhancedTrackItems.filter(item => item.type === 'video' || item.type === 'image' || item.type === 'text').forEach((media, index) => {
      const display = media.display as any;
      console.log(`  Enhanced ${media.type} ${index}:`, {
        id: media.id,
        type: media.type,
        src: media.details?.src,
        editorPosition: {
          left: media.details?.left,
          top: media.details?.top,
          x: media.details?.x,
          y: media.details?.y,
          width: media.details?.width,
          height: media.details?.height,
          scale: media.details?.scale
        },
        scaledDimensions: {
          scaledWidth: media.details?.scaledWidth,
          scaledHeight: media.details?.scaledHeight,
          originalWidth: media.details?.originalWidth,
          originalHeight: media.details?.originalHeight,
          shouldCrop: media.details?.shouldCrop
        },
        display: media.display,
        finalPosition: display.position
      });
    });

    const payload = {
      design: {
        trackItems: enhancedTrackItems,
        transitions: design.transitions ?? [],
      },
      options: {
        ...options,
        size: finalSize,
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
