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

    // ✅ ACCURATE TEXT POSITION CALCULATION: ยึดตาม composition size โดยตรง
    const calculateAccurateTextPosition = (item: any, finalSize: any) => {
      if (item.type !== 'text') return { x: 0, y: 0, textMetrics: null };

      console.log('🎯 Calculating text position using composition size directly');
      console.log('📏 Final composition size:', finalSize);
      console.log('� Original item position:', {
        left: item.details.left,
        top: item.details.top,
        x: item.details.x,
        y: item.details.y
      });

      // ใช้ตำแหน่งจาก editor โดยตรง - ไม่ต้องแปลงเพราะ artboard มีขนาดเท่ากับ composition
      const x = parseFloat(item.details.left ?? item.details.x ?? 0);
      const y = parseFloat(item.details.top ?? item.details.y ?? 0);
      
      // สร้าง canvas สำหรับวัดข้อความ (เพื่อใช้ในการ debug)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let textMetrics = null;
      
      if (ctx) {
        const fontSize = item.details.fontSize || 24;
        const fontFamily = item.details.fontFamily || 'Arial';
        ctx.font = `${fontSize}px ${fontFamily}`;
        
        const metrics = ctx.measureText(item.details.text || '');
        textMetrics = {
          width: metrics.width,
          height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
          fontSize,
          fontFamily
        };
      }

      console.log('✅ Final text position:', { x, y });
      console.log('📐 Text metrics:', textMetrics);

      return {
        x: Math.round(x),
        y: Math.round(y),
        textMetrics
      };
    };

    // ✅ ACCURATE IMAGE POSITION CALCULATION: ใช้ composition size โดยตรงเหมือน text
    const calculateAccurateImagePosition = (item: any, finalSize: any) => {
      if (item.type !== 'image') return { x: 0, y: 0 };

      console.log('🖼️ Calculating image position using composition size directly');
      console.log('📏 Final composition size:', finalSize);
      console.log('📍 Original image position:', {
        left: item.details.left,
        top: item.details.top,
        x: item.details.x,
        y: item.details.y
      });

      // ใช้ตำแหน่งจาก editor โดยตรง - ไม่ต้องแปลงเพราะ artboard มีขนาดเท่ากับ composition
      const x = parseFloat(item.details.left ?? item.details.x ?? 0);
      const y = parseFloat(item.details.top ?? item.details.y ?? 0);

      console.log('🎯 Image position calculation result:', { x, y });
      
      return {
        x: Math.round(x),
        y: Math.round(y)
      };
    };

    // ✅ ACCURATE VIDEO POSITION CALCULATION: ใช้ composition size โดยตรงเหมือน image และ text
    const calculateAccurateVideoPosition = (item: any, finalSize: any) => {
      if (item.type !== 'video') return { x: 0, y: 0 };

      console.log('🎥 Calculating video position using composition size directly');
      console.log('📏 Final composition size:', finalSize);
      console.log('📍 Original video position:', {
        left: item.details.left,
        top: item.details.top,
        x: item.details.x,
        y: item.details.y
      });

      // ใช้ตำแหน่งจาก editor โดยตรง - ไม่ต้องแปลงเพราะ artboard มีขนาดเท่ากับ composition
      const x = parseFloat(item.details.left ?? item.details.x ?? 0);
      const y = parseFloat(item.details.top ?? item.details.y ?? 0);

      console.log('🎯 Video position calculation result:', { x, y });
      
      return {
        x: Math.round(x),
        y: Math.round(y)
      };
    };

    // map ตำแหน่งและขนาดให้ normalize เสมอ
    const enhancedTrackItems = design.trackItems.map((item) => {
      if ((item.type === 'video' || item.type === 'image' || item.type === 'text') && item.details) {
        const getNum = (v: any) => (typeof v === 'string' ? parseFloat(v) : (typeof v === 'number' ? v : 0));
        
        let x = getNum(item.details.left ?? item.details.x ?? 0);
        let y = getNum(item.details.top ?? item.details.y ?? 0);
        
        // สำหรับ text ใช้การคำนวณแบบแม่นยำ - ยึดตาม composition size โดยตรง
        if (item.type === 'text' && typeof window !== 'undefined') {
          const accuratePos = calculateAccurateTextPosition(item, finalSize);
          x = accuratePos.x;
          y = accuratePos.y;
          
          // เก็บ text metrics ไว้ส่งให้ backend
          if (accuratePos.textMetrics) {
            item.details.textMetrics = accuratePos.textMetrics;
          }
        }
        
        // สำหรับ image ใช้การคำนวณแบบแม่นยำ - ยึดตาม composition size โดยตรงเหมือน text
        if (item.type === 'image' && typeof window !== 'undefined') {
          const accuratePos = calculateAccurateImagePosition(item, finalSize);
          x = accuratePos.x;
          y = accuratePos.y;
        }

        // สำหรับ video ใช้การคำนวณแบบแม่นยำ - ยึดตาม composition size โดยตรงเหมือน image และ text
        if (item.type === 'video' && typeof window !== 'undefined') {
          const accuratePos = calculateAccurateVideoPosition(item, finalSize);
          x = accuratePos.x;
          y = accuratePos.y;
        }

        const position = { x, y };
        let details = { ...item.details, x, y };
        
        // ✅ CONSISTENT SIZE HANDLING: Image และ Video ใช้วิธีเดียวกัน
        if (item.type === 'image') {
          // สำหรับ image ใช้ scaledWidth/scaledHeight หากมี หรือ fallback ไปที่ details.width/height
          const imageWidth = getNum(item.details.scaledWidth ?? item.details.width);
          const imageHeight = getNum(item.details.scaledHeight ?? item.details.height);
          
          if (imageWidth && imageHeight) {
            details = { 
              ...details, 
              width: imageWidth, 
              height: imageHeight 
            };
            console.log(`🖼️ Image ${item.id}: Using size ${imageWidth}x${imageHeight} from details (same as video)`);
          }
        } else if (item.type === 'video') {
          // สำหรับ video ใช้ width/height จาก details เหมือน image (consistent approach)
          const videoWidth = getNum(item.details.width);
          const videoHeight = getNum(item.details.height);
          
          if (videoWidth && videoHeight) {
            details = { 
              ...details, 
              width: videoWidth, 
              height: videoHeight 
            };
            console.log(`🎥 Video ${item.id}: Using size ${videoWidth}x${videoHeight} from details`);
          }
        } else {
          // สำหรับ text ใช้ขนาดปกติ
          const width = getNum(item.details.width);
          const height = getNum(item.details.height);
          if (width && height) {
            details = { ...details, width, height };
          }
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
   * Poll render status until completion with enhanced progress tracking
   */
  async pollRenderStatus(
    renderId: string, 
    onProgress?: (progress: number, status: string) => void,
    pollInterval = 1000 // ลดจาก 2000ms เป็น 1000ms เพื่อ update ถี่ขึ้น
  ): Promise<VideoRenderResponse> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const response = await this.getRenderStatus(renderId);
          const { video } = response;
          
          console.log(`🎬 Render status: ${video.status}, progress: ${video.progress}%`);
          
          // Call progress callback
          if (onProgress) {
            onProgress(video.progress, video.status);
          }

          // Check if completed
          if (video.status === 'COMPLETED') {
            console.log('✅ Render completed successfully!');
            resolve(response);
            return;
          }
          
          // Check if failed
          if (video.status === 'FAILED') {
            console.error('❌ Render failed:', video.error);
            reject(new Error(video.error || 'Render failed'));
            return;
          }
          
          // Continue polling for PENDING or PROCESSING status
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
