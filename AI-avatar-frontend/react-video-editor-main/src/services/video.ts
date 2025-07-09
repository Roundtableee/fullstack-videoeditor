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
    // Since we now use consistent 1920x1080 resolution, position mapping should be 1:1
    const enhancedTrackItems = design.trackItems.map((item) => {
      if ((item.type === 'video' || item.type === 'image' || item.type === 'text') && item.details) {
        const currentDisplay = item.display as any;

        // Helper function to clean position values
        const cleanPositionValue = (value: any): number => {
          if (typeof value === 'string') {
            const numMatch = value.match(/-?\d+\.?\d*/);
            return numMatch ? parseFloat(numMatch[0]) : 0;
          } else if (typeof value === 'number') {
            return value;
          }
          return 0;
        };

        // With consistent 1920x1080 resolution, positions should map directly
        // No complex scaling needed since preview and output use same resolution
        console.log(`📐 Using 1:1 position mapping for ${item.type} ${item.id}`);

        // Get output video dimensions
        const outputWidth = options.size.width;
        const outputHeight = options.size.height;

        // Since we now use consistent 1920x1080 resolution for both preview and output,
        // we use 1:1 mapping without complex scaling
        const previewWidth = outputWidth;   // Same resolution for preview and output
        const previewHeight = outputHeight; // Same resolution for preview and output

        // Extract editor-provided position values
        const previewX = cleanPositionValue(item.details.left ?? item.details.x ?? 0);
        const previewY = cleanPositionValue(item.details.top ?? item.details.y ?? 0);

        // Calculate scaling factors (should be 1:1 with consistent resolution)
        const scaleX = outputWidth / previewWidth;   // Should be 1.0
        const scaleY = outputHeight / previewHeight; // Should be 1.0

        // Scale coordinates from preview to output resolution using exact video dimensions
        // This ensures positions match exactly between preview and final video
        const scaledX = Math.round(previewX * scaleX);
        const scaledY = Math.round(previewY * scaleY);

        // Also scale dimensions if available for proper cropping
        let scaledWidth, scaledHeight, originalWidth, originalHeight;
        if (item.details.width !== undefined && item.details.height !== undefined) {
          const previewW = cleanPositionValue(item.details.width);
          const previewH = cleanPositionValue(item.details.height);
          
          // Store original dimensions for cropping calculations
          originalWidth = previewW;
          originalHeight = previewH;
          
          // Scale to output dimensions
          scaledWidth = Math.round(previewW * scaleX);
          scaledHeight = Math.round(previewH * scaleY);
          
          console.log(`📏 ${item.type} ${item.id}: Dimensions - preview: ${previewW}x${previewH} → output: ${scaledWidth}x${scaledHeight}`);
        }

        // Prioritize editor details for positioning if available
        if (item.details.left !== undefined || item.details.top !== undefined || item.details.x !== undefined || item.details.y !== undefined) {
          const position = { x: scaledX, y: scaledY };
          
          // Create enhanced item with position and scaled dimensions
          const enhancedItem = { 
            ...item, 
            display: { ...item.display, position } as any
          };
          
          // Add scaled dimensions and original dimensions to details for backend processing
          if (scaledWidth !== undefined && scaledHeight !== undefined) {
            enhancedItem.details = {
              ...enhancedItem.details,
              scaledWidth,
              scaledHeight,
              originalWidth,
              originalHeight,
              // Add cropping information for images that are larger than the preview
              shouldCrop: item.type === 'image' && (originalWidth > scaledWidth || originalHeight > scaledHeight)
            };
          }
          
          console.log(`🎯 Using editor details for position on ${item.type} ${item.id}:`);
          console.log(`   Preview: (${previewX}, ${previewY}) → Output: (${scaledX}, ${scaledY})`);
          console.log(`   Preview size: ${previewWidth}x${previewHeight} → Output size: ${outputWidth}x${outputHeight}`);
          console.log(`   Scale factors: ${scaleX.toFixed(3)} x ${scaleY.toFixed(3)}`);
          if (scaledWidth !== undefined) {
            console.log(`   Dimensions: (${originalWidth}, ${originalHeight}) → (${scaledWidth}, ${scaledHeight})`);
            console.log(`   Should crop: ${enhancedItem.details.shouldCrop}`);
          }
          
          return enhancedItem;
        } else if (currentDisplay.position) {
          // Scale existing position in display
          const previewPosX = cleanPositionValue(currentDisplay.position.x);
          const previewPosY = cleanPositionValue(currentDisplay.position.y);
          const scaledPosition = { 
            x: Math.round(previewPosX * scaleX), 
            y: Math.round(previewPosY * scaleY) 
          };
          console.log(`📍 Scaled existing display.position for ${item.type} ${item.id}:`);
          console.log(`   Preview: (${previewPosX}, ${previewPosY}) → Output: (${scaledPosition.x}, ${scaledPosition.y})`);
          console.log(`   Scale factors: ${scaleX.toFixed(3)} x ${scaleY.toFixed(3)}`);
          return { ...item, display: { ...item.display, position: scaledPosition } as any };
        }

        // Default position if no editor or display values
        const defaultPosition = { x: 0, y: 0 };
        console.log(`🎬 Using default position for ${item.type} ${item.id}: x=${defaultPosition.x}, y=${defaultPosition.y}`);
        return { ...item, display: { ...item.display, position: defaultPosition } as any };
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
